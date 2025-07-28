-- PluggedIn Equipment Table Creation and Data Insertion
-- Run this complete script in your Supabase SQL Editor

-- Step 1: Create the equipment table
CREATE TABLE IF NOT EXISTS public.equipment (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    price_per_hour DECIMAL(10,2),
    availability_status VARCHAR(50) DEFAULT 'available',
    studio_id INTEGER,
    image_url VARCHAR(500),
    specifications JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Enable Row Level Security
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;

-- Step 3: Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow public read access" ON public.equipment;
DROP POLICY IF EXISTS "Allow public insert access" ON public.equipment;

-- Step 4: Create RLS policies for public access
CREATE POLICY "Allow public read access" ON public.equipment
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert access" ON public.equipment
    FOR INSERT WITH CHECK (true);

-- Step 5: Insert sample equipment data
INSERT INTO public.equipment (name, category, description, price_per_hour, availability_status, studio_id, image_url, specifications) VALUES
(
    'Neumann U87 Microphone',
    'Microphones',
    'Professional large-diaphragm condenser microphone, industry standard for vocals and instruments',
    25.00,
    'available',
    1,
    'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400',
    '{"type": "Condenser", "polar_pattern": "Cardioid/Omnidirectional/Figure-8", "frequency_response": "20Hz-20kHz", "max_spl": "127dB"}'::jsonb
),
(
    'SSL 4000 E Console',
    'Mixing Consoles',
    'Legendary analog mixing console used on countless hit records',
    150.00,
    'available',
    1,
    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400',
    '{"channels": "48", "eq_bands": "4", "dynamics": "Compressor/Gate", "automation": "G+ Automation"}'::jsonb
),
(
    'Yamaha NS-10M Monitors',
    'Studio Monitors',
    'Near-field reference monitors, the industry standard for mixing',
    15.00,
    'available',
    2,
    'https://images.unsplash.com/photo-1545127398-14699f92334b?w=400',
    '{"type": "2-way", "woofer": "6.5 inch", "tweeter": "1 inch dome", "frequency_response": "60Hz-20kHz"}'::jsonb
),
(
    'Pro Tools HDX System',
    'Digital Audio Workstations',
    'Professional digital audio workstation with HDX DSP processing',
    75.00,
    'available',
    2,
    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400',
    '{"tracks": "Unlimited", "sample_rate": "Up to 192kHz", "bit_depth": "Up to 32-bit", "dsp_cards": "2x HDX"}'::jsonb
),
(
    'Fender Stratocaster',
    'Instruments',
    'Classic electric guitar, perfect for recording sessions',
    20.00,
    'available',
    3,
    'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=400',
    '{"type": "Electric Guitar", "pickups": "3x Single Coil", "neck": "Maple", "body": "Alder"}'::jsonb
);

-- Step 6: Verify the data was inserted
SELECT COUNT(*) as total_equipment FROM public.equipment;
SELECT name, category, price_per_hour FROM public.equipment ORDER BY id;

-- Success! Your equipment table is now ready for the PluggedIn web app.
