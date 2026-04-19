// Studio Dashboard Module for PluggedIn Studio Owners

class StudioDashboard {
    constructor() {
        this.currentTab = 'overview';
        this.studioData = null;
        this.bookingsData = [];
        this.analyticsData = {};
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadDashboardData();
        this.checkAuthState();
    }

    setupEventListeners() {
        // Tab navigation
        const tabButtons = document.querySelectorAll('.dashboard-tab');
        tabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const tabId = e.target.id.replace('Tab', '');
                this.switchTab(tabId);
            });
        });

        // User menu functionality
        this.setupUserMenu();

        // Quick action buttons
        this.setupQuickActions();
    }

    setupUserMenu() {
        const userMenuBtn = document.getElementById('userMenuBtn');
        const userDropdown = document.getElementById('userDropdown');

        if (userMenuBtn && userDropdown) {
            userMenuBtn.addEventListener('click', () => {
                userDropdown.classList.toggle('hidden');
            });

            // Close dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (!userMenuBtn.contains(e.target) && !userDropdown.contains(e.target)) {
                    userDropdown.classList.add('hidden');
                }
            });
        }

        // Sign out functionality
        const signOutBtn = document.getElementById('signOutBtn');
        if (signOutBtn) {
            signOutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.signOut();
            });
        }
    }

    setupQuickActions() {
        // Quick action buttons in overview
        const quickActionBtns = document.querySelectorAll('.quick-action-btn');
        quickActionBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                this.handleQuickAction(action);
            });
        });
    }

    async checkAuthState() {
        try {
            const { data: { session } } = await supabaseClient.auth.getSession();
            if (!session) {
                // Redirect to login if not authenticated
                window.location.href = 'webapp.html';
                return;
            }

            // Update user info in UI
            this.updateUserInfo(session.user);
        } catch (error) {
            console.error('Error checking auth state:', error);
            window.location.href = 'webapp.html';
        }
    }

    updateUserInfo(user) {
        const userInitials = document.getElementById('userInitials');
        if (userInitials && user.email) {
            const initials = user.email.substring(0, 2).toUpperCase();
            userInitials.textContent = initials;
        }
    }

    switchTab(tabId) {
        // Update active tab button
        document.querySelectorAll('.dashboard-tab').forEach(btn => {
            btn.classList.remove('active', 'bg-blue-100', 'text-blue-700', 'dark:bg-blue-900/30', 'dark:text-blue-300', 'font-bold');
            btn.classList.add('text-gray-700', 'dark:text-gray-400', 'hover:bg-gray-100', 'dark:hover:bg-slate-800');
        });

        const activeTab = document.getElementById(`${tabId}Tab`);
        if (activeTab) {
            activeTab.classList.add('active', 'bg-blue-100', 'dark:bg-blue-900/30', 'text-blue-700', 'dark:text-blue-300', 'font-bold');
            activeTab.classList.remove('text-gray-700', 'dark:text-gray-400', 'hover:bg-gray-100', 'dark:hover:bg-slate-800');
        }

        // Show/hide content
        document.querySelectorAll('.dashboard-content').forEach(content => {
            content.classList.add('hidden');
        });

        const activeContent = document.getElementById(`${tabId}Content`);
        if (activeContent) {
            activeContent.classList.remove('hidden');
        }

        this.currentTab = tabId;

        // Load tab-specific data
        this.loadTabData(tabId);
    }

    async loadDashboardData() {
        try {
            // First verify we have a studio ID (in a real app this would be linked to the user)
            const studioId = localStorage.getItem('currentStudioId') || '1';
            
            // Load initial dashboard data from DB
            const [financials, payouts] = await Promise.all([
                db.getStudioFinancials(studioId),
                db.getStudioPayouts(studioId)
            ]);

            this.processAnalytics(financials);
            this.payoutsData = payouts;

            this.updateOverviewStats();
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            utils.showNotification('Error loading dashboard data', 'error');
        }
    }

    processAnalytics(financials) {
        const platformFeePercentage = 0.10; // 10% platform fee
        const succeeded = financials.filter(f => f.status === 'succeeded');
        
        const grossRevenue = succeeded.reduce((sum, f) => sum + (f.amount || 0), 0);
        const netRevenue = grossRevenue * (1 - platformFeePercentage);
        const totalBookings = succeeded.length;
        
        // Calculate this month's revenue
        const now = new Date();
        const thisMonth = succeeded.filter(f => {
            const date = new Date(f.created_at);
            return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
        });
        
        const monthlyGross = thisMonth.reduce((sum, f) => sum + (f.amount || 0), 0);

        this.analyticsData = {
            monthlyBookings: totalBookings, // For demo purposes using total as monthly if monthly is small
            monthlyRevenue: monthlyGross / 100, // Convert cents to dollars
            netEarnings: (netRevenue / 100).toFixed(2),
            totalGross: (grossRevenue / 100).toFixed(2)
        };
    }

    updateOverviewStats() {
        // Update monthly bookings
        const monthlyBookingsEl = document.getElementById('monthlyBookings');
        if (monthlyBookingsEl) {
            monthlyBookingsEl.textContent = this.analyticsData.monthlyBookings;
        }

        // Update monthly revenue
        const monthlyRevenueEl = document.getElementById('monthlyRevenue');
        if (monthlyRevenueEl) {
            monthlyRevenueEl.textContent = utils.formatCurrency(this.analyticsData.monthlyRevenue);
        }

        // Update active integrations count
        const activeIntegrationsEl = document.getElementById('activeIntegrations');
        if (activeIntegrationsEl && window.calendarIntegrations) {
            activeIntegrationsEl.textContent = window.calendarIntegrations.activeIntegrations.length;
        }
    }

    async loadTabData(tabId) {
        switch (tabId) {
            case 'overview':
                this.updateOverviewStats();
                break;
            case 'studio':
                this.loadStudioDetails();
                break;
            case 'bookings':
                this.loadBookingsDetails();
                break;
            case 'integrations':
                // Calendar integrations are handled by the CalendarIntegrationsManager
                break;
            case 'analytics':
                this.loadAnalyticsDetails();
                break;
            case 'financials':
                this.loadFinancialsDetails();
                break;
        }
    }

    loadStudioDetails() {
        const studioContent = document.getElementById('studioContent');
        if (!studioContent || !this.studioData) return;

        studioContent.innerHTML = `
                <div class="bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-8 border dark:border-slate-800">
                    <div class="flex justify-between items-center mb-8">
                        <h2 class="text-xl font-bold text-gray-900 dark:text-white">Studio Details</h2>
                        <button class="bg-black dark:bg-white text-white dark:text-black px-6 py-2.5 rounded-xl font-bold hover:opacity-90 transition-all shadow-lg active:scale-95">
                            Edit Studio
                        </button>
                    </div>
    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h3 class="text-lg font-bold mb-4 text-gray-900 dark:text-white">Basic Information</h3>
                            <div class="space-y-4">
                                <div class="p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-100 dark:border-slate-800">
                                    <label class="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Studio Name</label>
                                    <p class="text-gray-900 dark:text-white font-medium">${this.studioData.name}</p>
                                </div>
                                <div class="p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-100 dark:border-slate-800">
                                    <label class="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Location</label>
                                    <p class="text-gray-900 dark:text-white font-medium">${this.studioData.location}</p>
                                </div>
                                <div class="grid grid-cols-2 gap-4">
                                    <div class="p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-100 dark:border-slate-800">
                                        <label class="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Hourly Rate</label>
                                        <p class="text-gray-900 dark:text-white font-medium">${utils.formatCurrency(this.studioData.hourly_rate)}</p>
                                    </div>
                                    <div class="p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-100 dark:border-slate-800">
                                        <label class="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Capacity</label>
                                        <p class="text-gray-900 dark:text-white font-medium">${this.studioData.capacity} people</p>
                                    </div>
                                </div>
                            </div>
                        </div>
    
                        <div>
                            <h3 class="text-lg font-bold mb-4 text-gray-900 dark:text-white">About Your Space</h3>
                            <div class="p-6 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-800 h-full">
                                <p class="text-gray-600 dark:text-gray-400 leading-relaxed">${this.studioData.description}</p>
                                
                                <div class="mt-8 pt-6 border-t dark:border-slate-700">
                                    <h4 class="text-sm font-bold text-gray-900 dark:text-white mb-4">Integrations</h4>
                                    <div id="studioIntegrationsSummary" class="space-y-3">
                                        <p class="text-xs text-gray-400 italic">No external calendars linked</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
        `;

        // Update integrations summary if possible
        this.updateIntegrationsSummary();
    }

    async updateIntegrationsSummary() {
        const container = document.getElementById('studioIntegrationsSummary');
        if (!container || !window.calendarIntegrations) return;

        const integrations = window.calendarIntegrations.activeIntegrations;
        if (integrations && integrations.length > 0) {
            container.innerHTML = integrations.map(i => `
                <div class="flex items-center justify-between text-sm">
                    <div class="flex items-center">
                        <span class="mr-2">${window.calendarIntegrations.supportedIntegrations[i.type]?.icon || '📅'}</span>
                        <span class="text-gray-900 font-medium">${window.calendarIntegrations.supportedIntegrations[i.type]?.name}</span>
                    </div>
                    <span class="text-green-600 text-[10px] font-bold uppercase tracking-tighter">Connected</span>
                </div>
            `).join('');
        }
    }

    loadBookingsDetails() {
        const bookingsContent = document.getElementById('bookingsContent');
        if (!bookingsContent) return;

        bookingsContent.innerHTML = `
            <div class="bg-white rounded-lg shadow p-6">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-xl font-semibold">Recent Bookings</h2>
                    <div class="flex space-x-2">
                        <button class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                            Export
                        </button>
                        <button class="border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50">
                            Filter
                        </button>
                    </div>
                </div>

                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                            ${this.bookingsData.map(booking => `
                                <tr>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        ${booking.client_name}
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        ${utils.formatDate(booking.start_time)}<br>
                                        ${utils.formatTime(booking.start_time)}
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        ${booking.duration} hours
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        ${utils.formatCurrency(booking.total_cost)}
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                            booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-red-100 text-red-800'
                                        }">
                                            ${booking.status}
                                        </span>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <button class="text-blue-600 hover:text-blue-900 mr-3">View</button>
                                        <button class="text-gray-600 hover:text-gray-900">Edit</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    async loadFinancialsDetails() {
        const container = document.getElementById('financialsContent');
        if (!container) return;

        const studioId = localStorage.getItem('currentStudioId') || '1';
        
        // Show loading state
        container.innerHTML = `
            <div class="bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-8 border dark:border-slate-800 text-center py-12">
                <div class="animate-spin h-8 w-8 border-b-2 border-black dark:border-white mx-auto mb-4 rounded-full"></div>
                <p class="text-gray-500 dark:text-gray-400">Loading financial data...</p>
            </div>
        `;

        try {
            const [financials, payouts, studioInfo] = await Promise.all([
                db.getStudioFinancials(studioId),
                db.getStudioPayouts(studioId),
                db.getStudio(studioId)
            ]);

            this.processAnalytics(financials);
            this.payoutsData = payouts;
            this.studioData = studioInfo;

            const isConnected = studioInfo.stripe_onboarding_complete;

            container.innerHTML = `
                <div class="space-y-6">
                    <!-- Stripe Status Card -->
                    <div class="bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-8 border dark:border-slate-800">
                        <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div class="flex items-center space-x-4">
                                <div class="w-16 h-16 ${isConnected ? 'bg-green-100 dark:bg-green-900/30' : 'bg-blue-100 dark:bg-blue-900/30'} rounded-2xl flex items-center justify-center text-3xl">
                                    ${isConnected ? '✅' : '💳'}
                                </div>
                                <div>
                                    <h2 class="text-xl font-bold text-gray-900 dark:text-white">Payout Method</h2>
                                    <p class="text-sm text-gray-500 dark:text-gray-400">
                                        ${isConnected ? 'Your bank account is linked via Stripe' : 'Connect your bank account to receive payouts'}
                                    </p>
                                </div>
                            </div>
                            <button onclick="stripeConnect.initiateOnboarding()" class="px-8 py-3.5 ${isConnected ? 'bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-white' : 'bg-black dark:bg-white text-white dark:text-black'} rounded-xl font-bold hover:opacity-90 transition-all shadow-xl active:scale-95">
                                ${isConnected ? 'Manage Stripe Account' : 'Connect with Stripe'}
                            </button>
                        </div>
                    </div>

                    <!-- Earnings Grid -->
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div class="bg-gray-50 dark:bg-slate-800/50 rounded-2xl p-8 border border-gray-100 dark:border-slate-800">
                            <label class="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Gross Earnings</label>
                            <p class="text-3xl font-bold text-gray-900 dark:text-white">${utils.formatCurrency(this.analyticsData.totalGross)}</p>
                            <p class="text-[10px] text-gray-400 mt-2 font-medium">Total revenue before fees</p>
                        </div>
                        <div class="bg-gray-50 dark:bg-slate-800/50 rounded-2xl p-8 border border-gray-100 dark:border-slate-800">
                            <label class="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Platform Fees (10%)</label>
                            <p class="text-3xl font-bold text-red-600 dark:text-red-400">-${utils.formatCurrency(this.analyticsData.totalGross * 0.10)}</p>
                            <p class="text-[10px] text-gray-400 mt-2 font-medium">Auto-deducted upon booking</p>
                        </div>
                        <div class="bg-black dark:bg-white rounded-2xl p-8 shadow-2xl">
                            <label class="block text-xs font-bold text-gray-400 dark:text-gray-400 uppercase tracking-widest mb-1">Available for Payout</label>
                            <p class="text-3xl font-bold text-white dark:text-black">${utils.formatCurrency(this.analyticsData.netEarnings)}</p>
                            <p class="text-[10px] text-blue-200 dark:text-blue-700 mt-2 font-bold uppercase tracking-tighter">Ready to transfer</p>
                        </div>
                    </div>

                    <!-- Payout History -->
                    <div class="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border dark:border-slate-800 overflow-hidden">
                        <div class="p-8 border-b dark:border-slate-800">
                            <h3 class="text-lg font-bold text-gray-900 dark:text-white">Payout History</h3>
                        </div>
                        <div class="overflow-x-auto">
                            ${this.payoutsData && this.payoutsData.length > 0 ? `
                                <table class="min-w-full divide-y dark:divide-slate-800">
                                    <thead class="bg-gray-50 dark:bg-slate-800/20">
                                        <tr>
                                            <th class="px-8 py-4 text-left text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Date</th>
                                            <th class="px-8 py-4 text-left text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Status</th>
                                            <th class="px-8 py-4 text-left text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Method</th>
                                            <th class="px-8 py-4 text-right text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody class="divide-y dark:divide-slate-800">
                                        ${this.payoutsData.map(payout => `
                                            <tr class="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                                                <td class="px-8 py-5 text-sm text-gray-900 dark:text-gray-200 font-medium">
                                                    ${utils.formatDate(payout.created_at)}
                                                </td>
                                                <td class="px-8 py-5">
                                                    <span class="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                                                        payout.status === 'paid' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                                                        payout.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
                                                        'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                                    }">
                                                        ${payout.status}
                                                    </span>
                                                </td>
                                                <td class="px-8 py-5 text-sm text-gray-500 dark:text-gray-400">
                                                    ${payout.payout_method || 'Bank Transfer'}
                                                </td>
                                                <td class="px-8 py-5 text-right text-sm font-bold text-gray-900 dark:text-white">
                                                    ${utils.formatCurrency(payout.amount / 100)}
                                                </td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            ` : `
                                <div class="p-12 text-center">
                                    <div class="text-4xl mb-4">🏜️</div>
                                    <p class="text-gray-500 dark:text-gray-400 font-medium">No payouts recorded yet.</p>
                                    <p class="text-xs text-gray-400 mt-1">Earnings will appear here after your first completed booking.</p>
                                </div>
                            `}
                        </div>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Error loading financials:', error);
            container.innerHTML = `
                <div class="bg-red-50 dark:bg-red-900/20 p-8 rounded-2xl border border-red-100 dark:border-red-900/30 text-center">
                    <p class="text-red-700 dark:text-red-400 font-bold">Error loading financial data</p>
                    <button onclick="studioDashboard.loadFinancialsDetails()" class="mt-4 text-sm font-bold underline">Try Again</button>
                </div>
            `;
        }
    }

    loadAnalyticsDetails() {
        const analyticsContent = document.getElementById('analyticsContent');
        if (!analyticsContent) return;

        analyticsContent.innerHTML = `
            <div class="space-y-6">
                <!-- Key Metrics -->
                <div class="bg-white rounded-lg shadow p-6">
                    <h2 class="text-xl font-semibold mb-6">Key Metrics</h2>
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div class="text-center">
                            <div class="text-3xl font-bold text-blue-600">${this.analyticsData.monthlyBookings}</div>
                            <div class="text-sm text-gray-600">Total Bookings</div>
                        </div>
                        <div class="text-center">
                            <div class="text-3xl font-bold text-green-600">${utils.formatCurrency(this.analyticsData.monthlyRevenue)}</div>
                            <div class="text-sm text-gray-600">Revenue</div>
                        </div>
                        <div class="text-center">
                            <div class="text-3xl font-bold text-purple-600">${this.analyticsData.averageBookingDuration}h</div>
                            <div class="text-sm text-gray-600">Avg Duration</div>
                        </div>
                        <div class="text-center">
                            <div class="text-3xl font-bold text-orange-600">${this.analyticsData.repeatCustomers}</div>
                            <div class="text-sm text-gray-600">Repeat Customers</div>
                        </div>
                    </div>
                </div>

                <!-- Popular Times -->
                <div class="bg-white rounded-lg shadow p-6">
                    <h3 class="text-lg font-semibold mb-4">Popular Booking Times</h3>
                    <div class="flex flex-wrap gap-2">
                        ${this.analyticsData.popularTimes.map(time => `
                            <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                ${time}
                            </span>
                        `).join('')}
                    </div>
                </div>

                <!-- Equipment Usage -->
                <div class="bg-white rounded-lg shadow p-6">
                    <h3 class="text-lg font-semibold mb-4">Equipment Usage</h3>
                    <div class="space-y-4">
                        ${Object.entries(this.analyticsData.equipmentUsage).map(([equipment, usage]) => `
                            <div>
                                <div class="flex justify-between text-sm">
                                    <span class="font-medium text-gray-700">${equipment}</span>
                                    <span class="text-gray-500">${usage}%</span>
                                </div>
                                <div class="mt-1 bg-gray-200 rounded-full h-2">
                                    <div class="bg-blue-600 h-2 rounded-full" style="width: ${usage}%"></div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    handleQuickAction(action) {
        switch (action) {
            case 'add_integration':
                this.switchTab('integrations');
                if (window.calendarIntegrations) {
                    window.calendarIntegrations.showIntegrationModal();
                }
                break;
            case 'update_availability':
                utils.showNotification('Availability management coming soon!', 'info');
                break;
            default:
                console.log('Unknown quick action:', action);
        }
    }

    async signOut() {
        try {
            const { error } = await supabaseClient.auth.signOut();
            if (error) throw error;

            window.location.href = 'webapp.html';
        } catch (error) {
            console.error('Sign out error:', error);
            utils.showNotification('Error signing out', 'error');
        }
    }

    // Public API methods
    getStudioData() {
        return this.studioData;
    }

    getBookingsData() {
        return this.bookingsData;
    }

    getAnalyticsData() {
        return this.analyticsData;
    }

    refreshData() {
        this.loadDashboardData();
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.studioDashboard = new StudioDashboard();
});
