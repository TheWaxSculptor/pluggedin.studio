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
