-- PluggedIn Studio Database Migration Script
-- Paste this entire script into the Supabase Dashboard -> SQL Editor and Run

SET search_path = public;
CREATE SEQUENCE IF NOT EXISTS public.studio_registrations_id_seq;

CREATE TABLE public.availabilities (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    studio_id uuid NOT NULL,
    day_of_week integer NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT valid_day CHECK (((day_of_week >= 0) AND (day_of_week <= 6)))
);
CREATE TABLE public.bookings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    studio_id uuid NOT NULL,
    user_id uuid NOT NULL,
    booking_date date NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT valid_status CHECK ((status = ANY (ARRAY['pending'::text, 'confirmed'::text, 'canceled'::text])))
);
CREATE TABLE public.conversation_participants (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    conversation_id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
CREATE TABLE public.conversations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
CREATE TABLE public.equipment (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    brand text,
    model text,
    category text,
    studio_id text,
    room text,
    description text,
    image_url text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE TABLE public.messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    conversation_id uuid NOT NULL,
    sender_id uuid NOT NULL,
    content text NOT NULL,
    read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
CREATE TABLE public.studio_registrations (
    id integer NOT NULL,
    studio_name text NOT NULL,
    contact_name text NOT NULL,
    contact_email text NOT NULL,
    phone text,
    city text NOT NULL,
    state text NOT NULL,
    studio_type text NOT NULL,
    studio_size text,
    hourly_rate text,
    operating_hours text,
    primary_daw text,
    equipment text,
    current_booking text,
    interest_reason text,
    heard_about text,
    created_at timestamp with time zone DEFAULT now(),
    status text DEFAULT 'pending'::text,
    name text,
    location text,
    description text,
    rating numeric
);
CREATE TABLE public.studios (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    location text,
    description text,
    hourly_rate numeric,
    rating numeric,
    amenities text[],
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now()
);
CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    full_name text,
    avatar_url text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY public.availabilities
    ADD CONSTRAINT availabilities_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.conversation_participants
    ADD CONSTRAINT conversation_participants_conversation_id_user_id_key UNIQUE (conversation_id, user_id);
ALTER TABLE ONLY public.conversation_participants
    ADD CONSTRAINT conversation_participants_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.equipment
    ADD CONSTRAINT equipment_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.studio_registrations
    ADD CONSTRAINT studio_registrations_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.studios
    ADD CONSTRAINT studios_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);
ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);
ALTER TABLE ONLY public.conversation_participants
    ADD CONSTRAINT conversation_participants_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.conversation_participants
    ADD CONSTRAINT conversation_participants_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.studio_registrations ALTER COLUMN id SET DEFAULT nextval('public.studio_registrations_id_seq'::regclass);


--
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
ALTER TABLE ONLY public.availabilities
    ADD CONSTRAINT availabilities_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.conversation_participants
    ADD CONSTRAINT conversation_participants_conversation_id_user_id_key UNIQUE (conversation_id, user_id);
ALTER TABLE ONLY public.conversation_participants
    ADD CONSTRAINT conversation_participants_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.equipment
    ADD CONSTRAINT equipment_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.studio_registrations
    ADD CONSTRAINT studio_registrations_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.studios
    ADD CONSTRAINT studios_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);
ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);
ALTER TABLE ONLY public.conversation_participants
    ADD CONSTRAINT conversation_participants_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.conversation_participants
    ADD CONSTRAINT conversation_participants_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id) ON DELETE CASCADE;

INSERT INTO public.studios (id, name, location, description, hourly_rate, rating, is_active, created_at) VALUES
('b3d6bcd9-3aaf-477f-af40-a686a424af92', 'Soundwave Studios', 'Brooklyn, NY', 'Professional recording studio with top-tier equipment', 75.0, 4.8, true, NOW()),
('8a0505a5-6d30-47ea-a705-c49e0ae6f13e', 'Platinum Sound', 'Manhattan, NY', 'Premium recording facility with SSL console', 195.0, 4.9, true, NOW()),
('4fe00c7b-e392-44bf-aa34-97e3c4ecb908', 'Broadcast Hub', 'Los Angeles, CA', 'Podcast-focused studio with broadcast-quality equipment', 85.0, 4.7, true, NOW());

INSERT INTO public.equipment (id, name, brand, model, category, studio_id, room, description, image_url) VALUES
('a010d88e-2ab3-4913-80ae-56195c1d052b', 'U87', 'Neumann', 'U87 Ai', 'Microphones', '1', 'Studio A', 'Professional large-diaphragm condenser microphone', 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400'),
('aadcddc8-e003-4fa7-8a98-3cbbe8fcf3db', '4000 E Console', 'SSL', '4000 E', 'Mixing Consoles', '1', 'Studio A', 'Legendary analog mixing console', 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400'),
('f06367ae-06cf-47fd-8bbe-b8b36f5c66b4', 'NS-10M', 'Yamaha', 'NS-10M Studio', 'Studio Monitors', '2', 'Studio B', 'Near-field reference monitors', 'https://images.unsplash.com/photo-1545127398-14699f92334b?w=400');

INSERT INTO public.studio_registrations (studio_name, contact_name, contact_email, phone, city, state, studio_type, studio_size, hourly_rate, operating_hours) VALUES
('M studios', 'F Norvilus', 'fmarvilus@yahoo.com', '(954) 699-4502', 'Tamarac', 'FL', 'recording', 'small', '25-50', '9-5');
