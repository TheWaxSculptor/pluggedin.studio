// Booking Module for PluggedIn Web App

class BookingManager {
    constructor() {
        this.selectedStudio = null;
        this.selectedDate = null;
        this.selectedTimeSlot = null;
        this.bookingData = {};
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Listen for booking initiation from studios module
        document.addEventListener('initiate-booking', (e) => {
            this.startBookingFlow(e.detail.studio);
        });
    }

    startBookingFlow(studio) {
        this.selectedStudio = studio;
        this.showBookingModal();
    }

    showBookingModal() {
        // Create booking modal dynamically
        const existingModal = document.getElementById('bookingModal');
        if (existingModal) {
            existingModal.remove();
        }

        const modal = this.createBookingModal();
        document.body.appendChild(modal);
        
        // Show the modal
        setTimeout(() => {
            modal.classList.remove('hidden');
        }, 10);

        this.setupBookingEventListeners();
        this.loadAvailableSlots();
    }

    createBookingModal() {
        const modal = document.createElement('div');
        modal.id = 'bookingModal';
        modal.className = 'hidden fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50';
        
        modal.innerHTML = `
            <div class="relative top-10 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 xl:w-1/2 shadow-lg rounded-md bg-white">
                <div class="mt-3">
                    <div class="flex justify-between items-center mb-6">
                        <h3 class="text-xl font-semibold text-gray-900">Book ${this.selectedStudio.name}</h3>
                        <button id="closeBookingModal" class="text-gray-400 hover:text-gray-600">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>
                    </div>
                    
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <!-- Studio Info -->
                        <div class="bg-gray-50 p-4 rounded-lg">
                            <h4 class="font-semibold mb-3">Studio Details</h4>
                            <div class="space-y-2 text-sm">
                                <p><span class="font-medium">Location:</span> ${this.selectedStudio.location || 'Not specified'}</p>
                                <p><span class="font-medium">Rate:</span> ${utils.formatCurrency(this.selectedStudio.hourly_rate || 0)}/hour</p>
                                <p><span class="font-medium">Capacity:</span> ${this.selectedStudio.capacity || 'Not specified'}</p>
                            </div>
                        </div>

                        <!-- Booking Form -->
                        <div>
                            <form id="bookingForm" class="space-y-4">
                                <div>
                                    <label for="bookingDate" class="block text-sm font-medium text-gray-700 mb-1">Select Date</label>
                                    <input type="date" id="bookingDate" required 
                                           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                           min="${new Date().toISOString().split('T')[0]}">
                                </div>

                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">Available Time Slots</label>
                                    <div id="timeSlots" class="grid grid-cols-2 gap-2">
                                        <div class="text-center text-gray-500 py-4">Select a date to see available times</div>
                                    </div>
                                </div>

                                <div>
                                    <label for="duration" class="block text-sm font-medium text-gray-700 mb-1">Duration (hours)</label>
                                    <select id="duration" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500">
                                        <option value="">Select duration</option>
                                        <option value="1">1 hour</option>
                                        <option value="2">2 hours</option>
                                        <option value="3">3 hours</option>
                                        <option value="4">4 hours</option>
                                        <option value="6">6 hours</option>
                                        <option value="8">8 hours</option>
                                    </select>
                                </div>

                                <div>
                                    <label for="notes" class="block text-sm font-medium text-gray-700 mb-1">Special Requirements (Optional)</label>
                                    <textarea id="notes" rows="3" 
                                              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                              placeholder="Any special requirements or notes..."></textarea>
                                </div>

                                <!-- Booking Summary -->
                                <div id="bookingSummary" class="hidden bg-blue-50 p-4 rounded-lg">
                                    <h5 class="font-medium text-blue-900 mb-2">Booking Summary</h5>
                                    <div id="summaryContent" class="text-sm text-blue-800"></div>
                                </div>

                                <div class="flex justify-end space-x-3 pt-4">
                                    <button type="button" id="cancelBooking" 
                                            class="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50">
                                        Cancel
                                    </button>
                                    <button type="submit" id="confirmBooking" 
                                            class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
                                        Confirm Booking
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;

        return modal;
    }

    setupBookingEventListeners() {
        // Close modal
        const closeBtn = document.getElementById('closeBookingModal');
        const cancelBtn = document.getElementById('cancelBooking');
        
        if (closeBtn) closeBtn.addEventListener('click', () => this.hideBookingModal());
        if (cancelBtn) cancelBtn.addEventListener('click', () => this.hideBookingModal());

        // Date change
        const dateInput = document.getElementById('bookingDate');
        if (dateInput) {
            dateInput.addEventListener('change', () => this.loadAvailableSlots());
        }

        // Duration change
        const durationSelect = document.getElementById('duration');
        if (durationSelect) {
            durationSelect.addEventListener('change', () => this.updateBookingSummary());
        }

        // Form submission
        const bookingForm = document.getElementById('bookingForm');
        if (bookingForm) {
            bookingForm.addEventListener('submit', (e) => this.handleBookingSubmit(e));
        }

        // Close modal when clicking outside
        const modal = document.getElementById('bookingModal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideBookingModal();
                }
            });
        }
    }

    async loadAvailableSlots() {
        const dateInput = document.getElementById('bookingDate');
        const timeSlotsContainer = document.getElementById('timeSlots');
        
        if (!dateInput || !timeSlotsContainer || !dateInput.value) {
            return;
        }

        this.selectedDate = dateInput.value;
        
        // Show loading state
        timeSlotsContainer.innerHTML = '<div class="col-span-2 text-center text-gray-500 py-4">Loading available times...</div>';

        try {
            // Generate time slots (in a real app, this would come from the database)
            const timeSlots = this.generateTimeSlots();
            this.renderTimeSlots(timeSlots);
        } catch (error) {
            console.error('Error loading time slots:', error);
            timeSlotsContainer.innerHTML = '<div class="col-span-2 text-center text-red-500 py-4">Error loading time slots</div>';
        }
    }

    generateTimeSlots() {
        // Generate hourly slots from 9 AM to 9 PM
        const slots = [];
        for (let hour = 9; hour <= 21; hour++) {
            const time = `${hour.toString().padStart(2, '0')}:00`;
            const displayTime = new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
            
            // Randomly mark some slots as unavailable for demo
            const isAvailable = Math.random() > 0.3;
            
            slots.push({
                time,
                displayTime,
                isAvailable
            });
        }
        return slots;
    }

    renderTimeSlots(slots) {
        const timeSlotsContainer = document.getElementById('timeSlots');
        if (!timeSlotsContainer) return;

        timeSlotsContainer.innerHTML = slots.map(slot => `
            <button type="button" 
                    class="time-slot p-2 text-sm border rounded-md transition-colors ${
                        slot.isAvailable 
                            ? 'border-gray-300 hover:border-blue-500 hover:bg-blue-50' 
                            : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                    }" 
                    data-time="${slot.time}"
                    ${!slot.isAvailable ? 'disabled' : ''}>
                ${slot.displayTime}
                ${!slot.isAvailable ? '<br><span class="text-xs">Unavailable</span>' : ''}
            </button>
        `).join('');

        // Add click listeners to available slots
        timeSlotsContainer.querySelectorAll('.time-slot:not([disabled])').forEach(button => {
            button.addEventListener('click', () => this.selectTimeSlot(button));
        });
    }

    selectTimeSlot(button) {
        // Remove previous selection
        document.querySelectorAll('.time-slot').forEach(btn => {
            btn.classList.remove('bg-blue-500', 'text-white', 'border-blue-500');
        });

        // Add selection to clicked button
        button.classList.add('bg-blue-500', 'text-white', 'border-blue-500');
        
        this.selectedTimeSlot = button.dataset.time;
        this.updateBookingSummary();
    }

    updateBookingSummary() {
        const duration = document.getElementById('duration').value;
        const summaryContainer = document.getElementById('bookingSummary');
        const summaryContent = document.getElementById('summaryContent');

        if (!this.selectedDate || !this.selectedTimeSlot || !duration) {
            if (summaryContainer) summaryContainer.classList.add('hidden');
            return;
        }

        const startTime = new Date(`${this.selectedDate}T${this.selectedTimeSlot}`);
        const endTime = new Date(startTime.getTime() + (parseInt(duration) * 60 * 60 * 1000));
        const totalCost = (this.selectedStudio.hourly_rate || 0) * parseInt(duration);

        if (summaryContainer && summaryContent) {
            summaryContainer.classList.remove('hidden');
            summaryContent.innerHTML = `
                <div class="space-y-1">
                    <p><span class="font-medium">Date:</span> ${utils.formatDate(startTime)}</p>
                    <p><span class="font-medium">Time:</span> ${utils.formatTime(startTime)} - ${utils.formatTime(endTime)}</p>
                    <p><span class="font-medium">Duration:</span> ${duration} hour${duration > 1 ? 's' : ''}</p>
                    <p><span class="font-medium">Total Cost:</span> ${utils.formatCurrency(totalCost)}</p>
                </div>
            `;
        }
    }

    async handleBookingSubmit(e) {
        e.preventDefault();

        if (!window.authManager || !window.authManager.isAuthenticated()) {
            utils.showNotification('Please sign in to complete booking', 'error');
            return;
        }

        const duration = document.getElementById('duration').value;
        const notes = document.getElementById('notes').value;

        if (!this.selectedDate || !this.selectedTimeSlot || !duration) {
            utils.showNotification('Please select date, time, and duration', 'error');
            return;
        }

        const confirmBtn = document.getElementById('confirmBooking');
        if (confirmBtn) {
            confirmBtn.disabled = true;
            confirmBtn.textContent = 'Processing...';
        }

        try {
            const startTime = new Date(`${this.selectedDate}T${this.selectedTimeSlot}`);
            const endTime = new Date(startTime.getTime() + (parseInt(duration) * 60 * 60 * 1000));
            const totalCost = (this.selectedStudio.hourly_rate || 0) * parseInt(duration);

            const bookingData = {
                studio_id: this.selectedStudio.id,
                user_id: window.authManager.getCurrentUser().id,
                start_time: startTime.toISOString(),
                end_time: endTime.toISOString(),
                duration_hours: parseInt(duration),
                total_cost: totalCost,
                status: 'pending',
                notes: notes || null,
                created_at: new Date().toISOString()
            };

            // Create booking in database
            const booking = await db.createBooking(bookingData);
            
            utils.showNotification('Booking created successfully!', 'success');
            this.hideBookingModal();
            
            // Optionally redirect to bookings page or show confirmation
            this.showBookingConfirmation(booking);

        } catch (error) {
            console.error('Error creating booking:', error);
            utils.showNotification('Error creating booking. Please try again.', 'error');
        } finally {
            if (confirmBtn) {
                confirmBtn.disabled = false;
                confirmBtn.textContent = 'Confirm Booking';
            }
        }
    }

    showBookingConfirmation(booking) {
        // Create a simple confirmation modal
        const confirmationModal = document.createElement('div');
        confirmationModal.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50';
        
        confirmationModal.innerHTML = `
            <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                <div class="mt-3 text-center">
                    <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                        <svg class="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                    </div>
                    <h3 class="text-lg leading-6 font-medium text-gray-900 mt-4">Booking Confirmed!</h3>
                    <div class="mt-2 px-7 py-3">
                        <p class="text-sm text-gray-500">
                            Your booking has been confirmed. You'll receive a confirmation email shortly.
                        </p>
                    </div>
                    <div class="items-center px-4 py-3">
                        <button id="closeConfirmation" 
                                class="px-4 py-2 bg-green-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-green-600">
                            OK
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(confirmationModal);

