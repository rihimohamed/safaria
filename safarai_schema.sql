-- =========================================================================
-- SAFARAI - POSTGRESQL DATABASE SCHEMA
-- =========================================================================
-- This schema establishes the relational backbone for the SafarAI App.
-- Includes Row Level Security (RLS) and granular Roles for a
-- production-ready BaaS environment (like Supabase).
-- =========================================================================

-- Enable UUID extension for secure, unguessable primary keys
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 0. ROLES (Assuming standard PostgREST / Supabase setup)
-- ==========================================
-- (PostgreSQL standard roles. Note: Environments like Supabase create these automatically)
-- DO NOT run CREATE ROLE if you are on Supabase; it already has anon/authenticated roles.
-- CREATE ROLE anon NOLOGIN;
-- CREATE ROLE authenticated NOLOGIN;
-- GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- ==========================================
-- 1. USERS TABLE
-- Stores authentication data and user profile info.
-- ==========================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL, -- Encrypted password or OAuth token
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    avatar_url TEXT,
    preferences JSONB DEFAULT '{}', -- E.g. {"budget": "$$", "climate": "Sunny"}
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can only read and update their OWN profile.
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- ==========================================
-- 2. DESTINATIONS TABLE (Optional Cache)
-- ==========================================
CREATE TABLE destinations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    country VARCHAR(100) DEFAULT 'Morocco',
    climate VARCHAR(50), 
    fallback_image_url TEXT,
    is_ai_recommended BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE destinations ENABLE ROW LEVEL SECURITY;

-- Destinations are a global catalog. Everyone (even anonymous guests) can read them.
CREATE POLICY "Destinations are viewable by everyone" ON destinations
    FOR SELECT USING (true);
    
-- Only admins can insert/update destinations (Placeholder)
-- CREATE POLICY "Only admins can edit destinations" ON destinations FOR ALL USING (auth.role() = 'admin');

-- ==========================================
-- 3. SAVED PLACES (The "Bucket List")
-- ==========================================
CREATE TABLE saved_places (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    foursquare_venue_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    city VARCHAR(100),
    image_url TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, foursquare_venue_id)
);

ALTER TABLE saved_places ENABLE ROW LEVEL SECURITY;

-- Authenticated users have FULL control over their own saved places.
CREATE POLICY "Users control their own saved places" ON saved_places
    FOR ALL USING (auth.uid() = user_id);

-- ==========================================
-- 4. ITINERARIES
-- ==========================================
CREATE TABLE itineraries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    destination_id INTEGER REFERENCES destinations(id) ON DELETE SET NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_public BOOLEAN DEFAULT false,
    ai_generated BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE itineraries ENABLE ROW LEVEL SECURITY;

-- Users can manage their own itineraries
CREATE POLICY "Users manage own itineraries" ON itineraries
    FOR ALL USING (auth.uid() = user_id);

-- Public itineraries can be read by anyone
CREATE POLICY "Anyone can view public itineraries" ON itineraries
    FOR SELECT USING (is_public = true);

-- ==========================================
-- 5. ITINERARY DAYS
-- ==========================================
CREATE TABLE itinerary_days (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    itinerary_id UUID REFERENCES itineraries(id) ON DELETE CASCADE,
    day_number INTEGER NOT NULL,
    date DATE NOT NULL,
    theme VARCHAR(255),
    UNIQUE(itinerary_id, day_number)
);

ALTER TABLE itinerary_days ENABLE ROW LEVEL SECURITY;

-- Access to days is dictated by access to the parent itinerary
CREATE POLICY "Users manage days of their itineraries" ON itinerary_days
    FOR ALL USING (
        EXISTS (SELECT 1 FROM itineraries WHERE itineraries.id = itinerary_days.itinerary_id AND itineraries.user_id = auth.uid())
    );

CREATE POLICY "Anyone can view days of public itineraries" ON itinerary_days
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM itineraries WHERE itineraries.id = itinerary_days.itinerary_id AND itineraries.is_public = true)
    );

-- ==========================================
-- 6. ITINERARY ACTIVITIES
-- ==========================================
CREATE TABLE itinerary_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    itinerary_day_id UUID REFERENCES itinerary_days(id) ON DELETE CASCADE,
    foursquare_venue_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    scheduled_start_time TIME,
    scheduled_end_time TIME,
    activity_type VARCHAR(50), 
    ai_reasoning TEXT, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE itinerary_activities ENABLE ROW LEVEL SECURITY;

-- Same relational security propagation as Days
CREATE POLICY "Users manage activities of their itineraries" ON itinerary_activities
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM itinerary_days 
            JOIN itineraries ON itineraries.id = itinerary_days.itinerary_id 
            WHERE itinerary_days.id = itinerary_activities.itinerary_day_id AND itineraries.user_id = auth.uid()
        )
    );

CREATE POLICY "Anyone can view activities of public itineraries" ON itinerary_activities
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM itinerary_days 
            JOIN itineraries ON itineraries.id = itinerary_days.itinerary_id 
            WHERE itinerary_days.id = itinerary_activities.itinerary_day_id AND itineraries.is_public = true
        )
    );

-- ==========================================
-- INDEXES FOR PERFORMANCE ⚡
-- ==========================================
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_saved_places_user ON saved_places(user_id);
CREATE INDEX idx_itineraries_user ON itineraries(user_id);
CREATE INDEX idx_activities_day ON itinerary_activities(itinerary_day_id);

-- ==========================================
-- TRIGGER: UPDATE TIMESTAMP (Optional Utility)
-- ==========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = CURRENT_TIMESTAMP;
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_modtime
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_itineraries_modtime
    BEFORE UPDATE ON itineraries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
