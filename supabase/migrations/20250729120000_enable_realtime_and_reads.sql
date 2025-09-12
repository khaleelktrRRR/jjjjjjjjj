/*
          # Enable Public Read Access for Real-Time
          This migration enables public read access on all primary data tables. This is essential for both the initial data fetching and for Supabase's real-time functionality to work correctly. Without these policies, the application's anonymous key is blocked by Row Level Security (RLS) from selecting data.

          ## Query Description:
          - This script creates a `SELECT` policy for the `books`, `categories`, `members`, `circulation`, and `feedback` tables.
          - It allows any user (including anonymous visitors) to read data from these tables.
          - This change is safe and necessary for the public-facing parts of the library website to function. It does not grant any write permissions (INSERT, UPDATE, DELETE).
          - The script is idempotent and can be run multiple times without causing errors.

          ## Metadata:
          - Schema-Category: "Structural"
          - Impact-Level: "Low"
          - Requires-Backup: false
          - Reversible: true

          ## Structure Details:
          - Tables affected: `books`, `categories`, `members`, `circulation`, `feedback`
          - Policies created: `Allow public read access` on each table.

          ## Security Implications:
          - RLS Status: Enabled
          - Policy Changes: Yes, adds `SELECT` policies.
          - Auth Requirements: None. This applies to the public `anon` role.

          ## Performance Impact:
          - Indexes: None
          - Triggers: None
          - Estimated Impact: Negligible. Enables read queries that were previously blocked.
          */

-- Enable RLS on all tables if not already enabled
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.circulation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to ensure a clean slate
DROP POLICY IF EXISTS "Allow public read access" ON public.books;
DROP POLICY IF EXISTS "Allow public read access" ON public.categories;
DROP POLICY IF EXISTS "Allow public read access" ON public.members;
DROP POLICY IF EXISTS "Allow public read access" ON public.circulation;
DROP POLICY IF EXISTS "Allow public read access" ON public.feedback;

-- Create policies to allow public read access
CREATE POLICY "Allow public read access" ON public.books FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON public.members FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON public.circulation FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON public.feedback FOR SELECT USING (true);
