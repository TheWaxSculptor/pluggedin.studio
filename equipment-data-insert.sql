-- PluggedIn Equipment Data Insertion (Schema-Aware)
-- First, let's check what columns exist in the equipment table

-- Step 1: Check the existing table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'equipment' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 2: Based on the error, the table likely has these columns:
-- Let's insert data using only the columns that exist
-- Common columns that likely exist: id, name, category, description, studio_id, image_url, specifications

-- Step 3: Insert sample equipment data (using basic columns)
INSERT INTO public.equipment (name, category, description, studio_id, image_url) VALUES
(
    'Neumann U87 Microphone',
    'Microphones',
    'Professional large-diaphragm condenser microphone, industry standard for vocals and instruments',
    1,
    'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400'
),
(
    'SSL 4000 E Console',
    'Mixing Consoles',
    'Legendary analog mixing console used on countless hit records',
    1,
    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400'
),
(
    'Yamaha NS-10M Monitors',
    'Studio Monitors',
    'Near-field reference monitors, the industry standard for mixing',
    2,
    'https://images.unsplash.com/photo-1545127398-14699f92334b?w=400'
),
(
    'Pro Tools HDX System',
    'Digital Audio Workstations',
    'Professional digital audio workstation with HDX DSP processing',
    2,
    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400'
),
(
    'Fender Stratocaster',
    'Instruments',
    'Classic electric guitar, perfect for recording sessions',
    3,
    'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=400'
);

-- Step 4: Verify the data was inserted
SELECT COUNT(*) as total_equipment FROM public.equipment;
SELECT name, category FROM public.equipment ORDER BY id;

-- Step 5: If you want to add the missing columns, uncomment and run these:
-- ALTER TABLE public.equipment ADD COLUMN IF NOT EXISTS price_per_hour DECIMAL(10,2);
-- ALTER TABLE public.equipment ADD COLUMN IF NOT EXISTS availability_status VARCHAR(50) DEFAULT 'available';
-- ALTER TABLE public.equipment ADD COLUMN IF NOT EXISTS specifications JSONB;

-- Success! Equipment data should now be inserted into your existing table.
