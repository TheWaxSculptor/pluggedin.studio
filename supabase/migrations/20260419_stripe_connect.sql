-- Migration to support Stripe Connect Payouts
-- Added on: 2026-04-19

-- Add Stripe fields to studios table
ALTER TABLE studios 
ADD COLUMN IF NOT EXISTS stripe_account_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_onboarding_complete BOOLEAN DEFAULT FALSE;

-- Create payouts table
CREATE TABLE IF NOT EXISTS payouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    studio_id UUID REFERENCES studios(id),
    amount INTEGER NOT NULL, -- Amount in cents
    status TEXT NOT NULL DEFAULT 'pending', -- pending, paid, failed
    stripe_payout_id TEXT,
    payout_method TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    paid_at TIMESTAMP WITH TIME ZONE
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_payouts_studio_id ON payouts(studio_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON payouts(status);
