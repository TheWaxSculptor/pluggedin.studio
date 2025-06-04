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
        '.video-container',
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
