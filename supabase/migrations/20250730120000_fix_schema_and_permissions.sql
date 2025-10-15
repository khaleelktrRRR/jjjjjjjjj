/*
  # [Fix Schema and Permissions]
  This migration script creates the complete database schema for the Muhimmath Library application and sets the necessary permissions to resolve access errors.

  ## Query Description:
  This script is designed to be run on a fresh database or to replace a faulty setup. It creates all tables (categories, books, members, feedback, circulation), defines relationships, and creates server-side functions for core logic. Crucially, it also grants the required permissions to the 'anon' and 'authenticated' roles, which is the likely cause of the "table not found" error.

  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "High"
  - Requires-Backup: true
  - Reversible: false

  ## Structure Details:
  - Creates Tables: categories, books, members, feedback, circulation
  - Creates Functions: issue_book, return_book, add_category, delete_category
  - Grants Permissions: USAGE on schema, SELECT on public tables for 'anon' and 'authenticated', and INSERT/UPDATE/DELETE for 'authenticated'.

  ## Security Implications:
  - RLS Status: Enabled on all tables.
  - Policy Changes: Yes, initial policies are created.
  - Auth Requirements: Operations are segregated between anonymous and authenticated users.
*/

-- STEP 1: Grant basic schema access
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- STEP 2: Create tables

-- Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL UNIQUE,
    created_at timestamptz DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.categories IS 'Stores book categories.';

-- Books Table
CREATE TABLE IF NOT EXISTS public.books (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    author text NOT NULL,
    isbn text UNIQUE,
    ddc_number text,
    publication_year integer,
    publisher text,
    total_copies integer NOT NULL DEFAULT 1,
    available_copies integer NOT NULL DEFAULT 1,
    status text NOT NULL DEFAULT 'available'::text,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
    language text,
    price numeric(10,2)
);
COMMENT ON TABLE public.books IS 'Stores information about each book in the library.';

-- Members Table
CREATE TABLE IF NOT EXISTS public.members (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    email text NOT NULL UNIQUE,
    phone text,
    address text,
    membership_date timestamptz DEFAULT now() NOT NULL,
    membership_type text NOT NULL DEFAULT 'regular'::text,
    status text NOT NULL DEFAULT 'active'::text,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    place text,
    register_number text,
    class text
);
COMMENT ON TABLE public.members IS 'Stores information about library members.';

-- Circulation Table
CREATE TABLE IF NOT EXISTS public.circulation (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    book_id uuid NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
    member_id uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    issue_date timestamptz DEFAULT now() NOT NULL,
    due_date timestamptz NOT NULL,
    return_date timestamptz,
    status text NOT NULL DEFAULT 'issued'::text,
    fine_amount numeric(10,2) DEFAULT 0,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.circulation IS 'Tracks borrowing and returning of books.';

-- Feedback Table
CREATE TABLE IF NOT EXISTS public.feedback (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    member_id uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    book_id uuid REFERENCES public.books(id) ON DELETE SET NULL,
    rating integer,
    review text,
    feedback_type text NOT NULL,
    status text NOT NULL DEFAULT 'pending'::text,
    created_at timestamptz DEFAULT now() NOT NULL,
    suggestion_title text,
    suggestion_author text,
    suggestion_reason text
);
COMMENT ON TABLE public.feedback IS 'Stores member feedback, reviews, and suggestions.';


-- STEP 3: Create server-side functions for business logic

-- Function to issue a book
CREATE OR REPLACE FUNCTION public.issue_book(p_book_id uuid, p_member_id uuid, p_due_date timestamptz)
RETURNS void AS $$
DECLARE
    v_available_copies integer;
BEGIN
    SELECT available_copies INTO v_available_copies FROM public.books WHERE id = p_book_id;

    IF v_available_copies > 0 THEN
        UPDATE public.books
        SET available_copies = available_copies - 1
        WHERE id = p_book_id;

        INSERT INTO public.circulation(book_id, member_id, due_date, status)
        VALUES (p_book_id, p_member_id, p_due_date, 'issued');
    ELSE
        RAISE EXCEPTION 'No available copies for book %', p_book_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
COMMENT ON FUNCTION public.issue_book IS 'Issues a book to a member and decrements available copies.';

-- Function to return a book
CREATE OR REPLACE FUNCTION public.return_book(p_circulation_id uuid)
RETURNS void AS $$
DECLARE
    v_book_id uuid;
BEGIN
    SELECT book_id INTO v_book_id FROM public.circulation WHERE id = p_circulation_id AND status = 'issued';

    IF v_book_id IS NOT NULL THEN
        UPDATE public.circulation
        SET status = 'returned', return_date = now()
        WHERE id = p_circulation_id;

        UPDATE public.books
        SET available_copies = available_copies + 1
        WHERE id = v_book_id;
    ELSE
        RAISE EXCEPTION 'Circulation record not found or book already returned.';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
COMMENT ON FUNCTION public.return_book IS 'Returns a book from a member and increments available copies.';

-- Function to add a category safely
CREATE OR REPLACE FUNCTION public.add_category(p_name text)
RETURNS void AS $$
BEGIN
    INSERT INTO public.categories (name) VALUES (p_name)
    ON CONFLICT (name) DO NOTHING;
END;
$$ LANGUAGE plpgsql;
COMMENT ON FUNCTION public.add_category IS 'Adds a new category if it does not already exist.';

-- Function to delete a category safely
CREATE OR REPLACE FUNCTION public.delete_category(p_id uuid)
RETURNS void AS $$
BEGIN
    -- Unset category from books before deleting
    UPDATE public.books SET category_id = NULL WHERE category_id = p_id;
    DELETE FROM public.categories WHERE id = p_id;
END;
$$ LANGUAGE plpgsql;
COMMENT ON FUNCTION public.delete_category IS 'Deletes a category after unlinking it from any books.';


-- STEP 4: Grant permissions to roles

-- Grant usage on the schema
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant SELECT on all tables to anon and authenticated roles for reading data
GRANT SELECT ON TABLE public.categories, public.books, public.members, public.feedback, public.circulation TO anon, authenticated;

-- Grant INSERT, UPDATE, DELETE to the authenticated role for admin actions
GRANT INSERT, UPDATE, DELETE ON TABLE public.categories, public.books, public.members, public.feedback, public.circulation TO authenticated;

-- Allow anonymous users to submit feedback (suggestions/reviews)
GRANT INSERT ON TABLE public.feedback TO anon;

-- Grant execute permissions on functions to the authenticated role (admins)
GRANT EXECUTE ON FUNCTION public.issue_book(uuid, uuid, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.return_book(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_category(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_category(uuid) TO authenticated;


-- STEP 5: Enable Row Level Security (RLS) and define policies

-- Enable RLS on all tables
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.circulation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Policies: Allow public read access on all tables
CREATE POLICY "Allow public read access" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON public.books FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON public.members FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON public.circulation FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON public.feedback FOR SELECT USING (true);

-- Policies: Allow authenticated users (admins) to perform all actions
CREATE POLICY "Allow all access for authenticated users" ON public.categories FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access for authenticated users" ON public.books FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access for authenticated users" ON public.members FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access for authenticated users" ON public.circulation FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access for authenticated users" ON public.feedback FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Policies: Allow anonymous users to insert their own feedback
CREATE POLICY "Allow anonymous feedback submission" ON public.feedback FOR INSERT TO anon WITH CHECK (true);

-- Grant all privileges to supabase_admin for maintenance
GRANT ALL ON ALL TABLES IN SCHEMA public TO supabase_admin;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO supabase_admin;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO supabase_admin;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO supabase_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO supabase_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO supabase_admin;
