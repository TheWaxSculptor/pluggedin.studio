// Supabase Configuration for PluggedIn Web App
// Using actual Supabase project credentials

// Get config from supabase-config.js
const SUPABASE_URL = window.SUPABASE_CONFIG?.url || 'https://fdkrfyzcxhnhanodxopj.supabase.co';
const SUPABASE_ANON_KEY = window.SUPABASE_CONFIG?.anonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZka3JmeXpjeGhuaGFub2R4b3BqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg3MTIwNTksImV4cCI6MjA2NDI4ODA1OX0.tbdvE-7bkxJ09fUxH2Ds9z1k-ricXU4ezDHqeseytao';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Export for use in other modules
window.supabaseClient = supabase;

// Auth state management
let currentUser = null;
let authStateListeners = [];

// Subscribe to auth changes
supabase.auth.onAuthStateChange((event, session) => {
    console.log('Auth state changed:', event, session);
    
    if (session) {
        currentUser = session.user;
        updateUIForAuthenticatedUser(currentUser);
    } else {
        currentUser = null;
        updateUIForUnauthenticatedUser();
    }
    
    // Notify all listeners
    authStateListeners.forEach(listener => listener(event, session));
});

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
const tableNames = {
    studios: null,
    equipment: null,
    users: null,
    bookings: null,
    payments: null,
    reviews: null
};

// Detect actual table names in the database
async function detectTableNames() {
    const variations = {
        studios: ['studios', 'studio_registrations', 'studio', 'Studio', 'STUDIOS'],
        equipment: ['equipment', 'equipments', 'Equipment', 'EQUIPMENT', 'gear', 'instruments'],
        users: ['users', 'user', 'User', 'USERS'],
        bookings: ['bookings', 'booking', 'Booking', 'BOOKINGS'],
        payments: ['payments', 'payment', 'Payment', 'PAYMENTS'],
        reviews: ['reviews', 'review', 'Review', 'REVIEWS'],
        conversations: ['conversations', 'conversation'],
        messages: ['messages', 'message'],
        availabilities: ['availabilities', 'availability']
    };
    
    for (const [key, variants] of Object.entries(variations)) {
        for (const variant of variants) {
            try {
                const { error } = await supabase
                    .from(variant)
                    .select('*', { count: 'exact', head: true });
                
                if (!error) {
                    tableNames[key] = variant;
                    console.log(`✅ Found table: ${key} -> ${variant}`);
                    break;
                }
            } catch (e) {
                // Continue to next variant
            }
        }
        
        if (!tableNames[key]) {
            console.warn(`⚠️ Table not found: ${key}`);
        }
    }
}

// Initialize table detection
detectTableNames().then(() => {
    console.log('🎵 Table detection completed:', tableNames);
}).catch(err => {
    console.warn('⚠️ Table detection failed:', err);
});

