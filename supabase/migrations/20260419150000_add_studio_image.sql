-- Add image_url column to studios table
ALTER TABLE public.studios ADD COLUMN IF NOT EXISTS image_url text;

-- Ensure payouts table exists for the dashboard
CREATE TABLE IF NOT EXISTS public.payouts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    studio_id uuid REFERENCES public.studios(id),
    amount numeric NOT NULL,
    status text DEFAULT 'pending',
    payout_method text,
    created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on payouts
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

-- Policy for owners to view their own payouts
CREATE POLICY "Owners can view their own payouts" ON public.payouts
    FOR SELECT USING (
        studio_id IN (
            SELECT id FROM public.studios WHERE id = payouts.studio_id
        )
    );
