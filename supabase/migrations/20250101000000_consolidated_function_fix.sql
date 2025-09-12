--
-- Name: add_category(text); Type: FUNCTION; Schema: public; Owner: -
--
/*
          # [Operation Name]
          Recreate and Grant Permissions for All Custom Functions

          ## Query Description: [This script provides a definitive fix for all custom database functions. It safely drops any existing versions of `add_category`, `delete_category`, `issue_book`, and `return_book` to clean up inconsistencies from previous failed migrations. It then recreates them with their final, correct definitions and grants the necessary execution permissions to the public application roles. This ensures the database schema is perfectly aligned with the application code and resolves all function-related errors.]
          
          ## Metadata:
          - Schema-Category: ["Structural"]
          - Impact-Level: ["Low"]
          - Requires-Backup: [false]
          - Reversible: [false]
          
          ## Structure Details:
          - Drops and recreates the following functions:
            - `add_category(p_name text)`
            - `delete_category(p_id uuid)`
            - `issue_book(p_book_id uuid, p_member_id uuid, p_due_date timestamptz)`
            - `return_book(p_circulation_id uuid)`
          
          ## Security Implications:
          - RLS Status: [Enabled]
          - Policy Changes: [No]
          - Auth Requirements: [Grants EXECUTE permission to `anon` and `authenticated` roles]
          
          ## Performance Impact:
          - Indexes: [None]
          - Triggers: [None]
          - Estimated Impact: [Negligible. This is a one-time schema fix.]
          */

-- Drop all potentially conflicting functions first
DROP FUNCTION IF EXISTS public.add_category(text);
DROP FUNCTION IF EXISTS public.delete_category(uuid);
DROP FUNCTION IF EXISTS public.issue_book(uuid, uuid, timestamp with time zone);
DROP FUNCTION IF EXISTS public.return_book(uuid);


-- Recreate the add_category function
CREATE OR REPLACE FUNCTION public.add_category(p_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.categories (name)
  VALUES (p_name);
END;
$$;

-- Recreate the delete_category function
CREATE OR REPLACE FUNCTION public.delete_category(p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.categories WHERE id = p_id;
END;
$$;

-- Recreate the issue_book function
CREATE OR REPLACE FUNCTION public.issue_book(p_book_id uuid, p_member_id uuid, p_due_date timestamptz)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_available integer;
BEGIN
  -- Check for availability and lock the row
  SELECT available_copies INTO current_available FROM public.books WHERE id = p_book_id FOR UPDATE;

  IF current_available > 0 THEN
    -- Update book count
    UPDATE public.books
    SET available_copies = available_copies - 1
    WHERE id = p_book_id;

    -- Insert into circulation
    INSERT INTO public.circulation (book_id, member_id, issue_date, due_date, status, fine_amount)
    VALUES (p_book_id, p_member_id, NOW(), p_due_date, 'issued', 0);
  ELSE
    RAISE EXCEPTION 'Book not available';
  END IF;
END;
$$;

-- Recreate the return_book function
CREATE OR REPLACE FUNCTION public.return_book(p_circulation_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_book_id uuid;
BEGIN
  -- Update circulation record
  UPDATE public.circulation
  SET
    status = 'returned',
    return_date = NOW()
  WHERE id = p_circulation_id
  RETURNING book_id INTO v_book_id;

  -- Update book count if a book was associated
  IF v_book_id IS NOT NULL THEN
    UPDATE public.books
    SET available_copies = available_copies + 1
    WHERE id = v_book_id;
  END IF;
END;
$$;

-- Grant execute permissions to public roles
GRANT EXECUTE ON FUNCTION public.add_category(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_category(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.issue_book(uuid, uuid, timestamp with time zone) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.return_book(uuid) TO anon, authenticated;
