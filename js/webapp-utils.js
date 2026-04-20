// Global Utilities for PluggedIn Web App
// Version: 1.0 (Phase 9 Audit Optimization)

window.utils = {
    /**
     * Show a premium, glassmorphic toast notification
     * @param {string} message - The message to display
     * @param {string} type - 'success', 'error', 'info', or 'warning'
     * @param {number} duration - Time in ms before auto-dismiss
     */
    showNotification(message, type = 'info', duration = 5000) {
        // Create container if it doesn't exist
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.className = 'fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none max-w-[calc(100vw-3rem)]';
            document.body.appendChild(container);
        }

        // Create the toast element
        const toast = document.createElement('div');
        toast.className = 'toast-notification pointer-events-auto transform transition-all duration-500 ease-out translate-x-12 opacity-0';
        
        const typeStyles = {
            success: {
                bg: 'bg-emerald-50/90 dark:bg-emerald-950/80',
                border: 'border-emerald-200 dark:border-emerald-800/50',
                icon: 'fa-check-circle',
                iconColor: 'text-emerald-500',
                title: 'Success'
            },
            error: {
                bg: 'bg-rose-50/90 dark:bg-rose-950/80',
                border: 'border-rose-200 dark:border-rose-800/50',
                icon: 'fa-exclamation-circle',
                iconColor: 'text-rose-500',
                title: 'Error'
            },
            warning: {
                bg: 'bg-amber-50/90 dark:bg-amber-950/80',
                border: 'border-amber-200 dark:border-amber-800/50',
                icon: 'fa-exclamation-triangle',
                iconColor: 'text-amber-500',
                title: 'Warning'
            },
            info: {
                bg: 'bg-blue-50/90 dark:bg-blue-950/80',
                border: 'border-blue-200 dark:border-blue-800/50',
                icon: 'fa-info-circle',
                iconColor: 'text-blue-500',
                title: 'Notification'
            }
        };

        const style = typeStyles[type] || typeStyles.info;

        toast.innerHTML = `
            <div class="${style.bg} ${style.border} border backdrop-blur-md rounded-2xl p-4 shadow-2xl min-w-[300px] flex items-start gap-4 ring-1 ring-black/5">
                <div class="flex-shrink-0 mt-1">
                    <i class="fas ${style.icon} ${style.iconColor} text-xl"></i>
                </div>
                <div class="flex-1">
                    <h4 class="text-sm font-bold text-gray-900 dark:text-white mb-0.5">${style.title}</h4>
                    <p class="text-sm text-gray-600 dark:text-gray-400 leading-snug">${message}</p>
                </div>
                <button class="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors pt-1">
                    <i class="fas fa-times text-xs"></i>
                </button>
            </div>
        `;

        container.appendChild(toast);

        // Entry animation
        requestAnimationFrame(() => {
            toast.classList.remove('translate-x-12', 'opacity-0');
            toast.classList.add('translate-x-0', 'opacity-100');
        });

        // Close button logic
        const closeBtn = toast.querySelector('button');
        closeBtn.onclick = () => this.dismissNotification(toast);

        // Auto-dismiss
        if (duration > 0) {
            setTimeout(() => this.dismissNotification(toast), duration);
        }
    },

    dismissNotification(toast) {
        toast.classList.remove('translate-x-0', 'opacity-100');
        toast.classList.add('translate-x-12', 'opacity-0');
        setTimeout(() => toast.remove(), 500);
    },

    /**
     * Format a number as USD currency
     * @param {number} amount 
     * @returns {string}
     */
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    },

    /**
     * Format a date string into a user-friendly format
     * @param {string|Date} date 
     * @param {boolean} includeTime 
     * @returns {string}
     */
    formatDate(date, includeTime = false) {
        const d = new Date(date);
        const options = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            ...(includeTime ? { hour: '2-digit', minute: '2-digit' } : {})
        };
        return d.toLocaleDateString('en-US', options);
    },

    /**
     * Basic debounce utility
     * @param {Function} func 
     * @param {number} wait 
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Render a premium empty state illustration and message
     * @param {HTMLElement} container - Target container
     * @param {string} title - Main heading
     * @param {string} description - Subtext
     * @param {string} icon - FontAwesome icon class
     * @param {string} ctaText - Optional button text
     * @param {Function} ctaAction - Optional button callback
     */
    renderEmptyState(container, title, description, icon = 'fa-search', ctaText = null, ctaAction = null) {
        if (!container) return;
        
        container.innerHTML = `
            <div class="empty-state animate-fade-in py-16 px-4 text-center">
                <div class="mb-6 inline-flex items-center justify-center w-24 h-24 rounded-full bg-gray-50 dark:bg-slate-800/50 text-gray-400 dark:text-slate-600 border dark:border-slate-800">
                    <i class="fas ${icon} text-4xl"></i>
                </div>
                <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">${title}</h3>
                <p class="text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-8">${description}</p>
                ${ctaText ? `
                    <button id="emptyStateCta" class="bg-black dark:bg-white text-white dark:text-black font-bold py-3 px-8 rounded-xl hover:opacity-90 transition-opacity">
                        ${ctaText}
                    </button>
                ` : ''}
            </div>
        `;

        if (ctaText && ctaAction) {
            const cta = container.querySelector('#emptyStateCta');
            if (cta) cta.onclick = ctaAction;
        }
    }
};

// Global shorthand
window.showNotification = (msg, type, dur) => window.utils.showNotification(msg, type, dur);
