/**
 * FAQ Integration Script
 * 
 * This script will:
 * 1. Load the FAQ HTML content from faq.html
 * 2. Insert it at the appropriate location in the page
 * 3. Ensure the CSS and JS dependencies are loaded
 */
document.addEventListener('DOMContentLoaded', function() {
    // Create a function to load and insert the FAQ section
    function loadAndInsertFAQ() {
        // Create a new XMLHttpRequest
        const xhr = new XMLHttpRequest();
        
        // Configure it to get the FAQ HTML file
        xhr.open('GET', 'faq.html', true);
        
        // Set up the onload handler
        xhr.onload = function() {
            if (this.status === 200) {
                // Get the HTML content
                const faqHTML = this.responseText;
                
                // Find where to insert the FAQ section
                // We'll insert it before the footer or as the last element in the container
                const container = document.querySelector('.container');
                const footer = document.querySelector('footer') || container.lastElementChild;
                
                // Create a temporary div to hold the FAQ HTML
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = faqHTML;
                
                // Get the FAQ section from the temporary div
                const faqSection = tempDiv.firstElementChild;
                
                // Insert the FAQ section before the footer
                container.insertBefore(faqSection, footer);
                
                // Now that the FAQ section is in the DOM, initialize it
                initializeFAQ();
            }
        };
        
        // Handle errors
        xhr.onerror = function() {
            console.error('Error loading FAQ content');
        };
        
        // Send the request
        xhr.send();
    }
    
    // Function to ensure CSS is loaded
    function ensureCSSLoaded() {
        // Check if the FAQ CSS is already loaded
        const cssLoaded = Array.from(document.styleSheets).some(sheet => {
            if (sheet.href) {
                return sheet.href.includes('faq.css');
            }
            return false;
        });
        
        // If not loaded, add the CSS
        if (!cssLoaded) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'css/faq.css';
            document.head.appendChild(link);
        }
    }
    
    // Function to ensure JS is loaded
    function ensureJSLoaded(callback) {
        // Check if the FAQ JS is already loaded
        const scriptLoaded = Array.from(document.scripts).some(script => {
            if (script.src) {
                return script.src.includes('faq.js');
            }
            return false;
        });
        
        // If not loaded, add the script
        if (!scriptLoaded) {
            const script = document.createElement('script');
            script.src = 'js/faq.js';
            script.onload = callback;
            document.body.appendChild(script);
        } else {
            // If already loaded, just run the callback
            callback();
        }
    }
    
    // Function to initialize FAQ after all resources are loaded
    function initializeFAQ() {
        // Check if the initialization function is available
        if (typeof window.initFAQ === 'function') {
            window.initFAQ();
        } else {
            // If the FAQ script is loaded but the function isn't defined,
            // the script might have defined its own DOMContentLoaded handler.
            // In that case, we don't need to do anything.
            console.log('FAQ loaded successfully');
        }
    }
    
    // Main initialization sequence
    function init() {
        // First ensure CSS is loaded
        ensureCSSLoaded();
        
        // Then ensure JS is loaded
        ensureJSLoaded(function() {
            // Finally load and insert the FAQ content
            loadAndInsertFAQ();
        });
    }
    
    // Start the initialization
    init();
});
