// Modal functions
function openWhitepaper() {
    const modal = document.getElementById('whitepaperModal');
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

function closeWhitepaper() {
    const modal = document.getElementById('whitepaperModal');
    modal.classList.remove('show');
    document.body.style.overflow = '';
}

// Close modal on escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeWhitepaper();
    }
});

// Close modal on outside click
document.getElementById('whitepaperModal')?.addEventListener('click', function(e) {
    if (e.target === this) {
        closeWhitepaper();
    }
});

// Make functions globally available
window.openWhitepaper = openWhitepaper;
window.closeWhitepaper = closeWhitepaper;

document.addEventListener('DOMContentLoaded', () => {
    // Ensure all content is visible
    document.querySelector('.container').style.display = 'block';
    document.querySelector('.container').style.visibility = 'visible';
    document.querySelectorAll('.container > *').forEach(el => {
        el.style.display = el.tagName === 'DIV' ? 'block' : '';
        el.style.visibility = 'visible';
    });
    // Loading indicator
    const loader = document.getElementById('page-loader');
    
    // Force hide loader after 2 seconds in case it gets stuck
    setTimeout(() => {
        if (loader) {
            loader.classList.add('loader-hidden');
            loader.style.display = 'none';
        }
    }, 2000);
    
    // Hide loader when page is fully loaded
    window.addEventListener('load', () => {
        setTimeout(() => {
            loader.classList.add('loader-hidden');
        }, 500); // Small delay for smoother transition
    });
    
    // Studio form handling with Supabase integration
    const studioForm = document.getElementById('studio-form');
    const formMessage = document.getElementById('form-message');
    
    // Get Supabase configuration from external config file
    const SUPABASE_URL = window.SUPABASE_CONFIG?.url || 'YOUR_SUPABASE_URL';
    const SUPABASE_ANON_KEY = window.SUPABASE_CONFIG?.anonKey || 'YOUR_SUPABASE_ANON_KEY';
    
    // Check if Supabase is configured
    function isSupabaseConfigured() {
        return SUPABASE_URL !== 'YOUR_SUPABASE_URL' && 
               SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY' &&
               SUPABASE_URL && SUPABASE_ANON_KEY;
    }
    
    // Function to submit data to Supabase
    async function submitToSupabase(studioData) {
        // Check configuration first
        if (!isSupabaseConfigured()) {
            return { 
                success: false, 
                error: 'Supabase is not configured. Please update SUPABASE_URL and SUPABASE_ANON_KEY in the JavaScript file.' 
            };
        }
        
        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/studio_registrations`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify(studioData)
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Supabase error response:', errorText);
                throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
            }
            
            return { success: true };
        } catch (error) {
            console.error('Supabase submission error:', error);
            return { success: false, error: error.message };
        }
    }
    
    // Function to show form message
    function showFormMessage(message, type) {
        formMessage.textContent = message;
        formMessage.className = `form-message ${type}`;
        formMessage.style.display = 'block';
        
        // Hide message after 5 seconds for success, keep error visible
        if (type === 'success') {
            setTimeout(() => {
                formMessage.style.display = 'none';
            }, 5000);
        }
    }
    
    // Handle studio form submission
    if (studioForm) {
        studioForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(studioForm);
            const studioData = {
                studio_name: formData.get('studio_name'),
                contact_name: formData.get('contact_name'),
                contact_email: formData.get('contact_email'),
                phone: formData.get('phone'),
                city: formData.get('city'),
                state: formData.get('state'),
                studio_type: formData.get('studio_type'),
                studio_size: formData.get('studio_size'),
                hourly_rate: formData.get('hourly_rate'),
                operating_hours: formData.get('operating_hours'),
                primary_daw: formData.get('primary_daw'),
                equipment: formData.get('equipment'),
                current_booking: formData.get('current_booking'),
                interest_reason: formData.get('interest_reason'),
                heard_about: formData.get('heard_about'),
                created_at: new Date().toISOString(),
                status: 'pending'
            };
            
            const submitButton = studioForm.querySelector('.submit-btn');
            const originalText = submitButton.textContent;
            
            // Disable button and show loading state
            submitButton.disabled = true;
            submitButton.textContent = 'Submitting...';
            
            // Hide any previous messages
            formMessage.style.display = 'none';
            
            // Submit to Supabase
            const result = await submitToSupabase(studioData);
            
            if (result.success) {
                showFormMessage('Thank you! Your studio registration has been submitted successfully. We\'ll be in touch soon!', 'success');
                studioForm.reset(); // Clear the form
            } else {
                showFormMessage('There was an error submitting your registration. Please try again or contact us directly.', 'error');
            }
            
            // Re-enable button
            submitButton.disabled = false;
            submitButton.textContent = originalText;
        });
    }
    
    // Dark mode toggle
    const body = document.body;
    
    // Add dark mode toggle button
    const toggleButton = document.createElement('button');
    toggleButton.classList.add('mode-toggle');
    toggleButton.id = 'dark-mode-toggle'; // Add ID for reference in other scripts
    toggleButton.innerHTML = '<i class="fas fa-moon"></i>';
    document.body.appendChild(toggleButton);
    
    // Check if user prefers dark mode
    const prefersDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDarkMode) {
        body.classList.add('dark-mode');
        toggleButton.innerHTML = '<i class="fas fa-sun"></i>';
        // Initialize dark mode favicons
        updateFavicons(true);
    } else {
        // Initialize light mode favicons
        updateFavicons(false);
    }
    
    // Function to update favicons based on theme
    function updateFavicons(isDarkMode) {
        const themeFolder = isDarkMode ? 'dark' : 'light';
        
        // Update all favicon links
        document.querySelector('link[rel="icon"]').href = `favicon/${themeFolder}/apple-icon.png`;
        document.querySelector('link[rel="apple-touch-icon"]').href = `favicon/${themeFolder}/apple-icon.png`;
        document.querySelectorAll('link[rel="apple-touch-icon"][sizes]').forEach(link => {
            const size = link.getAttribute('sizes');
            link.href = `favicon/${themeFolder}/apple-icon-${size}.png`;
        });
        document.querySelector('link[rel="icon"][sizes="192x192"]').href = `favicon/${themeFolder}/android-icon-192x192.png`;
        document.querySelector('link[rel="icon"][sizes="96x96"]').href = `favicon/${themeFolder}/favicon-96x96.png`;
        document.querySelector('link[rel="manifest"]').href = `favicon/${themeFolder}/manifest.json`;
        document.querySelector('meta[name="msapplication-TileImage"]').content = `favicon/${themeFolder}/ms-icon-144x144.png`;
    }
    
    // Toggle dark mode
    toggleButton.addEventListener('click', () => {
        body.classList.toggle('dark-mode');
        const isDarkMode = body.classList.contains('dark-mode');
        
        if (isDarkMode) {
            toggleButton.innerHTML = '<i class="fas fa-sun"></i>';
            updateFavicons(true);
        } else {
            toggleButton.innerHTML = '<i class="fas fa-moon"></i>';
            updateFavicons(false);
        }
    });
    
    // Handle subscription form with improved validation
    const subscribeForm = document.getElementById('subscribe-form');
    const successMessage = document.getElementById('success-message');
    const emailInput = document.getElementById('email');
    
    function validateEmail(email) {
        const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return regex.test(email);
    }
    
    emailInput.addEventListener('input', () => {
        const email = emailInput.value;
        if (validateEmail(email)) {
            emailInput.setCustomValidity('');
        } else {
            emailInput.setCustomValidity('Please enter a valid email address');
        }
    });
    
    // Initialize EmailJS
    (function() {
        emailjs.init('WpKgdxlt2TVymbQ1O');
    })();

    subscribeForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = emailInput.value;
        
        if (!validateEmail(email)) {
            emailInput.reportValidity();
            return;
        }
        
        const submitButton = subscribeForm.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        
        submitButton.disabled = true;
        submitButton.textContent = 'Sending...';
        
        // Prepare the email parameters
        const templateParams = {
            to_email: 'yishaystewartmitchell@gmail.com',
            email: email,
            message: `New newsletter subscription request`,
            time: new Date().toLocaleString()
        };
        
        // Send email using EmailJS
        emailjs.send(
            'service_3edcf5g',
            'template_20kbkoq',
            templateParams
        )
        .then((response) => {
            console.log('SUCCESS!', response.status, response.text);
            
            // Show success message
            subscribeForm.style.display = 'none';
            successMessage.style.display = 'block';
            
            // Reset form
            subscribeForm.reset();
            
            // Reset the form after 5 seconds
            setTimeout(() => {
                successMessage.style.display = 'none';
                subscribeForm.style.display = 'flex';
            }, 5000);
        }, (error) => {
            console.error('FAILED...', error);
            alert('There was an issue submitting your email. Please try again.');
        })
        .finally(() => {
            // Re-enable button
            submitButton.disabled = false;
            submitButton.textContent = originalText;
        });
    });
    
    // Accessibility enhancement: make ESC key close success message
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && successMessage.style.display === 'block') {
            successMessage.style.display = 'none';
            subscribeForm.style.display = 'flex';
        }
    });
});
