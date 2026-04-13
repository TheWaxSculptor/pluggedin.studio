// Supabase Configuration
// Replace the values below with your actual Supabase project credentials
// You can find these in your Supabase Dashboard: Settings → API

const SUPABASE_CONFIG = {
    // Your Supabase Project URL
    url: 'https://dovsqgkxxdpdkagzpykn.supabase.co',
    
    // Your Supabase anon/public API key
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvdnNxZ2t4eGRwZGthZ3pweWtuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwMjI1NjEsImV4cCI6MjA5MTU5ODU2MX0.SBQQ5IwYy16tmxmGAkS6co8rNl5kPsPjAlOXLHSnQw8'
};

// 🚨 IMPORTANT: After updating the values above, your form will be ready to use!
// The form will automatically connect to your Supabase database.

// Export for use in other files
window.SUPABASE_CONFIG = SUPABASE_CONFIG;
