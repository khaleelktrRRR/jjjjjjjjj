/*
# [SECURITY] Set Function Search Path
This migration hardens database security by explicitly setting the `search_path` for all custom functions. This prevents potential hijacking attacks where a malicious user could alter the function's behavior by creating objects with the same name in a different schema. This change addresses the 'Function Search Path Mutable' warnings from the Supabase security advisor.

## Query Description: [This operation updates existing function definitions to enhance security. It is a non-destructive change and does not affect any data.]

## Metadata:
- Schema-Category: ["Security", "Structural"]
- Impact-Level: ["Low"]
- Requires-Backup: false
- Reversible: true

## Structure Details:
- Modifies functions: `add_category`, `delete_category`, `issue_book`, `return_book`, and `handle_updated_at`.

## Security Implications:
- RLS Status: [Not Applicable]
- Policy Changes: [No]
- Auth Requirements: [Requires database admin privileges to run.]

## Performance Impact:
- Indexes: [None]
- Triggers: [None]
- Estimated Impact: [Negligible performance impact. This is a one-time metadata change.]
*/

-- Secure the `add_category` function
ALTER FUNCTION public.add_category(p_name text)
SET search_path = public;

-- Secure the `delete_category` function
ALTER FUNCTION public.delete_category(p_id uuid)
SET search_path = public;

-- Secure the `issue_book` function
ALTER FUNCTION public.issue_book(p_book_id uuid, p_member_id uuid, p_due_date timestamptz)
SET search_path = public;

-- Secure the `return_book` function
ALTER FUNCTION public.return_book(p_circulation_id uuid)
SET search_path = public;

-- Secure the `handle_updated_at` trigger function
-- This addresses the fifth security warning related to trigger functions.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_updated_at') THEN
    ALTER FUNCTION public.handle_updated_at()
    SET search_path = public;
  END IF;
END
$$;

-- Reset role session settings
RESET ROLE;