        // Close confirmation
        const closeBtn = confirmationModal.querySelector('#closeConfirmation');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                confirmationModal.remove();
            });
        }

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (confirmationModal.parentNode) {
                confirmationModal.remove();
            }
        }, 5000);
    }

    hideBookingModal() {
        const modal = document.getElementById('bookingModal');
        if (modal) {
            modal.remove();
        }
        
        // Reset booking state
        this.selectedDate = null;
        this.selectedTimeSlot = null;
        this.bookingData = {};
    }
}

// Initialize booking manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.bookingManager = new BookingManager();
});
/**
 * PluggedIn.studio - Availability Calendar Component
 * Provides real-time studio availability checking for both professional and home studios
 */

class AvailabilityCalendar {
    constructor() {
        this.currentDate = new Date();
        this.selectedDate = null;
        this.availableSlots = new Map();
        this.studioId = null;
    }

    /**
     * Initialize the calendar for a specific studio
     * @param {string} studioId - The studio ID to check availability for
     * @param {HTMLElement} container - The container element to render the calendar
     */
    init(studioId, container) {
        this.studioId = studioId;
        this.container = container;
        this.loadAvailability();
        this.render();
    }

    /**
     * Load availability data from Supabase
     */
    async loadAvailability() {
        try {
            // Get availability data for the next 30 days
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + 30);

            const { data: availability, error } = await window.supabase
                .from('availabilities')
                .select('*')
                .eq('studio_id', this.studioId)
                .gte('date', this.currentDate.toISOString().split('T')[0])
                .lte('date', endDate.toISOString().split('T')[0]);

            if (error) {
                console.warn('Could not load availability data:', error);
                this.generateSampleAvailability();
                return;
            }

            // Process availability data
            availability.forEach(slot => {
                const dateKey = slot.date;
                if (!this.availableSlots.has(dateKey)) {
                    this.availableSlots.set(dateKey, []);
                }
                this.availableSlots.get(dateKey).push({
                    time: slot.start_time,
                    duration: slot.duration_hours,
                    price: slot.price_per_hour,
                    available: slot.is_available
                });
            });

        } catch (error) {
            console.warn('Error loading availability:', error);
            this.generateSampleAvailability();
        }
    }

    /**
     * Generate sample availability data for demonstration
     */
    generateSampleAvailability() {
        const timeSlots = ['09:00', '11:00', '13:00', '15:00', '17:00', '19:00'];
        const prices = [45, 60, 75, 50, 65];

        for (let i = 0; i < 30; i++) {
            const date = new Date();
            date.setDate(date.getDate() + i);
            const dateKey = date.toISOString().split('T')[0];

            const daySlots = [];
            timeSlots.forEach(time => {
                // Random availability (80% chance of being available)
                const available = Math.random() > 0.2;
                if (available) {
                    daySlots.push({
                        time: time,
                        duration: Math.random() > 0.5 ? 2 : 4, // 2 or 4 hour slots
                        price: prices[Math.floor(Math.random() * prices.length)],
                        available: true
                    });
                }
            });

            this.availableSlots.set(dateKey, daySlots);
        }
    }

    /**
     * Render the calendar interface
     */
    render() {
        if (!this.container) return;

        this.container.innerHTML = `
            <div class="availability-calendar bg-white rounded-lg border border-gray-200 p-4">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-lg font-semibold text-gray-900">Studio Availability</h3>
                    <div class="flex items-center space-x-2">
                        <button id="prevMonth" class="p-2 hover:bg-gray-100 rounded-md" aria-label="Previous month">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                            </svg>
                        </button>
                        <span id="currentMonth" class="text-sm font-medium text-gray-700"></span>
                        <button id="nextMonth" class="p-2 hover:bg-gray-100 rounded-md" aria-label="Next month">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                            </svg>
                        </button>
                    </div>
                </div>

                <div class="grid grid-cols-7 gap-1 mb-4">
                    <div class="text-xs font-medium text-gray-500 text-center py-2">Sun</div>
                    <div class="text-xs font-medium text-gray-500 text-center py-2">Mon</div>
                    <div class="text-xs font-medium text-gray-500 text-center py-2">Tue</div>
                    <div class="text-xs font-medium text-gray-500 text-center py-2">Wed</div>
                    <div class="text-xs font-medium text-gray-500 text-center py-2">Thu</div>
                    <div class="text-xs font-medium text-gray-500 text-center py-2">Fri</div>
                    <div class="text-xs font-medium text-gray-500 text-center py-2">Sat</div>
                </div>

                <div id="calendarDays" class="grid grid-cols-7 gap-1 mb-4"></div>

                <div id="timeSlots" class="space-y-2">
                    <p class="text-sm text-gray-500">Select a date to see available time slots</p>
                </div>

                <div class="mt-4 pt-4 border-t border-gray-200">
                    <div class="flex items-center justify-between text-xs text-gray-500">
                        <div class="flex items-center space-x-4">
                            <div class="flex items-center">
                                <div class="w-3 h-3 bg-green-100 border border-green-300 rounded mr-2"></div>
                                <span>Available</span>
                            </div>
                            <div class="flex items-center">
                                <div class="w-3 h-3 bg-red-100 border border-red-300 rounded mr-2"></div>
                                <span>Booked</span>
                            </div>
                        </div>
                        <span>Prices from $45/hour</span>
                    </div>
                </div>
            </div>
        `;

        this.renderCalendarDays();
        this.attachEventListeners();
    }

    /**
     * Render the calendar days
     */
    renderCalendarDays() {
        const calendarDays = this.container.querySelector('#calendarDays');
        const currentMonth = this.container.querySelector('#currentMonth');
        
        if (!calendarDays || !currentMonth) return;

        currentMonth.textContent = this.currentDate.toLocaleDateString('en-US', { 
            month: 'long', 
            year: 'numeric' 
        });

        const firstDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
        const lastDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());

        let daysHTML = '';
        for (let i = 0; i < 42; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);
            
            const dateKey = date.toISOString().split('T')[0];
            const slots = this.availableSlots.get(dateKey) || [];
            const availableSlots = slots.filter(slot => slot.available).length;
            
            const isCurrentMonth = date.getMonth() === this.currentDate.getMonth();
            const isToday = date.toDateString() === new Date().toDateString();
            const isSelected = this.selectedDate && date.toDateString() === this.selectedDate.toDateString();
            const isPast = date < new Date().setHours(0, 0, 0, 0);

            let dayClass = 'calendar-day p-2 text-center text-sm cursor-pointer rounded-md transition-colors ';
            
            if (!isCurrentMonth) {
                dayClass += 'text-gray-300 ';
            } else if (isPast) {
                dayClass += 'text-gray-400 cursor-not-allowed ';
            } else if (isSelected) {
                dayClass += 'bg-purple-600 text-white ';
            } else if (isToday) {
                dayClass += 'bg-purple-100 text-purple-800 font-semibold ';
            } else if (availableSlots > 0) {
                dayClass += 'hover:bg-green-50 text-gray-900 ';
            } else {
                dayClass += 'text-gray-400 ';
            }

            daysHTML += `
                <div class="${dayClass}" data-date="${dateKey}" ${isPast ? '' : 'tabindex="0"'}>
                    <div>${date.getDate()}</div>
                    ${availableSlots > 0 && isCurrentMonth && !isPast ? 
                        `<div class="w-1 h-1 bg-green-500 rounded-full mx-auto mt-1"></div>` : 
                        ''
                    }
                </div>
            `;
        }

        calendarDays.innerHTML = daysHTML;
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Month navigation
        const prevBtn = this.container.querySelector('#prevMonth');
        const nextBtn = this.container.querySelector('#nextMonth');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                this.currentDate.setMonth(this.currentDate.getMonth() - 1);
                this.renderCalendarDays();
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                this.currentDate.setMonth(this.currentDate.getMonth() + 1);
                this.renderCalendarDays();
            });
        }

        // Day selection
        this.container.addEventListener('click', (e) => {
            if (e.target.closest('.calendar-day')) {
                const dayElement = e.target.closest('.calendar-day');
                const dateKey = dayElement.dataset.date;
                
                if (dateKey && !dayElement.classList.contains('cursor-not-allowed')) {
                    this.selectedDate = new Date(dateKey);
                    this.renderCalendarDays();
                    this.renderTimeSlots(dateKey);
                }
            }
        });

        // Keyboard navigation
        this.container.addEventListener('keydown', (e) => {
            if (e.target.classList.contains('calendar-day') && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                e.target.click();
            }
        });
    }
        const slots = this.availableSlots.get(dateKey) || [];
        const availableSlots = slots.filter(slot => slot.available).length;
        
        const isCurrentMonth = date.getMonth() === this.currentDate.getMonth();
        const isToday = date.toDateString() === new Date().toDateString();
        const isSelected = this.selectedDate && date.toDateString() === this.selectedDate.toDateString();
        const isPast = date < new Date().setHours(0, 0, 0, 0);

        let dayClass = 'calendar-day p-2 text-center text-sm cursor-pointer rounded-md transition-colors ';
        
        if (!isCurrentMonth) {
            dayClass += 'text-gray-300 ';
        } else if (isPast) {
            dayClass += 'text-gray-400 cursor-not-allowed ';
        } else if (isSelected) {
            dayClass += 'bg-purple-600 text-white ';
        } else if (isToday) {
            dayClass += 'bg-purple-100 text-purple-800 font-semibold ';
        } else if (availableSlots > 0) {
            dayClass += 'hover:bg-green-50 text-gray-900 ';
            slot.addEventListener('click', () => {
                const time = slot.dataset.time;
                const price = slot.dataset.price;
                const duration = slot.dataset.duration;
                
                this.onTimeSlotSelected({
                    date: this.selectedDate,
                    time: time,
                    price: parseFloat(price),
                    duration: parseInt(duration)
                });
            });
        });
    }

    /**
     * Render available time slots for selected date
     */
    renderTimeSlots(dateKey) {
        const timeSlotsContainer = document.getElementById('timeSlots');
        if (!timeSlotsContainer) return;

        this.selectedDate = new Date(dateKey);
        const daySlots = this.availableSlots.get(dateKey) || [];
        
        // Create a complete list of all possible time slots for the day
        const allPossibleTimes = [
            '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', 
            '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
        ];
        
        // Mark which slots are available and which are booked
        const slotStatus = new Map();
        allPossibleTimes.forEach(time => {
            // Default all slots to unavailable
            slotStatus.set(time, { available: false, price: 0, duration: 0 });
        });
        
        // Update with actual availability data
        daySlots.forEach(slot => {
            slotStatus.set(slot.time, {
                available: slot.available,
                price: slot.price,
                duration: slot.duration
            });
        });

        let slotsHTML = '';
        if (daySlots.length === 0) {
            slotsHTML = `
                <div class="p-4 text-center">
                    <p class="text-gray-500">No available sessions on this date.</p>
                </div>
            `;
        } else {
            slotsHTML = `
                <div class="grid grid-cols-2 md:grid-cols-3 gap-3 p-4">
                    ${Array.from(slotStatus).map(([time, details]) => {
                        const isAvailable = details.available;
                        const timeClass = isAvailable ? 
                            "time-slot bg-white border border-gray-200 rounded-md p-3 cursor-pointer hover:bg-gray-50 transition-colors" : 
                            "time-slot bg-gray-100 border border-gray-200 rounded-md p-3 opacity-75 relative overflow-hidden";
                        
                        const priceDisplay = isAvailable ? `<span class="text-sm text-purple-600 font-semibold">$${details.price}/hr</span>` : '';
                        const durationDisplay = isAvailable ? `<div class="text-xs text-gray-500">${details.duration} hour session</div>` : '';
                        
                        // Create a crossed-out effect for unavailable slots
                        const crossOutElement = !isAvailable ? `
                            <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" class="z-10">
                                    <path d="M10 10 Q20 20 30 30" stroke="#ef4444" stroke-width="4" stroke-linecap="round"/>
                                    <path d="M30 10 Q20 20 10 30" stroke="#ef4444" stroke-width="4" stroke-linecap="round"/>
                                </svg>
                                <span class="absolute bottom-1 left-1/2 -translate-x-1/2 text-xs text-red-600 font-semibold bg-white bg-opacity-80 px-1 rounded shadow">Unavailable</span>
                            </div>` : '';
                        
                        const slotAttributes = isAvailable ? `
                            data-time="${time}"
                            data-price="${details.price}"
                            data-duration="${details.duration}"
                        ` : '';
                        
                        return `
                        <div 
                            class="${timeClass}"
                            ${slotAttributes}
                        >
                            <div class="flex justify-between items-center mb-1">
                                <span class="font-medium text-gray-900">${this.formatTime(time)}</span>
                                ${priceDisplay}
                            </div>
                            ${durationDisplay}
                            ${crossOutElement}
                        </div>
                        `;
                    }).join('')}
                </div>
            `;
        }

        timeSlotsContainer.innerHTML = `
            <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div class="px-4 py-3 bg-gray-50 border-b border-gray-200">
                    <h4 class="font-medium text-gray-900">Available Sessions for ${this.selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</h4>
                </div>
                ${slotsHTML}
            </div>
        `;
        
        // Add click handlers for time slots
        timeSlotsContainer.querySelectorAll('.time-slot[data-time]').forEach(slot => {
            slot.addEventListener('click', () => {
                const time = slot.dataset.time;
                const price = slot.dataset.price;
                const duration = slot.dataset.duration;
                
                this.onTimeSlotSelected({
                    date: this.selectedDate,
                    time: time,
                    price: parseFloat(price),
                    duration: parseInt(duration)
                });
            });
        });
    }
    
    /**
     * Format time string to AM/PM format
     */
    formatTime(timeString) {
        const hour = parseInt(timeString.split(':')[0]);
        if (hour < 12) {
            return `${hour === 0 ? 12 : hour}:00 AM`;
        } else {
            return `${hour === 12 ? 12 : hour - 12}:00 PM`;
        }
    }
    
    /**
     * Handle time slot selection
     */
    onTimeSlotSelected(booking) {
        // Emit custom event for booking selection
                        <span class="font-medium">${booking.date.toLocaleDateString()}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-600">Time:</span>
                        <span class="font-medium">${booking.time}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-600">Duration:</span>
                        <span class="font-medium">${booking.duration} hours</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-600">Rate:</span>
                        <span class="font-medium">$${booking.price}/hour</span>
                    </div>
                    <div class="flex justify-between border-t pt-3">
                        <span class="font-semibold">Total:</span>
                        <span class="font-semibold text-purple-600">$${booking.price * booking.duration}</span>
                    </div>
                </div>
                <div class="flex space-x-3">
                    <button id="cancelBooking" class="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
                        Cancel
                    </button>
                    <button id="confirmBooking" class="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700">
                        Book Now
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Handle modal actions
        modal.querySelector('#cancelBooking').addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        modal.querySelector('#confirmBooking').addEventListener('click', () => {
            // Here you would integrate with your booking system
            alert('Booking confirmed! You will be redirected to payment.');
            document.body.removeChild(modal);
        });

        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }
}

