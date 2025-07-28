-- Simple Equipment Data Insertion
-- This works with the existing equipment table structure

-- First, let's see what columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'equipment' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Insert equipment data using only basic columns that likely exist
INSERT INTO public.equipment (name, category, description) VALUES
('Neumann U87 Microphone', 'Microphones', 'Professional large-diaphragm condenser microphone'),
('SSL 4000 E Console', 'Mixing Consoles', 'Legendary analog mixing console'),
('Yamaha NS-10M Monitors', 'Studio Monitors', 'Near-field reference monitors'),
('Pro Tools HDX System', 'Digital Audio Workstations', 'Professional digital audio workstation'),
('Fender Stratocaster', 'Instruments', 'Classic electric guitar');

-- Verify the data was inserted
SELECT COUNT(*) as total_equipment FROM public.equipment;
SELECT * FROM public.equipment ORDER BY id;
