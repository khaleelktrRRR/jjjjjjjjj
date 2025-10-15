/*
# [Fix] Grant Public Access to Reporting Functions
This migration grants execute permissions to the `anon` and `authenticated` roles for the new reporting functions. This allows public users to view reports without being logged in, resolving the "Failed to fetch" error on the home page.

## Query Description: This operation grants permissions and is safe. It does not alter data or table structures.

## Metadata:
- Schema-Category: ["Safe"]
- Impact-Level: ["Low"]
- Requires-Backup: false
- Reversible: true

## Structure Details:
- Functions affected:
  - `get_most_read_books(text, integer)`
  - `get_most_active_members(text, integer)`
  - `get_readers_of_book(uuid)`
  - `get_books_read_by_member(uuid)`

## Security Implications:
- RLS Status: Not applicable
- Policy Changes: No
- Auth Requirements: This change specifically makes these functions accessible to non-authenticated (`anon`) users.

## Performance Impact:
- Indexes: None
- Triggers: None
- Estimated Impact: None
*/

-- Grant permissions for the main reporting functions
GRANT EXECUTE ON FUNCTION public.get_most_read_books(text, integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_most_active_members(text, integer) TO anon, authenticated;

-- Grant permissions for the drill-down functions
GRANT EXECUTE ON FUNCTION public.get_readers_of_book(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_books_read_by_member(uuid) TO anon, authenticated;
