/**
 * FAQ Section Functionality
 * Handles the accordion behavior of the FAQ items
 */
document.addEventListener('DOMContentLoaded', function() {
    // Find all FAQ question buttons
    const faqQuestions = document.querySelectorAll('.faq-question');
    
    // Add click event listener to each question
    faqQuestions.forEach(question => {
        question.addEventListener('click', function() {
            // Get the answer element (next sibling after the question button)
            const answer = this.nextElementSibling;
            
            // Check if this question is already active
            const isActive = this.classList.contains('active');
            
            // First close all other open questions
            faqQuestions.forEach(q => {
                if (q !== this) {
                    // Remove active class from questions
                    q.classList.remove('active');
                    
                    // Close their answers
                    if (q.nextElementSibling) {
                        q.nextElementSibling.classList.remove('active');
                    }
                }
            });
            
            // Toggle this question
            if (isActive) {
                // If already active, close it
                this.classList.remove('active');
                answer.classList.remove('active');
            } else {
                // If not active, open it
                this.classList.add('active');
                answer.classList.add('active');
            }
        });
    });
    
    // Accessibility enhancement: Allow keyboard navigation
    faqQuestions.forEach(question => {
        // Add keyboard accessibility
        question.addEventListener('keydown', function(e) {
            // Handle Enter or Space key press
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                question.click();
            }
        });
        
        // Add appropriate ARIA attributes
        question.setAttribute('aria-expanded', 'false');
        const answerId = 'faq-answer-' + Math.random().toString(36).substring(2, 9);
        const answer = question.nextElementSibling;
        
        question.setAttribute('aria-controls', answerId);
        answer.id = answerId;
        
        // Update ARIA attributes when toggled
        question.addEventListener('click', function() {
            const expanded = this.classList.contains('active');
            this.setAttribute('aria-expanded', expanded);
        });
    });
});
