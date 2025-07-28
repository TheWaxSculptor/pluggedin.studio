-- Equipment Data Insertion Script
-- Run this AFTER creating the equipment table

-- Insert sample equipment data
INSERT INTO equipment (name, brand, model, category, studio_id, room, description, image_url) VALUES
('Yamaha Grand Piano', 'Yamaha', 'C7X', 'Piano', 'studio_1', 'Main Room', 'Professional 7-foot grand piano with exceptional sound quality', 'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=400'),
('Neumann U87 Microphone', 'Neumann', 'U87', 'Microphone', 'studio_1', 'Vocal Booth', 'Industry-standard large-diaphragm condenser microphone', 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400'),
('SSL 4000 Series Console', 'SSL', '4000E', 'Mixing Console', 'studio_1', 'Control Room', 'Legendary analog mixing console used on countless hit records', 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400'),
('Fender Stratocaster', 'Fender', 'American Professional II', 'Guitar', 'studio_2', 'Live Room', 'Classic electric guitar with versatile tone options', 'https://images.unsplash.com/photo-1564186763535-ebb21ef5277f?w=400'),
('Roland TR-808 Drum Machine', 'Roland', 'TR-808', 'Drum Machine', 'studio_2', 'Production Room', 'Iconic drum machine that shaped modern music production', 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400'),
('Moog Minimoog Synthesizer', 'Moog', 'Minimoog Model D', 'Synthesizer', 'studio_3', 'Synth Room', 'Classic analog synthesizer with warm, rich tones', 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400'),
('AKG C414 Microphone', 'AKG', 'C414 XLS', 'Microphone', 'studio_3', 'Recording Booth', 'Versatile large-diaphragm microphone for vocals and instruments', 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400'),
('Pro Tools HDX System', 'Avid', 'HDX', 'Audio Interface', 'studio_1', 'Control Room', 'Professional digital audio workstation system', 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400');

-- Verify data was inserted
SELECT COUNT(*) as equipment_count FROM equipment;
SELECT 'Equipment data inserted successfully!' as status;
