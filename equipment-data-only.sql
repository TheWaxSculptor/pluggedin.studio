-- Equipment Data Insert Only
-- This script only inserts data, assumes table and policies already exist

-- Clear any existing data first (optional)
-- DELETE FROM public.equipment;

-- Insert sample equipment data
INSERT INTO public.equipment (name, brand, model, category, studio_id, room, description, image_url) VALUES
(
    'U87',
    'Neumann',
    'U87 Ai',
    'Microphones',
    '1',
    'Studio A',
    'Professional large-diaphragm condenser microphone, industry standard for vocals and instruments',
    'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400'
),
(
    '4000 E Console',
    'SSL',
    '4000 E',
    'Mixing Consoles',
    '1',
    'Studio A',
    'Legendary analog mixing console used on countless hit records',
    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400'
),
(
    'NS-10M',
    'Yamaha',
    'NS-10M Studio',
    'Studio Monitors',
    '2',
    'Studio B',
    'Near-field reference monitors, the industry standard for mixing',
    'https://images.unsplash.com/photo-1545127398-14699f92334b?w=400'
),
(
    'HDX System',
    'Avid',
    'Pro Tools HDX',
    'Digital Audio Workstations',
    '2',
    'Studio B',
    'Professional digital audio workstation with HDX DSP processing',
    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400'
),
(
    'Stratocaster',
    'Fender',
    'American Professional II',
    'Instruments',
    '3',
    'Studio C',
    'Classic electric guitar, perfect for recording sessions',
    'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=400'
);

-- Verify the data was inserted
SELECT COUNT(*) as total_equipment FROM public.equipment;
SELECT name, brand, category, studio_id FROM public.equipment ORDER BY created_at;
