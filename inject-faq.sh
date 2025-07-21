#!/bin/bash

# This script injects the FAQ section into index.html
INDEX_FILE="index.html"

# Back up the original
cp -f "$INDEX_FILE" "${INDEX_FILE}.pre-faq.bak"

# Add CSS link if not present
if ! grep -q "faq.css" "$INDEX_FILE"; then
  sed -i '' 's|<link rel="stylesheet" href="css/modal.css?v=1.0">|<link rel="stylesheet" href="css/modal.css?v=1.0">\n    <link rel="stylesheet" href="css/faq.css">|' "$INDEX_FILE"
fi

# Find insertion point and add FAQ section
if ! grep -q "faq-section" "$INDEX_FILE"; then
  # Look for the social-feed-container as our insertion point
  sed -i '' 's|<div class="social-feed-container">|<section class="faq-section">\n    <div class="faq-container">\n        <h2>Frequently Asked Questions</h2>\n        <p class="faq-subtitle">Everything you need to know about PluggedIn.studio</p>\n        \n        <div class="faq-accordion">\n            <div class="faq-item">\n                <button class="faq-question" aria-expanded="false" aria-controls="faq-answer-1">\n                    <span>What is PluggedIn.studio?</span>\n                    <i class="fas fa-chevron-down"></i>\n                </button>\n                <div class="faq-answer" id="faq-answer-1">\n                    <p>PluggedIn.studio is a platform that connects music creators with recording studios. We make it easy to discover, book, and pay for studio time without the back-and-forth communication, helping both artists and studio owners streamline the process.</p>\n                </div>\n            </div>\n            \n            <div class="faq-item">\n                <button class="faq-question" aria-expanded="false" aria-controls="faq-answer-2">\n                    <span>How do I book a studio?</span>\n                    <i class="fas fa-chevron-down"></i>\n                </button>\n                <div class="faq-answer" id="faq-answer-2">\n                    <p>Booking a studio is simple! Browse available studios based on location, equipment, and price. Select your preferred date and time, complete the booking process, and receive instant confirmation. Our platform handles payments securely so you can focus on your music.</p>\n                </div>\n            </div>\n            \n            <div class="faq-item">\n                <button class="faq-question" aria-expanded="false" aria-controls="faq-answer-3">\n                    <span>I own a studio. How can I list it on PluggedIn?</span>\n                    <i class="fas fa-chevron-down"></i>\n                </button>\n                <div class="faq-answer" id="faq-answer-3">\n                    <p>Studio owners can sign up for a free account and create a detailed profile showcasing your space, equipment, and availability. Set your own rates and booking policies, manage your calendar, and get paid directly through our platform. We charge a small commission only when bookings are made.</p>\n                </div>\n            </div>\n            \n            <div class="faq-item">\n                <button class="faq-question" aria-expanded="false" aria-controls="faq-answer-4">\n                    <span>What if I need to cancel my booking?</span>\n                    <i class="fas fa-chevron-down"></i>\n                </button>\n                <div class="faq-answer" id="faq-answer-4">\n                    <p>Cancellation policies vary by studio. Each listing clearly displays the cancellation terms before you book. Many studios offer full refunds with 24-48 hours notice, while others may have stricter policies. Always check the specific terms before booking.</p>\n                </div>\n            </div>\n        </div>\n    </div>\n</section>\n\n<div class="social-feed-container">|' "$INDEX_FILE"
fi

# Add JS file reference if not present
if ! grep -q "faq.js" "$INDEX_FILE"; then
  sed -i '' 's|</body>|<script src="js/faq.js"></script>\n</body>|' "$INDEX_FILE"
fi

echo "FAQ section has been successfully injected into index.html!"
