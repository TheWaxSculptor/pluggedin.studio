// Supabase Configuration
// Replace the values below with your actual Supabase project credentials
// You can find these in your Supabase Dashboard: Settings → API

const SUPABASE_CONFIG = {
    // Your Supabase Project URL
    url: 'https://dovsqgkxxdpdkagzpykn.supabase.co',
    
    // Your Supabase anon/public API key
    anonKey: 'YOUR_NEW_ANON_KEY_HERE'
};

// 🚨 IMPORTANT: After updating the values above, your form will be ready to use!
// The form will automatically connect to your Supabase database.

// Export for use in other files
window.SUPABASE_CONFIG = SUPABASE_CONFIG;
