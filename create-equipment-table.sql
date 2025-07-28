-- PluggedIn Equipment Table Creation and Data Insertion
-- Run this script in your Supabase SQL Editor

-- Step 1: Create the equipment table
CREATE TABLE IF NOT EXISTS public.equipment (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
-- Create equipment table (will not error if it already exists)
CREATE TABLE IF NOT EXISTS equipment (
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

-- Enable RLS (will not error if already enabled)
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;

-- Create fresh policies
CREATE POLICY "Allow public read access" ON equipment
FOR SELECT USING (true);

CREATE POLICY "Allow public insert access" ON equipment
FOR INSERT WITH CHECK (true);

-- Verify table was created
SELECT 'Equipment table created successfully!' as status;
