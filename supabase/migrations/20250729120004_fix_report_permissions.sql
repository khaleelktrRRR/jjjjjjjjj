/*
# [Fix Report Function Permissions]
This operation updates the reporting functions to run with the permissions of their owner, which is a more secure and reliable way to grant public access to aggregated data without exposing the underlying tables. It also explicitly sets the search path as a security best practice.

## Query Description: [This change alters the security model for two database functions to ensure they can be accessed publicly for reporting. It is a standard and safe practice for this kind of data exposure.]

## Metadata:
- Schema-Category: ["Structural"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [true]

## Structure Details:
- Functions: public.get_most_read_books, public.get_most_active_members

## Security Implications:
- RLS Status: [This change makes the functions bypass RLS by using SECURITY DEFINER.]
- Policy Changes: [No]
- Auth Requirements: [None]

## Performance Impact:
- Indexes: [Not Applicable]
- Triggers: [Not Applicable]
- Estimated Impact: [None]
*/

ALTER FUNCTION public.get_most_read_books(p_limit integer)
SECURITY DEFINER
SET search_path = public;

ALTER FUNCTION public.get_most_active_members(p_limit integer)
SECURITY DEFINER
SET search_path = public;
