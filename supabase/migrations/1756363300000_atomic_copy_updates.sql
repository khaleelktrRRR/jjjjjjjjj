/*
  # [Operation Name]
  Create Functions for Atomic Book Copy Updates

  ## Query Description: [This operation creates two PostgreSQL functions, `increment_available_copies` and `decrement_available_copies`, to safely update the number of available book copies. Using these functions prevents race conditions and ensures data integrity when multiple transactions occur simultaneously (e.g., issuing and returning books at the same time). This is a safe, non-destructive operation that adds new functionality to the database.]
  
  ## Metadata:
  - Schema-Category: ["Structural"]
  - Impact-Level: ["Low"]
  - Requires-Backup: [false]
  - Reversible: [true]
  
  ## Structure Details:
  - Creates function: `increment_available_copies(book_id_to_update UUID)`
  - Creates function: `decrement_available_copies(book_id_to_update UUID)`
  
  ## Security Implications:
  - RLS Status: [Enabled]
  - Policy Changes: [No]
  - Auth Requirements: [These functions will run with the permissions of the calling user. The existing RLS policies on the `books` table will apply.]
  - Note: `SET search_path = 'public'` is included to address the 'Function Search Path Mutable' security warning.
  
  ## Performance Impact:
  - Indexes: [Not Applicable]
  - Triggers: [Not Applicable]
  - Estimated Impact: [Low. These are simple update functions that will perform efficiently.]
*/

create or replace function public.increment_available_copies(book_id_to_update uuid)
returns void as $$
begin
  update public.books
  set
    available_copies = available_copies + 1,
    updated_at = now()
  where id = book_id_to_update;
end;
$$ language plpgsql set search_path = 'public';

create or replace function public.decrement_available_copies(book_id_to_update uuid)
returns void as $$
begin
  update public.books
  set
    available_copies = available_copies - 1,
    updated_at = now()
  where id = book_id_to_update;
end;
$$ language plpgsql set search_path = 'public';
