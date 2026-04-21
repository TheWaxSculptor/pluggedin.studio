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

    async startBookingFlow(studio) {
        this.selectedStudio = studio;
        // Fetch external integrations for this studio
        await this.fetchStudioIntegrations();
        this.showBookingModal();
    }

    async fetchStudioIntegrations() {
        try {
            const tableName = db.getTableName('studio_integrations');
            const { data, error } = await db.supabase
                .from(tableName)
                .select('*')
                .eq('studio_id', this.selectedStudio.id)
                .eq('status', 'active');
            
            if (data) {
                this.selectedStudio.integrations = data;
                // Look for calendly_url in config/credentials
                const calendly = data.find(i => i.platform === 'calendly');
                if (calendly) {
                    // Try to decrypt or parse credentials
                    try {
                        const creds = JSON.parse(atob(calendly.credentials));
                        this.selectedStudio.external_booking_url = creds.calendly_url;
                    } catch (e) {
                        console.error('Error parsing calendly credentials', e);
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching integrations:', error);
        }
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
        modal.className = 'hidden fixed inset-0 z-50 flex items-center justify-center p-4 booking-modal-backdrop';
        
        modal.innerHTML = `
            <div class="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-2xl booking-modal-content">
                <div class="flex flex-col md:flex-row h-full">
                    <!-- Left: Studio Preview (Premium) -->
                    <div class="w-full md:w-5/12 bg-black p-8 text-white flex flex-col justify-between relative overflow-hidden">
                        <div class="absolute inset-0 opacity-20">
                            <img src="${this.selectedStudio.image || 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=1000&q=80'}" class="w-full h-full object-cover">
                        </div>
                        <div class="relative z-10">
                            <div class="inline-block px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest mb-4 border border-white/20">Reservation</div>
                            <h3 class="text-4xl font-black mb-2 leading-none">${this.selectedStudio.name}</h3>
                            <p class="text-gray-400 text-xs mb-6 flex items-center font-medium">
                                <i class="fas fa-map-marker-alt mr-2 text-white/50"></i> ${this.selectedStudio.location || 'Studio Location'}
                            </p>
                        </div>
                        
                        <div class="relative z-10 space-y-4">
                            <div class="flex items-center justify-between py-4 border-t border-white/10">
                                <span class="text-white/50 text-xs font-bold uppercase tracking-wider">Hourly Rate</span>
                                <span class="font-black text-2xl">${utils.formatCurrency(this.selectedStudio.price || 0)}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Right: Booking Form -->
                    <div class="w-full md:w-7/12 p-10 max-h-[90vh] overflow-y-auto">
                        <div class="flex justify-between items-center mb-8">
                            <h4 class="text-2xl font-black tracking-tight uppercase">Configure Session</h4>
                            <button id="closeBookingModal" class="p-2 text-gray-400 hover:text-black dark:hover:text-white transition-colors">
                                <i class="fas fa-times text-xl"></i>
                            </button>
                        </div>
                        
                        <form id="bookingForm" class="space-y-8">
                            <!-- Date Selection -->
                            <div class="premium-field-group">
                                <input type="date" id="bookingDate" required 
                                       class="premium-input" placeholder=" "
                                       min="${new Date().toISOString().split('T')[0]}">
                                <label for="bookingDate" class="premium-label italic">Select Session Date</label>
                            </div>

                            <!-- Time Selection -->
                            <div>
                                <label class="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Availability Window</label>
                                <div id="timeSlots" class="grid grid-cols-3 gap-3">
                                    <div class="col-span-3 text-center text-gray-400 py-10 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-2xl italic text-sm">
                                        Select a date to unlock session times
                                    </div>
                                </div>
                            </div>

                            <!-- Duration Selection -->
                            <div class="premium-field-group">
                                <select id="duration" required class="premium-input premium-select">
                                    <option value="" disabled selected>Duration of stay?</option>
                                    <option value="1">1 Hour</option>
                                    <option value="2">2 Hours</option>
                                    <option value="3">3 Hours</option>
                                    <option value="4">4 Hours</option>
                                    <option value="8">Full Day Session (8h)</option>
                                </select>
                                <label class="premium-label italic">Session Duration</label>
                            </div>

                            <!-- Notes -->
                            <div class="premium-field-group">
                                <textarea id="notes" class="premium-input h-24 py-4" placeholder=" "></textarea>
                                <label for="notes" class="premium-label italic">Special Requirements / Notes</label>
                            </div>

                            <!-- Summary Card -->
                            <div id="bookingSummary" class="hidden p-8 rounded-3xl booking-summary-card">
                                <div id="summaryContent" class="space-y-2"></div>
                            </div>

                            <!-- Actions -->
                            <div class="flex flex-col gap-3 pt-4">
                                <button type="submit" id="confirmBooking" 
                                        class="flex-1 bg-black text-white dark:bg-white dark:text-black py-5 rounded-2xl font-black text-lg hover:scale-[1.01] active:scale-[0.99] transition-all shadow-2xl shadow-black/20 uppercase tracking-widest">
                                    Finalize Booking
                                </button>
                                
                                ${this.selectedStudio.external_booking_url ? `
                                    <div class="relative py-2 text-center">
                                        <div class="absolute inset-0 flex items-center"><div class="w-full border-t border-gray-100 dark:border-gray-800"></div></div>
                                        <span class="relative px-2 bg-white dark:bg-slate-900 text-[10px] font-black text-gray-400 uppercase tracking-widest">Or Booking via</span>
                                    </div>
                                    <a href="${this.selectedStudio.external_booking_url}" target="_blank" 
                                       class="flex items-center justify-center gap-2 border-2 border-gray-100 dark:border-gray-800 py-4 rounded-2xl font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 transition-all">
                                        <i class="fas fa-calendar-alt"></i>
                                        Reserve on Calendly
                                    </a>
                                ` : ''}
                            </div>
                        </form>
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
                const content = modal.querySelector('.booking-modal-content');
                if (e.target === modal || (content && !content.contains(e.target))) {
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
        timeSlotsContainer.innerHTML = '<div class="col-span-3 text-center text-gray-500 py-10 animate-pulse font-bold tracking-widest text-xs uppercase">Analyzing Studio Schedule...</div>';

        try {
            // 1. Fetch external busy slots for this date (Dynamic Table)
            const tableName = db.getTableName('studio_external_availability');
            const { data: externalBusy, error } = await db.supabase
                .from(tableName)
                .select('*')
                .eq('studio_id', this.selectedStudio.id)
                .gte('start_time', `${this.selectedDate}T00:00:00Z`)
                .lte('end_time', `${this.selectedDate}T23:59:59Z`);

            if (error) {
                console.warn(`External availability lookup skipped for ${tableName}`);
            }

            // 2. Generate initial slots
            let timeSlots = this.generateTimeSlots();

            // 3. Filter out slots that conflict with external busy events
            if (externalBusy && externalBusy.length > 0) {
                timeSlots = timeSlots.map(slot => {
                    const slotStart = new Date(`${this.selectedDate}T${slot.time}:00Z`);
                    // Cross reference with external busy times
                    const isConflict = externalBusy.some(busy => {
                        const busyStart = new Date(busy.start_time);
                        const busyEnd = new Date(busy.end_time);
                        return slotStart >= busyStart && slotStart < busyEnd;
                    });

                    if (isConflict) {
                        return { ...slot, available: false, label: 'Outside Sync' };
                    }
                    return slot;
                });
            }

            // Small delay for premium feel
            setTimeout(() => {
                this.renderTimeSlots(timeSlots);
            }, 600);
        } catch (error) {
            console.error('Error loading time slots:', error);
            timeSlotsContainer.innerHTML = '<div class="col-span-3 text-center text-red-500 py-4">Error loading time slots</div>';
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
                    class="time-slot-btn py-3 px-1 text-xs font-bold border rounded-xl transition-all ${
                        slot.isAvailable 
                            ? 'border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700' 
                            : 'opacity-30 cursor-not-allowed border-transparent'
                    }" 
                    data-time="${slot.time}"
                    ${!slot.isAvailable ? 'disabled' : ''}>
                ${slot.displayTime}
            </button>
        `).join('');

        // Add click listeners to available slots
        timeSlotsContainer.querySelectorAll('.time-slot-btn:not([disabled])').forEach(button => {
            button.addEventListener('click', () => this.selectTimeSlot(button));
        });
    }

    selectTimeSlot(button) {
        // Remove previous selection
        document.querySelectorAll('.time-slot-btn').forEach(btn => {
            btn.classList.remove('selected');
        });

        // Add selection to clicked button
        button.classList.add('selected');
        
        this.selectedTimeSlot = button.dataset.time;
        this.updateBookingSummary();
    }

    updateBookingSummary() {
        const durationSelect = document.getElementById('duration');
        if (!durationSelect) return;
        
        const duration = durationSelect.value;
        const summaryContainer = document.getElementById('bookingSummary');
        const summaryContent = document.getElementById('summaryContent');

        if (!this.selectedDate || !this.selectedTimeSlot || !duration) {
            if (summaryContainer) summaryContainer.classList.add('hidden');
            return;
        }

        const startTime = new Date(`${this.selectedDate}T${this.selectedTimeSlot}`);
        const endTime = new Date(startTime.getTime() + (parseInt(duration) * 60 * 60 * 1000));
        const totalCost = (this.selectedStudio.price || 0) * parseInt(duration);

        if (summaryContainer && summaryContent) {
            summaryContainer.classList.remove('hidden');
            summaryContent.innerHTML = `
                <div class="flex items-center justify-between mb-4">
                    <span class="text-xs font-black text-gray-400 uppercase tracking-widest">Pricing Details</span>
                    <span class="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-[10px] font-bold uppercase tracking-tighter">Est. Total</span>
                </div>
                <div class="grid grid-cols-2 gap-y-4">
                    <div>
                        <p class="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Time Frame</p>
                        <p class="text-sm font-bold">${utils.formatTime(startTime)} - ${utils.formatTime(endTime)}</p>
                    </div>
                    <div class="text-right">
                        <p class="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Session Date</p>
                        <p class="text-sm font-bold">${utils.formatDate(startTime)}</p>
                    </div>
                    <div class="col-span-2 pt-4 border-t border-black/5 dark:border-white/5 flex justify-between items-end">
                        <div class="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                            ${duration} hour${duration > 1 ? 's' : ''} session
                        </div>
                        <div class="text-3xl font-black">${utils.formatCurrency(totalCost)}</div>
                    </div>
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
            confirmBtn.innerHTML = '<i class="fas fa-spinner animate-spin mr-2"></i> Processing...';
        }

        try {
            const startTime = new Date(`${this.selectedDate}T${this.selectedTimeSlot}`);
            const endTime = new Date(startTime.getTime() + (parseInt(duration) * 60 * 60 * 1000));
            const totalCost = (this.selectedStudio.price || 0) * parseInt(duration);

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
            
            // 2-Way Sync: Push to external calendars
            if (this.selectedStudio.integrations && this.selectedStudio.integrations.length > 0) {
                const calendarBackend = new CalendarBackendService();
                this.selectedStudio.integrations.forEach(async (integration) => {
                    if (integration.status === 'active') {
                        try {
                            await calendarBackend.createExternalBooking(this.selectedStudio.id, integration.platform, {
                                title: `PluggedIn Studio Session: ${window.authManager.getCurrentUser().full_name || 'Reservation'}`,
                                start: bookingData.start_time,
                                end: bookingData.end_time,
                                description: `Booking Request from PluggedIn\nNotes: ${bookingData.notes || 'None'}`
                            });
                        } catch (e) {
                            console.error(`Failed to push booking to ${integration.platform}`, e);
                        }
                    }
                });
            }

            utils.showNotification('Booking requested successfully!', 'success');
            this.hideBookingModal();
            this.showBookingConfirmation(booking);

        } catch (error) {
            console.error('Error creating booking:', error);
            utils.showNotification('Error creating booking. Please try again.', 'error');
        } finally {
            if (confirmBtn) {
                confirmBtn.disabled = false;
                confirmBtn.innerHTML = 'Finalize Booking';
            }
        }
    }

    showBookingConfirmation(booking) {
        // Create a simple confirmation modal
        const confirmationModal = document.createElement('div');
        confirmationModal.className = 'fixed inset-0 z-[60] flex items-center justify-center p-4 booking-modal-backdrop';
        
        confirmationModal.innerHTML = `
            <div class="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-10 shadow-2xl booking-modal-content text-center">
                <div class="w-20 h-20 bg-black dark:bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                    <i class="fas fa-check text-white dark:text-black text-3xl"></i>
                </div>
                <h3 class="text-3xl font-black mb-4 uppercase tracking-tight">Request Sent</h3>
                <p class="text-gray-500 dark:text-gray-400 mb-8 font-medium">
                    Your session request for <span class="text-black dark:text-white font-bold">${this.selectedStudio.name}</span> has been received. You will be notified once the studio host confirms.
                </p>
                <button id="closeConfirmation" 
                        class="w-full bg-black text-white dark:bg-white dark:text-black py-4 rounded-2xl font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all">
                    Got it
                </button>
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

        // Auto-remove after 8 seconds
        setTimeout(() => {
            if (confirmationModal.parentNode) {
                confirmationModal.remove();
            }
        }, 8000);
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
