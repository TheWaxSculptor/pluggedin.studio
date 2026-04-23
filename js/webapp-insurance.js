/**
 * PluggedIn Web App - Insurance Module
 * Handles partnership integrations for studio and gear insurance.
 */

class InsuranceManager {
    constructor() {
        this.config = window.PARTNER_CONFIG?.insurance || {};
    }

    /**
     * Get the affiliate URL for a specific insurance provider.
     * @param {string} provider - 'next' or 'frontRow'
     * @returns {string|null}
     */
    getAffiliateUrl(provider) {
        return this.config[provider]?.affiliateUrl || null;
    }

    /**
     * Open the insurance quote flow in a new tab.
     * @param {string} provider - 'next' or 'frontRow'
     */
    openQuoteFlow(provider) {
        const url = this.getAffiliateUrl(provider);
        if (url) {
            window.open(url, '_blank', 'noopener,noreferrer');
        } else {
            console.error(`Insurance provider "${provider}" not found or has no URL.`);
        }
    }

    /**
     * Render a standard insurance promotion card.
     * @param {string} containerId - The ID of the element to render into.
     * @param {string} type - 'studio' or 'gear'
     */
    renderPromoCard(containerId, type = 'gear') {
        const container = document.getElementById(containerId);
        if (!container) return;

        const isGear = type === 'gear';
        const provider = isGear ? 'frontRow' : 'next';
        const partner = this.config[provider];

        container.innerHTML = `
            <div class="bg-blue-50 dark:bg-blue-900/10 rounded-2xl p-6 border border-blue-100 dark:border-blue-900/30">
                <div class="flex items-start space-x-4">
                    <div class="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600">
                        <i class="fas fa-shield-alt text-xl"></i>
                    </div>
                    <div class="flex-1">
                        <h4 class="font-bold text-blue-900 dark:text-blue-300 mb-1">
                            Protect your ${isGear ? 'Gear' : 'Studio'}
                        </h4>
                        <p class="text-xs text-blue-700 dark:text-blue-400/80 mb-4">
                            Get specialized coverage through our partner, ${partner.name}. 
                            Tailored for professional audio creators.
                        </p>
                        <button onclick="window.insuranceManager.openQuoteFlow('${provider}')" 
                            class="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all">
                            Get a Quote
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
}

// Initialize and make globally available
window.insuranceManager = new InsuranceManager();
