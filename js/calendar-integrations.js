// Calendar Integrations Module for PluggedIn Studio Owners

class CalendarIntegrationsManager {
    constructor() {
        this.supportedIntegrations = {
            calendly: {
                name: 'Calendly',
                description: 'Sync your Calendly availability and bookings',
                icon: '📅',
                color: 'blue',
                authType: 'oauth',
                features: ['availability_sync', 'booking_sync', 'webhook_support'],
                setupFields: ['calendly_username', 'webhook_url']
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
                description: 'Sync with Google Calendar for availability',
                icon: '📊',
                color: 'red',
                authType: 'oauth',
                features: ['availability_sync', 'event_sync', 'real_time_updates'],
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
            // In a real implementation, this would load from the database
            // For now, we'll simulate some active integrations
            this.activeIntegrations = [
                {
                    id: '1',
                    type: 'calendly',
                    status: 'active',
                    lastSync: new Date().toISOString(),
                    config: {
                        calendly_username: 'mystudio',
                        webhook_url: 'https://pluggedin.studio/webhooks/calendly'
                    }
                },
                {
                    id: '2',
                    type: 'google',
                    status: 'active',
                    lastSync: new Date(Date.now() - 3600000).toISOString(),
                    config: {
                        calendar_id: 'primary'
                    }
                }
            ];

            this.renderActiveIntegrations();
        } catch (error) {
            console.error('Error loading integrations:', error);
            utils.showNotification('Error loading integrations', 'error');
        }
    }

    renderActiveIntegrations() {
        const container = document.getElementById('integrationsList');
        if (!container) return;

        if (this.activeIntegrations.length === 0) {
            container.innerHTML = `
                <div class="col-span-2 text-center py-8">
                    <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                    <h3 class="mt-2 text-sm font-medium text-gray-900">No integrations yet</h3>
                    <p class="mt-1 text-sm text-gray-500">Get started by adding your first calendar integration.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.activeIntegrations.map(integration => {
            const config = this.supportedIntegrations[integration.type];
            const lastSyncTime = new Date(integration.lastSync).toLocaleString();
            
            return `
                <div class="border border-gray-200 rounded-lg p-4">
                    <div class="flex items-center justify-between mb-3">
                        <div class="flex items-center">
                            <span class="text-2xl mr-3">${config.icon}</span>
                            <div>
                                <h3 class="font-medium text-gray-900">${config.name}</h3>
                                <p class="text-sm text-gray-500">${config.description}</p>
                            </div>
                        </div>
                        <div class="flex items-center space-x-2">
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                integration.status === 'active' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                            }">
                                ${integration.status}
                            </span>
                            <button class="text-gray-400 hover:text-gray-600" onclick="calendarIntegrations.configureIntegration('${integration.id}')" title="Configure" aria-label="Configure integration">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                </svg>
                            </button>
                        </div>
                    </div>
                    
                    <div class="space-y-2 text-sm text-gray-600">
                        <div class="flex justify-between">
                            <span>Last sync:</span>
                            <span>${lastSyncTime}</span>
                        </div>
                        <div class="flex justify-between">
                            <span>Features:</span>
                            <span>${config.features.length} enabled</span>
                        </div>
                    </div>
                    
                    <div class="mt-4 flex space-x-2">
                        <button onclick="calendarIntegrations.syncIntegration('${integration.id}')" 
                                class="flex-1 bg-blue-50 text-blue-700 px-3 py-2 rounded-md text-sm hover:bg-blue-100">
                            Sync Now
                        </button>
                        <button onclick="calendarIntegrations.testIntegration('${integration.id}')" 
                                class="flex-1 bg-gray-50 text-gray-700 px-3 py-2 rounded-md text-sm hover:bg-gray-100">
                            Test
                        </button>
                        <button onclick="calendarIntegrations.removeIntegration('${integration.id}')" 
                                class="bg-red-50 text-red-700 px-3 py-2 rounded-md text-sm hover:bg-red-100">
                            Remove
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
                        class="p-4 border border-gray-200 rounded-lg hover:border-${config.color}-300 hover:bg-${config.color}-50 transition-colors text-center">
                    <div class="text-3xl mb-2">${config.icon}</div>
                    <div class="text-sm font-medium text-gray-900">${config.name}</div>
                    <div class="text-xs text-gray-500 mt-1">${config.features.length} features</div>
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
                <div class="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                    <span class="text-4xl">${config.icon}</span>
                    <div>
                        <h3 class="text-lg font-medium text-gray-900">${config.name}</h3>
                        <p class="text-sm text-gray-600">${config.description}</p>
                    </div>
                </div>

                <!-- Features -->
                <div>
                    <h4 class="text-sm font-medium text-gray-900 mb-2">Features</h4>
                    <div class="grid grid-cols-2 gap-2">
                        ${config.features.map(feature => `
                            <div class="flex items-center text-sm text-gray-600">
                                <svg class="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                                </svg>
                                ${this.formatFeatureName(feature)}
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Setup Form -->
                <form id="integrationSetupForm" class="space-y-4">
                    <input type="hidden" name="integration_type" value="${type}">
                    
                    ${config.authType === 'oauth' ? this.renderOAuthSetup(type, config) : this.renderApiKeySetup(type, config)}
                    
                    <!-- Additional Settings -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Sync Settings</label>
                        <div class="space-y-2">
                            <label class="flex items-center">
                                <input type="checkbox" name="sync_availability" checked class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
                                <span class="ml-2 text-sm text-gray-700">Sync availability to PluggedIn</span>
                            </label>
                            <label class="flex items-center">
                                <input type="checkbox" name="sync_bookings" checked class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
                                <span class="ml-2 text-sm text-gray-700">Sync bookings from external system</span>
                            </label>
                            <label class="flex items-center">
                                <input type="checkbox" name="prevent_double_booking" checked class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
                                <span class="ml-2 text-sm text-gray-700">Prevent double bookings</span>
                            </label>
                        </div>
                    </div>

                    <!-- Action Buttons -->
                    <div class="flex justify-end space-x-3 pt-4 border-t">
                        <button type="button" onclick="calendarIntegrations.hideIntegrationModal()" 
                                class="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50">
                            Cancel
                        </button>
                        <button type="submit" 
                                class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
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
            <div class="bg-blue-50 p-4 rounded-lg">
                <div class="flex items-center">
                    <svg class="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                    </svg>
                    <div>
                        <p class="text-sm font-medium text-blue-900">Secure OAuth Connection</p>
                        <p class="text-xs text-blue-700">You'll be redirected to ${config.name} to authorize access</p>
                    </div>
                </div>
            </div>
        `;
    }

    renderApiKeySetup(type, config) {
        return `
            <div class="space-y-4">
                ${config.setupFields.map(field => `
                    <div>
                        <label for="${field}" class="block text-sm font-medium text-gray-700 mb-1">
                            ${this.formatFieldName(field)}
                        </label>
                        <input type="${field.includes('key') || field.includes('token') ? 'password' : 'text'}" 
                               id="${field}" 
                               name="${field}" 
                               required
                               class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                               placeholder="Enter your ${this.formatFieldName(field).toLowerCase()}">
                        <p class="text-xs text-gray-500 mt-1">
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
                calendly_username: 'Your Calendly username (e.g., mystudio)',
                webhook_url: 'Webhook URL for real-time updates'
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
                // Add to active integrations
                const newIntegration = {
                    id: Date.now().toString(),
                    type: type,
                    status: 'active',
                    lastSync: new Date().toISOString(),
                    config: config
                };
                
                this.activeIntegrations.push(newIntegration);
                
                // Update UI
                this.renderActiveIntegrations();
                this.renderAvailableIntegrations();
                this.hideIntegrationModal();
                
                utils.showNotification(`${this.supportedIntegrations[type].name} integration added successfully!`, 'success');
                
                // Perform initial sync
                setTimeout(() => {
                    this.syncIntegration(newIntegration.id);
                }, 1000);
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

        try {
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
