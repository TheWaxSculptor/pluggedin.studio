/**
 * Location Autocomplete functionality for PluggedIn.studio
 * Now powered by Google Maps Places API for professional results
 */
class LocationAutocomplete {
    constructor() {
        this.inputElement = document.getElementById('locationSearch');
        this.autocomplete = null;
        
        if (this.inputElement) {
            this.init();
        } else {
            console.warn('⚠️ Location search input not found');
        }
    }
    
    init() {
        // Wait for Google Maps to load
        if (typeof google !== 'undefined' && google.maps && google.maps.places) {
            this.setupAutocomplete();
        } else {
            console.log('⏳ Waiting for Google Maps script to load...');
            window.addEventListener('load', () => {
                if (typeof google !== 'undefined' && google.maps && google.maps.places) {
                    this.setupAutocomplete();
                }
            });
        }
    }
    
    setupAutocomplete() {
        console.log('✅ Initializing Google Maps Autocomplete');
        
        // Options for Autocomplete
        const options = {
            fields: ['formatted_address', 'geometry', 'name'],
            types: ['(cities)'] // Focus on cities and significant localities
        };

        this.autocomplete = new google.maps.places.Autocomplete(this.inputElement, options);
        
        // Listen for selection
        this.autocomplete.addListener('place_changed', () => {
            const place = this.autocomplete.getPlace();
            
            if (!place.geometry) {
                console.log('⚠️ No details available for input: ' + place.name);
                return;
            }

            console.log('📍 Selected place:', place.formatted_address);
            
            // Trigger search automatically on selection
            this.triggerSearch();
        });

        // Add visual indicator class
        this.inputElement.classList.add('google-autocomplete-active');
    }
    
    triggerSearch() {
        if (window.studiosManager) {
            const searchSubmit = document.getElementById('searchSubmit');
            if (searchSubmit) {
                searchSubmit.click(); // Programmatically trigger search
            } else {
                window.studiosManager.loadStudios();
            }
        }
    }
}

// Initialize on DOM content loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check if google maps script is already loading
    window.locationAutocomplete = new LocationAutocomplete();
});