// Export for use in other modules
window.AvailabilityCalendar = AvailabilityCalendar;
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
/**
 * PluggedIn.studio - External Calendar Integration Module
 * Provides integration with external calendar and booking systems
 * Supports: Calendly, Square, Acuity/Squarespace, Google Calendar, Setmore, Picktime, Zoho, SimplyBook.me
 */

class ExternalCalendarIntegration {
    constructor() {
        this.currentProvider = null;
        this.providers = [
            { id: 'calendly', name: 'Calendly', icon: 'calendly.svg' },
            { id: 'square', name: 'Square Appointments', icon: 'square.svg' },
            { id: 'acuity', name: 'Acuity / Squarespace', icon: 'acuity.svg' },
            { id: 'google', name: 'Google Calendar', icon: 'google.svg' },
            { id: 'setmore', name: 'Setmore', icon: 'setmore.svg' },
            { id: 'picktime', name: 'Picktime', icon: 'picktime.svg' },
            { id: 'zoho', name: 'Zoho Bookings', icon: 'zoho.svg' },
            { id: 'simplybook', name: 'SimplyBook.me', icon: 'simplybook.svg' }
        ];
        this.init();
    }

    /**
     * Initialize the external calendar integration
     */
    init() {
        // Setup event listeners when DOM is loaded
        document.addEventListener('DOMContentLoaded', () => {
            // Add integration button to booking section if user is studio owner
            this.addIntegrationButton();
        });
    }

