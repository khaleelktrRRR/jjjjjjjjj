/*
# [Advanced Reporting Functions]
This migration adds new database functions to support advanced reporting features, including time-based filtering and drill-down capabilities for reports.

## Query Description: [This script creates four new PostgreSQL functions to enable advanced reporting. These functions are designed to be highly performant by processing data on the server. There is no risk to existing data as these are read-only operations. This change is reversible by dropping the functions.]

## Metadata:
- Schema-Category: ["Safe"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [true]

## Structure Details:
- Creates function `get_most_read_books_filtered(p_filter_type TEXT)`
- Creates function `get_most_active_members_filtered(p_filter_type TEXT)`
- Creates function `get_readers_of_book(p_book_id UUID)`
- Creates function `get_books_read_by_member(p_member_id UUID)`

## Security Implications:
- RLS Status: [Enabled]
- Policy Changes: [No]
- Auth Requirements: [Grants execute permission to `anon` and `authenticated` roles.]

## Performance Impact:
- Indexes: [No changes]
- Triggers: [No changes]
- Estimated Impact: [Positive. Offloads report calculations to the database, improving frontend performance.]
*/

-- ----------------------------------------------------------------
-- Function to get most read books with time-based filtering
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_most_read_books_filtered(p_filter_type TEXT DEFAULT 'all')
RETURNS TABLE(book_id UUID, title TEXT, author TEXT, borrow_count BIGINT)
LANGUAGE plpgsql STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.id AS book_id,
    b.title,
    b.author,
    COUNT(c.id) AS borrow_count
  FROM public.circulation c
  JOIN public.books b ON c.book_id = b.id
  WHERE
    CASE
      WHEN p_filter_type = 'year' THEN c.issue_date >= date_trunc('year', NOW())
      WHEN p_filter_type = 'month' THEN c.issue_date >= date_trunc('month', NOW())
      WHEN p_filter_type = 'week' THEN c.issue_date >= date_trunc('week', NOW())
      ELSE TRUE
    END
  GROUP BY b.id, b.title, b.author
  ORDER BY borrow_count DESC
  LIMIT 20;
END;
$$;

ALTER FUNCTION public.get_most_read_books_filtered(TEXT) SET search_path = public;
GRANT EXECUTE ON FUNCTION public.get_most_read_books_filtered(TEXT) TO anon, authenticated;

-- ----------------------------------------------------------------
-- Function to get most active members with time-based filtering
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_most_active_members_filtered(p_filter_type TEXT DEFAULT 'all')
RETURNS TABLE(member_id UUID, name TEXT, email TEXT, borrow_count BIGINT)
LANGUAGE plpgsql STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id AS member_id,
    m.name,
    m.email,
    COUNT(c.id) AS borrow_count
  FROM public.circulation c
  JOIN public.members m ON c.member_id = m.id
  WHERE
    CASE
      WHEN p_filter_type = 'year' THEN c.issue_date >= date_trunc('year', NOW())
      WHEN p_filter_type = 'month' THEN c.issue_date >= date_trunc('month', NOW())
      WHEN p_filter_type = 'week' THEN c.issue_date >= date_trunc('week', NOW())
      ELSE TRUE
    END
  GROUP BY m.id, m.name, m.email
  ORDER BY borrow_count DESC
  LIMIT 20;
END;
$$;

ALTER FUNCTION public.get_most_active_members_filtered(TEXT) SET search_path = public;
GRANT EXECUTE ON FUNCTION public.get_most_active_members_filtered(TEXT) TO anon, authenticated;

-- ----------------------------------------------------------------
-- Function to get all members who have read a specific book
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_readers_of_book(p_book_id UUID)
RETURNS TABLE(member_id UUID, name TEXT, email TEXT, issue_date TIMESTAMPTZ)
LANGUAGE plpgsql STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    m.id as member_id,
    m.name,
    m.email,
    c.issue_date
  FROM public.circulation c
  JOIN public.members m ON c.member_id = m.id
  WHERE c.book_id = p_book_id
  ORDER BY c.issue_date DESC;
END;
$$;

ALTER FUNCTION public.get_readers_of_book(UUID) SET search_path = public;
GRANT EXECUTE ON FUNCTION public.get_readers_of_book(UUID) TO anon, authenticated;

-- ----------------------------------------------------------------
-- Function to get all books read by a specific member
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_books_read_by_member(p_member_id UUID)
RETURNS TABLE(book_id UUID, title TEXT, author TEXT, issue_date TIMESTAMPTZ)
LANGUAGE plpgsql STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    b.id as book_id,
    b.title,
    b.author,
    c.issue_date
  FROM public.circulation c
  JOIN public.books b ON c.book_id = b.id
  WHERE c.member_id = p_member_id
  ORDER BY c.issue_date DESC;
END;
$$;

ALTER FUNCTION public.get_books_read_by_member(UUID) SET search_path = public;
GRANT EXECUTE ON FUNCTION public.get_books_read_by_member(UUID) TO anon, authenticated;
