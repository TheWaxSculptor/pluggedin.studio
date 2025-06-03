// Serverless function for handling newsletter subscriptions
exports.handler = async function(event, context) {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
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
        body: JSON.stringify({ error: 'Invalid email address' })
      };
    }
    
    // In a real implementation, you would:
    // 1. Connect to a database or email service API
    // 2. Store the email or send it to your newsletter provider
    // 3. Implement proper error handling and rate limiting
    
    // Example integration points:
    // - Mailchimp API
    // - Airtable/Google Sheets API
    // - SendGrid API
    // - Your own database
    
    // For now, we'll log the email and return success
    console.log(`Subscription request received for: ${email}`);
    
    // Return success response
    return {
      statusCode: 200,
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
      body: JSON.stringify({ error: 'Server error processing your request' })
    };
  }
};

// Email validation function
function validateEmail(email) {
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return regex.test(email);
}
