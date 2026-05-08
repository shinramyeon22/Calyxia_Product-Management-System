/** @vitest-environment jsdom */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

vi.mock('../supabaseClient', () => {
  const chain = {
    select: vi.fn(function () { return this; }),
    eq: vi.fn(function () { return this; }),
    order: vi.fn(function () { return this; }),
    single: vi.fn(),
    insert: vi.fn(),
  };

  return {
    supabase: {
      auth: {
        getSession: vi.fn(),
        signOut: vi.fn(),
        signInWithOAuth: vi.fn(),
        signInWithPassword: vi.fn(),
        signUp: vi.fn(),
      },
      from: vi.fn(() => chain),
    },
    __esModule: true,
  };
});

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

import { handleAuthCallback } from '../pages/AuthCallback';
import Login from '../pages/Login';
import Register from '../pages/Register';
import App from '../App';
import { supabase } from '../supabaseClient';
import { useAuth as mockedUseAuth } from '../context/AuthContext';

const getSupabaseFromMock = () => supabase.from();

beforeEach(() => {
  vi.resetAllMocks();
  window.alert = vi.fn();
});

describe('Auth and guard behavior', () => {
  it('Google OAuth flow auto-provisions new user as USER', async () => {
    const session = { user: { id: 'new-id', email: 'new.user@example.com' } };
    supabase.auth.getSession.mockResolvedValue({ data: { session } });
    getSupabaseFromMock().single.mockResolvedValue({ data: null, error: { code: 'PGRST116' } });
    getSupabaseFromMock().insert.mockResolvedValue({ error: null });

    const navigateMock = vi.fn();
    await handleAuthCallback(supabase, navigateMock);

    expect(navigateMock).toHaveBeenCalledWith('/products');
    expect(getSupabaseFromMock().insert).toHaveBeenCalledWith([
      {
        id: 'new-id',
        email: 'new.user@example.com',
        record_status: 'ACTIVE',
        user_type: 'USER',
      },
    ]);
  });

  it('Login guard blocks inactive user and redirects to login with error', async () => {
    const session = { user: { id: 'inactive-id', email: 'inactive.user@example.com' } };
    supabase.auth.getSession.mockResolvedValue({ data: { session } });
    getSupabaseFromMock().single.mockResolvedValue({ data: { record_status: 'INACTIVE' }, error: null });
    supabase.auth.signOut.mockResolvedValue({});

    const navigateMock = vi.fn();
    await handleAuthCallback(supabase, navigateMock);

    expect(supabase.auth.signOut).toHaveBeenCalled();
    expect(navigateMock).toHaveBeenCalledWith('/login?error=not_activated');
  });

  it('Login guard allows ACTIVE user through to /products', async () => {
    mockedUseAuth.mockReturnValue({
      session: { user: { id: 'active-id' } },
      user: { user_type: 'USER' },
      loading: false,
    });

    const productsPayload = { data: [{ id: 1, name: 'Test Product', description: 'Nice', price: 10, image_url: '', record_status: 'A' }] };
    getSupabaseFromMock().order.mockResolvedValue(productsPayload);

    render(
      <MemoryRouter initialEntries={['/products']}>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Calyxia Collections/i)).toBeTruthy();
    });
  });

  it('User can register an account and then login with newly created credentials', async () => {
    supabase.auth.signUp.mockResolvedValue({ error: null });
    supabase.auth.signInWithPassword.mockResolvedValue({ error: null });

    render(
      <MemoryRouter initialEntries={["/register"]}>
        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<div>LOGIN_PAGE</div>} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/FULL NAME/i), { target: { value: 'New User' } });
    fireEvent.change(screen.getByPlaceholderText(/EMAIL ADDRESS/i), { target: { value: 'new.account@example.com' } });
    fireEvent.change(screen.getByPlaceholderText(/PASSWORD/i), { target: { value: 'Password123!' } });
    fireEvent.click(screen.getByRole('button', { name: /CREATE ACCOUNT/i }));

    await waitFor(() => {
      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'new.account@example.com',
        password: 'Password123!',
        options: {
          data: { full_name: 'New User' },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      expect(screen.getByText('LOGIN_PAGE')).toBeTruthy();
    });

    render(
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/products" element={<div>PRODUCTS_PAGE</div>} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getAllByPlaceholderText(/EMAIL ADDRESS/i)[0], { target: { value: 'new.account@example.com' } });
    fireEvent.change(screen.getByPlaceholderText(/PASSWORD/i), { target: { value: 'Password123!' } });
    fireEvent.click(screen.getByRole('button', { name: /SIGN IN/i }));

    await waitFor(() => {
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'new.account@example.com',
        password: 'Password123!',
      });
      expect(screen.getByText('PRODUCTS_PAGE')).toBeTruthy();
    });
  });
});
