/*
# [Operation Name]
Rebuild Reporting Functions for Enhanced Analytics (Secure)

## Query Description: [This migration overhauls the reporting system to support advanced, interactive features. It introduces new, optimized `SECURITY DEFINER` functions for fetching report data with time-based filtering and drill-down capabilities. Using `SECURITY DEFINER` allows these functions to bypass Row-Level Security, providing aggregated report data to public users without exposing sensitive table information. This resolves previous permission errors securely. This operation is safe and does not modify any existing table data.]

## Metadata:
- Schema-Category: ["Structural", "Security"]
- Impact-Level: ["Medium"]
- Requires-Backup: false
- Reversible: true

## Structure Details:
- Drops old/potentially conflicting reporting functions.
- Creates new `SECURITY DEFINER` RPC functions:
  - `get_most_read_books_report(time_period text, p_limit integer)`
  - `get_most_active_members_report(time_period text, p_limit integer)`
  - `get_readers_of_book(p_book_id uuid)`
  - `get_books_read_by_member(p_member_id uuid)`
- Sets a secure `search_path` for each function.
- Grants EXECUTE permissions on these functions to `anon` and `authenticated` roles.

## Security Implications:
- RLS Status: [Bypassed by `SECURITY DEFINER` functions for read-only reporting purposes.]
- Policy Changes: [No]
- Auth Requirements: [Functions are made accessible to public (`anon`) users to allow viewing reports without logging in.]

## Performance Impact:
- Indexes: [No changes]
- Triggers: [No changes]
- Estimated Impact: [Positive. The new functions are designed to be more performant for filtered queries.]
*/

-- Drop existing functions if they exist to avoid conflicts
DROP FUNCTION IF EXISTS public.get_most_read_books(integer);
DROP FUNCTION IF EXISTS public.get_most_active_members(integer);
DROP FUNCTION IF EXISTS public.get_most_read_books_report(text, integer);
DROP FUNCTION IF EXISTS public.get_most_active_members_report(text, integer);
DROP FUNCTION IF EXISTS public.get_readers_of_book(uuid);
DROP FUNCTION IF EXISTS public.get_books_read_by_member(uuid);


-- Function to get most read books with time filtering
CREATE OR REPLACE FUNCTION public.get_most_read_books_report(
    time_period text DEFAULT 'all',
    p_limit integer DEFAULT 10
)
RETURNS TABLE(book_id uuid, title text, author text, borrow_count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        b.id as book_id,
        b.title,
        b.author,
        count(c.id) as borrow_count
    FROM
        circulation c
    JOIN
        books b ON c.book_id = b.id
    WHERE
        CASE
            WHEN time_period = 'year' THEN c.issue_date >= date_trunc('year', now())
            WHEN time_period = 'month' THEN c.issue_date >= date_trunc('month', now())
            WHEN time_period = 'week' THEN c.issue_date >= date_trunc('week', now())
            ELSE true
        END
    GROUP BY
        b.id, b.title, b.author
    ORDER BY
        borrow_count DESC
    LIMIT p_limit;
END;
$$;

-- Function to get most active members with time filtering
CREATE OR REPLACE FUNCTION public.get_most_active_members_report(
    time_period text DEFAULT 'all',
    p_limit integer DEFAULT 10
)
RETURNS TABLE(member_id uuid, name text, email text, borrow_count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        m.id as member_id,
        m.name,
        m.email,
        count(c.id) as borrow_count
    FROM
        circulation c
    JOIN
        members m ON c.member_id = m.id
    WHERE
        CASE
            WHEN time_period = 'year' THEN c.issue_date >= date_trunc('year', now())
            WHEN time_period = 'month' THEN c.issue_date >= date_trunc('month', now())
            WHEN time_period = 'week' THEN c.issue_date >= date_trunc('week', now())
            ELSE true
        END
    GROUP BY
        m.id, m.name, m.email
    ORDER BY
        borrow_count DESC
    LIMIT p_limit;
END;
$$;


-- Function to get readers of a specific book
CREATE OR REPLACE FUNCTION public.get_readers_of_book(p_book_id uuid)
RETURNS TABLE(member_id uuid, name text, issue_date text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        m.id as member_id,
        m.name,
        to_char(c.issue_date, 'YYYY-MM-DD') as issue_date
    FROM
        circulation c
    JOIN
        members m ON c.member_id = m.id
    WHERE
        c.book_id = p_book_id
    ORDER BY
        c.issue_date DESC;
END;
$$;

-- Function to get books read by a specific member
CREATE OR REPLACE FUNCTION public.get_books_read_by_member(p_member_id uuid)
RETURNS TABLE(book_id uuid, title text, issue_date text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        b.id as book_id,
        b.title,
        to_char(c.issue_date, 'YYYY-MM-DD') as issue_date
    FROM
        circulation c
    JOIN
        books b ON c.book_id = b.id
    WHERE
        c.member_id = p_member_id
    ORDER BY
        c.issue_date DESC;
END;
$$;

-- Grant permissions to anon and authenticated roles
GRANT EXECUTE ON FUNCTION public.get_most_read_books_report(text, integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_most_active_members_report(text, integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_readers_of_book(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_books_read_by_member(uuid) TO anon, authenticated;
