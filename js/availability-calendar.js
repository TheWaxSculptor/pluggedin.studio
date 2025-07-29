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
