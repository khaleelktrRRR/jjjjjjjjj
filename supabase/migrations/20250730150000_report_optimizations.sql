/*
# [Operation Name]
Create RPC Functions for Report Generation

## Query Description: [This operation creates two new PostgreSQL functions, `get_most_read_books` and `get_most_active_members`, to optimize the library's reporting feature. These functions aggregate data on the server, significantly improving performance by reducing the amount of data transferred to the client and offloading complex calculations to the database. This change is safe and does not alter any existing data.]

## Metadata:
- Schema-Category: ["Structural"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [true]

## Structure Details:
- Creates function `public.get_most_read_books()`
- Creates function `public.get_most_active_members()`

## Security Implications:
- RLS Status: [Enabled]
- Policy Changes: [No]
- Auth Requirements: [The functions are executable by the `anon` and `authenticated` roles, aligning with existing security policies.]

## Performance Impact:
- Indexes: [N/A]
- Triggers: [N/A]
- Estimated Impact: [Positive. Reduces client-side processing and network load, leading to faster report generation.]
*/

-- Function to get the top 10 most borrowed books
create or replace function get_most_read_books()
returns table (
  id uuid,
  title text,
  author text,
  borrow_count bigint
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select
    b.id,
    b.title,
    b.author,
    count(c.book_id) as borrow_count
  from circulation as c
  join books as b on c.book_id = b.id
  group by b.id, b.title, b.author
  order by borrow_count desc
  limit 10;
end;
$$;

-- Function to get the top 10 most active members
create or replace function get_most_active_members()
returns table (
  id uuid,
  name text,
  email text,
  borrow_count bigint
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select
    m.id,
    m.name,
    m.email,
    count(c.member_id) as borrow_count
  from circulation as c
  join members as m on c.member_id = m.id
  group by m.id, m.name, m.email
  order by borrow_count desc
  limit 10;
end;
$$;

-- Grant permissions to roles
grant execute on function get_most_read_books() to anon, authenticated, service_role;
grant execute on function get_most_active_members() to anon, authenticated, service_role;
