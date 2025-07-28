// Main App Controller for PluggedIn Web App

class PluggedInApp {
    constructor() {
        this.isInitialized = false;
        this.init();
    }

    async init() {
        if (this.isInitialized) return;
        
        try {
            // Wait for DOM to be ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.initializeApp());
            } else {
                this.initializeApp();
            }
        } catch (error) {
            console.error('Error initializing app:', error);
            this.showErrorState();
        }
    }

    async initializeApp() {
        console.log('Initializing PluggedIn Web App...');
        
        try {
            // Initialize core modules
            await this.initializeModules();
            
            // Setup global event listeners
            this.setupGlobalEventListeners();
            
            // Check authentication state
            await this.checkInitialAuthState();
            
            // Load initial data
            await this.loadInitialData();
            
            this.isInitialized = true;
            console.log('PluggedIn Web App initialized successfully');
            
        } catch (error) {
            console.error('Error during app initialization:', error);
            this.showErrorState();
        }
    }

    async initializeModules() {
        // Modules are initialized via their own DOMContentLoaded listeners
        // This method can be used for any additional module setup
        
        // Wait a bit for modules to initialize
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Verify modules are available
        if (!window.authManager) {
            throw new Error('AuthManager not initialized');
        }
        
        if (!window.studiosManager) {
            throw new Error('StudiosManager not initialized');
        }
        
        if (!window.bookingManager) {
            throw new Error('BookingManager not initialized');
        }
    }

    setupGlobalEventListeners() {
        // Handle navigation
        this.setupNavigation();
        
        // Handle search
        this.setupSearch();
        
        // Handle responsive behavior
        this.setupResponsiveBehavior();
        
        // Handle keyboard shortcuts
        this.setupKeyboardShortcuts();
    }

    setupNavigation() {
        // Handle logo click - go to home
        const logo = document.querySelector('nav img');
        if (logo) {
            logo.addEventListener('click', () => {
                this.navigateToHome();
            });
            logo.style.cursor = 'pointer';
        }

        // Handle browser back/forward
        window.addEventListener('popstate', (e) => {
            this.handlePopState(e);
        });
    }

    setupSearch() {
        const searchBtn = document.getElementById('searchBtn');
        const locationSearch = document.getElementById('locationSearch');

        // Enhanced search functionality
        if (searchBtn && locationSearch) {
            // Show/hide search on mobile
            searchBtn.addEventListener('click', () => {
                if (window.innerWidth < 768) {
                    this.toggleMobileSearch();
                } else {
                    locationSearch.focus();
                }
            });

            // Search suggestions (future enhancement)
            locationSearch.addEventListener('input', (e) => {
                this.handleSearchInput(e.target.value);
            });
        }
    }

    setupResponsiveBehavior() {
        // Handle window resize
        window.addEventListener('resize', () => {
            this.handleWindowResize();
        });

        // Initial responsive setup
        this.handleWindowResize();
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + K for search
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                const searchInput = document.getElementById('locationSearch');
                if (searchInput) {
                    searchInput.focus();
                }
            }

            // Escape to close modals
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });
    }

    async checkInitialAuthState() {
        try {
            const { data: { session } } = await supabaseClient.auth.getSession();
            if (session) {
                console.log('User is authenticated:', session.user.email);
            } else {
                console.log('User is not authenticated');
            }
        } catch (error) {
            console.error('Error checking auth state:', error);
        }
    }

    async loadInitialData() {
        // Load featured studios or default content
        try {
            // This is handled by StudiosManager, but we can add any app-level data loading here
            console.log('Loading initial app data...');
        } catch (error) {
            console.error('Error loading initial data:', error);
        }
    }

    navigateToHome() {
        // Scroll to top and reset any filters
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Clear search
        const locationSearch = document.getElementById('locationSearch');
        if (locationSearch) {
            locationSearch.value = '';
        }
        
        // Reload studios without filters
        if (window.studiosManager) {
            window.studiosManager.currentFilters = {};
            window.studiosManager.loadStudios();
        }
    }

    handlePopState(e) {
        // Handle browser navigation
        console.log('Handling popstate:', e.state);
    }

    toggleMobileSearch() {
        const locationSearch = document.getElementById('locationSearch');
        if (locationSearch) {
            // Toggle mobile search visibility
            locationSearch.classList.toggle('hidden');
            if (!locationSearch.classList.contains('hidden')) {
                locationSearch.focus();
            }
        }
    }

    handleSearchInput(value) {
        // Debounced search suggestions (future enhancement)
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            if (value.length > 2) {
                // Could implement search suggestions here
                console.log('Search suggestions for:', value);
            }
        }, 300);
    }

    handleWindowResize() {
        const width = window.innerWidth;
        
        // Update mobile/desktop behavior
        if (width < 768) {
            this.enableMobileMode();
        } else {
            this.enableDesktopMode();
        }
    }

    enableMobileMode() {
        // Mobile-specific adjustments
        document.body.classList.add('mobile-mode');
    }

    enableDesktopMode() {
        // Desktop-specific adjustments
        document.body.classList.remove('mobile-mode');
    }

    closeAllModals() {
        // Close any open modals
        const modals = document.querySelectorAll('[id$="Modal"]:not(.hidden)');
        modals.forEach(modal => {
            modal.classList.add('hidden');
        });
    }

    showErrorState() {
        const main = document.querySelector('main');
        if (main) {
            main.innerHTML = `
                <div class="text-center py-12">
                    <svg class="mx-auto h-12 w-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                    </svg>
                    <h3 class="mt-2 text-sm font-medium text-gray-900">Application Error</h3>
                    <p class="mt-1 text-sm text-gray-500">
                        There was an error loading the application. Please refresh the page to try again.
                    </p>
                    <div class="mt-6">
                        <button onclick="window.location.reload()" 
                                class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                            Refresh Page
                        </button>
                    </div>
                </div>
            `;
        }
    }

    // Public API methods
    getAuthManager() {
        return window.authManager;
    }

    getStudiosManager() {
        return window.studiosManager;
    }

    getBookingManager() {
        return window.bookingManager;
    }

    // Utility methods for other modules
    showNotification(message, type = 'info') {
        if (window.utils) {
            window.utils.showNotification(message, type);
        } else {
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    }

    formatCurrency(amount) {
        if (window.utils) {
            return window.utils.formatCurrency(amount);
        }
        return `$${amount.toFixed(2)}`;
    }

    formatDate(date) {
        if (window.utils) {
            return window.utils.formatDate(date);
        }
        return new Date(date).toLocaleDateString();
    }
}

// Initialize the app
window.pluggedInApp = new PluggedInApp();

// Export for debugging
window.app = window.pluggedInApp;
