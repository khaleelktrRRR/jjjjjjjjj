/*
          # [Fix] Grant Public Access to Reporting Functions
          [This migration grants public read access to the reporting functions, resolving the "Failed to fetch" error for anonymous users viewing the reports modal.]

          ## Query Description: [This operation safely grants execute permissions on several reporting functions to the 'anon' and 'authenticated' roles. It allows public users to view reports without needing to log in. This change is low-risk and does not expose any sensitive data.]
          
          ## Metadata:
          - Schema-Category: ["Safe"]
          - Impact-Level: ["Low"]
          - Requires-Backup: [false]
          - Reversible: [true]
          
          ## Structure Details:
          - Functions affected:
            - public.get_most_read_books()
            - public.get_most_active_members()
            - public.get_most_read_books_filtered(text)
            - public.get_most_active_members_filtered(text)
            - public.get_readers_of_book(uuid)
            - public.get_books_read_by_member(uuid)
          
          ## Security Implications:
          - RLS Status: [Not Applicable]
          - Policy Changes: [No]
          - Auth Requirements: [This change specifically allows anonymous access to these functions.]
          
          ## Performance Impact:
          - Indexes: [No change]
          - Triggers: [No change]
          - Estimated Impact: [None]
          */

GRANT EXECUTE ON FUNCTION public.get_most_read_books() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_most_active_members() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_most_read_books_filtered(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_most_active_members_filtered(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_readers_of_book(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_books_read_by_member(uuid) TO anon, authenticated;
