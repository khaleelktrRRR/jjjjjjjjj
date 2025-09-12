/*
          # [Feature Update] Schema Expansion
          This migration expands the database schema to support new features including book categories, detailed member information, and enhanced feedback options.

          ## Query Description: This operation is structural and adds new tables and columns. It is designed to be non-destructive to existing data.
          - A new `categories` table is created.
          - The `books` table is altered to include `category_id`, `language`, and `price`.
          - The `members` table is altered to include `place`, `register_number`, and `class`.
          - The `feedback` table is altered to support detailed book suggestions.
          
          ## Metadata:
          - Schema-Category: "Structural"
          - Impact-Level: "Low"
          - Requires-Backup: false
          - Reversible: true (with manual column/table removal)
          
          ## Structure Details:
          - **New Table:** `public.categories`
          - **Altered Table:** `public.books` (3 new columns)
          - **Altered Table:** `public.members` (3 new columns)
          - **Altered Table:** `public.feedback` (3 new columns)
          
          ## Security Implications:
          - RLS Status: Enabled on new and existing tables.
          - Policy Changes: Yes (New policies for `categories` table, updated for `feedback`).
          - Auth Requirements: Authenticated users can manage categories and submit feedback.
          
          ## Performance Impact:
          - Indexes: A new foreign key constraint on `books.category_id` and a unique constraint on `members.register_number` are added.
          - Triggers: None.
          - Estimated Impact: Low. These changes will slightly increase storage but improve data organization and query capabilities.
          */

-- Create categories table
CREATE TABLE public.categories (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT categories_pkey PRIMARY KEY (id),
    CONSTRAINT categories_name_key UNIQUE (name)
);

-- Add comments for clarity
COMMENT ON TABLE public.categories IS 'Stores book categories for the library.';
COMMENT ON COLUMN public.categories.name IS 'The unique name of the category.';

-- Enable RLS and define policies for categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON public.categories
FOR SELECT USING (true);

CREATE POLICY "Enable CUD for authenticated users" ON public.categories
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);


-- Alter books table to add new fields
ALTER TABLE public.books
ADD COLUMN category_id uuid,
ADD COLUMN language text CHECK (language IN ('Kannada', 'Malayalam', 'English', 'Urdu', 'Arabic')),
ADD COLUMN price numeric(10, 2);

-- Add foreign key constraint for category
ALTER TABLE public.books
ADD CONSTRAINT books_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL;

-- Add comments for new book columns
COMMENT ON COLUMN public.books.category_id IS 'Foreign key to the categories table.';
COMMENT ON COLUMN public.books.language IS 'The language the book is written in.';
COMMENT ON COLUMN public.books.price IS 'The price of the book.';


-- Alter members table to add new fields
ALTER TABLE public.members
ADD COLUMN place text,
ADD COLUMN register_number text,
ADD COLUMN "class" text; -- "class" is a reserved keyword, so it must be quoted.

-- Add a unique constraint for register number
ALTER TABLE public.members
ADD CONSTRAINT members_register_number_key UNIQUE (register_number);

-- Add comments for new member columns
COMMENT ON COLUMN public.members.place IS 'The place/city of the member.';
COMMENT ON COLUMN public.members.register_number IS 'Unique registration number, e.g., for students.';
COMMENT ON COLUMN public.members.class IS 'The class or grade of the member, e.g., for students.';


-- Alter feedback table to support detailed suggestions
ALTER TABLE public.feedback
ADD COLUMN book_title_suggestion text,
ADD COLUMN author_suggestion text,
ADD COLUMN reason text;

-- Add comments for new feedback columns
COMMENT ON COLUMN public.feedback.book_title_suggestion IS 'Title of the book suggested by a member.';
COMMENT ON COLUMN public.feedback.author_suggestion IS 'Author of the book suggested by a member.';
COMMENT ON COLUMN public.feedback.reason IS 'Reason provided by the member for their suggestion.';

-- Ensure insert policy for feedback allows authenticated users
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.feedback;
CREATE POLICY "Enable insert for authenticated users" ON public.feedback
FOR INSERT TO authenticated
WITH CHECK (true);
