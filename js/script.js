document.addEventListener('DOMContentLoaded', () => {
    // Loading indicator
    const loader = document.getElementById('page-loader');
    
    // Hide loader when page is fully loaded
    window.addEventListener('load', () => {
        setTimeout(() => {
            loader.classList.add('loader-hidden');
        }, 500); // Small delay for smoother transition
    });
    
    // Set a specific launch date (July 3rd, 2025)
    const launchDate = new Date('2025-07-03T00:00:00');
    
    // Update countdown timer
    function updateCountdown() {
        const currentTime = new Date();
        const diff = launchDate - currentTime;
        
        // Calculate time units
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        // Update DOM
        document.getElementById('days').textContent = days.toString().padStart(2, '0');
        document.getElementById('hours').textContent = hours.toString().padStart(2, '0');
        document.getElementById('minutes').textContent = minutes.toString().padStart(2, '0');
        document.getElementById('seconds').textContent = seconds.toString().padStart(2, '0');
    }
    
    // Initial call
    updateCountdown();
    
    // Update every second
    setInterval(updateCountdown, 1000);
    
    // Dark mode toggle
    const body = document.body;
    
    // Add dark mode toggle button
    const toggleButton = document.createElement('button');
    toggleButton.classList.add('mode-toggle');
    toggleButton.innerHTML = '<i class="fas fa-moon"></i>';
    document.body.appendChild(toggleButton);
    
    // Check if user prefers dark mode
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        body.classList.add('dark-mode');
        toggleButton.innerHTML = '<i class="fas fa-sun"></i>';
    }
    
    // Toggle dark mode
    toggleButton.addEventListener('click', () => {
        body.classList.toggle('dark-mode');
        
        if (body.classList.contains('dark-mode')) {
            toggleButton.innerHTML = '<i class="fas fa-sun"></i>';
        } else {
            toggleButton.innerHTML = '<i class="fas fa-moon"></i>';
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