    /**
     * Add integration button to the booking section for studio owners
     */
    addIntegrationButton() {
        // Check if user is studio owner
        const currentUser = window.authManager?.getCurrentUser();
        const isStudioOwner = currentUser?.type === 'studio_owner';
        
        // Only show for studio owners
        if (!isStudioOwner) return;
        
        // Find the booking section
        const bookingSection = document.querySelector('.booking-section, section:has(#availabilityCalendarContainer)');
        if (!bookingSection) return;
        
        // Create integration button
        const integrationBtn = document.createElement('button');
        integrationBtn.id = 'externalCalendarBtn';
        integrationBtn.className = 'inline-flex items-center px-4 py-2 bg-gray-800 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-gray-700 active:bg-gray-900 focus:outline-none focus:border-gray-900 focus:shadow-outline-gray transition ease-in-out duration-150 mt-4';
        integrationBtn.innerHTML = `
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
            Connect External Calendar
        `;
        
        // Add button to the top of the booking section
        const title = bookingSection.querySelector('h2');
        if (title && title.parentNode) {
            title.parentNode.appendChild(integrationBtn);
        } else {
            bookingSection.prepend(integrationBtn);
        }
        
        // Add click handler
        integrationBtn.addEventListener('click', () => {
            this.showIntegrationModal();
        });
    }

    /**
     * Show modal for connecting external calendar providers
     */
    showIntegrationModal() {
        // Create modal element
        const modal = document.createElement('div');
        modal.id = 'calendarIntegrationModal';
        modal.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-labelledby', 'integrationModalTitle');
        
        // Create modal content
        modal.innerHTML = `
            <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                <div class="mt-3">
                    <div class="flex justify-between items-center mb-4">
                        <h3 id="integrationModalTitle" class="text-lg font-medium text-gray-900">Connect Calendar</h3>
                        <button id="closeIntegrationModal" class="text-gray-400 hover:text-gray-600" aria-label="Close modal">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>
                    </div>
                    
                    <p class="text-sm text-gray-600 mb-4">Connect your existing booking system to sync availability and manage bookings in one place.</p>
                    
                    <div class="space-y-3" id="providerList">
                        ${this.providers.map(provider => `
                            <button class="provider-btn w-full flex items-center p-3 border rounded-md hover:bg-gray-50 transition-colors" data-provider="${provider.id}">
                                <div class="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-gray-100 rounded-md mr-3">
                                    <span class="text-sm font-medium text-gray-800">${provider.name.charAt(0)}</span>
                                </div>
                                <div class="flex-grow">
                                    <div class="font-medium">${provider.name}</div>
                                    <div class="text-xs text-gray-500">Connect and sync your availability</div>
                                </div>
                                <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                                </svg>
                            </button>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
        
        // Add modal to the DOM
        document.body.appendChild(modal);
        
        // Setup event handlers
        modal.querySelector('#closeIntegrationModal').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        // Setup provider buttons
        modal.querySelectorAll('.provider-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const providerId = btn.dataset.provider;
                this.connectProvider(providerId);
                document.body.removeChild(modal);
            });
        });
        
        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }
    
    /**
     * Connect to a specific provider
     * @param {string} providerId - The ID of the provider to connect to
     */
    connectProvider(providerId) {
        const provider = this.providers.find(p => p.id === providerId);
        if (!provider) return;
        
        this.currentProvider = providerId;
        
        // Show different connection flow based on provider
        switch (providerId) {
            case 'google':
                this.initiateOAuthFlow(providerId, 'https://accounts.google.com/o/oauth2/auth');
                break;
            case 'calendly':
                this.showEmbedCodeInput(providerId);
                break;
            case 'square':
                this.initiateOAuthFlow(providerId, 'https://connect.squareup.com/oauth2/authorize');
                break;
            default:
                this.showConnectionInstructionsModal(providerId);
                break;
        }
    }
    
    /**
     * Initiate OAuth flow for providers that support it
     * @param {string} providerId - The ID of the provider
     * @param {string} authUrl - The OAuth authorization URL
     */
    initiateOAuthFlow(providerId, authUrl) {
        // Create a confirmation dialog
        const confirmDialog = document.createElement('div');
        confirmDialog.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50';
        confirmDialog.innerHTML = `
            <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                <div class="mt-3 text-center">
                    <h3 class="text-lg font-medium text-gray-900 mb-4">Connect to ${this.getProviderName(providerId)}</h3>
                    <p class="text-sm text-gray-600 mb-6">
                        You'll be redirected to ${this.getProviderName(providerId)} to authorize access to your calendar.
                        Only your availability will be shared with PluggedIn.studio.
                    </p>
                    <div class="flex justify-between mt-4">
                        <button id="cancelAuth" class="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
                            Cancel
                        </button>
                        <button id="continueAuth" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                            Continue to ${this.getProviderName(providerId)}
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(confirmDialog);
        
        // Setup event listeners
        confirmDialog.querySelector('#cancelAuth').addEventListener('click', () => {
            document.body.removeChild(confirmDialog);
        });
        
        confirmDialog.querySelector('#continueAuth').addEventListener('click', () => {
            document.body.removeChild(confirmDialog);
            
            // In a real implementation, we would redirect to the actual OAuth URL
            // with proper client_id, redirect_uri, and scope parameters
            // For demo purposes, we'll simulate a successful connection
            this.simulateSuccessfulConnection(providerId);
        });
    }
    
    /**
     * Show embed code input for providers like Calendly
     * @param {string} providerId - The ID of the provider
     */
    showEmbedCodeInput(providerId) {
        const embedDialog = document.createElement('div');
        embedDialog.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50';
        embedDialog.innerHTML = `
            <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                <div class="mt-3">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-lg font-medium text-gray-900">Connect ${this.getProviderName(providerId)}</h3>
                        <button id="closeEmbedDialog" class="text-gray-400 hover:text-gray-600">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>
                    </div>
                    <p class="text-sm text-gray-600 mb-4">
                        Paste your ${this.getProviderName(providerId)} embed code or share link below:
                    </p>
                    <div class="mb-4">
                        <textarea 
                            id="embedCode" 
                            rows="4" 
                            class="w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none"
                            placeholder="https://calendly.com/yourusername or <div class='calendly-inline-widget'..."></textarea>
                    </div>
                    <div class="flex justify-end">
                        <button id="saveEmbedCode" class="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800">
                            Connect
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(embedDialog);
        
        // Setup event listeners
        embedDialog.querySelector('#closeEmbedDialog').addEventListener('click', () => {
            document.body.removeChild(embedDialog);
        });
        
        embedDialog.querySelector('#saveEmbedCode').addEventListener('click', () => {
            const embedCode = embedDialog.querySelector('#embedCode').value.trim();
            if (embedCode) {
                // In a real implementation, we would validate and process the embed code
                // For demo purposes, we'll simulate a successful connection
                document.body.removeChild(embedDialog);
                this.simulateSuccessfulConnection(providerId);
            }
        });
    }
    
    /**
     * Show connection instructions for other providers
     * @param {string} providerId - The ID of the provider
     */
    showConnectionInstructionsModal(providerId) {
        const instructionsDialog = document.createElement('div');
        instructionsDialog.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50';
        instructionsDialog.innerHTML = `
            <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                <div class="mt-3">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-lg font-medium text-gray-900">Connect ${this.getProviderName(providerId)}</h3>
                        <button id="closeInstructionsDialog" class="text-gray-400 hover:text-gray-600">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>
                    </div>
                    <div class="space-y-4">
                        <p class="text-sm text-gray-600">
                            Follow these steps to connect your ${this.getProviderName(providerId)} account:
                        </p>
                        <ol class="list-decimal pl-5 text-sm text-gray-600 space-y-2">
                            <li>Log in to your ${this.getProviderName(providerId)} account</li>
                            <li>Go to Settings > API or Integrations</li>
                            <li>Generate an API key or OAuth credentials</li>
                            <li>Enter the API key below</li>
                        </ol>
                        <div class="mt-4">
                            <label for="apiKey" class="block text-sm font-medium text-gray-700">API Key</label>
                            <input 
                                type="text" 
                                id="apiKey" 
                                class="mt-1 w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none"
                                placeholder="Your API key">
                        </div>
                    </div>
                    <div class="flex justify-end mt-4">
                        <button id="saveApiKey" class="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800">
                            Connect
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(instructionsDialog);
        
        // Setup event listeners
        instructionsDialog.querySelector('#closeInstructionsDialog').addEventListener('click', () => {
            document.body.removeChild(instructionsDialog);
        });
        
        instructionsDialog.querySelector('#saveApiKey').addEventListener('click', () => {
            const apiKey = instructionsDialog.querySelector('#apiKey').value.trim();
            if (apiKey) {
                // In a real implementation, we would validate and store the API key securely
                // For demo purposes, we'll simulate a successful connection
                document.body.removeChild(instructionsDialog);
                this.simulateSuccessfulConnection(providerId);
            }
        });
    }
    
    /**
     * Simulate a successful connection to a provider
     * @param {string} providerId - The ID of the provider
     */
    simulateSuccessfulConnection(providerId) {
        // Show success message
        const successDialog = document.createElement('div');
        successDialog.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50';
        successDialog.innerHTML = `
            <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                <div class="mt-3 text-center">
                    <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                        <svg class="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                    </div>
                    <h3 class="text-lg leading-6 font-medium text-gray-900 mt-4">Connected Successfully!</h3>
                    <div class="mt-2 px-7 py-3">
                        <p class="text-sm text-gray-600">
                            Your ${this.getProviderName(providerId)} account is now connected. Your availability will be synced automatically.
                        </p>
                    </div>
                    <div class="items-center px-4 py-3">
                        <button id="closeSuccessDialog" 
                                class="px-4 py-2 bg-black text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-gray-800">
                            OK
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(successDialog);
        
        // Setup event listeners
        successDialog.querySelector('#closeSuccessDialog').addEventListener('click', () => {
            document.body.removeChild(successDialog);
            
            // Update UI to show connection status
            this.updateConnectionStatus(providerId);
        });
    }
    
    /**
     * Update UI to show connection status
     * @param {string} providerId - The ID of the connected provider
     */
    updateConnectionStatus(providerId) {
        // Update the integration button
        const integrationBtn = document.getElementById('externalCalendarBtn');
        if (integrationBtn) {
            integrationBtn.innerHTML = `
                <svg class="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                ${this.getProviderName(providerId)} Connected
            `;
        }
        
        // In a real implementation, we would store this connection in the database
        // and start syncing availability data
    }
    
    /**
     * Get the display name for a provider
     * @param {string} providerId - The ID of the provider
     * @returns {string} The display name of the provider
     */
    getProviderName(providerId) {
        const provider = this.providers.find(p => p.id === providerId);
        return provider ? provider.name : 'Unknown Provider';
    }
}

