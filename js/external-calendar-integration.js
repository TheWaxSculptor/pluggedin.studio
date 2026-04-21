/**
 * PluggedIn.studio - External Calendar Integration Module
 * Provides integration with external calendar and booking systems
 * Supports: Calendly, Square, Acuity/Squarespace, Google Calendar, Setmore, Picktime, Zoho, SimplyBook.me
 */

class ExternalCalendarIntegration {
    constructor() {
        this.currentProvider = null;
        this.providers = [
            { id: 'calendly', name: 'Calendly', icon: 'calendly.svg' },
            { id: 'square', name: 'Square Appointments', icon: 'square.svg' },
            { id: 'acuity', name: 'Acuity / Squarespace', icon: 'acuity.svg' },
            { id: 'google', name: 'Google Calendar', icon: 'google.svg' },
            { id: 'setmore', name: 'Setmore', icon: 'setmore.svg' },
            { id: 'picktime', name: 'Picktime', icon: 'picktime.svg' },
            { id: 'zoho', name: 'Zoho Bookings', icon: 'zoho.svg' },
            { id: 'simplybook', name: 'SimplyBook.me', icon: 'simplybook.svg' }
        ];
        this.init();
    }

    /**
     * Initialize the external calendar integration
     */
    init() {
        // Setup event listeners when DOM is loaded
        document.addEventListener('DOMContentLoaded', () => {
            // Add integration button to booking section if user is studio owner
            this.addIntegrationButton();
        });
    }

    /**
     * Add integration button to the booking section for studio owners
     */
    addIntegrationButton() {
        // Check if user is studio owner
        const currentUser = window.authManager?.getCurrentUser();
        const isStudioOwner = currentUser?.type === 'studio_owner';
        
        // Only show for studio owners
        if (!isStudioOwner) return;
        
        // Find the booking section
        const bookingSection = document.querySelector('.booking-section, section:has(#availabilityCalendarContainer)');
        if (!bookingSection) return;
        
        // Create integration button
        const integrationBtn = document.createElement('button');
        integrationBtn.id = 'externalCalendarBtn';
        integrationBtn.className = 'inline-flex items-center px-4 py-2 bg-gray-800 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-gray-700 active:bg-gray-900 focus:outline-none focus:border-gray-900 focus:shadow-outline-gray transition ease-in-out duration-150 mt-4';
        integrationBtn.innerHTML = `
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
            Connect External Calendar
        `;
        
        // Add button to the top of the booking section
        const title = bookingSection.querySelector('h2');
        if (title && title.parentNode) {
            title.parentNode.appendChild(integrationBtn);
        } else {
            bookingSection.prepend(integrationBtn);
        }
        
        // Add click handler
        integrationBtn.addEventListener('click', () => {
            this.showIntegrationModal();
        });
    }

