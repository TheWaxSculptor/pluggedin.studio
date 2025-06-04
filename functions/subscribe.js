// Import the required EmailJS module
const { SMTPClient } = require('emailjs');

// Environment variables for EmailJS (set these in Netlify dashboard)
// EMAILJS_USER - Your EmailJS user ID
// EMAILJS_TEMPLATE - Your EmailJS template ID
// EMAILJS_SERVICE - Your EmailJS service ID
// EMAILJS_ACCESS_TOKEN - Your EmailJS access token (private key)

// Serverless function for handling newsletter subscriptions
exports.handler = async function(event, context) {
  // Set up CORS headers for local development and production
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };
  
  // Handle OPTIONS requests (pre-flight CORS check)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }
  
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }
  
  try {
    // Parse the incoming request body
    const data = JSON.parse(event.body);
    const email = data.email;
    
    // Basic validation
    if (!email || !validateEmail(email)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid email address' })
      };
    }
    
    // For development/testing without EmailJS credentials, just log the email
    if (!process.env.EMAILJS_USER) {
      console.log(`Subscription request received for: ${email} (Development mode - no email sent)`);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          message: 'Subscription successful (development mode)',
          email: email
        })
      };
    }
    
    // Store the email (this would normally go to a database)
    // For simplicity, we'll send an email notification to the site owner
    try {
      const client = new SMTPClient({
        user: process.env.EMAILJS_USER,
        password: process.env.EMAILJS_PASSWORD,
        host: process.env.EMAILJS_HOST,
        ssl: true
      });
      
      await client.sendAsync({
        text: `New subscription: ${email}`,
        from: process.env.NOTIFICATION_FROM_EMAIL || 'pluggedin.studio@example.com',
        to: process.env.NOTIFICATION_TO_EMAIL || 'yishaystewartmitchell@gmail.com',
        subject: 'New PluggedIn.studio Subscription'
      });
      
      console.log(`Email notification sent for new subscriber: ${email}`);
    } catch (emailError) {
      console.error('Failed to send email notification:', emailError);
      // We'll still consider the subscription successful even if notification fails
    }
    
    // Return success response
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Subscription successful',
        email: email
      })
    };
  } catch (error) {
    console.error('Subscription error:', error);
    
    // Return error response
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Server error processing your request' })
    };
  }
};

// Email validation function
function validateEmail(email) {
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return regex.test(email);
}