// Initialize the external calendar integration
const externalCalendarIntegration = new ExternalCalendarIntegration();

// Make it globally available
window.externalCalendarIntegration = externalCalendarIntegration;
/**
 * Calendar Integration Backend Service
 * Handles real API calls, OAuth flows, and webhook processing for external calendar systems
 */

class CalendarBackendService {
    constructor() {
        this.supabase = window.supabaseClient;
        this.baseUrl = window.location.origin;
    }

    /**
     * Initialize OAuth flow for a calendar platform
     */
    async initiateOAuth(platform, studioId) {
        try {
            const config = this.getOAuthConfig(platform);
            if (!config) {
                throw new Error(`OAuth not supported for ${platform}`);
            }

            // Store state for OAuth callback
            const state = this.generateState(studioId, platform);
            localStorage.setItem(`oauth_state_${state}`, JSON.stringify({
                studioId,
                platform,
                timestamp: Date.now()
            }));

            // Build OAuth URL
            const params = new URLSearchParams({
                client_id: config.clientId,
                redirect_uri: `${this.baseUrl}/oauth-callback.html`,
                scope: config.scope,
                state: state,
                response_type: 'code'
            });

            const authUrl = `${config.authUrl}?${params.toString()}`;
            
            // Open OAuth popup
            const popup = window.open(authUrl, 'oauth', 'width=500,height=600');
            
            return new Promise((resolve, reject) => {
                const checkClosed = setInterval(() => {
                    if (popup.closed) {
                        clearInterval(checkClosed);
                        // Check if we got the auth code
                        const result = localStorage.getItem(`oauth_result_${state}`);
                        if (result) {
                            localStorage.removeItem(`oauth_result_${state}`);
                            localStorage.removeItem(`oauth_state_${state}`);
                            resolve(JSON.parse(result));
                        } else {
                            reject(new Error('OAuth cancelled'));
                        }
                    }
                }, 1000);

                // Timeout after 5 minutes
                setTimeout(() => {
                    clearInterval(checkClosed);
                    if (!popup.closed) popup.close();
                    reject(new Error('OAuth timeout'));
                }, 300000);
            });

        } catch (error) {
            console.error('OAuth initiation error:', error);
            throw error;
        }
    }

    /**
     * Exchange OAuth code for access token
     */
    async exchangeOAuthCode(platform, code, state) {
        try {
            const config = this.getOAuthConfig(platform);
            const stateData = JSON.parse(localStorage.getItem(`oauth_state_${state}`) || '{}');

            const response = await fetch(config.tokenUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    client_id: config.clientId,
                    client_secret: config.clientSecret,
                    code: code,
                    redirect_uri: `${this.baseUrl}/oauth-callback.html`,
                    grant_type: 'authorization_code'
                })
            });

            const tokenData = await response.json();
            
            if (!response.ok) {
                throw new Error(tokenData.error_description || 'Token exchange failed');
            }

            // Store credentials securely in Supabase
            await this.storeIntegrationCredentials(stateData.studioId, platform, tokenData);

            return {
                success: true,
                platform,
                studioId: stateData.studioId
            };

        } catch (error) {
            console.error('OAuth code exchange error:', error);
            throw error;
        }
    }

    /**
     * Store integration credentials securely
     */
    async storeIntegrationCredentials(studioId, platform, credentials) {
        try {
            // Encrypt sensitive data before storing
            const encryptedCredentials = await this.encryptCredentials(credentials);

            const { error } = await this.supabase
                .from('studio_integrations')
                .upsert({
                    studio_id: studioId,
                    platform: platform,
                    credentials: encryptedCredentials,
                    status: 'active',
                    connected_at: new Date().toISOString(),
                    last_sync: null
                });

            if (error) throw error;

            // Test the connection
            await this.testConnection(studioId, platform);

        } catch (error) {
            console.error('Error storing credentials:', error);
            throw error;
        }
    }

    /**
     * Test connection to external calendar platform
     */
    async testConnection(studioId, platform) {
        try {
            const credentials = await this.getIntegrationCredentials(studioId, platform);
            if (!credentials) {
                throw new Error('No credentials found');
            }

            const testResult = await this.makeApiCall(platform, 'test', credentials);
            
            // Update integration status
            await this.supabase
                .from('studio_integrations')
                .update({
                    status: testResult.success ? 'active' : 'error',
                    last_tested: new Date().toISOString(),
                    error_message: testResult.error || null
                })
                .eq('studio_id', studioId)
                .eq('platform', platform);

            return testResult;

        } catch (error) {
            console.error('Connection test error:', error);
            throw error;
        }
    }

    /**
     * Sync availability data from external calendar
     */
    async syncAvailability(studioId, platform) {
        try {
            const credentials = await this.getIntegrationCredentials(studioId, platform);
            if (!credentials) {
                throw new Error('No credentials found');
            }

            const availabilityData = await this.makeApiCall(platform, 'availability', credentials);
            
            // Process and store availability data
            const processedData = this.processAvailabilityData(platform, availabilityData);
            
            // Update local availability records
            await this.updateLocalAvailability(studioId, processedData);

            // Update last sync timestamp
            await this.supabase
                .from('studio_integrations')
                .update({
                    last_sync: new Date().toISOString(),
                    sync_status: 'success'
                })
                .eq('studio_id', studioId)
                .eq('platform', platform);

            return {
                success: true,
                recordsProcessed: processedData.length
            };

        } catch (error) {
            console.error('Sync error:', error);
            
            // Update sync status
            await this.supabase
                .from('studio_integrations')
                .update({
                    sync_status: 'error',
                    error_message: error.message
                })
                .eq('studio_id', studioId)
                .eq('platform', platform);

            throw error;
        }
    }

    /**
     * Create booking on external platform
     */
    async createExternalBooking(studioId, platform, bookingData) {
        try {
            const credentials = await this.getIntegrationCredentials(studioId, platform);
            if (!credentials) {
                throw new Error('No credentials found');
            }

            const result = await this.makeApiCall(platform, 'create_booking', credentials, bookingData);
            
            return result;

        } catch (error) {
            console.error('External booking creation error:', error);
            throw error;
        }
    }

    /**
     * Handle incoming webhooks from external platforms
     */
    async handleWebhook(platform, payload, signature) {
        try {
            // Verify webhook signature
            if (!this.verifyWebhookSignature(platform, payload, signature)) {
                throw new Error('Invalid webhook signature');
            }

            const processedData = this.processWebhookData(platform, payload);
            
            // Update local data based on webhook
            await this.processWebhookUpdate(processedData);

            return { success: true };

        } catch (error) {
            console.error('Webhook processing error:', error);
            throw error;
        }
    }

    /**
     * Get OAuth configuration for platform
     */
    getOAuthConfig(platform) {
        const configs = {
            calendly: {
                clientId: process.env.CALENDLY_CLIENT_ID,
                clientSecret: process.env.CALENDLY_CLIENT_SECRET,
                authUrl: 'https://auth.calendly.com/oauth/authorize',
                tokenUrl: 'https://auth.calendly.com/oauth/token',
                scope: 'default'
            },
            google_calendar: {
                clientId: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
                tokenUrl: 'https://oauth2.googleapis.com/token',
                scope: 'https://www.googleapis.com/auth/calendar'
            },
            square: {
                clientId: process.env.SQUARE_CLIENT_ID,
                clientSecret: process.env.SQUARE_CLIENT_SECRET,
                authUrl: 'https://connect.squareup.com/oauth2/authorize',
                tokenUrl: 'https://connect.squareup.com/oauth2/token',
                scope: 'APPOINTMENTS_READ APPOINTMENTS_WRITE'
            },
            acuity: {
                clientId: process.env.ACUITY_CLIENT_ID,
                clientSecret: process.env.ACUITY_CLIENT_SECRET,
                authUrl: 'https://acuityscheduling.com/oauth2/authorize',
                tokenUrl: 'https://acuityscheduling.com/oauth2/token',
                scope: 'api-v1'
            }
        };

        return configs[platform];
    }

    /**
     * Make API call to external platform
     */
    async makeApiCall(platform, endpoint, credentials, data = null) {
        const apiConfigs = {
            calendly: {
                baseUrl: 'https://api.calendly.com',
                endpoints: {
                    test: '/users/me',
                    availability: '/user_availability_schedules',
                    create_booking: '/scheduled_events'
                }
            },
            google_calendar: {
                baseUrl: 'https://www.googleapis.com/calendar/v3',
                endpoints: {
                    test: '/users/me',
                    availability: '/freebusy',
                    create_booking: '/events'
                }
            },
            square: {
                baseUrl: 'https://connect.squareup.com/v2',
                endpoints: {
                    test: '/locations',
                    availability: '/bookings/availability',
                    create_booking: '/bookings'
                }
            },
            acuity: {
                baseUrl: 'https://acuityscheduling.com/api/v1',
                endpoints: {
                    test: '/me',
                    availability: '/availability/times',
                    create_booking: '/appointments'
                }
            }
        };

        const config = apiConfigs[platform];
        if (!config) {
            throw new Error(`API config not found for ${platform}`);
        }

        const url = `${config.baseUrl}${config.endpoints[endpoint]}`;
        const options = {
            method: data ? 'POST' : 'GET',
            headers: {
                'Authorization': `Bearer ${credentials.access_token}`,
                'Content-Type': 'application/json'
            }
        };

        if (data) {
            options.body = JSON.stringify(data);
        }

        const response = await fetch(url, options);
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || `API call failed: ${response.status}`);
        }

        return result;
    }

    /**
     * Utility methods
     */
    generateState(studioId, platform) {
        return btoa(`${studioId}:${platform}:${Date.now()}`).replace(/[^a-zA-Z0-9]/g, '');
    }

    async encryptCredentials(credentials) {
        // In production, use proper encryption
        // For now, just base64 encode (NOT secure for production)
        return btoa(JSON.stringify(credentials));
    }

    async decryptCredentials(encryptedCredentials) {
        // In production, use proper decryption
        return JSON.parse(atob(encryptedCredentials));
    }

    async getIntegrationCredentials(studioId, platform) {
        const { data, error } = await this.supabase
            .from('studio_integrations')
            .select('credentials')
            .eq('studio_id', studioId)
            .eq('platform', platform)
            .eq('status', 'active')
            .single();

        if (error || !data) return null;

        return await this.decryptCredentials(data.credentials);
    }

    processAvailabilityData(platform, data) {
        // Platform-specific data processing logic
        const processors = {
            calendly: (data) => data.collection?.map(item => ({
                start: item.start_time,
                end: item.end_time,
                available: item.status === 'active'
            })) || [],
            
            google_calendar: (data) => data.calendars ? 
                Object.values(data.calendars).flatMap(cal => 
                    cal.busy?.map(busy => ({
                        start: busy.start,
                        end: busy.end,
                        available: false
                    })) || []
                ) : [],
                
            square: (data) => data.availabilities?.map(avail => ({
                start: avail.start_at,
                end: avail.end_at,
                available: true
            })) || [],
            
            acuity: (data) => data.map(slot => ({
                start: slot.time,
                end: new Date(new Date(slot.time).getTime() + slot.duration * 60000).toISOString(),
                available: true
            }))
        };

        return processors[platform]?.(data) || [];
    }

    async updateLocalAvailability(studioId, availabilityData) {
        // Update local availability records in Supabase
        for (const slot of availabilityData) {
            await this.supabase
                .from('studio_availability')
                .upsert({
                    studio_id: studioId,
                    start_time: slot.start,
                    end_time: slot.end,
                    is_available: slot.available,
                    source: 'external_sync',
                    updated_at: new Date().toISOString()
                });
        }
    }

    processWebhookData(platform, payload) {
        // Platform-specific webhook data processing
        return {
            platform,
            event: payload.event || payload.type,
            data: payload.data || payload,
            timestamp: new Date().toISOString()
        };
    }

    async processWebhookUpdate(processedData) {
        // Handle webhook updates based on event type
        console.log('Processing webhook update:', processedData);
        
        // Implement specific update logic based on event type
        // e.g., booking created, cancelled, rescheduled, etc.
    }

    verifyWebhookSignature(platform, payload, signature) {
        // Implement webhook signature verification for each platform
        // This is crucial for security
        return true; // Placeholder - implement proper verification
    }
}

