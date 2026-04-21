// Studios Module for PluggedIn Web App
// NOTE: Always access db via window.db (resolved after DB_READY) — NOT const db = window.db at top level

// Global initialization functions for filtering
window.initializeTagFiltering = function() {
    const tagButtons = document.querySelectorAll('.tag-btn');
    const activeTagsContainer = document.getElementById('activeTagsContainer');
    const activeTagsList = document.getElementById('activeTags');
    
    if (!tagButtons.length) return;

    tagButtons.forEach(btn => {
        // Prevent duplicate listener
        if (btn.dataset.hasListener) return;
        btn.dataset.hasListener = "true";
        
        btn.addEventListener('click', () => {
            const tag = btn.dataset.tag;
            btn.classList.toggle('active');
            updateActiveTagsUI();
            refreshFilteredResults();
        });
    });

    function updateActiveTagsUI() {
        const activeBTNs = document.querySelectorAll('.tag-btn.active');
        
        if (activeBTNs.length > 0) {
            activeTagsContainer.classList.remove('hidden');
            activeTagsList.innerHTML = Array.from(activeBTNs).map(btn => `
                <span class="active-tag">
                    ${btn.textContent}
                    <i class="fas fa-times active-tag-remove" onclick="removeActiveFilter('${btn.dataset.tag}')" title="Remove filter"></i>
                </span>
            `).join('') + `
                <button class="clear-all-btn" onclick="clearAllActiveFilters()">Clear All</button>
            `;
        } else {
            activeTagsContainer.classList.add('hidden');
            activeTagsList.innerHTML = '';
        }
    }
    
    function refreshFilteredResults() {
        if (window.studiosManager) {
            const activeTags = Array.from(document.querySelectorAll('.tag-btn.active'))
                .map(b => b.dataset.tag);
            
            window.studiosManager.currentFilters.tags = activeTags.length > 0 ? activeTags : null;
            window.studiosManager.loadStudios();
        }
    }
    
    // Global functions for inline onclicks
    window.removeActiveFilter = function(tag) {
        const btn = document.querySelector(`.tag-btn[data-tag="${tag}"]`);
        if (btn) {
            btn.classList.remove('active');
            updateActiveTagsUI();
            refreshFilteredResults();
        }
    };
    
    window.clearAllActiveFilters = function() {
        document.querySelectorAll('.tag-btn.active').forEach(btn => btn.classList.remove('active'));
        updateActiveTagsUI();
        if (window.studiosManager) {
            window.studiosManager.currentFilters.tags = null;
            window.studiosManager.loadStudios();
        }
    };
};

window.initializeCityPicker = function() {
    const locationInput = document.getElementById('locationSearch');
    const suggestions = document.getElementById('locationSuggestions');
    
    if (!locationInput) return;

    locationInput.addEventListener('input', (e) => {
        const value = e.target.value.toLowerCase();
        if (value.length < 1) {
            suggestions?.classList.add('hidden');
            return;
        }

        if (window.studiosManager) {
            const cities = [...new Set(window.studiosManager.getStudios()
                .map(s => s.location ? s.location.split(',')[0].trim() : '')
                .filter(c => c !== ''))];
            
            const filtered = cities.filter(c => c.toLowerCase().includes(value));
            
            if (filtered.length > 0 && suggestions) {
                suggestions.innerHTML = filtered.map(city => `
                    <div class="px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-800 cursor-pointer border-b border-gray-100 dark:border-gray-800 last:border-0" onclick="selectCity('${city}')">
                        <span class="text-sm font-medium text-gray-700 dark:text-gray-200">${city}</span>
                    </div>
                `).join('');
                suggestions.classList.remove('hidden');
            } else if (suggestions) {
                suggestions.classList.add('hidden');
            }
        }
    });

    window.selectCity = function(city) {
        locationInput.value = city;
        if (suggestions) suggestions.classList.add('hidden');
        
        if (window.studiosManager) {
            window.studiosManager.currentFilters.location = city;
            window.studiosManager.loadStudios();
        }
    };

    // Close suggestions on click outside
    document.addEventListener('click', (e) => {
        if (!locationInput.contains(e.target) && !suggestions?.contains(e.target)) {
            suggestions?.classList.add('hidden');
        }
    });
};

