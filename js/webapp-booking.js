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
