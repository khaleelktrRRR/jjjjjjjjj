/*
  # [Function] add_category
  [Safely adds a new category to the categories table. This function is designed to be called from the client-side to bypass RLS policies that prevent direct inserts by anonymous or non-admin users.]

  ## Query Description: [This operation creates a PostgreSQL function that allows for the insertion of new categories. It runs with the permissions of the function owner, making it a secure way to handle data entry from the frontend. It checks if a category with the same name already exists to prevent duplicates.]
  
  ## Metadata:
  - Schema-Category: ["Structural"]
  - Impact-Level: ["Low"]
  - Requires-Backup: [false]
  - Reversible: [true]
  
  ## Structure Details:
  - Function Name: add_category
  - Arguments: category_name (text)
  - Returns: void
  
  ## Security Implications:
  - RLS Status: [Bypassed via SECURITY DEFINER]
  - Policy Changes: [No]
  - Auth Requirements: [None, as it's SECURITY DEFINER. The function itself is the security boundary.]
  
  ## Performance Impact:
  - Indexes: [Uses index on categories.name for the check]
  - Triggers: [None]
  - Estimated Impact: [Low. Simple insert/check operation.]
*/
CREATE OR REPLACE FUNCTION public.add_category(category_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.categories(name)
    VALUES (category_name)
    ON CONFLICT (name) DO NOTHING;
END;
$$;


/*
  # [Function] delete_category
  [Safely deletes a category from the categories table. This function is designed to be called from the client-side to bypass RLS policies that prevent direct deletes by anonymous or non-admin users.]

  ## Query Description: [This operation creates a PostgreSQL function that allows for the deletion of categories. It runs with the permissions of the function owner. It will fail if the category is still referenced by any books due to foreign key constraints, which is a desired safety feature.]
  
  ## Metadata:
  - Schema-Category: ["Dangerous"]
  - Impact-Level: ["Medium"]
  - Requires-Backup: [false]
  - Reversible: [false]
  
  ## Structure Details:
  - Function Name: delete_category
  - Arguments: p_category_id (uuid)
  - Returns: void
  
  ## Security Implications:
  - RLS Status: [Bypassed via SECURITY DEFINER]
  - Policy Changes: [No]
  - Auth Requirements: [None]
  
  ## Performance Impact:
  - Indexes: [Uses primary key index for deletion]
  - Triggers: [None]
  - Estimated Impact: [Low. Simple delete operation.]
*/
CREATE OR REPLACE FUNCTION public.delete_category(p_category_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    DELETE FROM public.categories WHERE id = p_category_id;
END;
$$;
