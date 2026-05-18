-- ============================================================
-- Migration 003: RLS policies + auto-insert trigger for app_user
--
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query).
-- Safe to re-run: uses DROP IF EXISTS + ON CONFLICT DO NOTHING.
-- ============================================================

-- ── 1. Ensure RLS is enabled ──────────────────────────────────
ALTER TABLE public.app_user ENABLE ROW LEVEL SECURITY;

-- ── 2. Drop old policies (clean slate) ───────────────────────
DROP POLICY IF EXISTS "users can view own profile"        ON public.app_user;
DROP POLICY IF EXISTS "superadmin can view all users"     ON public.app_user;
DROP POLICY IF EXISTS "superadmin can update users"       ON public.app_user;
DROP POLICY IF EXISTS "users can insert own profile"      ON public.app_user;
DROP POLICY IF EXISTS "authenticated users can view all"  ON public.app_user;
DROP POLICY IF EXISTS "admins can update profiles"        ON public.app_user;
DROP POLICY IF EXISTS "service role full access"          ON public.app_user;

-- ── 3. Helper function (SECURITY DEFINER bypasses RLS so it
--       won't recurse when called from inside a policy) ───────
CREATE OR REPLACE FUNCTION public.current_user_is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.app_user
    WHERE id = auth.uid()
      AND user_type IN ('ADMIN', 'SUPERADMIN')
  );
$$;

-- ── 4. RLS Policies ───────────────────────────────────────────

-- All authenticated users can read all rows.
-- (Needed so the AdminDashboard can list every user.)
CREATE POLICY "authenticated_read_all" ON public.app_user
  FOR SELECT
  TO authenticated
  USING (true);

-- Any authenticated user can insert their own row.
-- (Handles the fallback upsert in Register/Login when the trigger
--  is not yet deployed.)
CREATE POLICY "insert_own_row" ON public.app_user
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Only admins / superadmins can update rows.
CREATE POLICY "admin_update_any" ON public.app_user
  FOR UPDATE
  TO authenticated
  USING (public.current_user_is_admin());

-- ── 5. Auto-insert trigger ────────────────────────────────────
-- Creates an app_user row (INACTIVE, USER type) every time a new
-- auth.users entry is added — covers email/password AND OAuth.

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.app_user (id, email, user_type, record_status, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    'USER',
    'INACTIVE',
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();
