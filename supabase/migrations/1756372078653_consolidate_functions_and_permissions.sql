/*
# [Function and Permission Consolidation]
[This script recreates all necessary helper functions with the correct signatures and grants the required permissions. This ensures the database is in a consistent state and resolves any previous migration issues.]

## Query Description: [This operation will safely update four database functions (issue_book, return_book, add_category, delete_category) using CREATE OR REPLACE, which prevents errors if they already exist. It then grants public access to these functions, which is necessary for the application to work correctly. There is no risk of data loss.]

## Metadata:
- Schema-Category: ["Structural", "Safe"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [true]

## Structure Details:
- Functions affected:
  - public.issue_book
  - public.return_book
  - public.add_category
  - public.delete_category

## Security Implications:
- RLS Status: [Unaffected]
- Policy Changes: [No]
- Auth Requirements: [Grants EXECUTE permission to 'anon' and 'authenticated' roles]

## Performance Impact:
- Indexes: [Unaffected]
- Triggers: [Unaffected]
- Estimated Impact: [None]
*/

-- Recreate function to issue a book
CREATE OR REPLACE FUNCTION public.issue_book(
    p_book_id uuid,
    p_member_id uuid,
    p_due_date timestamptz
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_available_copies int;
BEGIN
    SELECT available_copies INTO v_available_copies
    FROM public.books
    WHERE id = p_book_id
    FOR UPDATE;

    IF v_available_copies > 0 THEN
        UPDATE public.books
        SET available_copies = available_copies - 1
        WHERE id = p_book_id;

        INSERT INTO public.circulation (book_id, member_id, issue_date, due_date, status)
        VALUES (p_book_id, p_member_id, now(), p_due_date, 'issued');
    ELSE
        RAISE EXCEPTION 'No available copies for book %', p_book_id;
    END IF;
END;
$$;

-- Recreate function to return a book
CREATE OR REPLACE FUNCTION public.return_book(p_circulation_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_book_id uuid;
BEGIN
    UPDATE public.circulation
    SET status = 'returned', return_date = now()
    WHERE id = p_circulation_id AND status IN ('issued', 'overdue')
    RETURNING book_id INTO v_book_id;

    IF v_book_id IS NOT NULL THEN
        UPDATE public.books
        SET available_copies = available_copies + 1
        WHERE id = v_book_id;
    END IF;
END;
$$;

-- Recreate function to add a category
CREATE OR REPLACE FUNCTION public.add_category(p_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.categories (name)
    VALUES (p_name);
END;
$$;

-- Recreate function to delete a category
CREATE OR REPLACE FUNCTION public.delete_category(p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    DELETE FROM public.categories WHERE id = p_id;
END;
$$;


-- Grant permissions for all functions
GRANT EXECUTE ON FUNCTION public.issue_book(uuid, uuid, timestamptz) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.return_book(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.add_category(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_category(uuid) TO anon, authenticated;
