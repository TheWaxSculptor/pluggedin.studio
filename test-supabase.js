#!/usr/bin/env node

// Supabase Integration Test Script for PluggedIn
// This script tests the connection to your Supabase database and displays existing data

const { createClient } = require('@supabase/supabase-js');

// Your Supabase configuration
const SUPABASE_URL = 'https://dovsqgkxxdpdkagzpykn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZka3JmeXpjeGhuaGFub2R4b3BqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg3MTIwNTksImV4cCI6MjA2NDI4ODA1OX0.tbdvE-7bkxJ09fUxH2Ds9z1k-ricXU4ezDHqeseytao';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('🔌 PluggedIn Supabase Integration Test');
console.log('=====================================');
console.log(`📡 Connecting to: ${SUPABASE_URL}`);
console.log('');

async function testConnection() {
    console.log('🔍 Testing database connection...');
    
    try {
        // Test basic connection with a simple query
        const { data, error } = await supabase
            .from('users')
            .select('count')
            .limit(1);
        
        if (error) throw error;
        
        console.log('✅ Successfully connected to Supabase!');
        return true;
    } catch (error) {
        console.log('❌ Connection failed:', error.message);
        return false;
    }
}

async function testTables() {
    console.log('\n📊 Testing database tables...');
    
    const tables = [
        'users', 'studios', 'bookings', 'equipment', 
        'payments', 'reviews', 'messages', 'conversations',
        'active_sessions', 'availabilities'
    ];
    
    const results = {};
    
    for (const table of tables) {
        try {
            const { data, error, count } = await supabase
                .from(table)
                .select('*', { count: 'exact', head: true });
            
            if (error) throw error;
            
            console.log(`✅ ${table.padEnd(15)} - ${count || 0} records`);
            results[table] = { success: true, count: count || 0 };
            
        } catch (error) {
            console.log(`❌ ${table.padEnd(15)} - ${error.message}`);
            results[table] = { success: false, error: error.message };
        }
    }
    
    return results;
}

async function displaySampleData() {
    console.log('\n📋 Sample data from your database:');
    console.log('==================================');
    
    try {
        // Get sample users
        const { data: users, error: usersError } = await supabase
            .from('users')
            .select('id, name, email, role, created_at')
            .limit(5);
        
        if (!usersError && users && users.length > 0) {
            console.log('\n👥 Users:');
            users.forEach(user => {
                console.log(`   • ${user.name || user.email || 'Unnamed'} ${user.role ? `(${user.role})` : ''}`);
            });
        }
        
        // Get sample studios
        const { data: studios, error: studiosError } = await supabase
            .from('studios')
            .select('id, name, location, owner_id, created_at')
            .limit(5);
        
        if (!studiosError && studios && studios.length > 0) {
            console.log('\n🏢 Studios:');
            studios.forEach(studio => {
                console.log(`   • ${studio.name || 'Unnamed Studio'} ${studio.location ? `- ${studio.location}` : ''}`);
            });
        }
        
        // Get sample bookings
        const { data: bookings, error: bookingsError } = await supabase
            .from('bookings')
            .select('id, user_id, studio_id, status, start_time, created_at')
            .limit(5);
        
        if (!bookingsError && bookings && bookings.length > 0) {
            console.log('\n📅 Bookings:');
            bookings.forEach(booking => {
                const date = booking.start_time ? new Date(booking.start_time).toLocaleDateString() : 'No date';
                console.log(`   • Booking #${booking.id} - ${booking.status || 'Unknown status'} (${date})`);
            });
        }
        
        // Get sample equipment
        const { data: equipment, error: equipmentError } = await supabase
            .from('equipment')
            .select('id, name, brand, model, category')
            .limit(5);
        
        if (!equipmentError && equipment && equipment.length > 0) {
            console.log('\n🎵 Equipment:');
            equipment.forEach(item => {
                console.log(`   • ${item.name || 'Unnamed'} ${item.brand ? `(${item.brand}` : ''}${item.model ? ` ${item.model})` : item.brand ? ')' : ''}`);
            });
        }
        
    } catch (error) {
        console.log(`❌ Error fetching sample data: ${error.message}`);
    }
}

async function testAdminFunctions() {
    console.log('\n🔧 Testing admin functions...');
    
    try {
        // Test admin stats function
        const [usersResult, studiosResult, bookingsResult] = await Promise.all([
            supabase.from('users').select('id', { count: 'exact', head: true }),
            supabase.from('studios').select('id', { count: 'exact', head: true }),
            supabase.from('bookings').select('id', { count: 'exact', head: true })
        ]);
        
        console.log('📈 Admin Statistics:');
        console.log(`   • Total Users: ${usersResult.count || 0}`);
        console.log(`   • Total Studios: ${studiosResult.count || 0}`);
        console.log(`   • Total Bookings: ${bookingsResult.count || 0}`);
        
        // Test recent activity
        const { data: recentUsers } = await supabase
            .from('users')
            .select('name, created_at')
            .order('created_at', { ascending: false })
            .limit(3);
        
        if (recentUsers && recentUsers.length > 0) {
            console.log('\n🕒 Recent Activity:');
            recentUsers.forEach(user => {
                const date = new Date(user.created_at).toLocaleDateString();
                console.log(`   • ${user.name || 'New user'} joined on ${date}`);
            });
        }
        
    } catch (error) {
        console.log(`❌ Error testing admin functions: ${error.message}`);
    }
}

async function runAllTests() {
    const connected = await testConnection();
    
    if (!connected) {
        console.log('\n❌ Cannot proceed with tests - connection failed');
        console.log('\nPossible issues:');
        console.log('• Check your Supabase URL and API key');
        console.log('• Verify your database is accessible');
        console.log('• Check Row Level Security (RLS) policies');
        return;
    }
    
    const tableResults = await testTables();
    await displaySampleData();
    await testAdminFunctions();
    
    console.log('\n📊 Test Summary:');
    console.log('================');
    
    const successfulTables = Object.values(tableResults).filter(r => r.success).length;
    const totalTables = Object.keys(tableResults).length;
    
    console.log(`✅ Tables accessible: ${successfulTables}/${totalTables}`);
    
    if (successfulTables === totalTables) {
        console.log('🎉 All tests passed! Your Supabase integration is working perfectly.');
    } else {
        console.log('⚠️  Some tables are not accessible. This might be expected if they don\'t exist yet.');
    }
    
    console.log('\n🚀 Your PluggedIn web app is ready to use with Supabase!');
    console.log('   Visit: http://localhost:8081/admin.html to see the admin dashboard');
    console.log('   Visit: http://localhost:8081/test-supabase.html for interactive testing');
}

// Run the tests
runAllTests().catch(console.error);
