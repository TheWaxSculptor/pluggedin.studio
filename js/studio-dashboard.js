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
            btn.classList.remove('active', 'bg-blue-100', 'text-blue-700');
            btn.classList.add('text-gray-700', 'hover:bg-gray-100');
        });

        const activeTab = document.getElementById(`${tabId}Tab`);
        if (activeTab) {
            activeTab.classList.add('active', 'bg-blue-100', 'text-blue-700');
            activeTab.classList.remove('text-gray-700', 'hover:bg-gray-100');
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
            // Load initial dashboard data
            await Promise.all([
                this.loadStudioData(),
                this.loadBookingsData(),
                this.loadAnalyticsData()
            ]);

            this.updateOverviewStats();
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            utils.showNotification('Error loading dashboard data', 'error');
        }
    }

    async loadStudioData() {
        try {
            // In a real implementation, this would load the studio data from the database
            // For now, we'll simulate studio data
            this.studioData = {
                id: '1',
                name: 'Harmony Recording Studio',
                location: 'Nashville, TN',
                hourly_rate: 150,
                capacity: 8,
                description: 'Professional recording studio with state-of-the-art equipment',
                equipment_count: 25,
                images: ['studio1.jpg'],
                status: 'active'
            };
        } catch (error) {
            console.error('Error loading studio data:', error);
        }
    }

    async loadBookingsData() {
        try {
            // Simulate bookings data
            this.bookingsData = [
                {
                    id: '1',
                    client_name: 'John Smith',
                    start_time: new Date().toISOString(),
                    duration: 3,
                    total_cost: 450,
                    status: 'confirmed'
                },
                {
                    id: '2',
                    client_name: 'Sarah Johnson',
                    start_time: new Date(Date.now() + 86400000).toISOString(),
                    duration: 2,
                    total_cost: 300,
                    status: 'pending'
                }
            ];
        } catch (error) {
            console.error('Error loading bookings data:', error);
        }
    }

    async loadAnalyticsData() {
        try {
            // Simulate analytics data
            this.analyticsData = {
                monthlyBookings: 12,
                monthlyRevenue: 2400,
                averageBookingDuration: 2.5,
                repeatCustomers: 8,
                popularTimes: ['2pm-4pm', '6pm-8pm'],
                equipmentUsage: {
                    'Microphones': 85,
                    'Mixing Board': 90,
                    'Monitors': 75
                }
            };
        } catch (error) {
            console.error('Error loading analytics data:', error);
        }
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
        }
    }

    loadStudioDetails() {
        const studioContent = document.getElementById('studioContent');
        if (!studioContent || !this.studioData) return;

        studioContent.innerHTML = `
            <div class="bg-white rounded-lg shadow p-6">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-xl font-semibold">Studio Details</h2>
                    <button class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                        Edit Studio
                    </button>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h3 class="text-lg font-medium mb-4">Basic Information</h3>
                        <div class="space-y-3">
                            <div>
                                <label class="block text-sm font-medium text-gray-700">Studio Name</label>
                                <p class="mt-1 text-sm text-gray-900">${this.studioData.name}</p>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700">Location</label>
                                <p class="mt-1 text-sm text-gray-900">${this.studioData.location}</p>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700">Hourly Rate</label>
                                <p class="mt-1 text-sm text-gray-900">${utils.formatCurrency(this.studioData.hourly_rate)}</p>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700">Capacity</label>
                                <p class="mt-1 text-sm text-gray-900">${this.studioData.capacity} people</p>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 class="text-lg font-medium mb-4">Description</h3>
                        <p class="text-sm text-gray-900">${this.studioData.description}</p>
                        
                        <div class="mt-6">
                            <h4 class="text-sm font-medium text-gray-700 mb-2">Statistics</h4>
                            <div class="space-y-2 text-sm">
                                <div class="flex justify-between">
                                    <span class="text-gray-600">Equipment Items:</span>
                                    <span class="text-gray-900">${this.studioData.equipment_count}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-gray-600">Status:</span>
                                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        ${this.studioData.status}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
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
