/*
# [Initial Schema Setup]
This script sets up the complete initial database schema for the Muhimmath Library Management System. It creates tables for books, members, categories, circulation, and feedback. It also defines necessary data types, functions for core logic, and enables Row-Level Security with basic policies.

## Query Description:
This is a foundational script that creates the entire database structure from scratch. It is safe to run on a new, empty project.
**WARNING:** Running this on a database that already has these tables will cause errors.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "High"
- Requires-Backup: false
- Reversible: false
*/

-- Custom Types
/*
# [Create Custom Enum Types]
Defines custom data types for status fields to ensure data consistency.
*/
create type public.book_status as enum ('available', 'issued', 'maintenance', 'lost');
create type public.member_status as enum ('active', 'inactive', 'suspended');
create type public.membership_type as enum ('regular', 'premium', 'student');
create type public.circulation_status as enum ('issued', 'returned', 'overdue', 'lost');
create type public.feedback_type as enum ('book_review', 'service_feedback', 'suggestion');
create type public.feedback_status as enum ('pending', 'approved', 'rejected');
create type public.book_language as enum ('Kannada', 'Malayalam', 'English', 'Urdu', 'Arabic');

-- Categories Table
/*
# [Create 'categories' Table]
Stores book categories.
*/
create table public.categories (
    id uuid default gen_random_uuid() primary key,
    name text not null unique,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.categories enable row level security;
create policy "Allow public read access to categories" on public.categories for select using (true);
create policy "Allow admin to manage categories" on public.categories for all using (auth.role() = 'service_role');

-- Members Table
/*
# [Create 'members' Table]
Stores information about library members.
*/
create table public.members (
    id uuid default gen_random_uuid() primary key,
    name text not null,
    email text not null unique,
    phone text,
    address text,
    membership_date timestamp with time zone default timezone('utc'::text, now()) not null,
    membership_type public.membership_type not null default 'regular',
    status public.member_status not null default 'active',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    place text,
    register_number text,
    "class" text
);
alter table public.members enable row level security;
create policy "Allow admin to manage members" on public.members for all using (auth.role() = 'service_role');


-- Books Table
/*
# [Create 'books' Table]
Stores the library's book collection.
*/
create table public.books (
    id uuid default gen_random_uuid() primary key,
    title text not null,
    author text not null,
    isbn text unique,
    ddc_number text,
    publication_year integer,
    publisher text,
    total_copies integer not null default 1,
    available_copies integer not null default 1,
    status public.book_status not null default 'available',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    category_id uuid references public.categories(id) on delete set null,
    language public.book_language,
    price numeric(10, 2)
);
alter table public.books enable row level security;
create policy "Allow public read access to books" on public.books for select using (true);
create policy "Allow admin to manage books" on public.books for all using (auth.role() = 'service_role');


-- Circulation Table
/*
# [Create 'circulation' Table]
Tracks borrowing and returning of books.
*/
create table public.circulation (
    id uuid default gen_random_uuid() primary key,
    book_id uuid not null references public.books(id) on delete cascade,
    member_id uuid not null references public.members(id) on delete cascade,
    issue_date timestamp with time zone default timezone('utc'::text, now()) not null,
    due_date timestamp with time zone not null,
    return_date timestamp with time zone,
    status public.circulation_status not null default 'issued',
    fine_amount numeric(10, 2) not null default 0,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.circulation enable row level security;
create policy "Allow admin to manage circulation" on public.circulation for all using (auth.role() = 'service_role');


-- Feedback Table
/*
# [Create 'feedback' Table]
Stores member feedback, including reviews and suggestions.
*/
create table public.feedback (
    id uuid default gen_random_uuid() primary key,
    member_id uuid not null references public.members(id) on delete cascade,
    book_id uuid references public.books(id) on delete set null,
    rating integer check (rating >= 1 and rating <= 5),
    review text,
    feedback_type public.feedback_type not null,
    status public.feedback_status not null default 'pending',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    suggestion_title text,
    suggestion_author text,
    suggestion_reason text
);
alter table public.feedback enable row level security;
create policy "Allow anyone to submit feedback" on public.feedback for insert with check (true);
create policy "Allow admin to manage feedback" on public.feedback for all using (auth.role() = 'service_role');
create policy "Allow public to read approved feedback" on public.feedback for select using (status = 'approved');


-- Trigger to update `updated_at` timestamps
/*
# [Create 'handle_updated_at' Trigger Function]
This function automatically updates the `updated_at` column for any table it's applied to.
*/
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$ language plpgsql;

create trigger on_books_update before update on public.books for each row execute procedure public.handle_updated_at();
create trigger on_members_update before update on public.members for each row execute procedure public.handle_updated_at();
create trigger on_circulation_update before update on public.circulation for each row execute procedure public.handle_updated_at();


-- Database Functions (RPC)
/*
# [Create 'add_category' Function]
Safely adds a new category.
*/
create or replace function public.add_category(p_name text)
returns void as $$
begin
  insert into public.categories (name) values (p_name);
end;
$$ language plpgsql security definer;
grant execute on function public.add_category(text) to service_role;


/*
# [Create 'delete_category' Function]
Deletes a category. Books associated with this category will have their category set to NULL.
*/
create or replace function public.delete_category(p_id uuid)
returns void as $$
begin
  delete from public.categories where id = p_id;
end;
$$ language plpgsql security definer;
grant execute on function public.delete_category(uuid) to service_role;


/*
# [Create 'issue_book' Function]
Handles the logic for issuing a book to a member.
*/
create or replace function public.issue_book(p_book_id uuid, p_member_id uuid, p_due_date timestamp with time zone)
returns void as $$
declare
  v_available_copies int;
begin
  select available_copies into v_available_copies from public.books where id = p_book_id for update;

  if v_available_copies > 0 then
    update public.books set available_copies = available_copies - 1 where id = p_book_id;
    insert into public.circulation (book_id, member_id, due_date, status)
    values (p_book_id, p_member_id, p_due_date, 'issued');
  else
    raise exception 'No available copies of the book to issue.';
  end if;
end;
$$ language plpgsql security definer;
grant execute on function public.issue_book(uuid, uuid, timestamp with time zone) to service_role;


/*
# [Create 'return_book' Function]
Handles the logic for returning a book.
*/
create or replace function public.return_book(p_circulation_id uuid)
returns void as $$
declare
  v_book_id uuid;
begin
  select book_id into v_book_id from public.circulation where id = p_circulation_id;

  if v_book_id is not null then
    update public.circulation set status = 'returned', return_date = timezone('utc', now()) where id = p_circulation_id;
    update public.books set available_copies = available_copies + 1 where id = v_book_id;
  else
    raise exception 'Circulation record not found.';
  end if;
end;
$$ language plpgsql security definer;
grant execute on function public.return_book(uuid) to service_role;


-- Enable Realtime
/*
# [Enable Realtime]
Adds tables to the 'supabase_realtime' publication to enable live updates in the app.
*/
alter publication supabase_realtime add table public.books;
alter publication supabase_realtime add table public.categories;
alter publication supabase_realtime add table public.members;
alter publication supabase_realtime add table public.circulation;
alter publication supabase_realtime add table public.feedback;
