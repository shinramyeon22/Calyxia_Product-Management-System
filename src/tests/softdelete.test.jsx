import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { useAuth } from '../context/AuthContext';
import { useRights } from '../context/UserRightsContext';
import * as productService from '../services/productService';
import ProductManagement from '../pages/ProductManagement';
import DeletedItemsPage from '../pages/DeletedItemsPage';
import { BrowserRouter } from 'react-router-dom';

vi.mock('../context/AuthContext');
vi.mock('../context/UserRightsContext');
vi.mock('../services/productService');

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const renderWithRouter = (ui) => render(ui, { wrapper: BrowserRouter });

describe('Sprint 2: Visibility & Stamp Gating', () => {
  beforeEach(() => {
    vi.mocked(productService.getProducts).mockResolvedValue([
      { id: 1, name: 'Test product', description: 'A product', unit: 'ea', created_at: new Date() }
    ]);
    vi.mocked(productService.getCurrentPrice).mockResolvedValue(100);
    vi.mocked(productService.getPriceHistory).mockResolvedValue([]);
    mockNavigate.mockClear();
  });

  it('should hide CREATED (Stamp) column for USER', async () => {
    useAuth.mockReturnValue({ user: { user_type: 'USER' }, loading: false });
    useRights.mockReturnValue({ hasRight: () => false, loading: false });

    renderWithRouter(<ProductManagement />);
    await waitFor(() => {
      expect(screen.queryByText(/CREATED/i)).not.toBeInTheDocument();
    });
  });

  it('should show CREATED (Stamp) column for ADMIN', async () => {
    useAuth.mockReturnValue({ user: { user_type: 'ADMIN' }, loading: false });
    useRights.mockReturnValue({ hasRight: () => true, loading: false });

    renderWithRouter(<ProductManagement />);
    await waitFor(() => {
      expect(screen.getByText(/CREATED/i)).toBeInTheDocument();
    });
  });

  it('should redirect USER away from DeletedItemsPage', async () => {
    useAuth.mockReturnValue({ user: { user_type: 'USER' }, loading: false });

    renderWithRouter(<DeletedItemsPage />);

    // Verifies the useEffect redirection logic in Source 4
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/products', { replace: true });
    });
  });
});
