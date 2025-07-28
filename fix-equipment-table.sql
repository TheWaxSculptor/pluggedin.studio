-- FOOLPROOF Equipment Table Creation and Data Import
-- Copy and paste this ENTIRE script into your Supabase SQL Editor and run it

-- Step 1: Drop table if it exists (clean slate)
DROP TABLE IF EXISTS equipment CASCADE;

-- Step 2: Create equipment table with all necessary columns
CREATE TABLE equipment (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    brand TEXT,
    model TEXT,
    category TEXT,
    studio_id TEXT,
    room TEXT,
    description TEXT,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Enable RLS
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;

-- Step 4: Create policies for public access
CREATE POLICY "Allow public read access" ON equipment
FOR SELECT USING (true);

CREATE POLICY "Allow public insert access" ON equipment
FOR INSERT WITH CHECK (true);

-- Step 5: Insert your real equipment data
INSERT INTO equipment (name, brand, model, category, studio_id, room, description, image_url) VALUES
-- Soundwave Studios Equipment
('Condenser Microphone', 'Neumann', 'TLM 103', 'Condenser Microphone', 'soundwave', 'Main Room', 'Neumann TLM 103 - Professional condenser microphone', 'https://via.placeholder.com/300x200?text=TLM%20103'),
('Audio Interface', 'Universal Audio', 'Apollo x8', 'Audio Interface', 'soundwave', 'Main Room', 'Universal Audio Apollo x8 - Professional audio interface', 'https://via.placeholder.com/300x200?text=Apollo%20x8'),
('Studio Monitors', 'Adam Audio', 'A7V', 'Studio Monitors', 'soundwave', 'Main Room', 'Adam Audio A7V - Professional studio monitors', 'https://via.placeholder.com/300x200?text=A7V'),

-- Platinum Sound Equipment
('Mixing Console', 'SSL', 'AWS 900+', 'Mixing Console', 'platinum', 'SSL Suite', 'SSL AWS 900+ - Professional mixing console', 'https://via.placeholder.com/300x200?text=AWS%20900%2B'),
('Condenser Microphone', 'Neumann', 'U87', 'Condenser Microphone', 'platinum', 'SSL Suite', 'Neumann U87 - Professional condenser microphone', 'https://via.placeholder.com/300x200?text=U87'),
('Compressor', 'Universal Audio', '1176', 'Compressor', 'platinum', 'SSL Suite', 'Universal Audio 1176 - Professional compressor', 'https://via.placeholder.com/300x200?text=1176'),

-- Broadcast Hub Equipment
('Microphone', 'Shure', 'SM7B', 'Microphone', 'broadcast', 'Podcast Studio A', 'Shure SM7B - Professional microphone', 'https://via.placeholder.com/300x200?text=SM7B'),
('Audio Interface', 'Universal Audio', 'Apollo Twin X', 'Audio Interface', 'broadcast', 'Podcast Studio A', 'Universal Audio Apollo Twin X - Professional audio interface', 'https://via.placeholder.com/300x200?text=Apollo%20Twin%20X'),
('Headphones', 'Sony', 'MDR-7506', 'Headphones', 'broadcast', 'Podcast Studio A', 'Sony MDR-7506 - Professional headphones', 'https://via.placeholder.com/300x200?text=MDR-7506');

-- Step 6: Verify the data was inserted
SELECT 
    'SUCCESS: Equipment table created and data inserted!' as status,
    COUNT(*) as total_equipment,
    COUNT(DISTINCT category) as categories,
    COUNT(DISTINCT studio_id) as studios
FROM equipment;

-- Step 7: Show sample data
SELECT name, brand, model, category, studio_id FROM equipment ORDER BY studio_id, name;