// Export for use in other modules
window.CalendarBackendService = CalendarBackendService;
// Calendar Integrations Module for PluggedIn Studio Owners

class CalendarIntegrationsManager {
    constructor() {
        this.supportedIntegrations = {
            calendly: {
                name: 'Calendly',
                description: 'Sync your Calendly availability and bookings',
                icon: '📅',
                color: 'blue',
                authType: 'oauth',
                features: ['availability_sync', 'booking_sync', 'webhook_support'],
                setupFields: ['calendly_username', 'webhook_url']
            },
            square: {
                name: 'Square Appointments',
                description: 'Integrate with Square booking system',
                icon: '⬜',
                color: 'gray',
                authType: 'api_key',
                features: ['availability_sync', 'booking_sync', 'payment_integration'],
                setupFields: ['application_id', 'access_token', 'location_id']
            },
            acuity: {
                name: 'Acuity / Squarespace',
                description: 'Connect your Acuity Scheduling account',
                icon: '🎯',
                color: 'purple',
                authType: 'api_key',
                features: ['availability_sync', 'booking_sync', 'client_management'],
                setupFields: ['user_id', 'api_key']
            },
            google: {
                name: 'Google Calendar',
                description: 'Sync with Google Calendar for availability',
                icon: '📊',
                color: 'red',
                authType: 'oauth',
                features: ['availability_sync', 'event_sync', 'real_time_updates'],
                setupFields: ['calendar_id']
            },
            setmore: {
                name: 'Setmore',
                description: 'Integrate with Setmore appointment booking',
                icon: '⏰',
                color: 'green',
                authType: 'api_key',
                features: ['availability_sync', 'booking_sync', 'customer_management'],
                setupFields: ['api_key', 'refresh_token']
            },
            picktime: {
                name: 'Picktime',
                description: 'Connect your Picktime booking system',
                icon: '🕐',
                color: 'orange',
                authType: 'api_key',
                features: ['availability_sync', 'booking_sync'],
                setupFields: ['api_key', 'business_id']
            },
            zoho: {
                name: 'Zoho Bookings',
                description: 'Sync with Zoho Bookings platform',
                icon: '📋',
                color: 'blue',
                authType: 'oauth',
                features: ['availability_sync', 'booking_sync', 'analytics'],
                setupFields: ['client_id', 'client_secret']
            },
            simplybook: {
                name: 'SimplyBook.me',
                description: 'Integrate with SimplyBook.me system',
                icon: '📖',
                color: 'teal',
                authType: 'api_key',
                features: ['availability_sync', 'booking_sync', 'multi_location'],
                setupFields: ['company_login', 'api_key']
            }
        };

        this.activeIntegrations = [];
        this.backendService = new CalendarBackendService();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadActiveIntegrations();
        this.renderAvailableIntegrations();
    }

    setupEventListeners() {
        // Add integration button
        const addIntegrationBtn = document.getElementById('addIntegrationBtn');
        if (addIntegrationBtn) {
            addIntegrationBtn.addEventListener('click', () => this.showIntegrationModal());
        }

        // Close integration modal
        const closeModalBtn = document.getElementById('closeIntegrationModal');
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', () => this.hideIntegrationModal());
        }

