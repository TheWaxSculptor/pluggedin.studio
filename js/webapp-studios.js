// Studios Module for PluggedIn Web App

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
    }

    setupEventListeners() {
        // Search functionality
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

        // Modal functionality
        const closeModal = document.getElementById('closeModal');
        if (closeModal) {
            closeModal.addEventListener('click', () => this.hideStudioModal());
        }

        // Close modal when clicking outside
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
            this.studios = await db.getStudios(this.currentFilters);
            this.filteredStudios = [...this.studios];
            this.renderStudios();
        } catch (error) {
            console.error('Error loading studios:', error);
            utils.showNotification('Error loading studios. Please try again.', 'error');
            this.showEmptyState();
        }
    }

    handleSearch() {
        const searchTerm = document.getElementById('locationSearch').value.trim();
        
        if (searchTerm) {
            this.currentFilters = {
                location: searchTerm,
            };
        } else {
            this.currentFilters = {};
        }

        initializeCityPicker();
        initializeTagFiltering();
        loadFeaturedStudios();
        loadRecentStudios();
        this.loadStudios();
    }

    showLoadingState() {
        const loadingState = document.getElementById('loadingState');
        const studioGrid = document.getElementById('studioGrid');
        const emptyState = document.getElementById('emptyState');

        if (loadingState) loadingState.classList.remove('hidden');
        if (studioGrid) studioGrid.innerHTML = '';
        if (emptyState) emptyState.classList.add('hidden');
    }

    showEmptyState() {
        const loadingState = document.getElementById('loadingState');
        const emptyState = document.getElementById('emptyState');

        if (loadingState) loadingState.classList.add('hidden');
        if (emptyState) emptyState.classList.remove('hidden');
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
            
            // Add click listeners to studio cards
            studioGrid.querySelectorAll('.studio-card').forEach((card, index) => {
                card.addEventListener('click', () => this.showStudioDetails(this.filteredStudios[index]));
            });
        }
    }

    createStudioCard(studio) {
        const equipmentCount = studio.equipment ? studio.equipment.length : 0;
        const tags = studio.tags || [];
        const amenities = studio.amenities || [];
        const displayTags = [...tags, ...amenities].slice(0, 3);
        
        return `
            <div class="studio-card group cursor-pointer" onclick="window.studiosManager.showStudioDetails(${JSON.stringify(studio).replace(/"/g, '&quot;')})">
                <div class="relative mb-3">
                    <img src="${studio.image || 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80'}" 
                         alt="${studio.name}" class="w-full h-64 object-cover rounded-xl group-hover:scale-105 transition-transform duration-200">
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
                        <h3 class="font-medium text-gray-900 truncate pr-2">${studio.name}</h3>
                        <div class="flex items-center flex-shrink-0">
                            <svg class="w-4 h-4 text-black fill-current" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                            </svg>
                            <span class="text-sm text-gray-900 ml-1">${studio.rating || '4.8'}</span>
                        </div>
                    </div>
                    <p class="text-gray-500 text-sm">${studio.location}</p>
                    <p class="text-gray-500 text-sm">${studio.description || 'Professional recording studio'}</p>
                    <p class="text-gray-900 font-medium"><span class="font-semibold">$${studio.price || '75'}</span> per hour</p>
                </div>
            </div>
        `;
    }

    async showStudioDetails(studio) {
        this.selectedStudio = studio;
        
        try {
            // Get full studio details including availability
            const fullStudio = await db.getStudio(studio.id);
            this.renderStudioModal(fullStudio);
            this.showStudioModal();
        } catch (error) {
            console.error('Error loading studio details:', error);
            utils.showNotification('Error loading studio details', 'error');
        }
    }

    renderStudioModal(studio) {
        const modalStudioName = document.getElementById('modalStudioName');
        const modalContent = document.getElementById('modalContent');

        if (modalStudioName) {
            modalStudioName.textContent = studio.name;
        }

        if (modalContent) {
            const imageUrl = studio.images && studio.images.length > 0 
                ? studio.images[0] 
                : 'https://via.placeholder.com/600x300?text=Studio+Image';

            modalContent.innerHTML = `
                <div class="space-y-6">
                    <!-- Studio Image -->
                    <div class="aspect-w-16 aspect-h-9">
                        <img src="${imageUrl}" alt="${studio.name}" class="w-full h-64 object-cover rounded-lg">
                    </div>

                    <!-- Studio Info -->
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
                                    ${utils.formatCurrency(studio.hourly_rate || 0)} per hour
                                </p>
                                <p class="flex items-center text-gray-600">
                                    <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                                    </svg>
                                    Capacity: ${studio.capacity || 'Not specified'}
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

                    <!-- Booking Section -->
                    <div class="border-t pt-6">
                        <div class="flex justify-between items-center">
                            <div>
                                <h4 class="text-lg font-semibold">Ready to book?</h4>
                                <p class="text-gray-600">Select your preferred time slot</p>
                            </div>
                            <button id="bookStudioBtn" class="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors">
                                Book Now
                            </button>
                        </div>
                    </div>
                </div>
            `;

            // Add booking button listener
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
        if (!window.authManager || !window.authManager.isAuthenticated()) {
            utils.showNotification('Please sign in to book a studio', 'info');
            window.authManager.showAuthModal();
            return;
        }

        // TODO: Implement booking flow
        utils.showNotification('Booking feature coming soon!', 'info');
    }

    getStudios() {
        return this.studios;
    }

    getSelectedStudio() {
        return this.selectedStudio;
    }
}

// Initialize studios manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.studiosManager = new StudiosManager();
});
