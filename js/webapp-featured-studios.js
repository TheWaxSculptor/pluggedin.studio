// Featured Studios Module - Airbnb-style implementation for PluggedIn Web App

class FeaturedStudiosManager {
    constructor() {
        this.studios = [];
        this.filteredStudios = [];
        this.currentCategory = 'All';
        this.categories = ['All', 'Professional', 'Home', 'Mixing', 'Mastering', 'Live Room'];
        this.scrollPosition = 0;
        this.cardsPerView = 3; // Default, will adjust based on screen size
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadFeaturedStudios();
        this.adjustCardsPerView();
        window.addEventListener('resize', () => this.adjustCardsPerView());
    }

    setupEventListeners() {
        // Set up category filter pills
        const categoryContainer = document.getElementById('featuredCategoryFilters');
        if (categoryContainer) {
            categoryContainer.innerHTML = this.categories.map(category => 
                `<button 
                    class="category-pill ${category === 'All' ? 'active' : ''}" 
                    data-category="${category}"
                    aria-pressed="${category === 'All' ? 'true' : 'false'}"
                    >
                    ${category}
                </button>`
            ).join('');

            // Add click events to category pills
            categoryContainer.querySelectorAll('.category-pill').forEach(pill => {
                pill.addEventListener('click', () => this.filterByCategory(pill.dataset.category));
            });
        }

        // Set up scroll navigation buttons
        const scrollLeft = document.getElementById('featuredScrollLeft');
        const scrollRight = document.getElementById('featuredScrollRight');

        if (scrollLeft) {
            scrollLeft.addEventListener('click', () => this.scrollCarousel('left'));
            // Initially hide left button as we start at position 0
            scrollLeft.classList.add('hidden');
        }

        if (scrollRight) {
            scrollRight.addEventListener('click', () => this.scrollCarousel('right'));
        }

        // View All button
        const viewAllBtn = document.getElementById('featuredViewAll');
        if (viewAllBtn) {
            viewAllBtn.addEventListener('click', () => {
                window.location.href = '/explore.html';
            });
        }
    }

    async loadFeaturedStudios() {
        try {
            // Show loading state
            const container = document.getElementById('featuredStudiosCarousel');
            if (container) {
                container.innerHTML = `
                    <div class="w-full flex justify-center items-center py-8">
                        <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
                    </div>
                `;
            }

            // Load studios from database
            const allStudios = await window.db.getStudios();
            
            // Filter featured studios - in a real app, this would be based on a "featured" flag
            // For now, we'll use the top 8 studios ordered by rating
            this.studios = allStudios
                .sort((a, b) => (b.rating || 0) - (a.rating || 0))
                .slice(0, 8);
                
            this.filteredStudios = [...this.studios];
            this.renderFeaturedStudios();
        } catch (error) {
            console.error('Error loading featured studios:', error);
            const container = document.getElementById('featuredStudiosCarousel');
            if (container) {
                container.innerHTML = `
                    <div class="w-full text-center py-8">
                        <p class="text-gray-500">Unable to load featured studios.</p>
                    </div>
                `;
            }
        }
    }

    filterByCategory(category) {
        this.currentCategory = category;
        
        // Update active pill state
        const pills = document.querySelectorAll('.category-pill');
        pills.forEach(pill => {
            const isActive = pill.dataset.category === category;
            pill.classList.toggle('active', isActive);
            pill.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        });

        // Filter studios based on category
        if (category === 'All') {
            this.filteredStudios = [...this.studios];
        } else {
            this.filteredStudios = this.studios.filter(studio => {
                // Check if studio has this category/type
                return (
                    (studio.type && studio.type.toLowerCase() === category.toLowerCase()) || 
                    (studio.categories && studio.categories.some(cat => 
                        cat.toLowerCase() === category.toLowerCase()
                    )) ||
                    (studio.tags && studio.tags.some(tag => 
                        tag.toLowerCase() === category.toLowerCase()
                    ))
                );
            });
        }

        // Reset scroll position when changing categories
        this.scrollPosition = 0;
        this.renderFeaturedStudios();
        this.updateScrollButtons();
    }

    scrollCarousel(direction) {
        const container = document.getElementById('featuredStudiosCarousel');
        if (!container) return;
        
        const cardWidth = container.querySelector('.studio-card')?.offsetWidth + 16; // card + margin
        if (!cardWidth) return;
        
        if (direction === 'left') {
            this.scrollPosition = Math.max(0, this.scrollPosition - this.cardsPerView);
        } else {
            this.scrollPosition = Math.min(
                this.filteredStudios.length - this.cardsPerView, 
                this.scrollPosition + this.cardsPerView
            );
        }
        
        container.scrollTo({
            left: this.scrollPosition * cardWidth,
            behavior: 'smooth'
        });
        
        this.updateScrollButtons();
    }
    
