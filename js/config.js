/**
 * PluggedIn Web App - Centralized Configuration
 * IMPORTANT: In a production environment, these should be populated via 
 * build-time environment variables or a secure configuration endpoint.
 */

window.SUPABASE_CONFIG = {
    url: 'https://dovsqgkxxdpdkagzpykn.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvdnNxZ2t4eGRwZGthZ3pweWtuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwMjI1NjEsImV4cCI6MjA5MTU5ODU2MX0.SBQQ5IwYy16tmxmGAkS6co8rNl5kPsPjAlOXLHSnQw8'
};

// Global App Settings
window.APP_CONFIG = {
    name: 'PluggedIn Studio',
    version: '1.2.0-stable',
    isProduction: window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.0.0.1'),
    supportEmail: 'support@pluggedin.studio',
    hubStudioId: '446e21fc-b61d-4fbc-8912-37bc3a612232'
};

// Convenience legacy export
window.HUB_STUDIO_ID = window.APP_CONFIG.hubStudioId;

// Insurance & Partnership Configuration
window.PARTNER_CONFIG = {
    insurance: {
        next: {
            name: 'Next Insurance',
            affiliateUrl: 'https://www.nextinsurance.com/', // Replace with your affiliate link
            apiBase: 'https://api.nextinsurance.com/v1'
        },
        frontRow: {
            name: 'Front Row Insurance',
            affiliateUrl: 'https://www.frontrowinsurance.com/music-industry-insurance',
            apiBase: null
        }
    }
};

