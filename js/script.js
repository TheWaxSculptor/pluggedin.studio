document.addEventListener('DOMContentLoaded', () => {
    // Set the launch date - 30 days from now
    const now = new Date();
    const launchDate = new Date(now);
    launchDate.setDate(launchDate.getDate() + 30);
    
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
    
    // Handle subscription form
    const subscribeForm = document.getElementById('subscribe-form');
    
    subscribeForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = subscribeForm.querySelector('input[type="email"]').value;
        
        // Here you would typically send this to your backend
        // For now, just show an alert
        alert(`Thank you! ${email} has been added to our notification list.`);
        
        // Clear the form
        subscribeForm.reset();
    });
});
