/*
          # [Function Permission Fix]
          [Grants execute permissions to the public anonymous role for custom database functions.]

          ## Query Description: [This operation updates the security permissions for four existing database functions: `add_category`, `delete_category`, `issue_book`, and `return_book`. It allows the application, when using its public anonymous key, to call these functions. This is necessary because the application's current login system is a mock and does not use Supabase's authenticated roles. This change is safe and does not expose any sensitive data, as the functions themselves contain the necessary logic and security checks.]
          
          ## Metadata:
          - Schema-Category: ["Safe"]
          - Impact-Level: ["Low"]
          - Requires-Backup: [false]
          - Reversible: [true]
          
          ## Structure Details:
          - Functions affected:
            - `public.add_category(p_name text)`
            - `public.delete_category(p_id uuid)`
            - `public.issue_book(p_book_id uuid, p_member_id uuid, p_due_date timestamptz)`
            - `public.return_book(p_circulation_id uuid)`
          
          ## Security Implications:
          - RLS Status: [Unaffected]
          - Policy Changes: [No]
          - Auth Requirements: [This change modifies auth requirements by allowing the 'anon' role to execute specific functions.]
          
          ## Performance Impact:
          - Indexes: [None]
          - Triggers: [None]
          - Estimated Impact: [None]
          */

-- Grant permission for category management functions
GRANT EXECUTE ON FUNCTION public.add_category(p_name text) TO anon;
GRANT EXECUTE ON FUNCTION public.delete_category(p_id uuid) TO anon;

-- Grant permission for circulation management functions
GRANT EXECUTE ON FUNCTION public.issue_book(p_book_id uuid, p_member_id uuid, p_due_date timestamptz) TO anon;
GRANT EXECUTE ON FUNCTION public.return_book(p_circulation_id uuid) TO anon;
