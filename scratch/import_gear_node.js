const fs = require('fs');
const path = require('path');

// Constants for Supabase
const SUPABASE_URL = 'https://dovsqgkxxdpdkagzpykn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvdnNxZ2t4eGRwZGthZ3pweWtuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwMjI1NjEsImV4cCI6MjA5MTU5ODU2MX0.SBQQ5IwYy16tmxmGAkS6co8rNl5kPsPjAlOXLHSnQw8';
const GEAR_HUB_STUDIO_ID = '446e21fc-b61d-4fbc-8912-37bc3a612232';

// CSV Path
const csvPath = '/Users/stirringstew/Documents/Electatech/PluggedIn.studio/Gearogs.warc/gearogs_list.csv';

async function importGear() {
    console.log('🚀 Starting gear ingestion...');

    try {
        const content = fs.readFileSync(csvPath, 'utf8');
        const lines = content.split('\n');
        
        // Skip header
        const dataLines = lines.slice(1).filter(line => line.trim().length > 0);
        console.log(`📊 Found ${dataLines.length} records to import.`);

        const equipment = dataLines.map((line, index) => {
            // Simple comma split (assuming no commas in fields for now based on head check)
            // If they have commas, this will need a more robust parser
            const parts = line.split(',');
            if (parts.length < 3) return null;

            const make = parts[0].trim();
            const model = parts[1].trim();
            const url = parts[2].trim();

            return {
                brand: make,
                name: model,
                description: `Sourced from Gearogs: ${url}`,
                studio_id: GEAR_HUB_STUDIO_ID,
                category: 'Marketplace Gear',
                room: 'Showroom'
            };
        }).filter(item => item !== null);

        console.log(`✅ Parsed ${equipment.length} valid items.`);

        // Bulk insert in chunks
        const chunkSize = 100;
        for (let i = 0; i < equipment.length; i += chunkSize) {
            const chunk = equipment.slice(i, i + chunkSize);
            
            const response = await fetch(`${SUPABASE_URL}/rest/v1/equipment`, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify(chunk)
            });

            if (!response.ok) {
                const error = await response.text();
                console.error(`❌ Error inserting chunk ${i/chunkSize + 1}:`, error);
            } else {
                console.log(`📦 Inserted chunk ${i/chunkSize + 1}/${Math.ceil(equipment.length / chunkSize)}`);
            }
        }

        console.log('🎉 Ingestion complete!');

    } catch (error) {
        console.error('❌ Critical error during ingestion:', error);
    }
}

importGear();