    /**
     * Show modal for connecting external calendar providers
     */
    showIntegrationModal() {
        // Create modal element
        const modal = document.createElement('div');
        modal.id = 'calendarIntegrationModal';
        modal.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-labelledby', 'integrationModalTitle');
        
        // Create modal content
        modal.innerHTML = `
            <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                <div class="mt-3">
                    <div class="flex justify-between items-center mb-4">
                        <h3 id="integrationModalTitle" class="text-lg font-medium text-gray-900">Connect Calendar</h3>
                        <button id="closeIntegrationModal" class="text-gray-400 hover:text-gray-600" aria-label="Close modal">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>
                    </div>
                    
                    <p class="text-sm text-gray-600 mb-4">Connect your existing booking system to sync availability and manage bookings in one place.</p>
                    
                    <div class="space-y-3" id="providerList">
                        ${this.providers.map(provider => `
                            <button class="provider-btn w-full flex items-center p-3 border rounded-md hover:bg-gray-50 transition-colors" data-provider="${provider.id}">
                                <div class="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-gray-100 rounded-md mr-3">
                                    <span class="text-sm font-medium text-gray-800">${provider.name.charAt(0)}</span>
                                </div>
                                <div class="flex-grow">
                                    <div class="font-medium">${provider.name}</div>
                                    <div class="text-xs text-gray-500">Connect and sync your availability</div>
                                </div>
                                <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                                </svg>
                            </button>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
        
        // Add modal to the DOM
        document.body.appendChild(modal);
        
        // Setup event handlers
        modal.querySelector('#closeIntegrationModal').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        // Setup provider buttons
        modal.querySelectorAll('.provider-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const providerId = btn.dataset.provider;
                this.connectProvider(providerId);
                document.body.removeChild(modal);
            });
        });
        
        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }
    
    /**
     * Connect to a specific provider
     * @param {string} providerId - The ID of the provider to connect to
     */
    connectProvider(providerId) {
        const provider = this.providers.find(p => p.id === providerId);
        if (!provider) return;
        
        this.currentProvider = providerId;
        
        // Show different connection flow based on provider
        switch (providerId) {
            case 'google':
                this.initiateOAuthFlow(providerId, 'https://accounts.google.com/o/oauth2/auth');
                break;
            case 'calendly':
                this.showEmbedCodeInput(providerId);
                break;
            case 'square':
                this.initiateOAuthFlow(providerId, 'https://connect.squareup.com/oauth2/authorize');
                break;
            default:
                this.showConnectionInstructionsModal(providerId);
                break;
        }
    }
    
    /**
     * Initiate OAuth flow for providers that support it
     * @param {string} providerId - The ID of the provider
     * @param {string} authUrl - The OAuth authorization URL
     */
    initiateOAuthFlow(providerId, authUrl) {
        // Create a confirmation dialog
        const confirmDialog = document.createElement('div');
        confirmDialog.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50';
        confirmDialog.innerHTML = `
            <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                <div class="mt-3 text-center">
                    <h3 class="text-lg font-medium text-gray-900 mb-4">Connect to ${this.getProviderName(providerId)}</h3>
                    <p class="text-sm text-gray-600 mb-6">
                        You'll be redirected to ${this.getProviderName(providerId)} to authorize access to your calendar.
                        Only your availability will be shared with PluggedIn.studio.
                    </p>
                    <div class="flex justify-between mt-4">
                        <button id="cancelAuth" class="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
                            Cancel
                        </button>
                        <button id="continueAuth" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                            Continue to ${this.getProviderName(providerId)}
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(confirmDialog);
        
        // Setup event listeners
        confirmDialog.querySelector('#cancelAuth').addEventListener('click', () => {
            document.body.removeChild(confirmDialog);
        });
        
        confirmDialog.querySelector('#continueAuth').addEventListener('click', () => {
            document.body.removeChild(confirmDialog);
            
            // In a real implementation, we would redirect to the actual OAuth URL
            // with proper client_id, redirect_uri, and scope parameters
            // For demo purposes, we'll simulate a successful connection
            this.simulateSuccessfulConnection(providerId);
        });
    }
    
    /**
     * Show embed code input for providers like Calendly
     * @param {string} providerId - The ID of the provider
     */
    showEmbedCodeInput(providerId) {
        const embedDialog = document.createElement('div');
        embedDialog.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50';
        embedDialog.innerHTML = `
            <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                <div class="mt-3">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-lg font-medium text-gray-900">Connect ${this.getProviderName(providerId)}</h3>
                        <button id="closeEmbedDialog" class="text-gray-400 hover:text-gray-600">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>
                    </div>
                    <p class="text-sm text-gray-600 mb-4">
                        Paste your ${this.getProviderName(providerId)} embed code or share link below:
                    </p>
                    <div class="mb-4">
                        <textarea 
                            id="embedCode" 
                            rows="4" 
                            class="w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none"
                            placeholder="https://calendly.com/yourusername or <div class='calendly-inline-widget'..."></textarea>
                    </div>
                    <div class="flex justify-end">
                        <button id="saveEmbedCode" class="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800">
                            Connect
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(embedDialog);
        
        // Setup event listeners
        embedDialog.querySelector('#closeEmbedDialog').addEventListener('click', () => {
            document.body.removeChild(embedDialog);
        });
        
        embedDialog.querySelector('#saveEmbedCode').addEventListener('click', () => {
            const embedCode = embedDialog.querySelector('#embedCode').value.trim();
            if (embedCode) {
                // In a real implementation, we would validate and process the embed code
                // For demo purposes, we'll simulate a successful connection
                document.body.removeChild(embedDialog);
                this.simulateSuccessfulConnection(providerId);
            }
        });
    }
    
    /**
     * Show connection instructions for other providers
     * @param {string} providerId - The ID of the provider
     */
    showConnectionInstructionsModal(providerId) {
        const instructionsDialog = document.createElement('div');
        instructionsDialog.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50';
        instructionsDialog.innerHTML = `
            <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                <div class="mt-3">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-lg font-medium text-gray-900">Connect ${this.getProviderName(providerId)}</h3>
                        <button id="closeInstructionsDialog" class="text-gray-400 hover:text-gray-600">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>
                    </div>
                    <div class="space-y-4">
                        <p class="text-sm text-gray-600">
                            Follow these steps to connect your ${this.getProviderName(providerId)} account:
                        </p>
                        <ol class="list-decimal pl-5 text-sm text-gray-600 space-y-2">
                            <li>Log in to your ${this.getProviderName(providerId)} account</li>
                            <li>Go to Settings > API or Integrations</li>
                            <li>Generate an API key or OAuth credentials</li>
                            <li>Enter the API key below</li>
                        </ol>
                        <div class="mt-4">
                            <label for="apiKey" class="block text-sm font-medium text-gray-700">API Key</label>
                            <input 
                                type="text" 
                                id="apiKey" 
                                class="mt-1 w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none"
                                placeholder="Your API key">
                        </div>
                    </div>
                    <div class="flex justify-end mt-4">
                        <button id="saveApiKey" class="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800">
                            Connect
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(instructionsDialog);
        
        // Setup event listeners
        instructionsDialog.querySelector('#closeInstructionsDialog').addEventListener('click', () => {
            document.body.removeChild(instructionsDialog);
        });
        
        instructionsDialog.querySelector('#saveApiKey').addEventListener('click', () => {
            const apiKey = instructionsDialog.querySelector('#apiKey').value.trim();
            if (apiKey) {
                // In a real implementation, we would validate and store the API key securely
                // For demo purposes, we'll simulate a successful connection
                document.body.removeChild(instructionsDialog);
                this.simulateSuccessfulConnection(providerId);
            }
        });
    }
    
    /**
     * Simulate a successful connection to a provider
     * @param {string} providerId - The ID of the provider
     */
    simulateSuccessfulConnection(providerId) {
        // Show success message
        const successDialog = document.createElement('div');
        successDialog.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50';
        successDialog.innerHTML = `
            <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                <div class="mt-3 text-center">
                    <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                        <svg class="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                    </div>
                    <h3 class="text-lg leading-6 font-medium text-gray-900 mt-4">Connected Successfully!</h3>
                    <div class="mt-2 px-7 py-3">
                        <p class="text-sm text-gray-600">
                            Your ${this.getProviderName(providerId)} account is now connected. Your availability will be synced automatically.
                        </p>
                    </div>
                    <div class="items-center px-4 py-3">
                        <button id="closeSuccessDialog" 
                                class="px-4 py-2 bg-black text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-gray-800">
                            OK
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(successDialog);
        
        // Setup event listeners
        successDialog.querySelector('#closeSuccessDialog').addEventListener('click', () => {
            document.body.removeChild(successDialog);
            
            // Update UI to show connection status
            this.updateConnectionStatus(providerId);
        });
    }
    
    /**
     * Update UI to show connection status
     * @param {string} providerId - The ID of the connected provider
     */
    updateConnectionStatus(providerId) {
        // Update the integration button
        const integrationBtn = document.getElementById('externalCalendarBtn');
        if (integrationBtn) {
            integrationBtn.innerHTML = `
                <svg class="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                ${this.getProviderName(providerId)} Connected
            `;
        }
        
        // In a real implementation, we would store this connection in the database
        // and start syncing availability data
    }
    
    /**
     * Get the display name for a provider
     * @param {string} providerId - The ID of the provider
     * @returns {string} The display name of the provider
     */
    getProviderName(providerId) {
        const provider = this.providers.find(p => p.id === providerId);
        return provider ? provider.name : 'Unknown Provider';
    }
}

// Initialize the external calendar integration
const externalCalendarIntegration = new ExternalCalendarIntegration();

// Make it globally available
window.externalCalendarIntegration = externalCalendarIntegration;