class StudiosManager {
    constructor() {
        this.studios = [];
        this.filteredStudios = [];
        this.currentFilters = {};
        this.selectedStudio = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadStudios();
        
        // Initialize global components
        window.initializeTagFiltering();
        window.initializeCityPicker();
    }

    setupEventListeners() {
        const searchSubmit = document.getElementById('searchSubmit');
        const locationSearch = document.getElementById('locationSearch');

        if (searchSubmit) {
            searchSubmit.addEventListener('click', () => this.handleSearch());
        }

        if (locationSearch) {
            locationSearch.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleSearch();
                }
            });
        }

        const closeModal = document.getElementById('closeModal');
        if (closeModal) {
            closeModal.addEventListener('click', () => this.hideStudioModal());
        }

        const studioModal = document.getElementById('studioModal');
        if (studioModal) {
            studioModal.addEventListener('click', (e) => {
                if (e.target === studioModal) {
                    this.hideStudioModal();
                }
            });
        }
    }

    async loadStudios() {
        this.showLoadingState();
        
        try {
            if (window.DB_READY) {
                console.log('⏳ Waiting for DB sync before loading studios...');
                await window.DB_READY;
            }
            
            const db = window.db;
            if (!db || typeof db.getStudios !== 'function') {
                throw new Error('Database not initialized');
            }

            this.studios = await db.getStudios(this.currentFilters);
            this.filteredStudios = [...this.studios];
            this.renderStudios();
        } catch (error) {
            console.error('Error loading studios:', error);
            const utils = window.utils;
            if (utils && utils.showNotification) {
                utils.showNotification('Error loading studios. Please try again.', 'error');
            }
            this.showEmptyState();
        }
    }

    handleSearch() {
        const searchTerm = document.getElementById('locationSearch')?.value.trim();
        
        if (searchTerm) {
            this.currentFilters.location = searchTerm;
        } else {
            delete this.currentFilters.location;
        }

        this.loadStudios();
    }

    showLoadingState() {
        const loadingState = document.getElementById('loadingState');
        const studioGrid = document.getElementById('studioGrid');
        const emptyState = document.getElementById('emptyState');

        if (loadingState) loadingState.classList.add('hidden');
        if (emptyState) emptyState.classList.add('hidden');

        if (studioGrid) {
            studioGrid.innerHTML = Array(6).fill(0).map(() => `
                <div class="studio-card rounded-xl overflow-hidden border border-gray-100 dark:border-slate-800">
                    <div class="skeleton skeleton-img w-full h-64"></div>
                    <div class="p-4 space-y-3">
                        <div class="flex justify-between">
                            <div class="skeleton skeleton-title" style="width: 70%"></div>
                            <div class="skeleton skeleton-text" style="width: 15%"></div>
                        </div>
                        <div class="skeleton skeleton-text" style="width: 40%"></div>
                        <div class="skeleton skeleton-text" style="width: 100%"></div>
                        <div class="skeleton skeleton-text" style="width: 30%"></div>
                    </div>
                </div>
            `).join('');
        }
    }

    showEmptyState() {
        const studioGrid = document.getElementById('studioGrid');
        const emptyState = document.getElementById('emptyState');
        const loadingState = document.getElementById('loadingState');

        if (loadingState) loadingState.classList.add('hidden');
        if (emptyState) emptyState.classList.add('hidden');

        if (studioGrid) {
            studioGrid.classList.remove('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3');
            studioGrid.classList.add('block');
            studioGrid.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">
                        <i class="fas fa-search"></i>
                    </div>
                    <h3 class="empty-state-title">No studios found</h3>
                    <p class="empty-state-description">We couldn't find any studios matching your current filters. Try adjusting your search or clear all filters to see more options.</p>
                    <button onclick="window.clearAllActiveFilters();" class="empty-state-cta">
                        Clear all filters
                    </button>
                </div>
            `;
        }
    }

    renderStudios() {
        const loadingState = document.getElementById('loadingState');
        const studioGrid = document.getElementById('studioGrid');
        const emptyState = document.getElementById('emptyState');

        if (loadingState) loadingState.classList.add('hidden');

        if (!this.filteredStudios || this.filteredStudios.length === 0) {
            this.showEmptyState();
            return;
        }

        if (emptyState) emptyState.classList.add('hidden');

        if (studioGrid) {
            studioGrid.innerHTML = this.filteredStudios.map(studio => this.createStudioCard(studio)).join('');
            
            studioGrid.querySelectorAll('.studio-card').forEach((card, index) => {
                card.addEventListener('click', () => this.showStudioDetails(this.filteredStudios[index]));
            });
        }
    }

    createStudioCard(studio) {
        return `
            <div class="studio-card group cursor-pointer" onclick="window.studiosManager.showStudioDetails(${JSON.stringify(studio).replace(/"/g, '&quot;')})">
                <div class="relative mb-3">
                    <img src="${studio.image_url || studio.image || 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'}" 
                         alt="${studio.name}" class="w-full h-64 object-cover rounded-xl group-hover:scale-105 transition-transform duration-200"
                         loading="lazy">
                    <button class="absolute top-3 right-3 p-2 hover:scale-110 transition-transform" 
                            onclick="event.stopPropagation(); toggleFavorite('${studio.id}')" 
                            aria-label="Add to favorites">
                        <svg class="w-6 h-6 text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                        </svg>
                    </button>
                </div>
                <div class="space-y-1">
                    <div class="flex justify-between items-start">
                        <h3 class="font-medium text-gray-900 dark:text-white truncate pr-2">${studio.name}</h3>
                        <div class="flex items-center flex-shrink-0">
                            <svg class="w-4 h-4 text-yellow-500 fill-current" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                            </svg>
                            <span class="text-sm text-gray-900 dark:text-gray-200 ml-1">${studio.rating || '4.8'}</span>
                        </div>
                    </div>
                    <p class="text-gray-500 dark:text-gray-400 text-sm">${studio.location}</p>
                    <p class="text-gray-500 dark:text-gray-400 text-sm">${studio.description || 'Professional recording studio'}</p>
                    <p class="text-gray-900 dark:text-white font-medium"><span class="font-semibold">$${studio.price || studio.hourly_rate || '75'}</span> per hour</p>
                </div>
            </div>
        `;
    }

    async showStudioDetails(studio) {
        this.selectedStudio = studio;
        
        const studioCard = document.querySelector(`[onclick*="${studio.id}"]`);
        if (studioCard) studioCard.style.opacity = '0.7';
        
        try {
            const db = window.db;
            const fullStudio = await db.getStudio(studio.id);
            
            if (studioCard) studioCard.style.opacity = '1';
            this.renderStudioModal(fullStudio);
            this.showStudioModal();
        } catch (error) {
            if (studioCard) studioCard.style.opacity = '1';
            console.error('Error loading studio details:', error);
            const utils = window.utils;
            if (utils) utils.showNotification('Error loading studio details. Please check your connection.', 'error');
        }
    }

    renderStudioModal(studio) {
        const modalStudioName = document.getElementById('modalStudioName');
        const modalContent = document.getElementById('modalContent');
        const utils = window.utils;

        if (modalStudioName) {
            modalStudioName.textContent = studio.name;
        }

        if (modalContent) {
            const imageUrl = studio.images && studio.images.length > 0 
                ? studio.images[0] 
                : 'https://via.placeholder.com/600x300?text=Studio+Image';

            modalContent.innerHTML = `
                <div class="space-y-6">
                    <div class="aspect-w-16 aspect-h-9">
                        <img src="${imageUrl}" alt="${studio.name}" class="w-full h-64 object-cover rounded-lg">
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h4 class="text-lg font-semibold mb-3">Studio Details</h4>
                            <div class="space-y-2">
                                <p class="flex items-center text-gray-600">
                                    <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                    </svg>
                                    ${studio.location || 'Location not specified'}
                                </p>
                                <p class="flex items-center text-gray-600">
                                    <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                                    </svg>
                                    ${utils ? utils.formatCurrency(studio.hourly_rate || 0) : '$' + (studio.hourly_rate || 0)} per hour
                                </p>
                            </div>
                            <div class="mt-4">
                                <h5 class="font-medium mb-2">Description</h5>
                                <p class="text-gray-600 text-sm">${studio.description || 'No description available'}</p>
                            </div>
                        </div>
                        <div>
                            <h4 class="text-lg font-semibold mb-3">Equipment</h4>
                            <div class="space-y-2 max-h-48 overflow-y-auto">
                                ${studio.equipment && studio.equipment.length > 0 
                                    ? studio.equipment.map(eq => `
                                        <div class="flex justify-between items-center p-2 bg-gray-50 rounded">
                                            <span class="text-sm font-medium">${eq.name}</span>
                                            <span class="text-xs text-gray-500">${eq.category || 'Equipment'}</span>
                                        </div>
                                    `).join('')
                                    : '<p class="text-gray-500 text-sm">No equipment listed</p>'
                                }
                            </div>
                        </div>
                    </div>
                    <div class="border-t pt-6">
                        <div class="flex flex-col sm:flex-row justify-between items-center gap-4">
                            <div>
                                <h4 class="text-lg font-semibold">Ready to book?</h4>
                                <p class="text-gray-600">Choose your preferred booking method</p>
                            </div>
                            <div class="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                                ${studio.external_booking_url ? `
                                    <a href="${studio.external_booking_url}" target="_blank" 
                                       class="flex-1 text-center bg-white border-2 border-blue-600 text-blue-600 px-6 py-2 rounded-md hover:bg-blue-50 transition-colors font-medium">
                                        Book via ${studio.external_platform === 'calendly' ? 'Calendly' : 'External Calendar'}
                                    </a>
                                ` : ''}
                                <button id="bookStudioBtn" class="flex-1 bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium">
                                    Native Booking
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            const bookBtn = document.getElementById('bookStudioBtn');
            if (bookBtn) {
                bookBtn.addEventListener('click', () => this.initiateBooking(studio));
            }
        }
    }

    showStudioModal() {
        const modal = document.getElementById('studioModal');
        if (modal) {
            modal.classList.remove('hidden');
        }
    }

    hideStudioModal() {
        const modal = document.getElementById('studioModal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    initiateBooking(studio) {
        const utils = window.utils;
        if (!window.authManager || !window.authManager.isAuthenticated()) {
            if (utils) utils.showNotification('Please sign in to book a studio', 'info');
            if (window.authManager) window.authManager.showAuthModal();
            return;
        }

        document.dispatchEvent(new CustomEvent('initiate-booking', { 
            detail: { studio } 
        }));
        
        this.hideStudioModal();
    }

    getStudios() {
        return this.studios;
    }

    getSelectedStudio() {
        return this.selectedStudio;
    }
}

// Initialize studios manager when DOM and Database are ready
document.addEventListener('DOMContentLoaded', () => {
    const initStudios = () => {
        window.studiosManager = new StudiosManager();
    };

    if (window.DB_READY) {
        window.DB_READY.then(initStudios).catch(err => {
            console.warn('DB_READY failed, falling back:', err);
            initStudios();
        });
    } else {
        initStudios();
    }
});
