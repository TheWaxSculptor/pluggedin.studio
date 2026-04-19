// Calendar Integrations Module for PluggedIn Studio Owners

class CalendarIntegrationsManager {
    constructor() {
        this.supportedIntegrations = {
            calendly: {
                name: 'Calendly',
                description: 'Sync your Calendly availability and bookings',
                icon: '📅',
                color: 'blue',
                authType: 'api_key', // Changed to api_key for direct URL setup
                features: ['availability_sync', 'booking_sync', 'direct_booking'],
                setupFields: ['calendly_url', 'api_key']
            },
            square: {
                name: 'Square Appointments',
                description: 'Integrate with Square booking system',
                icon: '⬜',
                color: 'gray',
                authType: 'api_key',
                features: ['availability_sync', 'booking_sync', 'payment_integration'],
                setupFields: ['application_id', 'access_token', 'location_id']
            },
            acuity: {
                name: 'Acuity / Squarespace',
                description: 'Connect your Acuity Scheduling account',
                icon: '🎯',
                color: 'purple',
                authType: 'api_key',
                features: ['availability_sync', 'booking_sync', 'client_management'],
                setupFields: ['user_id', 'api_key']
            },
            google: {
                name: 'Google Calendar',
                description: 'Full 2-way sync with Google Calendar',
                icon: '📊',
                color: 'red',
                authType: 'oauth',
                features: ['availability_sync', 'push_bookings', 'real_time_updates'],
                setupFields: ['calendar_id']
            },
            outlook: {
                name: 'Outlook / Office 365',
                description: 'Microsoft 365 and Outlook.com sync',
                icon: '📧',
                color: 'blue',
                authType: 'oauth',
                features: ['availability_sync', 'push_bookings', 'real_time_updates'],
                setupFields: ['calendar_id']
            },
            setmore: {
                name: 'Setmore',
                description: 'Integrate with Setmore appointment booking',
                icon: '⏰',
                color: 'green',
                authType: 'api_key',
                features: ['availability_sync', 'booking_sync', 'customer_management'],
                setupFields: ['api_key', 'refresh_token']
            },
            picktime: {
                name: 'Picktime',
                description: 'Connect your Picktime booking system',
                icon: '🕐',
                color: 'orange',
                authType: 'api_key',
                features: ['availability_sync', 'booking_sync'],
                setupFields: ['api_key', 'business_id']
            },
            zoho: {
                name: 'Zoho Bookings',
                description: 'Sync with Zoho Bookings platform',
                icon: '📋',
                color: 'blue',
                authType: 'oauth',
                features: ['availability_sync', 'booking_sync', 'analytics'],
                setupFields: ['client_id', 'client_secret']
            },
            simplybook: {
                name: 'SimplyBook.me',
                description: 'Integrate with SimplyBook.me system',
                icon: '📖',
                color: 'teal',
                authType: 'api_key',
                features: ['availability_sync', 'booking_sync', 'multi_location'],
                setupFields: ['company_login', 'api_key']
            },
            apple: {
                name: 'Apple iCloud',
                description: 'Full sync via Apple ID and App-Specific Password',
                icon: '🍏',
                color: 'gray',
                authType: 'api_key',
                features: ['availability_sync', 'push_bookings'],
                setupFields: ['apple_id', 'app_specific_password']
            }
        };

        this.activeIntegrations = [];
        this.backendService = new CalendarBackendService();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadActiveIntegrations();
        this.renderAvailableIntegrations();
    }

    setupEventListeners() {
        // Add integration button
        const addIntegrationBtn = document.getElementById('addIntegrationBtn');
        if (addIntegrationBtn) {
            addIntegrationBtn.addEventListener('click', () => this.showIntegrationModal());
        }

        // Close integration modal
        const closeModalBtn = document.getElementById('closeIntegrationModal');
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', () => this.hideIntegrationModal());
        }