        // Modal backdrop click
        const modal = document.getElementById('integrationModal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideIntegrationModal();
                }
            });
        }
    }

    async loadActiveIntegrations() {
        try {
            // In a real implementation, this would load from the database
            // For now, we'll simulate some active integrations
            this.activeIntegrations = [
                {
                    id: '1',
                    type: 'calendly',
                    status: 'active',
                    lastSync: new Date().toISOString(),
                    config: {
                        calendly_username: 'mystudio',
                        webhook_url: 'https://pluggedin.studio/webhooks/calendly'
                    }
                },
                {
                    id: '2',
                    type: 'google',
                    status: 'active',
                    lastSync: new Date(Date.now() - 3600000).toISOString(),
                    config: {
                        calendar_id: 'primary'
                    }
                }
            ];

            this.renderActiveIntegrations();
        } catch (error) {
            console.error('Error loading integrations:', error);
            utils.showNotification('Error loading integrations', 'error');
        }
    }

    renderActiveIntegrations() {
        const container = document.getElementById('integrationsList');
        if (!container) return;

        if (this.activeIntegrations.length === 0) {
            container.innerHTML = `
                <div class="col-span-2 text-center py-8">
                    <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                    <h3 class="mt-2 text-sm font-medium text-gray-900">No integrations yet</h3>
                    <p class="mt-1 text-sm text-gray-500">Get started by adding your first calendar integration.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.activeIntegrations.map(integration => {
            const config = this.supportedIntegrations[integration.type];
            const lastSyncTime = new Date(integration.lastSync).toLocaleString();
            
            return `
                <div class="border border-gray-200 rounded-lg p-4">
                    <div class="flex items-center justify-between mb-3">
                        <div class="flex items-center">
                            <span class="text-2xl mr-3">${config.icon}</span>
                            <div>
                                <h3 class="font-medium text-gray-900">${config.name}</h3>
                                <p class="text-sm text-gray-500">${config.description}</p>
                            </div>
                        </div>
                        <div class="flex items-center space-x-2">
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                integration.status === 'active' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                            }">
                                ${integration.status}
                            </span>
                            <button class="text-gray-400 hover:text-gray-600" onclick="calendarIntegrations.configureIntegration('${integration.id}')" title="Configure" aria-label="Configure integration">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                </svg>
                            </button>
                        </div>
                    </div>
                    
                    <div class="space-y-2 text-sm text-gray-600">
                        <div class="flex justify-between">
                            <span>Last sync:</span>
                            <span>${lastSyncTime}</span>
                        </div>
                        <div class="flex justify-between">
                            <span>Features:</span>
                            <span>${config.features.length} enabled</span>
                        </div>
                    </div>
                    
                    <div class="mt-4 flex space-x-2">
                        <button onclick="calendarIntegrations.syncIntegration('${integration.id}')" 
                                class="flex-1 bg-blue-50 text-blue-700 px-3 py-2 rounded-md text-sm hover:bg-blue-100">
                            Sync Now
                        </button>
                        <button onclick="calendarIntegrations.testIntegration('${integration.id}')" 
                                class="flex-1 bg-gray-50 text-gray-700 px-3 py-2 rounded-md text-sm hover:bg-gray-100">
                            Test
                        </button>
                        <button onclick="calendarIntegrations.removeIntegration('${integration.id}')" 
                                class="bg-red-50 text-red-700 px-3 py-2 rounded-md text-sm hover:bg-red-100">
                            Remove
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    renderAvailableIntegrations() {
        const container = document.getElementById('availableIntegrations');
        if (!container) return;

        const availableTypes = Object.keys(this.supportedIntegrations).filter(type => 
            !this.activeIntegrations.some(integration => integration.type === type)
        );

        container.innerHTML = availableTypes.map(type => {
            const config = this.supportedIntegrations[type];
            return `
                <button onclick="calendarIntegrations.startIntegrationSetup('${type}')" 
                        class="p-4 border border-gray-200 rounded-lg hover:border-${config.color}-300 hover:bg-${config.color}-50 transition-colors text-center">
                    <div class="text-3xl mb-2">${config.icon}</div>
                    <div class="text-sm font-medium text-gray-900">${config.name}</div>
                    <div class="text-xs text-gray-500 mt-1">${config.features.length} features</div>
                </button>
            `;
        }).join('');
    }

    showIntegrationModal() {
        const modal = document.getElementById('integrationModal');
        if (modal) {
            modal.classList.remove('hidden');
        }
    }

    hideIntegrationModal() {
        const modal = document.getElementById('integrationModal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    startIntegrationSetup(type) {
        const config = this.supportedIntegrations[type];
        if (!config) return;

        this.showIntegrationModal();
        this.renderIntegrationSetup(type, config);
    }

    renderIntegrationSetup(type, config) {
        const modalContent = document.getElementById('integrationModalContent');
        if (!modalContent) return;

        modalContent.innerHTML = `
            <div class="space-y-6">
                <!-- Integration Info -->
                <div class="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                    <span class="text-4xl">${config.icon}</span>
                    <div>
                        <h3 class="text-lg font-medium text-gray-900">${config.name}</h3>
                        <p class="text-sm text-gray-600">${config.description}</p>
                    </div>
                </div>

                <!-- Features -->
                <div>
                    <h4 class="text-sm font-medium text-gray-900 mb-2">Features</h4>
                    <div class="grid grid-cols-2 gap-2">
                        ${config.features.map(feature => `
                            <div class="flex items-center text-sm text-gray-600">
                                <svg class="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                                </svg>
                                ${this.formatFeatureName(feature)}
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Setup Form -->
                <form id="integrationSetupForm" class="space-y-4">
                    <input type="hidden" name="integration_type" value="${type}">
                    
                    ${config.authType === 'oauth' ? this.renderOAuthSetup(type, config) : this.renderApiKeySetup(type, config)}
                    
                    <!-- Additional Settings -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Sync Settings</label>
                        <div class="space-y-2">
                            <label class="flex items-center">
                                <input type="checkbox" name="sync_availability" checked class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
                                <span class="ml-2 text-sm text-gray-700">Sync availability to PluggedIn</span>
                            </label>
                            <label class="flex items-center">
                                <input type="checkbox" name="sync_bookings" checked class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
                                <span class="ml-2 text-sm text-gray-700">Sync bookings from external system</span>
                            </label>
                            <label class="flex items-center">
                                <input type="checkbox" name="prevent_double_booking" checked class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
                                <span class="ml-2 text-sm text-gray-700">Prevent double bookings</span>
                            </label>
                        </div>
                    </div>

                    <!-- Action Buttons -->
                    <div class="flex justify-end space-x-3 pt-4 border-t">
                        <button type="button" onclick="calendarIntegrations.hideIntegrationModal()" 
                                class="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50">
                            Cancel
                        </button>
                        <button type="submit" 
                                class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                            ${config.authType === 'oauth' ? 'Connect Account' : 'Save Integration'}
                        </button>
                    </div>
                </form>
            </div>
        `;

        // Setup form submission
        const form = document.getElementById('integrationSetupForm');
        if (form) {
            form.addEventListener('submit', (e) => this.handleIntegrationSetup(e, type));
        }
    }

    renderOAuthSetup(type, config) {
        return `
            <div class="bg-blue-50 p-4 rounded-lg">
                <div class="flex items-center">
                    <svg class="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                    </svg>
                    <div>
                        <p class="text-sm font-medium text-blue-900">Secure OAuth Connection</p>
                        <p class="text-xs text-blue-700">You'll be redirected to ${config.name} to authorize access</p>
                    </div>
                </div>
            </div>
        `;
    }

    renderApiKeySetup(type, config) {
        return `
            <div class="space-y-4">
                ${config.setupFields.map(field => `
                    <div>
                        <label for="${field}" class="block text-sm font-medium text-gray-700 mb-1">
                            ${this.formatFieldName(field)}
                        </label>
                        <input type="${field.includes('key') || field.includes('token') ? 'password' : 'text'}" 
                               id="${field}" 
                               name="${field}" 
                               required
                               class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                               placeholder="Enter your ${this.formatFieldName(field).toLowerCase()}">
                        <p class="text-xs text-gray-500 mt-1">
                            ${this.getFieldHelp(type, field)}
                        </p>
                    </div>
                `).join('')}
            </div>
        `;
    }

    formatFeatureName(feature) {
        return feature.split('_').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }

    formatFieldName(field) {
        return field.split('_').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }

    getFieldHelp(type, field) {
        const helpText = {
            calendly: {
                calendly_username: 'Your Calendly username (e.g., mystudio)',
                webhook_url: 'Webhook URL for real-time updates'
            },
            square: {
                application_id: 'Found in your Square Developer Dashboard',
                access_token: 'Your Square access token',
                location_id: 'Your Square location ID'
            },
            acuity: {
                user_id: 'Your Acuity user ID',
                api_key: 'Found in your Acuity account settings'
            },
            google: {
                calendar_id: 'Usually "primary" for your main calendar'
            },
            setmore: {
                api_key: 'Your Setmore API key',
                refresh_token: 'Setmore refresh token'
            },
            picktime: {
                api_key: 'Your Picktime API key',
                business_id: 'Your Picktime business ID'
            },
            zoho: {
                client_id: 'Your Zoho OAuth client ID',
                client_secret: 'Your Zoho OAuth client secret'
            },
            simplybook: {
                company_login: 'Your SimplyBook.me company login',
                api_key: 'Your SimplyBook.me API key'
            }
        };

        return helpText[type]?.[field] || 'Enter the required information from your account';
    }

    async handleIntegrationSetup(e, type) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const config = Object.fromEntries(formData.entries());
        
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        
        try {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Connecting...';
            
            const integration = this.supportedIntegrations[type];
            const studioId = window.currentUser?.studioId || 'demo-studio-id';
            
            let result;
            
            if (integration.authType === 'oauth') {
                // Handle OAuth flow
                submitBtn.textContent = 'Opening OAuth window...';
                result = await this.backendService.initiateOAuth(type, studioId);
                
                if (result.success) {
                    // Test the connection
                    submitBtn.textContent = 'Testing connection...';
                    await this.backendService.testConnection(studioId, type);
                }
            } else {
                // Handle API key setup
                submitBtn.textContent = 'Validating credentials...';
                
                // Store API key credentials
                await this.backendService.storeIntegrationCredentials(studioId, type, {
                    ...config,
                    auth_type: 'api_key'
                });
                
                // Test the connection
                await this.backendService.testConnection(studioId, type);
                
                result = { success: true, platform: type, studioId };
            }
            
            if (result.success) {
                // Add to active integrations
                const newIntegration = {
                    id: Date.now().toString(),
                    type: type,
                    status: 'active',
                    lastSync: new Date().toISOString(),
                    config: config
                };
                
                this.activeIntegrations.push(newIntegration);
                
                // Update UI
                this.renderActiveIntegrations();
                this.renderAvailableIntegrations();
                this.hideIntegrationModal();
                
                utils.showNotification(`${this.supportedIntegrations[type].name} integration added successfully!`, 'success');
                
                // Perform initial sync
                setTimeout(() => {
                    this.syncIntegration(newIntegration.id);
                }, 1000);
            } else {
                throw new Error(result.error || 'Integration setup failed');
            }
            
        } catch (error) {
            console.error('Error setting up integration:', error);
            let errorMessage = 'Error setting up integration. Please try again.';
            
            if (error.message.includes('OAuth cancelled')) {
                errorMessage = 'OAuth process was cancelled. Please try again.';
            } else if (error.message.includes('OAuth timeout')) {
                errorMessage = 'OAuth process timed out. Please try again.';
            } else if (error.message.includes('Invalid credentials')) {
                errorMessage = 'Invalid credentials provided. Please check your API keys.';
            }
            
            utils.showNotification(errorMessage, 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    }

    async syncIntegration(integrationId) {
        const integration = this.activeIntegrations.find(i => i.id === integrationId);
        if (!integration) return;

        try {
            utils.showNotification('Syncing integration...', 'info');
            
            const studioId = window.currentUser?.studioId || 'demo-studio-id';
            
            // Sync availability data from external platform
            const syncResult = await this.backendService.syncAvailability(studioId, integration.type);
            
            if (syncResult.success) {
                integration.lastSync = new Date().toISOString();
                integration.status = 'active';
                this.renderActiveIntegrations();
                
                const recordsText = syncResult.recordsProcessed === 1 ? 'record' : 'records';
                utils.showNotification(
                    `Integration synced successfully! ${syncResult.recordsProcessed} ${recordsText} processed.`, 
                    'success'
                );
            } else {
                throw new Error('Sync failed');
            }
            
        } catch (error) {
            console.error('Error syncing integration:', error);
            
            // Update integration status
            integration.status = 'error';
            this.renderActiveIntegrations();
            
            let errorMessage = 'Error syncing integration';
            if (error.message.includes('credentials')) {
                errorMessage = 'Integration credentials expired. Please reconnect.';
            } else if (error.message.includes('rate limit')) {
                errorMessage = 'API rate limit exceeded. Please try again later.';
            }
            
            utils.showNotification(errorMessage, 'error');
        }
    }

    async testIntegration(integrationId) {
        const integration = this.activeIntegrations.find(i => i.id === integrationId);
        if (!integration) return;

        try {
            utils.showNotification('Testing integration...', 'info');
            
            const studioId = window.currentUser?.studioId || 'demo-studio-id';
            
            // Test the connection to external platform
            const testResult = await this.backendService.testConnection(studioId, integration.type);
            
            if (testResult.success) {
                integration.status = 'active';
                this.renderActiveIntegrations();
                utils.showNotification('Integration test successful!', 'success');
            } else {
                throw new Error(testResult.error || 'Connection test failed');
            }
            
        } catch (error) {
            console.error('Error testing integration:', error);
            
            // Update integration status
            integration.status = 'error';
            this.renderActiveIntegrations();
            
            let errorMessage = 'Integration test failed';
            if (error.message.includes('credentials')) {
                errorMessage = 'Invalid or expired credentials. Please reconnect.';
            } else if (error.message.includes('network')) {
                errorMessage = 'Network error. Please check your connection.';
            } else if (error.message.includes('unauthorized')) {
                errorMessage = 'Unauthorized access. Please check your permissions.';
            }
            
            utils.showNotification(errorMessage, 'error');
        }
    }

    async removeIntegration(integrationId) {
        if (!confirm('Are you sure you want to remove this integration?')) {
            return;
        }

        try {
            this.activeIntegrations = this.activeIntegrations.filter(i => i.id !== integrationId);
            this.renderActiveIntegrations();
            this.renderAvailableIntegrations();
            
            utils.showNotification('Integration removed successfully', 'success');
        } catch (error) {
            console.error('Error removing integration:', error);
            utils.showNotification('Error removing integration', 'error');
        }
    }

    configureIntegration(integrationId) {
        const integration = this.activeIntegrations.find(i => i.id === integrationId);
        if (!integration) return;

        // Show configuration modal
        utils.showNotification('Configuration modal coming soon!', 'info');
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.calendarIntegrations = new CalendarIntegrationsManager();
});
/**
 * Location Autocomplete functionality for PluggedIn.studio
 * Provides location suggestions as the user types
 */
class LocationAutocomplete {
    constructor() {
        this.locations = [
            "New York, NY", "Los Angeles, CA", "Chicago, IL", "Houston, TX", 
            "Phoenix, AZ", "Philadelphia, PA", "San Antonio, TX", "San Diego, CA",
            "Dallas, TX", "San Jose, CA", "Austin, TX", "Jacksonville, FL", 
            "Fort Worth, TX", "Columbus, OH", "San Francisco, CA", "Charlotte, NC", 
            "Indianapolis, IN", "Seattle, WA", "Denver, CO", "Washington, DC",
            "Boston, MA", "Nashville, TN", "Baltimore, MD", "Louisville, KY", 
            "Portland, OR", "Las Vegas, NV", "Milwaukee, WI", "Albuquerque, NM", 
            "Tucson, AZ", "Fresno, CA", "Sacramento, CA", "Atlanta, GA",
            "Miami, FL", "Orlando, FL", "Tampa, FL", "Tallahassee, FL",
            "Miami Beach, FL", "Fort Lauderdale, FL", "Jacksonville Beach, FL",
            "Gainesville, FL", "Pensacola, FL", "West Palm Beach, FL"
        ];
        
        this.inputElement = document.getElementById('locationInput');
        this.suggestionsContainer = document.getElementById('locationSuggestions');
        
        if (this.inputElement && this.suggestionsContainer) {
            this.init();
        }
    }
    
    init() {
        // Set up event listeners
        this.inputElement.addEventListener('input', this.onInput.bind(this));
        this.inputElement.addEventListener('focus', this.onFocus.bind(this));
        
        // Close suggestions when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.inputElement.contains(e.target) && !this.suggestionsContainer.contains(e.target)) {
                this.hideSuggestions();
            }
        });
    }
    
    onInput(e) {
        const query = e.target.value.trim().toLowerCase();
        
        if (query.length < 2) {
            this.hideSuggestions();
            return;
        }
        
        // Filter locations based on input
        const filteredLocations = this.locations.filter(location => 
            location.toLowerCase().includes(query)
        );
        
        if (filteredLocations.length > 0) {
            this.showSuggestions(filteredLocations);
        } else {
            this.hideSuggestions();
        }
    }
    
    onFocus() {
        const query = this.inputElement.value.trim().toLowerCase();
        if (query.length >= 2) {
            const filteredLocations = this.locations.filter(location => 
                location.toLowerCase().includes(query)
            );
            
            if (filteredLocations.length > 0) {
                this.showSuggestions(filteredLocations);
            }
        }
    }
    
    showSuggestions(suggestions) {
        // Clear previous suggestions
        this.suggestionsContainer.innerHTML = '';
        
        // Create suggestions list
        const ul = document.createElement('ul');
        ul.className = 'py-1';
        
        suggestions.slice(0, 10).forEach(location => {
            const li = document.createElement('li');
            li.className = 'px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer';
            li.textContent = location;
            li.addEventListener('click', () => this.selectSuggestion(location));
            ul.appendChild(li);
        });
        
        this.suggestionsContainer.appendChild(ul);
        this.suggestionsContainer.classList.remove('hidden');
    }
    
    hideSuggestions() {
        this.suggestionsContainer.classList.add('hidden');
    }
    
    selectSuggestion(location) {
        this.inputElement.value = location;
        this.hideSuggestions();
        
        // Trigger a change event
        const event = new Event('change', { bubbles: true });
        this.inputElement.dispatchEvent(event);
    }
}

// Initialize on DOM content loaded
document.addEventListener('DOMContentLoaded', () => {
    window.locationAutocomplete = new LocationAutocomplete();
});
/**
 * Content Keeper - Ensures content remains visible
 * This script continuously monitors and restores visibility of page elements
 * to prevent any other scripts from accidentally hiding content
 * 
 * SUPER AGGRESSIVE VERSION - Will force content to stay visible
 */

(function() {
    // Elements to keep visible
    const criticalElements = [
        '.container',
        '.logo-container',
        'h1',
        '.tagline',
        '.countdown',
        // '.video-container', // Removed as requested
        '.subscribe',
        '.whitepaper-section',
        '.social-links'
    ];
    
    // Function to ensure elements are visible
    function ensureVisibility() {
        // Hide loader if it exists
        const loader = document.getElementById('page-loader');
        if (loader) {
            loader.classList.add('loader-hidden');
            loader.style.display = 'none';
        }
        
        // Make container visible
        const container = document.querySelector('.container');
        if (container) {
            container.style.display = 'block';
            container.style.visibility = 'visible';
            container.style.opacity = '1';
        }
        
        // Make all critical elements visible
        criticalElements.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                if (el) {
                    el.style.display = el.tagName === 'DIV' ? 'block' : '';
                    el.style.visibility = 'visible';
                    el.style.opacity = '1';
                }
            });
        });
    }
    
    // Run immediately
    ensureVisibility();
    
    // Run again after a short delay to catch any late-loading scripts
    setTimeout(ensureVisibility, 500);
    setTimeout(ensureVisibility, 1000);
    setTimeout(ensureVisibility, 2000);
    
    // Set up a recurring check every second PERMANENTLY
    // This is an aggressive approach to ensure content always stays visible
    setInterval(ensureVisibility, 1000);
    
    // Also set up a more intensive check every 100ms for the first 10 seconds
    let intensiveCheckCount = 0;
    const intensiveInterval = setInterval(() => {
        ensureVisibility();
        intensiveCheckCount++;
        
        // Stop intensive checking after 100 iterations (10 seconds)
        if (intensiveCheckCount >= 100) {
            clearInterval(intensiveInterval);
        }
    }, 100);
    
    // Also run when the window is resized or scrolled
    window.addEventListener('resize', ensureVisibility);
    window.addEventListener('scroll', ensureVisibility);
    
    // Run when DOM content is loaded
    document.addEventListener('DOMContentLoaded', ensureVisibility);
    
    // Run when page is fully loaded
    window.addEventListener('load', ensureVisibility);
})();
