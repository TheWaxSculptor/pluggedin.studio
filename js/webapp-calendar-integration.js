/**
 * PluggedIn.studio - Calendar Integration Module
 * Connects the AvailabilityCalendar component with the main app functionality
 * Handles the integration between Supabase data, booking workflow and calendar display
 */

class CalendarIntegration {
    constructor() {
        this.availabilityCalendar = null;
        this.featuredStudioId = null;
        this.featuredStudio = null;
        this.topStudios = [];
        this.init();
    }

    /**
     * Initialize the calendar integration
     */
    async init() {
        // Set up event listeners after DOM is fully loaded
        document.addEventListener('DOMContentLoaded', () => {
            this.setupEventListeners();
            this.loadFeaturedStudio();
            this.loadTopBookedStudios();
        });
    }

    /**
     * Set up event listeners for the calendar integration
     */
    setupEventListeners() {
        const viewAvailabilityBtn = document.getElementById('viewAvailabilityBtn');
        if (viewAvailabilityBtn) {
            viewAvailabilityBtn.addEventListener('click', () => this.showAvailabilityCalendar());
        }

        // Listen for booking-related events
        document.addEventListener('timeSlotSelected', (e) => {
            // Forward the event to the booking manager
            const bookingEvent = new CustomEvent('initiate-booking', {
                detail: {
                    studio: this.featuredStudio,
                    selectedDate: e.detail.date,
                    selectedTime: e.detail.time,
                    duration: e.detail.duration,
                    price: e.detail.price
                }
            });
            document.dispatchEvent(bookingEvent);
        });
    }

    /**
     * Load the featured studio for quick booking
     */
    async loadFeaturedStudio() {
        try {
            // Get a random featured studio from the database
            let studios = [];
            
            try {
                // Try to get studios from Supabase
                studios = await window.db.getStudios({ limit: 5, featured: true });
            } catch (error) {
                console.warn('Error loading studios from Supabase:', error);
                // Fallback to sample data
                studios = this.getSampleStudios();
            }
            
            if (studios && studios.length > 0) {
                // Select a random studio from the featured ones
                this.featuredStudio = studios[Math.floor(Math.random() * studios.length)];
                this.featuredStudioId = this.featuredStudio.id;
                
                // Update the UI
                this.updateFeaturedStudioUI(this.featuredStudio);
            } else {
                console.warn('No featured studios found');
                // Use a fallback studio
                this.featuredStudio = this.getSampleStudios()[0];
                this.updateFeaturedStudioUI(this.featuredStudio);
            }
        } catch (error) {
            console.error('Error in loadFeaturedStudio:', error);
            // Use a fallback studio
            this.featuredStudio = this.getSampleStudios()[0];
            this.updateFeaturedStudioUI(this.featuredStudio);
        }
    }
    
    /**
     * Update the featured studio UI elements
     */
    updateFeaturedStudioUI(studio) {
        if (!studio) return;
        
        const nameEl = document.getElementById('featuredStudioName');
        const descEl = document.getElementById('featuredStudioDesc');
        const imgEl = document.getElementById('featuredStudioImg');
        const ratingEl = document.getElementById('featuredStudioRating');
        const priceEl = document.getElementById('featuredStudioPrice');
        
        if (nameEl) nameEl.textContent = studio.name;
        if (descEl) descEl.textContent = studio.description || 'Professional recording space with top equipment';
        if (imgEl && studio.images && studio.images.length > 0) {
            imgEl.src = studio.images[0];
            imgEl.alt = `${studio.name} studio`;
        }
        
        if (ratingEl) {
            const rating = studio.rating || 4.8;
            const reviewCount = studio.review_count || Math.floor(Math.random() * 100) + 20;
            ratingEl.textContent = `${rating} (${reviewCount} reviews)`;
        }
        
        if (priceEl) {
            const hourlyRate = studio.hourly_rate || 45;
            priceEl.textContent = `From $${hourlyRate}/hour`;
        }
    }
    
    /**
     * Show the availability calendar for the selected studio
     */
    showAvailabilityCalendar() {
        if (!this.featuredStudioId) {
            utils.showNotification('No studio selected. Please try again.', 'error');
            return;
        }
        
        const container = document.getElementById('availabilityCalendarContainer');
        if (!container) return;
        
        // Clear any existing content
        container.innerHTML = '';
        
        // Create placeholder for calendar
        const calendarEl = document.createElement('div');
        calendarEl.id = 'studioCalendar';
        calendarEl.className = 'w-full';
        container.appendChild(calendarEl);
        
        // Initialize the availability calendar
        this.availabilityCalendar = new AvailabilityCalendar();
        this.availabilityCalendar.init(this.featuredStudioId, calendarEl);
        
        // Scroll to the calendar
        container.scrollIntoView({ behavior: 'smooth' });
    }
    
    /**
     * Load the top booked studios
     */
    async loadTopBookedStudios() {
        try {
            const container = document.getElementById('topBookedStudios');
            if (!container) return;
            
            // Try to get booking data from Supabase
            let bookings = [];
            try {
                bookings = await window.db.getBookings({ limit: 50 });
            } catch (error) {
                console.warn('Error loading bookings from Supabase:', error);
            }
            
            // Get the most frequently booked studios
            const studioBookingCounts = {};
            bookings.forEach(booking => {
                const studioId = booking.studio_id;
                studioBookingCounts[studioId] = (studioBookingCounts[studioId] || 0) + 1;
            });
            
            // Sort studios by booking count
            const sortedStudioIds = Object.keys(studioBookingCounts).sort((a, b) => {
                return studioBookingCounts[b] - studioBookingCounts[a];
            });
            
            // Get top 3 studios
            let topStudios = [];
            if (sortedStudioIds.length > 0) {
                // Get all studios
                const allStudios = await window.db.getStudios();
                
                // Filter for top booked studios
                topStudios = sortedStudioIds
                    .slice(0, 3)
                    .map(id => allStudios.find(s => s.id === id))
                    .filter(s => s); // Remove any undefined studios
            }
            
            // If we couldn't get real data, use sample data
            if (topStudios.length === 0) {
                topStudios = this.getSampleStudios().slice(0, 3);
            }
            
            // Store for later use
            this.topStudios = topStudios;
            
            // Render the studios
            this.renderTopBookedStudios(topStudios);
            
        } catch (error) {
            console.error('Error in loadTopBookedStudios:', error);
            // Render sample studios as fallback
            this.renderTopBookedStudios(this.getSampleStudios().slice(0, 3));
        }
    }
    
