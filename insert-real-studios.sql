-- Create studios table with necessary columns
CREATE TABLE IF NOT EXISTS studios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    location TEXT,
    description TEXT,
    hourly_rate DECIMAL,
    rating DECIMAL,
    image TEXT,
    cover_image TEXT,
    type TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Uncomment the next line if you want to clear out existing dummy studios before inserting the real ones:
-- TRUNCATE TABLE studios CASCADE;

-- Insert real studios
INSERT INTO studios (name, location, description, hourly_rate, rating, image, cover_image, type) VALUES 
-- Brooklyn, NY Studios
('Strange Weather Brooklyn', 'Brooklyn, NY', 'A premier analog recording studio located in Brooklyn. Features a massive tracking room, natural light, and a legendary 32-channel API console.', 125.00, 4.9, 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', 'Professional'),
('Grand Street Recording', 'Brooklyn, NY', 'Boutique recording studio in Williamsburg offering an extensive collection of vintage outboard gear and modern digital workflows.', 95.00, 4.8, 'https://images.unsplash.com/photo-1621619856624-42fd193a0661?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', 'https://images.unsplash.com/photo-1621619856624-42fd193a0661?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', 'Professional'),
('Mission Sound', 'Brooklyn, NY', 'Located in the heart of Williamsburg, known for its incredible vintage Neve console and massive live room loved by indie bands.', 150.00, 4.9, 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', 'Professional'),

-- Near Miami / Coral Gables, FL Studios (Substituting for Carroll Gardens, FL)
('Hit Factory Criteria', 'Miami, FL', 'Legendary recording studio where countless platinum records have been made. Features state-of-the-art acoustics and multiple SSL consoles.', 200.00, 5.0, 'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', 'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', 'Professional'),
('Bay Eight Recording Studios', 'North Miami, FL', 'Award-winning recording facility catering to major labels and independent artists alike. Features a massive live room and high-end outboard gear.', 110.00, 4.9, 'https://images.unsplash.com/photo-1598653222000-6b7b7a552625?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', 'https://images.unsplash.com/photo-1598653222000-6b7b7a552625?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', 'Professional'),
('House of Hits Recording Studio', 'Miami, FL', 'Luxury recording experience featuring multi-platinum engineers, elite vocal chains, and high-end production suites.', 150.00, 4.9, 'https://images.unsplash.com/photo-1643116774075-acc00caa9a7b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', 'https://images.unsplash.com/photo-1643116774075-acc00caa9a7b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', 'Professional');

-- If you are using studio_registrations as your primary table instead of studios, you can run this as well (Optional):
-- INSERT INTO studio_registrations (name, location, description, hourly_rate)
-- SELECT name, location, description, hourly_rate FROM studios;
