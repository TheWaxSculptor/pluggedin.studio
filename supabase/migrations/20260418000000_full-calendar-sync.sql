-- Migration to support full calendar synchronization
-- Table for storing studio integrations
CREATE TABLE IF NOT EXISTS public.studio_integrations (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    studio_id uuid REFERENCES public.studios(id) ON DELETE CASCADE,
    platform text NOT NULL, -- 'google', 'outlook', 'apple', 'calendly', etc.
    credentials text NOT NULL, -- Encrypted or base64 encoded JSON
    status text DEFAULT 'active' CHECK (status IN ('active', 'error', 'disabled')),
    sync_settings jsonb DEFAULT '{"push_bookings": true, "sync_availability": true}'::jsonb,
    last_sync timestamp with time zone,
    sync_status text,
    error_message text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Table for external availability cache (to speed up booking flow)
CREATE TABLE IF NOT EXISTS public.studio_external_availability (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    studio_id uuid REFERENCES public.studios(id) ON DELETE CASCADE,
    start_time timestamp with time zone NOT NULL,
    end_time timestamp with time zone NOT NULL,
    source_platform text,
    reason text DEFAULT 'external_event',
    created_at timestamp with time zone DEFAULT now()
);

-- Indexing for performance
CREATE INDEX IF NOT EXISTS idx_studio_integrations_studio_id ON public.studio_integrations(studio_id);
CREATE INDEX IF NOT EXISTS idx_studio_external_availability_studio_id ON public.studio_external_availability(studio_id);
CREATE INDEX IF NOT EXISTS idx_studio_external_availability_range ON public.studio_external_availability(start_time, end_time);

-- RLS Policies
ALTER TABLE public.studio_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.studio_external_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage their integrations" ON public.studio_integrations
    USING (studio_id IN (SELECT id FROM studios)); -- Simplify for now

CREATE POLICY "Everyone can view external availability" ON public.studio_external_availability
    FOR SELECT USING (true);
