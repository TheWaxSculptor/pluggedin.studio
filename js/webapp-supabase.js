// Global variable declarations for downstream script compatibility
window.supabaseClient = null;
window.db = window.db || { tableNames: {} };
window.utils = window.utils || {};

// Legacy local variables for compatibility within this file
var supabaseClient = null;
var db = window.db;
var utils = window.utils;

// Ensure DB_READY is defined immediately at the top level
window.DB_READY = new Promise((resolve) => {
    window.resolveDB = resolve;
});


// Supabase Configuration
const SUPABASE_URL = window.SUPABASE_CONFIG?.url;
const SUPABASE_ANON_KEY = window.SUPABASE_CONFIG?.anonKey;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error(' Supabase Config missing! Ensure js/config.js is loaded.');
} else if (window.supabase) {
    try {
        window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        supabaseClient = window.supabaseClient;
        
        // Populate window.db immediately
        window.db = window.db || { tableNames: {} };
        window.db.supabase = window.supabaseClient;
        window.db.from = (table) => window.db.supabase.from(table);
        
        console.log(' Supabase Initialized: window.db is ready');
    } catch (e) {
        console.error(' Error initializing Supabase:', e);
    }
}

// Auth state management using global supabaseClient
let currentUser = null;
let authStateListeners = [];

// Subscribe to auth changes if client is ready
if (supabaseClient) {
    supabaseClient.auth.onAuthStateChange((event, session) => {
        // Redundant with AuthManager but kept for legacy webapp-supabase compatibility
        // We will coordinate notifications in Phase 2
        console.debug('Auth state changed (webapp-supabase):', event);
        
        currentUser = session ? session.user : null;
        
        // Notify all listeners
        authStateListeners.forEach(listener => {
            try { listener(event, session); } catch(e) { console.error('Error in auth listener:', e); }
        });
    });
}


// Add auth state listener
function addAuthStateListener(callback) {
    authStateListeners.push(callback);
}

// Remove auth state listener
function removeAuthStateListener(callback) {
    const index = authStateListeners.indexOf(callback);
    if (index > -1) {
        authStateListeners.splice(index, 1);
    }
}

// Get current user
function getCurrentUser() {
    return currentUser;
}

// Check if user is authenticated
function isAuthenticated() {
    return currentUser !== null;
}

// Update UI for authenticated user
function updateUIForAuthenticatedUser(user) {
    const authBtn = document.getElementById('authBtn');
    const userMenu = document.getElementById('userMenu');
    const userInitials = document.getElementById('userInitials');
    
    if (authBtn) authBtn.classList.add('hidden');
    if (userMenu) userMenu.classList.remove('hidden');
    
    if (userInitials && user.email) {
        const initials = user.email.substring(0, 2).toUpperCase();
        userInitials.textContent = initials;
    }
}

// Update UI for unauthenticated user
function updateUIForUnauthenticatedUser() {
    const authBtn = document.getElementById('authBtn');
    const userMenu = document.getElementById('userMenu');
    
    if (authBtn) authBtn.classList.remove('hidden');
    if (userMenu) userMenu.classList.add('hidden');
}

// Table name detection - handles different naming conventions
// Global registry for detected table names
const tableNames = {};
window.DB_STATUS = {
    initialized: false,
    mapping: tableNames,
    errors: [],
    lastSync: null
};

// Map of canonical keys to their possible database variants
const variations = {
    studios: ['studios', 'studio_registrations', 'studio', 'Studio', 'STUDIOS'],
    equipment: ['equipment', 'equipments', 'Equipment', 'EQUIPMENT', 'gear', 'instruments'],
    users: ['users', 'user', 'User', 'USERS'],
    bookings: ['bookings', 'booking', 'Booking', 'BOOKINGS'],
    payments: ['payments', 'payment', 'Payment', 'PAYMENTS'],
    reviews: ['reviews', 'review', 'Review', 'REVIEWS'],
    conversations: ['conversations', 'conversation'],
    messages: ['messages', 'message'],
    payouts: ['payouts', 'payout', 'StudioPayouts'],
    availabilities: ['availabilities', 'availability']
};

// Detect actual table names in the database
async function detectTableNames() {
    console.group(' PluggedIn Database Sync');
    for (const [key, variants] of Object.entries(variations)) {
        for (const variant of variants) {
            try {
                const { error } = await supabaseClient
                    .from(variant)
                    .select('*', { count: 'exact', head: true });
                
                if (!error) {
                    tableNames[key] = variant;
                    console.log(` ${key.padEnd(15)} -> ${variant}`);
                    break;
                }
            } catch (e) {
                // Continue to next variant
            }
        }
        
        if (!tableNames[key]) {
            console.warn(` ${key.padEnd(15)} -> NOT FOUND (Will use fallback)`);
            window.DB_STATUS.errors.push(`Table not found: ${key}`);
        }
    }
    window.DB_STATUS.initialized = true;
    window.DB_STATUS.lastSync = new Date().toISOString();
    console.groupEnd();
}