    updateScrollButtons() {
        const leftBtn = document.getElementById('featuredScrollLeft');
        const rightBtn = document.getElementById('featuredScrollRight');
        
        if (leftBtn) {
            leftBtn.classList.toggle('hidden', this.scrollPosition <= 0);
        }
        
        if (rightBtn) {
            rightBtn.classList.toggle('hidden', 
                this.scrollPosition >= this.filteredStudios.length - this.cardsPerView);
        }
    }
    
    adjustCardsPerView() {
        const width = window.innerWidth;
        
        if (width >= 1280) { // xl
            this.cardsPerView = 4;
        } else if (width >= 1024) { // lg
            this.cardsPerView = 3;
        } else if (width >= 768) { // md
            this.cardsPerView = 2;
        } else {
            this.cardsPerView = 1;
        }
        
        // Update UI based on new cardsPerView value
        this.updateScrollButtons();
    }

    renderFeaturedStudios() {
        const container = document.getElementById('featuredStudiosCarousel');
        if (!container) return;
        
        if (!this.filteredStudios.length) {
            container.innerHTML = `
                <div class="w-full text-center py-8">
                    <p class="text-gray-500">No studios found in this category.</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = this.filteredStudios.map(studio => this.createStudioCard(studio)).join('');
        
        // Add click listeners to studio cards
        container.querySelectorAll('.studio-card').forEach((card, index) => {
            card.addEventListener('click', () => this.showStudioDetails(this.filteredStudios[index]));
        });

        // Reset scroll position and update buttons
        container.scrollLeft = 0;
        this.scrollPosition = 0;
        this.updateScrollButtons();
    }
    
    createStudioCard(studio) {
        const rating = studio.rating || 0;
        const starsHtml = this.generateStarRating(rating);
        const price = studio.hourlyRate ? utils.formatCurrency(studio.hourlyRate) : 'Contact for pricing';
        
        return `
            <div class="studio-card flex-shrink-0 w-full sm:w-80 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white cursor-pointer">
                <div class="relative h-48 overflow-hidden">
                    <img 
                        src="${studio.coverImage || 'images/studio-placeholder.jpg'}" 
                        alt="${studio.name}" 
                        class="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                        onerror="this.src='images/studio-placeholder.jpg'"
                    >
                    ${studio.type === 'Professional' ? 
                        `<div class="absolute top-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded-full">
                            Professional
                        </div>` : ''
                    }
                </div>
                <div class="p-4">
                    <div class="flex justify-between items-center">
                        <h3 class="font-semibold text-lg line-clamp-1">${studio.name}</h3>
                        <div class="flex items-center">
                            <span class="text-sm font-medium mr-1">${rating.toFixed(1)}</span>
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                        </div>
                    </div>
                    <p class="text-gray-500 text-sm mt-1 line-clamp-1">
                        ${studio.location || 'Location not specified'}
                    </p>
                    <div class="flex items-center justify-between mt-3">
                        <p class="font-semibold">${price} <span class="text-gray-500 text-sm font-normal">/ hour</span></p>
                    </div>
                </div>
            </div>
        `;
    }
    
    generateStarRating(rating) {
        const fullStars = Math.floor(rating);
        const halfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
        
        let starsHtml = '';
        
        // Full stars
        for (let i = 0; i < fullStars; i++) {
            starsHtml += `
                <svg class="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
            `;
        }
        
        // Half star
        if (halfStar) {
            starsHtml += `
                <svg class="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <linearGradient id="half-star-gradient">
                            <stop offset="50%" stop-color="currentColor" />
                            <stop offset="50%" stop-color="#E5E7EB" />
                        </linearGradient>
                    </defs>
                    <path fill="url(#half-star-gradient)" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
            `;
        }
        
        // Empty stars
        for (let i = 0; i < emptyStars; i++) {
            starsHtml += `
                <svg class="w-4 h-4 text-gray-300" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
            `;
        }
        
        return starsHtml;
    }
    
    showStudioDetails(studio) {
        if (window.studiosManager) {
            window.studiosManager.showStudioDetails(studio);
        } else {
            console.error('Studios Manager not initialized');
        }
    }
}

// Initialize featured studios manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.featuredStudiosManager = new FeaturedStudiosManager();
});