// Database helper functions
const db = {
    // Studios
    async getStudios(filters = {}) {
        const tableName = tableNames.studios || 'studios';
        
        let query = supabase
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
        
        console.log('✅ Studios data loaded:', data);
        return data || [];
    },
    
    async getStudio(id) {
        const { data, error } = await supabase
            .from('studios')
            .select(`
                *,
                equipment(*),
                availabilities(*)
            `)
            .eq('id', id)
            .single();
        
        if (error) throw error;
        return data;
    },
    
    // Bookings
    async createBooking(bookingData) {
        const { data, error } = await supabase
            .from('bookings')
            .insert([bookingData])
            .select()
            .single();
        
        if (error) throw error;
        return data;
    },
    
    async getUserBookings(userId) {
        const { data, error } = await supabase
            .from('bookings')
            .select(`
                *,
                studios(name, location)
            `)
            .eq('user_id', userId)
            .order('start_time', { ascending: false });
        
        if (error) throw error;
        return data;
    },
    
    // User profile
    async getUserProfile(userId) {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();
        
        if (error) throw error;
        return data;
    },
    
    async updateUserProfile(userId, updates) {
        const { data, error } = await supabase
            .from('users')
            .update(updates)
            .eq('id', userId)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    },

    // Equipment
    async getEquipment(filters = {}) {
        console.log('🎵 Starting getEquipment function...');
        
        // Use 'equipment' table with explicit public schema
        const tableName = 'equipment';
        console.log(`🔍 Querying equipment table: ${tableName}`);
        
        // Try querying with explicit schema reference
        let query = supabase
            .from(tableName)
            .select('*');
        
        if (filters.category && filters.category !== 'all') {
            query = query.eq('category', filters.category);
            console.log(`🏷️ Filtering by category: ${filters.category}`);
        }
        
        if (filters.search) {
            query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%,brand.ilike.%${filters.search}%,model.ilike.%${filters.search}%`);
            console.log(`🔍 Searching for: ${filters.search}`);
        }
        
        try {
            const { data, error } = await query.order('name');
            
            if (error) {
                console.error('❌ Equipment loading error:', error);
                throw error;
            }
            
            console.log(`✅ Successfully loaded ${data?.length || 0} equipment items`);
            console.log('📦 Equipment data:', data);
            return data || [];
        } catch (error) {
            console.error('❌ Exception in getEquipment:', error);
            throw error;
        }
    },

    async addEquipment(equipmentData) {
        const { data, error } = await supabase
            .from('equipment')
            .insert([equipmentData])
            .select()
            .single();
        
        if (error) throw error;
        return data;
    },

    // Payments
    async getPayments(userId, filters = {}) {
        let query = supabase
            .from('payments')
            .select(`
                *,
                bookings(id, studio_id, studios(name))
            `)
            .eq('user_id', userId);
        
        if (filters.status) {
            query = query.eq('status', filters.status);
        }
        
        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    },

    async createPayment(paymentData) {
        const { data, error } = await supabase
            .from('payments')
            .insert([paymentData])
            .select()
            .single();
        
        if (error) throw error;
        return data;
    },

    async updatePayment(paymentId, updates) {
        const { data, error } = await supabase
            .from('payments')
            .update(updates)
            .eq('id', paymentId)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    },

    // Reviews
    async getStudioReviews(studioId) {
        const { data, error } = await supabase
            .from('reviews')
            .select(`
                *,
                users(name, avatar_url),
                bookings(id, verified)
            `)
            .eq('studio_id', studioId)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data;
    },

    async createReview(reviewData) {
        const { data, error } = await supabase
            .from('reviews')
            .insert([reviewData])
            .select(`
                *,
                users(name, avatar_url)
            `)
            .single();
        
        if (error) throw error;
        return data;
    },

    // Messages
    async getConversations(userId) {
        const { data, error } = await supabase
            .from('conversations')
            .select(`
                *,
                participants!inner(user_id, users(name, avatar_url)),
                messages(content, created_at, read)
            `)
            .eq('participants.user_id', userId)
            .order('updated_at', { ascending: false });
        
        if (error) throw error;
        return data;
    },

    async getMessages(conversationId) {
        const { data, error } = await supabase
            .from('messages')
            .select(`
                *,
                users(name, avatar_url)
            `)
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true });
        
        if (error) throw error;
        return data;
    },

    async sendMessage(messageData) {
        const { data, error } = await supabase
            .from('messages')
            .insert([messageData])
            .select(`
                *,
                users(name, avatar_url)
            `)
            .single();
        
        if (error) throw error;
        return data;
    },

    // Active Sessions
    async getActiveSession(userId) {
        const { data, error } = await supabase
            .from('active_sessions')
            .select(`
                *,
                bookings(
                    id,
                    start_time,
                    end_time,
                    studios(name, address, room_number)
                )
            `)
            .eq('user_id', userId)
            .eq('status', 'active')
            .single();
        
        if (error && error.code !== 'PGRST116') throw error;
        return data;
    },

    async endSession(sessionId) {
        const { data, error } = await supabase
            .from('active_sessions')
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
            console.log('🔍 Loading admin stats...');
            
            // Use detected table names or fallback to known tables
            const studiosTable = tableNames.studios || 'studios';
            const usersTable = tableNames.users || 'users';
            const bookingsTable = tableNames.bookings || 'bookings';
            const paymentsTable = tableNames.payments || 'payments';
            
            console.log(`📊 Using tables: studios=${studiosTable}, users=${usersTable}, bookings=${bookingsTable}`);
            
            // Query each table individually with error handling
            let totalUsers = 0;
            let totalStudios = 0;
            let totalBookings = 0;
            let totalRevenue = 0;
            
            // Get studios count (this should work since we just created the table)
            try {
                const { count: studiosCount, error: studiosError } = await supabase
                    .from(studiosTable)
                    .select('*', { count: 'exact', head: true });
                
                if (!studiosError) {
                    totalStudios = studiosCount || 0;
                    console.log(`✅ Studios count: ${totalStudios}`);
                } else {
                    console.warn('⚠️ Studios query error:', studiosError.message);
                }
            } catch (e) {
                console.warn('⚠️ Studios query exception:', e.message);
            }
            
            // Get users count
            try {
                const { count: usersCount, error: usersError } = await supabase
                    .from(usersTable)
                    .select('*', { count: 'exact', head: true });
                
                if (!usersError) {
                    totalUsers = usersCount || 0;
                    console.log(`✅ Users count: ${totalUsers}`);
                } else {
                    console.warn('⚠️ Users query error:', usersError.message);
                }
            } catch (e) {
                console.warn('⚠️ Users query exception:', e.message);
            }
            
            // Get bookings count
            try {
                const { count: bookingsCount, error: bookingsError } = await supabase
                    .from(bookingsTable)
                    .select('*', { count: 'exact', head: true });
                
                if (!bookingsError) {
                    totalBookings = bookingsCount || 0;
                    console.log(`✅ Bookings count: ${totalBookings}`);
                } else {
                    console.warn('⚠️ Bookings query error:', bookingsError.message);
                }
            } catch (e) {
                console.warn('⚠️ Bookings query exception:', e.message);
            }
            
            // Get revenue (optional - might not have payments table yet)
            try {
                const { data: paymentsData, error: paymentsError } = await supabase
                    .from(paymentsTable)
                    .select('amount')
                    .eq('status', 'completed');
                
                if (!paymentsError && paymentsData) {
                    totalRevenue = paymentsData.reduce((sum, payment) => sum + (payment.amount || 0), 0);
                    console.log(`✅ Revenue calculated: $${totalRevenue}`);
                }
            } catch (e) {
                console.warn('⚠️ Payments query exception (this is normal if table doesn\'t exist):', e.message);
            }
            
            const stats = {
                totalUsers,
                totalStudios,
                totalBookings,
                totalRevenue
            };
            
            console.log('📊 Final admin stats:', stats);
            return stats;
            
        } catch (error) {
            console.error('❌ Error in getAdminStats:', error);
            throw error;
        }
    },

    async getAdminUsers(filters = {}) {
        let query = supabase
            .from('users')
            .select('*');
        
        if (filters.role && filters.role !== 'all') {
            query = query.eq('role', filters.role);
        }
        
        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    },

    async getAdminStudios() {
        const { data, error } = await supabase
            .from('studios')
            .select(`
                *,
                users(name, email)
            `)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data;
    },

    async getAdminBookings(filters = {}) {
        let query = supabase
            .from('bookings')
            .select(`
                *,
                users(name, email),
                studios(name)
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
        const { data: recentUsers } = await supabase
            .from('users')
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
        const { data: recentStudios } = await supabase
            .from('studios')
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
        const { data: recentBookings } = await supabase
            .from('bookings')
            .select(`
                id, created_at,
                users(name),
                studios(name)
            `)
            .order('created_at', { ascending: false })
            .limit(5);
        
        recentBookings?.forEach(booking => {
            activities.push({
                id: `booking-${booking.id}`,
                type: 'booking_created',
                title: 'New booking made',
                description: `${booking.users?.name} booked ${booking.studios?.name}`,
                timestamp: new Date(booking.created_at),
                color: 'orange'
            });
        });
        
        // Sort by timestamp and return latest
        return activities
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 10);
    }
};

// Export database helper
window.db = db;

// Utility functions
const utils = {
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

// Export utilities
window.utils = utils;