    /**
     * Render the top booked studios in the UI
     */
    renderTopBookedStudios(studios) {
        const container = document.getElementById('topBookedStudios');
        if (!container) return;
        
        // Clear loading state
        container.innerHTML = '';
        
        // Render each studio
        studios.forEach(studio => {
            const studioCard = document.createElement('div');
            studioCard.className = 'bg-white rounded-lg shadow overflow-hidden';
            
            const image = studio.images && studio.images.length > 0 
                ? studio.images[0] 
                : 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80';
                
            studioCard.innerHTML = `
                <div class="relative pb-36 overflow-hidden">
                    <img class="absolute inset-0 h-full w-full object-cover" 
                         src="${image}" alt="${studio.name}">
                </div>
                <div class="p-4">
                    <h4 class="font-semibold text-gray-900">${studio.name}</h4>
                    <div class="flex items-center mt-1">
                        <div class="flex items-center">
                            <svg class="w-3 h-3 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                            </svg>
                            <span class="text-xs text-gray-700 ml-1">${studio.rating || 4.8}</span>
                        </div>
                        <span class="mx-1 text-gray-500 text-xs">•</span>
                        <span class="text-xs text-gray-700">$${studio.hourly_rate || 45}/hr</span>
                    </div>
                    <button class="mt-2 text-sm text-black hover:underline book-studio-btn" 
                            data-studio-id="${studio.id}">
                        View details
                    </button>
                </div>
            `;
            
            // Add click handler for each studio card
            studioCard.querySelector('.book-studio-btn').addEventListener('click', () => {
                // Redirect to studio detail page or show modal
                window.location.href = `studio.html?id=${studio.id}`;
            });
            
            container.appendChild(studioCard);
        });
    }
    
    /**
     * Get sample studios for fallback when Supabase is unavailable
     */
    getSampleStudios() {
        return [
            {
                id: 'studio-1',
                name: 'Soundwave Recording Studio',
                description: 'Professional recording space with top-of-the-line equipment for musicians and producers.',
                location: 'Los Angeles, CA',
                images: ['https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?ixlib=rb-1.2.1&auto=format&fit=crop&w=2000&q=80'],
                rating: 4.9,
                review_count: 124,
                hourly_rate: 65,
                amenities: ['Pro Tools', 'Parking', 'Live Room', 'Mixing Console'],
                tags: ['professional', 'mixing', 'mastering', 'vocal-recording']
            },
            {
                id: 'studio-2',
                name: 'Home Studio Haven',
                description: 'Cozy home studio perfect for indie artists and small productions.',
                location: 'Portland, OR',
                images: ['https://images.unsplash.com/photo-1589903308904-1010c2294adc?ixlib=rb-1.2.1&auto=format&fit=crop&w=2000&q=80'],
                rating: 4.7,
                review_count: 86,
                hourly_rate: 30,
                amenities: ['Logic Pro', 'Vocal Booth', 'MIDI Keyboard'],
                tags: ['home-studio', 'indie', 'vocal-recording', 'production']
            },
            {
                id: 'studio-3',
                name: 'Vintage Vibes Studio',
                description: 'Classic studio with vintage equipment and analog recording capabilities.',
                location: 'Nashville, TN',
                images: ['https://images.unsplash.com/photo-1567794822507-eea6201aca8a?ixlib=rb-1.2.1&auto=format&fit=crop&w=2000&q=80'],
                rating: 4.8,
                review_count: 98,
                hourly_rate: 55,
                amenities: ['Analog Console', 'Vintage Mics', 'Tape Machine'],
                tags: ['professional', 'vintage-gear', 'analog']
            },
            {
                id: 'studio-4',
                name: 'Podcaster\'s Paradise',
                description: 'Specialized studio for podcast recording and production.',
                location: 'Austin, TX',
                images: ['https://images.unsplash.com/photo-1478737270239-2f02b77fc618?ixlib=rb-1.2.1&auto=format&fit=crop&w=2000&q=80'],
                rating: 4.6,
                review_count: 72,
                hourly_rate: 40,
                amenities: ['Multiple Mics', 'Soundproofing', 'Editing Suite'],
                tags: ['podcast', 'voiceover', 'production']
            },
            {
                id: 'studio-5',
                name: 'Bedroom Beats Lab',
                description: 'Modern home studio setup for beat-making and electronic music production.',
                location: 'Chicago, IL',
                images: ['https://images.unsplash.com/photo-1598653222000-6b7b7a552625?ixlib=rb-1.2.1&auto=format&fit=crop&w=2000&q=80'],
                rating: 4.5,
                review_count: 63,
                hourly_rate: 25,
                amenities: ['Ableton Live', 'MIDI Controllers', 'Synth Collection'],
                tags: ['home-studio', 'beats', 'electronic', 'production']
            }
        ];
    }
}

// Initialize the calendar integration
const calendarIntegration = new CalendarIntegration();

// Make it globally available
window.calendarIntegration = calendarIntegration;