// Initial table detection logic
async function runTableDetection() {
    try {
        await detectTableNames();
        console.log(' Database table detection complete:', tableNames);
    } catch (err) {
        console.error(' Database table detection failed:', err);
    }
}

// Attach methods to window.db immediately to avoid race conditions
function getTableName(key) {
    const tableNames = (window.db && window.db.tableNames) || {};
    return tableNames[key] || key;
}

// Global studio cache for join lookups
let _studioCache = null;

Object.assign(window.db, {
    // Studios
    async getStudios(filters = {}) {
        const client = window.supabaseClient || supabaseClient;
        if (!client) {
            console.error('Supabase client not ready for getStudios');
            return [];
        }
        const tableName = tableNames.studios || 'studios';
        
        let query = client
            .from(tableName)
            .select('*');
        
        if (filters.location) {
            query = query.ilike('location', `%${filters.location}%`);
        }
        
        if (filters.name) {
            query = query.ilike('name', `%${filters.name}%`);
        }
        
        const { data, error } = await query;
        if (error) {
            console.error('Error fetching studios:', error);
            throw error;
        }
        
        console.log(' Studios data loaded:', data);
        return data || [];
    },
    
    async getStudio(id) {
        const client = window.supabaseClient || supabaseClient;
        const studioTable = getTableName('studios');
        
        // 1. Try fetching everything in one go (Optimal)
        const relations = [];
        if (tableNames.equipment) relations.push(`${tableNames.equipment}(*)`);
        if (tableNames.availabilities) relations.push(`${tableNames.availabilities}(*)`);
        
        let selectString = '*';
        if (relations.length > 0) {
            selectString = `*, ${relations.join(', ')}`;
        }

        try {
            const { data, error } = await client
                .from(studioTable)
                .select(selectString)
                .eq('id', id)
                .single();
            
            if (!error && data) {
                // Map relation variants to standard keys
                if (tableNames.equipment && tableNames.equipment !== 'equipment') {
                    data.equipment = data[tableNames.equipment];
                }
                if (tableNames.availabilities && tableNames.availabilities !== 'availabilities') {
                    data.availabilities = data[tableNames.availabilities];
                }
                return data;
            }
            
            // If it's a specific Postgres relation error, fall back to core data
            if (error && (error.code === 'PGRST200' || error.code === 'PGRST107')) {
                console.warn(` Relational query failed on ${studioTable}, falling back to core data...`);
                const { data: coreData, error: coreError } = await client
                    .from(studioTable)
                    .select('*')
                    .eq('id', id)
                    .single();
                
                if (coreError) throw coreError;
                
                // Attempt to fetch equipment separately
                if (tableNames.equipment) {
                    try {
                        const { data: eqData } = await client.from(getTableName('equipment')).select('*').eq('studio_id', id);
                        coreData.equipment = eqData || [];
                    } catch (e) { coreData.equipment = []; }
                }

                return coreData;
            } else if (error) {
                throw error;
            }
        } catch (err) {
            console.error(` Critical error fetching studio from ${studioTable}:`, err);
            throw err;
        }
    },

    async updateStudio(id, updates) {
        const tableName = tableNames.studios || 'studios';
        const { data, error } = await supabaseClient
            .from(tableName)
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    },

    async uploadFile(bucket, path, file) {
        const { data, error } = await supabaseClient
            .storage
            .from(bucket)
            .upload(path, file, {
                cacheControl: '3600',
                upsert: true
            });
        
        if (error) throw error;
        
        // Get public URL
        const { data: { publicUrl } } = supabaseClient
            .storage
            .from(bucket)
            .getPublicUrl(data.path);
            
        return publicUrl;
    },
    
    // Bookings
    async createBooking(bookingData) {
        const tableName = getTableName('bookings');
        const { data, error } = await supabaseClient
            .from(tableName)
            .insert([bookingData])
            .select()
            .single();
        
        if (error) throw error;
        return data;
    },
    
    async getUserBookings(userId) {
        const bookingTable = getTableName('bookings');
        const studioTable = getTableName('studios');
        const { data, error } = await supabaseClient
            .from(bookingTable)
            .select(`
                *,
                ${studioTable}(name, location)
            `)
            .eq('user_id', userId)
            .order('start_time', { ascending: false });
        if (error) throw error;
        return data;
    },
    
    // User profile
    async getUserProfile(userId) {
        const tableName = getTableName('users');
        const { data, error } = await supabaseClient
            .from(tableName)
            .select('*')
            .eq('id', userId)
            .single();
        
        if (error) throw error;
        return data;
    },
    
    async updateUserProfile(userId, updates) {
        const tableName = getTableName('users');
        const { data, error } = await supabaseClient
            .from(tableName)
            .update(updates)
            .eq('id', userId)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    },

    // Equipment
    async getEquipment(filters = {}) {
        const tableName = getTableName('equipment');
        const studioTable = getTableName('studios');
        const client = window.supabaseClient || supabaseClient;
        
        if (!client) {
            console.error('Supabase client not ready for getEquipment');
            return [];
        }

        // Try to pre-fetch studios once for the cache
        if (!_studioCache) {
            try {
                const { data: studios } = await client.from(studioTable).select('id, name, slug, location');
                _studioCache = studios || [];
            } catch (e) {
                console.warn('Could not cache studios for equipment join:', e);
                _studioCache = [];
            }
        }

        // Fetch equipment WITHOUT the failing studios(...) join
        let query = client.from(tableName).select('*');
        
        if (filters.category && filters.category !== 'all') {
            query = query.eq('category', filters.category);
        }
        
        if (filters.search) {
            query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%,brand.ilike.%${filters.search}%,model.ilike.%${filters.search}%`);
        }
        
        const { data, error } = await query.order('name');
        if (error) {
            console.error('Error fetching equipment:', error);
            throw error;
        }
        
        // Manual join with cached studios
        return (data || []).map(item => {
            const studioId = item.studio_id || window.HUB_STUDIO_ID;
            const studio = _studioCache.find(s => s.id === studioId) || {};
            
            return {
                ...item,
                studio_name: studio.name || item.studio_name || (studioId === window.HUB_STUDIO_ID ? 'PluggedIn Hub' : 'Independent Gear'),
                studio_slug: studio.slug || item.studio_slug || '',
                studio_location: studio.location || item.studio_location || 'Marketplace',
                studio_id: studioId
            };
        });
    },

    async addEquipment(equipmentData) {
        const tableName = getTableName('equipment');
        const { data, error } = await supabaseClient
            .from(tableName)
            .insert([equipmentData])
            .select()
            .single();
        
        if (error) throw error;
        return data;
    },

    async getPayments(userId, filters = {}) {
        const tableName = getTableName('payments');
        const bookingsTable = getTableName('bookings');
        const studiosTable = getTableName('studios');
        
        let query = supabaseClient
            .from(tableName)
            .select(`
                *,
                ${bookingsTable}(id, studio_id, ${studiosTable}(name))
            `)
            .eq('user_id', userId);
        
        if (filters.status) {
            query = query.eq('status', filters.status);
        }
        
        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    },

    // Studio Analytics & Financials
    async getStudioFinancials(studioId) {
        const paymentsTable = getTableName('payments');
        const bookingsTable = getTableName('bookings');
        
        // Fetch all successful payments for bookings belonging to this studio
        const { data, error } = await supabaseClient
            .from(paymentsTable)
            .select(`
                *,
                ${bookingsTable}!inner(id, studio_id)
            `)
            .eq(`${bookingsTable}.studio_id`, studioId);

        if (error) throw error;
        return data || [];
    },

    async getStudioPayouts(studioId) {
        const tableName = getTableName('payouts');
        // Fetch payout history (assuming a payouts table or similar log)
        const { data, error } = await supabaseClient
            .from(tableName)
            .select('*')
            .eq('studio_id', studioId)
            .order('created_at', { ascending: false });
        if (error && error.code !== 'PGRST116') { // Ignore missing table for now, handle gracefully
            console.warn('Payouts table might not be initialized yet');
            return [];
        }
        return data || [];
    },

    async createPayment(paymentData) {
        const tableName = getTableName('payments');
        const { data, error } = await supabaseClient
            .from(tableName)
            .insert([paymentData])
            .select()
            .single();
        
        if (error) throw error;
        return data;
    },

    async updatePayment(paymentId, updates) {
        const tableName = getTableName('payments');
        const { data, error } = await supabaseClient
            .from(tableName)
            .update(updates)
            .eq('id', paymentId)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    },

    // Reviews
    async getStudioReviews(studioId) {
        const reviewsTable = getTableName('reviews');
        const usersTable = getTableName('users');
        const bookingsTable = getTableName('bookings');
        
        const { data, error } = await supabaseClient
            .from(reviewsTable)
            .select(`
                *,
                ${usersTable}(name, avatar_url),
                ${bookingsTable}(id, verified)
            `)
            .eq('studio_id', studioId)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    },

    async createReview(reviewData) {
        const tableName = getTableName('reviews');
        const usersTable = getTableName('users');
        const { data, error } = await supabaseClient
            .from(tableName)
            .insert([reviewData])
            .select(`
                *,
                ${usersTable}(name, avatar_url)
            `)
            .single();
        
        if (error) throw error;
        return data;
    },

    // Messages
    async getConversations(userId) {
        const conversationsTable = getTableName('conversations');
        const usersTable = getTableName('users');
        const messagesTable = getTableName('messages');
        
        const { data, error } = await supabaseClient
            .from(conversationsTable)
            .select(`
                *,
                participants!inner(user_id, ${usersTable}(name, avatar_url)),
                ${messagesTable}(content, created_at, read)
            `)
            .eq('participants.user_id', userId)
            .order('updated_at', { ascending: false });
        if (error) throw error;
        return data;
    },
 
    async getMessages(conversationId) {
        const messagesTable = getTableName('messages');
        const usersTable = getTableName('users');
        const { data, error } = await supabaseClient
            .from(messagesTable)
            .select(`
                *,
                ${usersTable}(name, avatar_url)
            `)
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true });
        
        if (error) throw error;
        return data;
    },
 
    async sendMessage(messageData) {
        const messagesTable = getTableName('messages');
        const usersTable = getTableName('users');
        const { data, error } = await supabaseClient
            .from(messagesTable)
            .insert([messageData])
            .select(`
                *,
                ${usersTable}(name, avatar_url)
            `)
            .single();
        
        if (error) throw error;
        return data;
    },      // Active Sessions
    async getActiveSession(userId) {
        const sessionsTable = getTableName('active_sessions');
        const bookingsTable = getTableName('bookings');
        const studiosTable = getTableName('studios');
        
        const { data, error } = await supabaseClient
            .from(sessionsTable)
            .select(`
                *,
                ${bookingsTable}(
                    id,
                    start_time,
                    end_time,
                    ${studiosTable}(name, address, room_number)
                )
            `)
            .eq('user_id', userId)
            .eq('status', 'active')
            .single();
        
        if (error && error.code !== 'PGRST116') throw error;
        return data;
    },
 
    async endSession(sessionId) {
        const sessionsTable = getTableName('active_sessions');
        const { data, error } = await supabaseClient
            .from(sessionsTable)
            .update({ 
                status: 'completed',
                ended_at: new Date().toISOString()
            })
            .eq('id', sessionId)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    },

    // Admin functions
    async getAdminStats() {
        try {
            console.log(' Loading admin stats...');
            
            // Use detected table names or fallback to known tables
            const studiosTable = tableNames.studios || 'studios';
            const usersTable = tableNames.users || 'users';
            const bookingsTable = tableNames.bookings || 'bookings';
            const paymentsTable = tableNames.payments || 'payments';
            
            console.log(` Using tables: studios=${studiosTable}, users=${usersTable}, bookings=${bookingsTable}`);
            
            // Query each table individually with error handling
            let totalUsers = 0;
            let totalStudios = 0;
            let totalBookings = 0;
            let totalRevenue = 0;
            
            // Get studios count (this should work since we just created the table)
            try {
                const { count: studiosCount, error: studiosError } = await supabaseClient
                    .from(studiosTable)
                    .select('*', { count: 'exact', head: true });
                
                if (!studiosError) {
                    totalStudios = studiosCount || 0;
                    console.log(` Studios count: ${totalStudios}`);
                } else {
                    console.warn(' Studios query error:', studiosError.message);
                }
            } catch (e) {
                console.warn(' Studios query exception:', e.message);
            }
            
            // Get users count
            try {
                const { count: usersCount, error: usersError } = await supabaseClient
                    .from(usersTable)
                    .select('*', { count: 'exact', head: true });
                
                if (!usersError) {
                    totalUsers = usersCount || 0;
                    console.log(` Users count: ${totalUsers}`);
                } else {
                    console.warn(' Users query error:', usersError.message);
                }
            } catch (e) {
                console.warn(' Users query exception:', e.message);
            }
            
            // Get bookings count
            try {
                const { count: bookingsCount, error: bookingsError } = await supabaseClient
                    .from(bookingsTable)
                    .select('*', { count: 'exact', head: true });
                
                if (!bookingsError) {
                    totalBookings = bookingsCount || 0;
                    console.log(` Bookings count: ${totalBookings}`);
                } else {
                    console.warn(' Bookings query error:', bookingsError.message);
                }
            } catch (e) {
                console.warn(' Bookings query exception:', e.message);
            }
            
            // Get revenue (optional - might not have payments table yet)
            try {
                const { data: paymentsData, error: paymentsError } = await supabaseClient
                    .from(paymentsTable)
                    .select('amount')
                    .eq('status', 'completed');
                
                if (!paymentsError && paymentsData) {
                    totalRevenue = paymentsData.reduce((sum, payment) => sum + (payment.amount || 0), 0);
                    console.log(` Revenue calculated: $${totalRevenue}`);
                }
            } catch (e) {
                console.warn(' Payments query exception (this is normal if table doesn\'t exist):', e.message);
            }
            
            const stats = {
                totalUsers,
                totalStudios,
                totalBookings,
                totalRevenue
            };
            
            console.log(' Final admin stats:', stats);
            return stats;
            
        } catch (error) {
            console.error(' Error in getAdminStats:', error);
            throw error;
        }
    },

    async getAdminUsers(filters = {}) {
        const tableName = getTableName('users');
        let query = supabaseClient
            .from(tableName)
            .select('*');
        
        if (filters.role && filters.role !== 'all') {
            query = query.eq('role', filters.role);
        }
        
        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    },

    async getAdminStudios() {
        const studioTable = getTableName('studios');
        const usersTable = getTableName('users');
        const { data, error } = await supabaseClient
            .from(studioTable)
            .select(`
                *,
                ${usersTable}(name, email)
            `)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    },

    async getAdminBookings(filters = {}) {
        const bookingTable = getTableName('bookings');
        const usersTable = getTableName('users');
        const studiosTable = getTableName('studios');
        let query = supabaseClient
            .from(bookingTable)
            .select(`
                *,
                ${usersTable}(name, email),
                ${studiosTable}(name)
            `);
        
        if (filters.status && filters.status !== 'all') {
            query = query.eq('status', filters.status);
        }
        
        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    },

    async getRecentActivity() {
        // Get recent activities from multiple tables
        const activities = [];
        
        // Recent users
        const usersTable = getTableName('users');
        const { data: recentUsers } = await supabaseClient
            .from(usersTable)
            .select('id, name, created_at')
            .order('created_at', { ascending: false })
            .limit(5);
        
        recentUsers?.forEach(user => {
            activities.push({
                id: `user-${user.id}`,
                type: 'user_created',
                title: 'New user registered',
                description: `${user.name} joined PluggedIn`,
                timestamp: new Date(user.created_at),
                color: 'blue'
            });
        });
        
        // Recent studios
        const studiosTable = getTableName('studios');
        const { data: recentStudios } = await supabaseClient
            .from(studiosTable)
            .select('id, name, created_at')
            .order('created_at', { ascending: false })
            .limit(5);
        
        recentStudios?.forEach(studio => {
            activities.push({
                id: `studio-${studio.id}`,
                type: 'studio_created',
                title: 'New studio added',
                description: `${studio.name} was added to the platform`,
                timestamp: new Date(studio.created_at),
                color: 'green'
            });
        });
        
        // Recent bookings
        const bookingsTable = getTableName('bookings');
        
        const { data: recentBookings } = await supabaseClient
            .from(bookingsTable)
            .select(`
                id, created_at,
                ${usersTable}(name),
                ${studiosTable}(name)
            `)
            .order('created_at', { ascending: false })
            .limit(5);
        
        recentBookings?.forEach(booking => {
            activities.push({
                id: `booking-${booking.id}`,
                type: 'booking_created',
                title: 'New booking made',
                description: `${booking[usersTable]?.name} booked ${booking[studiosTable]?.name}`,
                timestamp: new Date(booking.created_at),
                color: 'orange'
            });
        });
        
        // Sort by timestamp and return latest
        return activities
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 10);
    }

}); // END Object.assign(window.db)

// Initialize DB object with current methods already handled above

// Utility functions
const utilsMethods = {
    formatDate(date) {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    },
    
    formatTime(date) {
        return new Date(date).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    },
    
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    },
    
    showNotification(message, type = 'info') {
        // Create a simple notification system
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 p-4 rounded-md shadow-lg z-50 ${
            type === 'success' ? 'bg-green-500 text-white' :
            type === 'error' ? 'bg-red-500 text-white' :
            'bg-blue-500 text-white'
        }`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }
};

Object.assign(utils, utilsMethods);
window.utils = utils;

// FINAL STEP: Run detection and then resolve the global promise
runTableDetection().then(() => {
    if (window.resolveDB) {
        console.log(' DB_READY resolve triggered');
        window.resolveDB(window.db);
    }
});

