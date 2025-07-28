/**
 * Calendar Integration Backend Service
 * Handles real API calls, OAuth flows, and webhook processing for external calendar systems
 */

class CalendarBackendService {
    constructor() {
        this.supabase = window.supabaseClient;
        this.baseUrl = window.location.origin;
    }

    /**
     * Initialize OAuth flow for a calendar platform
     */
    async initiateOAuth(platform, studioId) {
        try {
            const config = this.getOAuthConfig(platform);
            if (!config) {
                throw new Error(`OAuth not supported for ${platform}`);
            }

            // Store state for OAuth callback
            const state = this.generateState(studioId, platform);
            localStorage.setItem(`oauth_state_${state}`, JSON.stringify({
                studioId,
                platform,
                timestamp: Date.now()
            }));

            // Build OAuth URL
            const params = new URLSearchParams({
                client_id: config.clientId,
                redirect_uri: `${this.baseUrl}/oauth-callback.html`,
                scope: config.scope,
                state: state,
                response_type: 'code'
            });

            const authUrl = `${config.authUrl}?${params.toString()}`;
            
            // Open OAuth popup
            const popup = window.open(authUrl, 'oauth', 'width=500,height=600');
            
            return new Promise((resolve, reject) => {
                const checkClosed = setInterval(() => {
                    if (popup.closed) {
                        clearInterval(checkClosed);
                        // Check if we got the auth code
                        const result = localStorage.getItem(`oauth_result_${state}`);
                        if (result) {
                            localStorage.removeItem(`oauth_result_${state}`);
                            localStorage.removeItem(`oauth_state_${state}`);
                            resolve(JSON.parse(result));
                        } else {
                            reject(new Error('OAuth cancelled'));
                        }
                    }
                }, 1000);

                // Timeout after 5 minutes
                setTimeout(() => {
                    clearInterval(checkClosed);
                    if (!popup.closed) popup.close();
                    reject(new Error('OAuth timeout'));
                }, 300000);
            });

        } catch (error) {
            console.error('OAuth initiation error:', error);
            throw error;
        }
    }

