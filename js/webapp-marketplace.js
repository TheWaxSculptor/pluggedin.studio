/**
 * Gear Marketplace Controller for PluggedIn Studio
 * Handles fetching, filtering, and displaying equipment from all studios.
 */

class MarketplaceManager {
    constructor() {
        this.gear = [];
        this.filters = {
            search: '',
            category: 'all',
            status: 'all' // Added for marketplace filtering
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
                
                // Clear status filter when category is picked, or keep it? 
                // Let's allow cross-filtering
                
                this.updateChipUI();
                this.loadGear();
            });
        });

        // Status Chips (For Sale / For Rent)
        const statusChips = document.querySelectorAll('.status-chip');
        statusChips.forEach(chip => {
            chip.addEventListener('click', () => {
                const status = chip.dataset.status;
                
                // Toggle logic
                if (this.filters.status === status) {
                    this.filters.status = 'all';
                } else {
                    this.filters.status = status;
                }
                
                this.updateChipUI();
                this.loadGear();
            });
        });


        // Theme Toggle Support (Standardized)
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                const isDark = document.documentElement.classList.toggle('dark');
                if (isDark) {
                    document.body.classList.add('dark-mode');
                } else {
                    document.body.classList.remove('dark-mode');
                }
                
                // Update icons
                const moonIcon = document.getElementById('moonIcon');
                const sunIcon = document.getElementById('sunIcon');
                if (moonIcon && sunIcon) {
                    moonIcon.classList.toggle('hidden', isDark);
                    sunIcon.classList.toggle('hidden', !isDark);
                }
                
                localStorage.setItem('theme', isDark ? 'dark' : 'light');
            });
        }
    }

    updateChipUI() {
        // Update Categories
        document.querySelectorAll('.category-chip').forEach(chip => {
            if (chip.dataset.cat === this.filters.category) {
                chip.classList.add('bg-black', 'text-white');
                chip.classList.remove('bg-white', 'dark:bg-zinc-900', 'text-gray-900', 'dark:text-white');
            } else {
                chip.classList.remove('bg-black', 'text-white');
                chip.classList.add('bg-white', 'dark:bg-zinc-900', 'text-gray-900', 'dark:text-white');
            }
        });

        // Update Status
        document.querySelectorAll('.status-chip').forEach(chip => {
            if (chip.dataset.status === this.filters.status) {
                const colorClass = this.filters.status === 'for_sale' ? 'bg-green-600' : 'bg-blue-600';
                chip.classList.add(colorClass, 'text-white');
                chip.classList.remove('bg-white', 'dark:bg-zinc-900');
            } else {
                chip.classList.remove('bg-green-600', 'bg-blue-600', 'text-white');
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
            
            // Client-side marketplace filtering since schema doesn't have status columns yet
            if (this.filters.status !== 'all') {
                this.gear = this.gear.filter(item => {
                    const desc = item.description || '';
                    if (this.filters.status === 'for_sale') return desc.match(/\[FOR SALE:?/i);
                    if (this.filters.status === 'for_rent') return desc.match(/\[FOR RENT:?/i);
                    return true;
                });
            }

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
        
        // Parse metadata from description if present
        let displayDesc = item.description || 'Professional grade equipment';
        let marketplaceBadge = '';
        let priceDisplay = '';

        const saleMatch = displayDesc.match(/\[FOR SALE:?\s*\$([\d,]+)\]/i);
        const rentMatch = displayDesc.match(/\[FOR RENT:?\s*\$([\d,]+)(\/day)?\]/i);

        if (saleMatch) {
            marketplaceBadge = '<span class="px-2 py-0.5 bg-green-500 text-white text-[10px] font-black uppercase rounded-full ml-2">For Sale</span>';
            priceDisplay = `<p class="text-xl font-black text-green-600 dark:text-green-400 mt-2">$${saleMatch[1]}</p>`;
            displayDesc = displayDesc.replace(saleMatch[0], '').trim();
        } else if (rentMatch) {
            marketplaceBadge = '<span class="px-2 py-0.5 bg-blue-500 text-white text-[10px] font-black uppercase rounded-full ml-2">For Rent</span>';
            priceDisplay = `<p class="text-xl font-black text-blue-600 dark:text-blue-400 mt-2">$${rentMatch[1]}<span class="text-xs font-medium text-gray-500">/day</span></p>`;
            displayDesc = displayDesc.replace(rentMatch[0], '').trim();
        }

        const studioLink = `app.html?studio=${item.studio_id}`;
        
        return `
            <div class="gear-card bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden border border-gray-100 dark:border-white/5 flex flex-col group transition-all hover:shadow-2xl hover:-translate-y-1">
                <div class="relative aspect-square overflow-hidden bg-gray-100 dark:bg-zinc-800">
                    <img src="${image}" alt="${item.name}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy">
                    <div class="absolute top-4 left-4 flex items-center">
                        <span class="px-3 py-1 bg-white/90 dark:bg-black/90 backdrop-blur-md text-[10px] font-black uppercase tracking-tighter rounded-full border border-gray-100 dark:border-white/10">
                            ${item.category || 'Gear'}
                        </span>
                        ${marketplaceBadge}
                    </div>
                </div>
                <div class="p-6 sm:p-8 flex-1 flex flex-col">
                    <div class="mb-4">
                        <h3 class="text-xl font-black leading-tight mb-2 tracking-tight">${item.brand ? item.brand + ' ' : ''}${item.name || item.model}</h3>
                        <p class="text-sm text-gray-400 font-medium leading-relaxed line-clamp-2">${displayDesc}</p>
                        ${priceDisplay}
                    </div>
                    
                    <div class="mt-auto pt-4 border-t dark:border-white/5">
                        <a href="${studioLink}" class="group/studio flex items-center justify-between">
                            <div class="flex-1">
                                <p class="text-[10px] text-gray-400 font-black uppercase tracking-widest leading-none mb-1">Located at</p>
                                <p class="text-sm font-bold text-gray-900 dark:text-white group-hover/studio:text-blue-600 transition-colors truncate">
                                    ${item.studio_name}
                                </p>
                            </div>
                            <div class="w-8 h-8 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center group-hover/studio:bg-blue-600 transition-all">
                                <i class="fas fa-arrow-right text-xs text-gray-400 group-hover/studio:text-white transition-colors"></i>
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