        // Modal backdrop click
        const modal = document.getElementById('integrationModal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideIntegrationModal();
                }
            });
        }
    }

    async loadActiveIntegrations() {
        try {
            const studioId = window.currentUser?.studioId || 'demo-studio-id';
            
            const { data, error } = await this.backendService.supabase
                .from('studio_integrations')
                .select('*')
                .eq('studio_id', studioId);

            if (error) throw error;

            this.activeIntegrations = data.map(item => ({
                id: item.id,
                type: item.platform,
                status: item.status,
                lastSync: item.last_sync || item.connected_at,
                config: item.sync_settings
            }));

            this.renderActiveIntegrations();
            this.renderAvailableIntegrations(); // Refresh available list too
        } catch (error) {
            console.error('Error loading integrations:', error);
            if (window.utils) utils.showNotification('Error loading integrations', 'error');
        }
    }

    renderActiveIntegrations() {
        const container = document.getElementById('integrationsList');
        if (!container) return;

        if (this.activeIntegrations.length === 0) {
            container.innerHTML = `
                <div class="col-span-1 md:col-span-2 text-center py-12 bg-gray-50/50 dark:bg-slate-800/20 rounded-2xl border-2 border-dashed border-gray-200 dark:border-slate-800">
                    <svg class="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                    <h3 class="mt-4 text-lg font-bold text-gray-900 dark:text-white">No integrations yet</h3>
                    <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Expand your reach by connecting your external calendars.</p>
                    <button onclick="calendarIntegrations.showIntegrationModal()" class="mt-6 text-blue-600 dark:text-blue-400 font-bold hover:underline">Connect your first one &rarr;</button>
                </div>
            `;
            return;
        }

        container.innerHTML = this.activeIntegrations.map(integration => {
            const config = this.supportedIntegrations[integration.type];
            const lastSyncTime = new Date(integration.lastSync).toLocaleString();
            
            return `
                <div class="bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-800 rounded-2xl p-6 transition-all hover:shadow-md">
                    <div class="flex items-center justify-between mb-6">
                        <div class="flex items-center">
                            <div class="w-12 h-12 bg-white dark:bg-slate-700 rounded-xl flex items-center justify-center text-2xl shadow-sm border border-gray-100 dark:border-slate-600">
                                ${config.icon}
                            </div>
                            <div class="ml-4">
                                <h3 class="font-bold text-gray-900 dark:text-white">${config.name}</h3>
                                <div class="flex items-center">
                                    <span class="w-2 h-2 rounded-full ${integration.status === 'active' ? 'bg-green-500' : 'bg-red-500'} mr-2"></span>
                                    <span class="text-[10px] font-bold uppercase tracking-wider ${integration.status === 'active' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}">
                                        ${integration.status}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <button class="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" onclick="calendarIntegrations.configureIntegration('${integration.id}')" title="Configure" aria-label="Configure integration">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                            </svg>
                        </button>
                    </div>
                    
                    <div class="space-y-3 mb-6">
                        <div class="flex justify-between items-center text-xs">
                            <span class="text-gray-500 dark:text-gray-400">Last Synced</span>
                            <span class="text-gray-900 dark:text-gray-200 font-medium">${lastSyncTime}</span>
                        </div>
                        <div class="flex justify-between items-center text-xs">
                            <span class="text-gray-500 dark:text-gray-400">Active Features</span>
                            <span class="text-gray-900 dark:text-gray-200 font-medium">${config.features.length} Enabled</span>
                        </div>
                    </div>
                    
                    <div class="flex items-center space-x-2">
                        <button id="sync-btn-${integration.id}" onclick="calendarIntegrations.syncIntegration('${integration.id}')" 
                                class="flex-1 bg-black dark:bg-white text-white dark:text-black py-2.5 rounded-xl text-xs font-bold hover:opacity-90 transition-all flex items-center justify-center">
                            Sync Now
                        </button>
                        <button onclick="calendarIntegrations.testIntegration('${integration.id}')" 
                                class="p-2.5 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 rounded-xl hover:bg-gray-200 dark:hover:bg-slate-600 transition-all">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        </button>
                        <button onclick="calendarIntegrations.removeIntegration('${integration.id}')" 
                                class="p-2.5 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-200 dark:hover:bg-red-900/40 transition-all">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    renderAvailableIntegrations() {
        const container = document.getElementById('availableIntegrations');
        if (!container) return;

        const availableTypes = Object.keys(this.supportedIntegrations).filter(type => 
            !this.activeIntegrations.some(integration => integration.type === type)
        );

        container.innerHTML = availableTypes.map(type => {
            const config = this.supportedIntegrations[type];
            return `
                <button onclick="calendarIntegrations.startIntegrationSetup('${type}')" 
                        class="p-5 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-900 transition-all text-center group">
                    <div class="text-4xl mb-3 transform group-hover:scale-110 transition-transform">${config.icon}</div>
                    <div class="text-sm font-bold text-gray-900 dark:text-white">${config.name}</div>
                    <div class="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mt-2">${config.features.length} Features</div>
                </button>
            `;
        }).join('');
    }

    showIntegrationModal() {
        const modal = document.getElementById('integrationModal');
        if (modal) {
            modal.classList.remove('hidden');
        }
    }

    hideIntegrationModal() {
        const modal = document.getElementById('integrationModal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    startIntegrationSetup(type) {
        const config = this.supportedIntegrations[type];
        if (!config) return;

        this.showIntegrationModal();
        this.renderIntegrationSetup(type, config);
    }

    renderIntegrationSetup(type, config) {
        const modalContent = document.getElementById('integrationModalContent');
        if (!modalContent) return;

        modalContent.innerHTML = `
            <div class="space-y-6">
                <!-- Integration Info -->
                <div class="flex items-center space-x-4 p-6 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-800">
                    <span class="text-5xl">${config.icon}</span>
                    <div>
                        <h3 class="text-xl font-bold text-gray-900 dark:text-white">${config.name}</h3>
                        <p class="text-sm text-gray-500 dark:text-gray-400">${config.description}</p>
                    </div>
                </div>

                <!-- Features -->
                <div>
                    <h4 class="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">Supported Features</h4>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        ${config.features.map(feature => `
                            <div class="flex items-center text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-800 p-3 rounded-xl border border-gray-50 dark:border-slate-800/50">
                                <div class="w-5 h-5 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mr-3">
                                    <svg class="w-3 h-3 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
                                    </svg>
                                </div>
                                <span class="font-medium">${this.formatFeatureName(feature)}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Setup Form -->
                <form id="integrationSetupForm" class="space-y-4">
                    <input type="hidden" name="integration_type" value="${type}">
                    
                    ${config.authType === 'oauth' ? this.renderOAuthSetup(type, config) : this.renderApiKeySetup(type, config)}
                    
                    <!-- Additional Settings -->
                    <div class="p-6 bg-gray-50 dark:bg-slate-800/30 rounded-2xl border border-gray-100 dark:border-slate-800">
                        <label class="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">Sync Settings</label>
                        <div class="space-y-4">
                            <label class="flex items-center group cursor-pointer">
                                <div class="relative flex items-center">
                                    <input type="checkbox" name="sync_availability" checked class="peer h-5 w-5 bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 rounded-md text-blue-600 focus:ring-blue-500 transition-all cursor-pointer">
                                </div>
                                <span class="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Sync availability to PluggedIn</span>
                            </label>
                            <label class="flex items-center group cursor-pointer">
                                <input type="checkbox" name="sync_bookings" checked class="peer h-5 w-5 bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 rounded-md text-blue-600 focus:ring-blue-500 transition-all cursor-pointer">
                                <span class="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Sync bookings from external system</span>
                            </label>
                        </div>
                    </div>

                    <!-- Action Buttons -->
                    <div class="flex items-center justify-between pt-8 mt-8 border-t dark:border-slate-800">
                        <button type="button" onclick="calendarIntegrations.hideIntegrationModal()" 
                                class="px-6 py-3 text-sm font-bold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                            Cancel
                        </button>
                        <button type="submit" 
                                class="px-10 py-3.5 bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold hover:opacity-90 transition-all shadow-xl active:scale-95">
                            ${config.authType === 'oauth' ? 'Connect Account' : 'Save Integration'}
                        </button>
                    </div>
                </form>
            </div>
        `;

        // Setup form submission
        const form = document.getElementById('integrationSetupForm');
        if (form) {
            form.addEventListener('submit', (e) => this.handleIntegrationSetup(e, type));
        }
    }

    renderOAuthSetup(type, config) {
        return `
            <div class="bg-blue-50 dark:bg-blue-900/10 p-5 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                <div class="flex items-center">
                    <div class="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg mr-3">
                        <svg class="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                        </svg>
                    </div>
                    <div>
                        <p class="text-sm font-bold text-blue-900 dark:text-blue-300">Secure OAuth Connection</p>
                        <p class="text-xs text-blue-700 dark:text-blue-400/80">You'll be redirected to ${config.name} to authorize access</p>
                    </div>
                </div>
            </div>
        `;
    }

    renderApiKeySetup(type, config) {
        return `
            <div class="space-y-6">
                ${config.setupFields.map(field => `
                    <div>
                        <label for="${field}" class="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">
                            ${this.formatFieldName(field)}
                        </label>
                        <input type="${field.includes('key') || field.includes('token') ? 'password' : 'text'}" 
                               id="${field}" 
                               name="${field}" 
                               required
                               class="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-white transition-all outline-none"
                               placeholder="Enter your ${this.formatFieldName(field).toLowerCase()}">
                        <p class="text-[10px] font-medium text-gray-400 dark:text-gray-500 mt-2 italic px-1">
                            ${this.getFieldHelp(type, field)}
                        </p>
                    </div>
                `).join('')}
            </div>
        `;
    }

    formatFeatureName(feature) {
        return feature.split('_').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }

    formatFieldName(field) {
        return field.split('_').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }

    getFieldHelp(type, field) {
        const helpText = {
            calendly: {
                calendly_url: 'Your public Calendly booking URL',
                api_key: 'Your Calendly personal access token (optional for sync)'
            },
            apple: {
                apple_id: 'Your Apple ID email address',
                app_specific_password: 'Created in appleid.apple.com (NOT your main password)'
            },
             outlook: {
                calendar_id: 'Usually "primary" for your main calendar'
            },
            square: {
                application_id: 'Found in your Square Developer Dashboard',
                access_token: 'Your Square access token',
                location_id: 'Your Square location ID'
            },
            acuity: {
                user_id: 'Your Acuity user ID',
                api_key: 'Found in your Acuity account settings'
            },
            google: {
                calendar_id: 'Usually "primary" for your main calendar'
            },
            setmore: {
                api_key: 'Your Setmore API key',
                refresh_token: 'Setmore refresh token'
            },
            picktime: {
                api_key: 'Your Picktime API key',
                business_id: 'Your Picktime business ID'
            },
            zoho: {
                client_id: 'Your Zoho OAuth client ID',
                client_secret: 'Your Zoho OAuth client secret'
            },
            simplybook: {
                company_login: 'Your SimplyBook.me company login',
                api_key: 'Your SimplyBook.me API key'
            }
        };

        return helpText[type]?.[field] || 'Enter the required information from your account';
    }

    async handleIntegrationSetup(e, type) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const config = Object.fromEntries(formData.entries());
        
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        
        try {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Connecting...';
            
            const integration = this.supportedIntegrations[type];
            const studioId = window.currentUser?.studioId || 'demo-studio-id';
            
            let result;
            
            if (integration.authType === 'oauth') {
                // Handle OAuth flow
                submitBtn.textContent = 'Opening OAuth window...';
                result = await this.backendService.initiateOAuth(type, studioId);
                
                if (result.success) {
                    // Test the connection
                    submitBtn.textContent = 'Testing connection...';
                    await this.backendService.testConnection(studioId, type);
                }
            } else {
                // Handle API key setup
                submitBtn.textContent = 'Validating credentials...';
                
                // Store API key credentials
                await this.backendService.storeIntegrationCredentials(studioId, type, {
                    ...config,
                    auth_type: 'api_key'
                });
                
                // Test the connection
                await this.backendService.testConnection(studioId, type);
                
                result = { success: true, platform: type, studioId };
            }
            
            if (result.success) {
                // If this is a direct link platform like Calendly, also update the studio record
                if (type === 'calendly' && config.calendly_url) {
                    await this.backendService.supabase
                        .from('studios')
                        .update({ 
                            external_booking_url: config.calendly_url,
                            external_platform: 'calendly'
                        })
                        .eq('id', studioId);
                }

                // Reload integrations from database to get real IDs and status
                await this.loadActiveIntegrations();
                
                this.hideIntegrationModal();
                
                utils.showNotification(`${this.supportedIntegrations[type].name} integration added successfully!`, 'success');
                
                // Perform initial sync
                const newIntegration = this.activeIntegrations.find(i => i.type === type);
                if (newIntegration) {
                    setTimeout(() => {
                        this.syncIntegration(newIntegration.id);
                    }, 1000);
                }
            } else {
                throw new Error(result.error || 'Integration setup failed');
            }
            
        } catch (error) {
            console.error('Error setting up integration:', error);
            let errorMessage = 'Error setting up integration. Please try again.';
            
            if (error.message.includes('OAuth cancelled')) {
                errorMessage = 'OAuth process was cancelled. Please try again.';
            } else if (error.message.includes('OAuth timeout')) {
                errorMessage = 'OAuth process timed out. Please try again.';
            } else if (error.message.includes('Invalid credentials')) {
                errorMessage = 'Invalid credentials provided. Please check your API keys.';
            }
            
            utils.showNotification(errorMessage, 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    }

    async syncIntegration(integrationId) {
        const integration = this.activeIntegrations.find(i => i.id === integrationId);
        if (!integration) return;

        const btn = document.getElementById(`sync-btn-${integrationId}`);
        const originalHtml = btn.innerHTML;

        try {
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = `<svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white dark:text-black inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Syncing...`;
            }

            utils.showNotification('Syncing integration...', 'info');
            
            const studioId = window.currentUser?.studioId || 'demo-studio-id';
            
            // Sync availability data from external platform
            const syncResult = await this.backendService.syncAvailability(studioId, integration.type);
            
            if (syncResult.success) {
                integration.lastSync = new Date().toISOString();
                integration.status = 'active';
                this.renderActiveIntegrations();
                
                const recordsText = syncResult.recordsProcessed === 1 ? 'record' : 'records';
                utils.showNotification(
                    `Integration synced successfully! ${syncResult.recordsProcessed} ${recordsText} processed.`, 
                    'success'
                );
            } else {
                throw new Error('Sync failed');
            }
            
        } catch (error) {
            console.error('Error syncing integration:', error);
            
            // Update integration status
            integration.status = 'error';
            this.renderActiveIntegrations();
            
            let errorMessage = 'Error syncing integration';
            if (error.message.includes('credentials')) {
                errorMessage = 'Integration credentials expired. Please reconnect.';
            } else if (error.message.includes('rate limit')) {
                errorMessage = 'API rate limit exceeded. Please try again later.';
            }
            
            utils.showNotification(errorMessage, 'error');
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = originalHtml;
            }
        }
    }

    async testIntegration(integrationId) {
        const integration = this.activeIntegrations.find(i => i.id === integrationId);
        if (!integration) return;

        try {
            utils.showNotification('Testing integration...', 'info');
            
            const studioId = window.currentUser?.studioId || 'demo-studio-id';
            
            // Test the connection to external platform
            const testResult = await this.backendService.testConnection(studioId, integration.type);
            
            if (testResult.success) {
                integration.status = 'active';
                this.renderActiveIntegrations();
                utils.showNotification('Integration test successful!', 'success');
            } else {
                throw new Error(testResult.error || 'Connection test failed');
            }
            
        } catch (error) {
            console.error('Error testing integration:', error);
            
            // Update integration status
            integration.status = 'error';
            this.renderActiveIntegrations();
            
            let errorMessage = 'Integration test failed';
            if (error.message.includes('credentials')) {
                errorMessage = 'Invalid or expired credentials. Please reconnect.';
            } else if (error.message.includes('network')) {
                errorMessage = 'Network error. Please check your connection.';
            } else if (error.message.includes('unauthorized')) {
                errorMessage = 'Unauthorized access. Please check your permissions.';
            }
            
            utils.showNotification(errorMessage, 'error');
        }
    }

    async removeIntegration(integrationId) {
        if (!confirm('Are you sure you want to remove this integration?')) {
            return;
        }

        try {
            this.activeIntegrations = this.activeIntegrations.filter(i => i.id !== integrationId);
            this.renderActiveIntegrations();
            this.renderAvailableIntegrations();
            
            utils.showNotification('Integration removed successfully', 'success');
        } catch (error) {
            console.error('Error removing integration:', error);
            utils.showNotification('Error removing integration', 'error');
        }
    }

    configureIntegration(integrationId) {
        const integration = this.activeIntegrations.find(i => i.id === integrationId);
        if (!integration) return;

        // Show configuration modal
        utils.showNotification('Configuration modal coming soon!', 'info');
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.calendarIntegrations = new CalendarIntegrationsManager();
});
