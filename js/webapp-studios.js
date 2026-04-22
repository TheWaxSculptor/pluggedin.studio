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
            // Graceful fallback: render empty state but don't crash
            this.showEmptyState();
        }
    }

    handleSearch() {
        const searchTerm = document.getElementById('locationSearch')?.value.trim();
        const citySuggestions = document.getElementById('locationSuggestions');
        
        if (citySuggestions) citySuggestions.classList.add('hidden');
        
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
        const studioGrid = document.getElementById('studioGrid');
        const loadingState = document.getElementById('loadingState');

        if (loadingState) loadingState.classList.add('hidden');

        if (!this.filteredStudios || this.filteredStudios.length === 0) {
            this.showEmptyState();
            return;
        }

        if (studioGrid) {
            studioGrid.classList.add('grid');
            studioGrid.classList.remove('block');
            studioGrid.innerHTML = this.filteredStudios.map(studio => this.createStudioCard(studio)).join('');
            
            // Add delegated click listener to the grid instead of individual cards
            if (!studioGrid.dataset.hasListener) {
                studioGrid.addEventListener('click', (e) => {
                    const card = e.target.closest('.studio-card');
                    if (card && !e.target.closest('button')) {
                        const studioId = card.dataset.id;
                        const studio = this.filteredStudios.find(s => s.id === studioId);
                        if (studio) this.showStudioDetails(studio);
                    }
                });
                studioGrid.dataset.hasListener = "true";
            }
        }
    }

    createStudioCard(studio) {
        const rating = studio.rating || '4.8';
        const price = studio.price || studio.hourly_rate || '75';
        const image = studio.image_url || studio.image || 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=800&q=80';

        return `
            <div class="studio-card group cursor-pointer bg-white dark:bg-zinc-900/40 rounded-3xl overflow-hidden border border-gray-100 dark:border-white/5 transition-all hover:shadow-2xl hover:shadow-black/5" data-id="${studio.id}">
                <div class="relative aspect-[4/3] overflow-hidden">
                    <img src="${image}" 
                         alt="${studio.name}" 
                         class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                         loading="lazy">
                    <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    
                    <div class="absolute top-4 left-4">
                        <span class="px-3 py-1 bg-white/90 backdrop-blur-md dark:bg-black/80 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/20">
                            ${studio.studio_type || 'Recording'}
                        </span>
                    </div>

                    <button class="absolute top-4 right-4 p-2.5 bg-white/90 backdrop-blur-md dark:bg-black/80 rounded-full text-gray-900 dark:text-white border border-white/20 transition-all hover:scale-110 active:scale-95" 
                            onclick="event.stopPropagation(); window.utils.showNotification('Saved to favorites', 'success')" 
                            aria-label="Add to favorites">
                        <i class="far fa-heart"></i>
                    </button>
                </div>
                
                <div class="p-6">
                    <div class="flex justify-between items-start mb-2">
                        <h3 class="text-lg font-black uppercase tracking-tight text-gray-900 dark:text-white truncate pr-4">${studio.name}</h3>
                        <div class="flex items-center space-x-1 px-2 py-1 bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-100 dark:border-white/10">
                            <i class="fas fa-star text-[10px] text-yellow-500"></i>
                            <span class="text-xs font-black">${rating}</span>
                        </div>
                    </div>
                    
                    <p class="text-gray-500 dark:text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-4 flex items-center">
                        <i class="fas fa-map-marker-alt mr-2 opacity-50"></i> ${studio.location}
                    </p>
                    
                    <div class="flex items-center justify-between pt-4 border-t border-gray-50 dark:border-white/5">
                        <div class="flex flex-col">
                            <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Hourly</span>
                            <span class="text-xl font-black text-gray-900 dark:text-white mt-1">$${price}</span>
                        </div>
                        <button class="px-5 py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98]">
                            Details
                        </button>
                    </div>
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
            modalStudioName.textContent = ""; // Use the modal's own header redesign
        }

        if (modalContent) {
            const imageUrl = studio.images && studio.images.length > 0 
                ? studio.images[0] 
                : studio.image_url || studio.image || 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=1200&q=80';

            modalContent.innerHTML = `
                <div class="flex flex-col md:flex-row h-full -m-5 md:-m-10 min-h-[85vh]">
                    <!-- Left: Studio Immersion (High Fidelity) -->
                    <div class="w-full md:w-5/12 bg-black text-white p-8 md:p-12 flex flex-col justify-between relative overflow-hidden">
                        <div class="absolute inset-0 opacity-40">
                            <img src="${imageUrl}" class="w-full h-full object-cover grayscale active:grayscale-0 transition-all duration-1000">
                        </div>
                        <div class="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
                        
                        <div class="relative z-10">
                            <div class="inline-block px-4 py-1.5 bg-white/10 backdrop-blur-xl rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-6 border border-white/20">
                                ${studio.location ? studio.location.split(',')[0] : 'Exclusive'} Site
                            </div>
                            <h2 class="text-5xl font-black mb-4 leading-[0.9] tracking-tighter uppercase">${studio.name}</h2>
                            <p class="text-gray-400 text-sm font-medium leading-relaxed max-w-sm mb-8">
                                ${studio.description || 'Elevating sound melalui premium hardware and world-class acoustics.'}
                            </p>
                        </div>
                        
                        <div class="relative z-10 grid grid-cols-2 gap-8 pt-12 border-t border-white/10">
                            <div>
                                <span class="block text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Standard Rate</span>
                                <span class="text-3xl font-black">${utils ? utils.formatCurrency(studio.hourly_rate || 0) : '$' + (studio.hourly_rate || 0)}</span>
                            </div>
                            <div>
                                <span class="block text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Verified Rating</span>
                                <span class="text-3xl font-black flex items-center">
                                    ${studio.rating || '4.8'}
                                    <i class="fas fa-star text-xs ml-2 text-yellow-500"></i>
                                </span>
                            </div>
                        </div>
                    </div>

                    <!-- Right: Technical Specifications & Actions -->
                    <div class="w-full md:w-7/12 p-8 md:p-12 bg-white dark:bg-zinc-950 flex flex-col">
                        <div class="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                            <div class="space-y-12">
                                <!-- Technical Rider -->
                                <div>
                                    <h4 class="text-xs font-black uppercase tracking-[0.3em] text-gray-400 mb-8 border-b border-gray-100 dark:border-white/5 pb-4">Technical Rider</h4>
                                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        ${studio.equipment && studio.equipment.length > 0 
                                            ? studio.equipment.map(eq => `
                                                <div class="flex items-center p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 group hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all">
                                                    <div class="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center mr-4 group-hover:bg-white/20">
                                                        <i class="fas fa-microchip text-[10px]"></i>
                                                    </div>
                                                    <div>
                                                        <span class="block text-xs font-black leading-tight uppercase">${eq.name}</span>
                                                        <span class="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">${eq.category || 'Gear'}</span>
                                                    </div>
                                                </div>
                                            `).join('')
                                            : `
                                                <div class="col-span-2 py-10 text-center border-2 border-dashed border-gray-100 dark:border-white/5 rounded-3xl">
                                                    <p class="text-xs font-black text-gray-400 uppercase tracking-widest">Digital-First Environment / Custom Specs</p>
                                                </div>
                                            `
                                        }
                                    </div>
                                </div>

                                <!-- Amenities Section -->
                                <div>
                                    <h4 class="text-xs font-black uppercase tracking-[0.3em] text-gray-400 mb-6">Environment Amenities</h4>
                                    <div class="flex flex-wrap gap-3">
                                        ${(studio.amenities || ['High-Speed WiFi', 'Climate Control', 'Lounge Access']).map(amenity => `
                                            <span class="px-4 py-2 bg-gray-100 dark:bg-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest opacity-60">
                                                ${amenity}
                                            </span>
                                        `).join('')}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Footer Actions -->
                        <div class="mt-12 pt-8 border-t border-gray-100 dark:border-white/5">
                            <div class="flex flex-col sm:flex-row gap-4">
                                <button id="bookStudioBtn" class="flex-1 bg-black dark:bg-white text-white dark:text-black py-5 rounded-2xl font-black uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl shadow-black/20">
                                    Initiate Session
                                </button>
                                ${studio.external_booking_url ? `
                                    <a href="${studio.external_booking_url}" target="_blank" 
                                       class="px-8 flex items-center justify-center bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-100 dark:hover:bg-white/10 transition-all">
                                        External Sync
                                    </a>
                                ` : ''}
                            </div>
                            <p class="text-center text-[10px] font-bold text-gray-400 mt-6 uppercase tracking-widest">Secured via PluggedIn Protection®</p>
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
        const studioModalContent = modal?.querySelector('.relative.top-20');
        
        if (modal) {
            // Upgrade modal structure for High Fidelity
            if (studioModalContent) {
                studioModalContent.className = "relative mx-auto border-0 w-11/12 md:w-11/12 lg:w-3/4 max-w-6xl shadow-2xl rounded-[40px] bg-white dark:bg-slate-900 overflow-hidden transition-all duration-500 scale-95 opacity-0";
                
                // Animate entry
                modal.classList.remove('hidden');
                modal.classList.add('flex', 'items-center', 'justify-center', 'p-4');
                modal.style.background = "rgba(0,0,0,0.85)";
                modal.style.backdropFilter = "blur(10px)";
                
                setTimeout(() => {
                    studioModalContent.classList.remove('scale-95', 'opacity-0');
                    studioModalContent.classList.add('scale-100', 'opacity-100');
                }, 10);
            }
        }
    }

    hideStudioModal() {
        const modal = document.getElementById('studioModal');
        const studioModalContent = modal?.querySelector('.relative.mx-auto');
        
        if (modal && studioModalContent) {
            studioModalContent.classList.add('scale-95', 'opacity-0');
            setTimeout(() => {
                modal.classList.add('hidden');
                modal.classList.remove('flex', 'items-center', 'justify-center', 'p-4');
            }, 300);
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
