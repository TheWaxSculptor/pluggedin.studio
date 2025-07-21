// Supabase Configuration
// Replace the values below with your actual Supabase project credentials
// You can find these in your Supabase Dashboard: Settings → API

const SUPABASE_CONFIG = {
    // Your Supabase Project URL
    url: 'https://fdkrfyzcxhnhanodxopj.supabase.co',
    
    // Your Supabase anon/public API key
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZka3JmeXpjeGhuaGFub2R4b3BqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg3MTIwNTksImV4cCI6MjA2NDI4ODA1OX0.tbdvE-7bkxJ09fUxH2Ds9z1k-ricXU4ezDHqeseytao'
};

// 🚨 IMPORTANT: After updating the values above, your form will be ready to use!
// The form will automatically connect to your Supabase database.

// Export for use in other files
window.SUPABASE_CONFIG = SUPABASE_CONFIG;
