/**
 * Gear Marketplace Controller for PluggedIn Studio
 * Handles fetching, filtering, and displaying equipment from all studios.
 */

class MarketplaceManager {
    constructor() {
        this.gear = [];
        this.filters = {
            search: '',
            category: 'all'
        };
        this.init();
    }

    async init() {
        console.log('🎸 Initializing Gear Marketplace...');
        
        // Wait for database synchronization
        if (window.DB_READY) {
            await window.DB_READY;
        }

        this.setupEventListeners();
        await this.loadGear();
    }

    setupEventListeners() {
        // Search Input
        const searchInput = document.getElementById('gearSearch');
        const searchSubmit = document.getElementById('searchSubmit');
        
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filters.search = e.target.value;
                this.debounceSearch();
            });
        }

        if (searchSubmit) {
            searchSubmit.addEventListener('click', () => this.loadGear());
        }

        // Category Select
        const categorySelect = document.getElementById('categorySelect');
        if (categorySelect) {
            categorySelect.addEventListener('change', (e) => {
                this.filters.category = e.target.value;
                this.updateChipUI(this.filters.category);
                this.loadGear();
            });
        }

        // Category Chips
        const chips = document.querySelectorAll('.category-chip');
        chips.forEach(chip => {
            chip.addEventListener('click', () => {
                const cat = chip.dataset.cat;
                this.filters.category = cat;
                
                // Update dropdown if it exists
                if (categorySelect) categorySelect.value = cat;
                
                this.updateChipUI(cat);
                this.loadGear();
            });
        });


        // Theme Toggle Support (Standardized)
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                const isDark = document.documentElement.classList.toggle('dark');
                localStorage.setItem('theme', isDark ? 'dark' : 'light');
            });
        }
    }

    updateChipUI(activeCat) {
        document.querySelectorAll('.category-chip').forEach(chip => {
            if (chip.dataset.cat === activeCat) {
                chip.classList.add('active');
                chip.classList.remove('bg-white', 'dark:bg-zinc-900');
            } else {
                chip.classList.remove('active');
                chip.classList.add('bg-white', 'dark:bg-zinc-900');
            }
        });
    }

    debounceSearch() {
        if (this.searchTimeout) clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            this.loadGear();
        }, 300);
    }

    async loadGear() {
        this.showState('loading');
        
        try {
            // Wait for DB if not ready
            if (window.DB_READY) await window.DB_READY;
            
            if (!window.db || !window.db.getEquipment) {
                console.error('❌ Database methods not found on window.db');
                this.showState('empty');
                return;
            }
            
            this.gear = await window.db.getEquipment(this.filters);
            
            if (this.gear.length === 0) {
                this.showState('empty');
            } else {
                this.renderGear();
                this.showState('grid');
            }
        } catch (error) {
            console.error('❌ Error loading gear:', error);
            window.utils?.showNotification('Failed to load marketplace gear', 'error');
            this.showState('empty');
        }
    }

    renderGear() {
        const grid = document.getElementById('gearGrid');
        if (!grid) return;

        grid.innerHTML = this.gear.map(item => this.createGearCard(item)).join('');
    }

    createGearCard(item) {
        const fallbackImage = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
        const image = item.image || item.image_url || fallbackImage;
        
        // Build the studio link - if we have a studio_slug we use that, otherwise id
        const studioLink = `app.html?studio=${item.studio_id}`;
        
        return `
            <div class="gear-card bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden border border-gray-100 dark:border-white/5 flex flex-col">
                <div class="relative aspect-square overflow-hidden bg-gray-100 dark:bg-zinc-800">
                    <img src="${image}" alt="${item.name}" class="w-full h-full object-cover" loading="lazy">
                    <div class="absolute top-4 left-4">
                        <span class="px-3 py-1 bg-white/90 dark:bg-black/90 backdrop-blur-md text-[10px] font-black uppercase tracking-tighter rounded-full border border-gray-100 dark:border-white/10">
                            ${item.category || 'Gear'}
                        </span>
                    </div>
                </div>
                <div class="p-6 sm:p-8 flex-1 flex flex-col">
                    <div class="mb-4">
                        <h3 class="text-xl font-black leading-tight mb-2 tracking-tight">${item.brand ? item.brand + ' ' : ''}${item.name || item.model}</h3>
                        <p class="text-sm text-gray-400 font-medium leading-relaxed">${item.description || 'Professional grade equipment'}</p>
                    </div>
                    
                    <div class="mt-auto pt-4 border-t dark:border-white/5">
                        <a href="${studioLink}" class="group flex items-center justify-between">
                            <div class="flex-1">
                                <p class="text-[10px] text-gray-400 font-black uppercase tracking-widest leading-none mb-1">Located at</p>
                                <p class="text-sm font-bold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors truncate">
                                    ${item.studio_name}
                                </p>
                            </div>
                            <div class="w-8 h-8 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center group-hover:bg-blue-600 transition-all">
                                <i class="fas fa-arrow-right text-xs text-gray-400 group-hover:text-white transition-colors"></i>
                            </div>
                        </a>
                    </div>
                </div>
            </div>
        `;
    }

    showState(state) {
        const loading = document.getElementById('loadingState');
        const grid = document.getElementById('gearGrid');
        const empty = document.getElementById('emptyState');

        if (loading) loading.classList.toggle('hidden', state !== 'loading');
        if (grid) grid.classList.toggle('hidden', state !== 'grid');
        if (empty) empty.classList.toggle('hidden', state !== 'empty');
    }
}


// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    const init = () => {
        window.marketplaceManager = new MarketplaceManager();
    };

    if (window.DB_READY) {
        window.DB_READY.then(init);
    } else {
        // Fallback for immediate initialization attempt
        const checkDB = setInterval(() => {
            if (window.db && window.db.getEquipment) {
                clearInterval(checkDB);
                init();
            }
        }, 100);
    }


});