    /**
     * Exchange OAuth code for access token
     */
    async exchangeOAuthCode(platform, code, state) {
        try {
            const config = this.getOAuthConfig(platform);
            const stateData = JSON.parse(localStorage.getItem(`oauth_state_${state}`) || '{}');

            const response = await fetch(config.tokenUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    client_id: config.clientId,
                    client_secret: config.clientSecret,
                    code: code,
                    redirect_uri: `${this.baseUrl}/oauth-callback.html`,
                    grant_type: 'authorization_code'
                })
            });

            const tokenData = await response.json();
            
            if (!response.ok) {
                throw new Error(tokenData.error_description || 'Token exchange failed');
            }

            // Store credentials securely in Supabase
            await this.storeIntegrationCredentials(stateData.studioId, platform, tokenData);

            return {
                success: true,
                platform,
                studioId: stateData.studioId
            };

        } catch (error) {
            console.error('OAuth code exchange error:', error);
            throw error;
        }
    }

    /**
     * Store integration credentials securely
     */
    async storeIntegrationCredentials(studioId, platform, credentials) {
        try {
            // Encrypt sensitive data before storing
            const encryptedCredentials = await this.encryptCredentials(credentials);

            const { error } = await this.supabase
                .from('studio_integrations')
                .upsert({
                    studio_id: studioId,
                    platform: platform,
                    credentials: encryptedCredentials,
                    status: 'active',
                    connected_at: new Date().toISOString(),
                    last_sync: null
                });

            if (error) throw error;

            // Test the connection
            await this.testConnection(studioId, platform);

        } catch (error) {
            console.error('Error storing credentials:', error);
            throw error;
        }
    }

    /**
     * Test connection to external calendar platform
     */
    async testConnection(studioId, platform) {
        try {
            const credentials = await this.getIntegrationCredentials(studioId, platform);
            if (!credentials) {
                throw new Error('No credentials found');
            }

            const testResult = await this.makeApiCall(platform, 'test', credentials);
            
            // Update integration status
            await this.supabase
                .from('studio_integrations')
                .update({
                    status: testResult.success ? 'active' : 'error',
                    last_tested: new Date().toISOString(),
                    error_message: testResult.error || null
                })
                .eq('studio_id', studioId)
                .eq('platform', platform);

            return testResult;

        } catch (error) {
            console.error('Connection test error:', error);
            throw error;
        }
    }

    /**
     * Sync availability data from external calendar
     */
    async syncAvailability(studioId, platform) {
        try {
            const credentials = await this.getIntegrationCredentials(studioId, platform);
            if (!credentials) {
                throw new Error('No credentials found');
            }

            const availabilityData = await this.makeApiCall(platform, 'availability', credentials);
            
            // Process and store availability data
            const processedData = this.processAvailabilityData(platform, availabilityData);
            
            // Update local availability records
            await this.updateLocalAvailability(studioId, processedData);

            // Update last sync timestamp
            await this.supabase
                .from('studio_integrations')
                .update({
                    last_sync: new Date().toISOString(),
                    sync_status: 'success'
                })
                .eq('studio_id', studioId)
                .eq('platform', platform);

            return {
                success: true,
                recordsProcessed: processedData.length
            };

        } catch (error) {
            console.error('Sync error:', error);
            
            // Update sync status
            await this.supabase
                .from('studio_integrations')
                .update({
                    sync_status: 'error',
                    error_message: error.message
                })
                .eq('studio_id', studioId)
                .eq('platform', platform);

            throw error;
        }
    }

    /**
     * Create booking on external platform
     */
    async createExternalBooking(studioId, platform, bookingData) {
        try {
            const credentials = await this.getIntegrationCredentials(studioId, platform);
            if (!credentials) {
                throw new Error('No credentials found');
            }

            const result = await this.makeApiCall(platform, 'create_booking', credentials, bookingData);
            
            return result;

        } catch (error) {
            console.error('External booking creation error:', error);
            throw error;
        }
    }

    /**
     * Handle incoming webhooks from external platforms
     */
    async handleWebhook(platform, payload, signature) {
        try {
            // Verify webhook signature
            if (!this.verifyWebhookSignature(platform, payload, signature)) {
                throw new Error('Invalid webhook signature');
            }

            const processedData = this.processWebhookData(platform, payload);
            
            // Update local data based on webhook
            await this.processWebhookUpdate(processedData);

            return { success: true };

        } catch (error) {
            console.error('Webhook processing error:', error);
            throw error;
        }
    }

    /**
     * Get OAuth configuration for platform
     */
    getOAuthConfig(platform) {
        const configs = {
            calendly: {
                clientId: process.env.CALENDLY_CLIENT_ID,
                clientSecret: process.env.CALENDLY_CLIENT_SECRET,
                authUrl: 'https://auth.calendly.com/oauth/authorize',
                tokenUrl: 'https://auth.calendly.com/oauth/token',
                scope: 'default'
            },
            google_calendar: {
                clientId: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
                tokenUrl: 'https://oauth2.googleapis.com/token',
                scope: 'https://www.googleapis.com/auth/calendar'
            },
            square: {
                clientId: process.env.SQUARE_CLIENT_ID,
                clientSecret: process.env.SQUARE_CLIENT_SECRET,
                authUrl: 'https://connect.squareup.com/oauth2/authorize',
                tokenUrl: 'https://connect.squareup.com/oauth2/token',
                scope: 'APPOINTMENTS_READ APPOINTMENTS_WRITE'
            },
            acuity: {
                clientId: process.env.ACUITY_CLIENT_ID,
                clientSecret: process.env.ACUITY_CLIENT_SECRET,
                authUrl: 'https://acuityscheduling.com/oauth2/authorize',
                tokenUrl: 'https://acuityscheduling.com/oauth2/token',
                scope: 'api-v1'
            }
        };

        return configs[platform];
    }

    /**
     * Make API call to external platform
     */
    async makeApiCall(platform, endpoint, credentials, data = null) {
        const apiConfigs = {
            calendly: {
                baseUrl: 'https://api.calendly.com',
                endpoints: {
                    test: '/users/me',
                    availability: '/user_availability_schedules',
                    create_booking: '/scheduled_events'
                }
            },
            google_calendar: {
                baseUrl: 'https://www.googleapis.com/calendar/v3',
                endpoints: {
                    test: '/users/me',
                    availability: '/freebusy',
                    create_booking: '/events'
                }
            },
            square: {
                baseUrl: 'https://connect.squareup.com/v2',
                endpoints: {
                    test: '/locations',
                    availability: '/bookings/availability',
                    create_booking: '/bookings'
                }
            },
            acuity: {
                baseUrl: 'https://acuityscheduling.com/api/v1',
                endpoints: {
                    test: '/me',
                    availability: '/availability/times',
                    create_booking: '/appointments'
                }
            }
        };

        const config = apiConfigs[platform];
        if (!config) {
            throw new Error(`API config not found for ${platform}`);
        }

        const url = `${config.baseUrl}${config.endpoints[endpoint]}`;
        const options = {
            method: data ? 'POST' : 'GET',
            headers: {
                'Authorization': `Bearer ${credentials.access_token}`,
                'Content-Type': 'application/json'
            }
        };

        if (data) {
            options.body = JSON.stringify(data);
        }

        const response = await fetch(url, options);
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || `API call failed: ${response.status}`);
        }

        return result;
    }

    /**
     * Utility methods
     */
    generateState(studioId, platform) {
        return btoa(`${studioId}:${platform}:${Date.now()}`).replace(/[^a-zA-Z0-9]/g, '');
    }

    async encryptCredentials(credentials) {
        // In production, use proper encryption
        // For now, just base64 encode (NOT secure for production)
        return btoa(JSON.stringify(credentials));
    }

    async decryptCredentials(encryptedCredentials) {
        // In production, use proper decryption
        return JSON.parse(atob(encryptedCredentials));
    }

    async getIntegrationCredentials(studioId, platform) {
        const { data, error } = await this.supabase
            .from('studio_integrations')
            .select('credentials')
            .eq('studio_id', studioId)
            .eq('platform', platform)
            .eq('status', 'active')
            .single();

        if (error || !data) return null;

        return await this.decryptCredentials(data.credentials);
    }

    processAvailabilityData(platform, data) {
        // Platform-specific data processing logic
        const processors = {
            calendly: (data) => data.collection?.map(item => ({
                start: item.start_time,
                end: item.end_time,
                available: item.status === 'active'
            })) || [],
            
            google_calendar: (data) => data.calendars ? 
                Object.values(data.calendars).flatMap(cal => 
                    cal.busy?.map(busy => ({
                        start: busy.start,
                        end: busy.end,
                        available: false
                    })) || []
                ) : [],
                
            square: (data) => data.availabilities?.map(avail => ({
                start: avail.start_at,
                end: avail.end_at,
                available: true
            })) || [],
            
            acuity: (data) => data.map(slot => ({
                start: slot.time,
                end: new Date(new Date(slot.time).getTime() + slot.duration * 60000).toISOString(),
                available: true
            }))
        };

        return processors[platform]?.(data) || [];
    }

    async updateLocalAvailability(studioId, availabilityData) {
        // Update local availability records in Supabase
        for (const slot of availabilityData) {
            await this.supabase
                .from('studio_availability')
                .upsert({
                    studio_id: studioId,
                    start_time: slot.start,
                    end_time: slot.end,
                    is_available: slot.available,
                    source: 'external_sync',
                    updated_at: new Date().toISOString()
                });
        }
    }

    processWebhookData(platform, payload) {
        // Platform-specific webhook data processing
        return {
            platform,
            event: payload.event || payload.type,
            data: payload.data || payload,
            timestamp: new Date().toISOString()
        };
    }

    async processWebhookUpdate(processedData) {
        // Handle webhook updates based on event type
        console.log('Processing webhook update:', processedData);
        
        // Implement specific update logic based on event type
        // e.g., booking created, cancelled, rescheduled, etc.
    }

    verifyWebhookSignature(platform, payload, signature) {
        // Implement webhook signature verification for each platform
        // This is crucial for security
        return true; // Placeholder - implement proper verification
    }
}

// Export for use in other modules
window.CalendarBackendService = CalendarBackendService;
