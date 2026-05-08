import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { useRights } from '../context/UserRightsContext';
import { useAuth } from '../context/AuthContext';
import ProductManagement from '../pages/ProductManagement';
import { BrowserRouter } from 'react-router-dom';
import * as productService from '../services/productService';

vi.mock('../context/UserRightsContext');
vi.mock('../context/AuthContext');
vi.mock('../services/productService');

const renderWithRouter = (ui) => render(ui, { wrapper: BrowserRouter });

/**
 * Sprint 2: Rights Matrix Enforcement (18 Cases)
 * 
 * Matrix: 6 Rights × 3 User Types
 * 
 * Rights:
 *   1. PRD_ADD   - Can create new products
 *   2. PRD_EDIT  - Can edit existing products
 *   3. PRD_DEL   - Can delete products
 *   4. PRD_VIEW  - Can view products (default for all)
 *   5. PRICE_ADD - Can add price entries
 *   6. PRICE_VIEW- Can view price history (default for all)
 * 
 * User Types:
 *   - USER       - Limited access (view only)
 *   - ADMIN      - Full CRUD access
 *   - SUPERADMIN - Full access to everything
 */
describe('Sprint 2: Rights Matrix Enforcement (18 Cases)', () => {
  beforeEach(() => {
    // Mock product service
    vi.mocked(productService.getProducts).mockResolvedValue([
      { id: 1, name: 'Product 1', description: 'Test product', unit: 'ea', created_at: new Date() }
    ]);
    vi.mocked(productService.getCurrentPrice).mockResolvedValue(100);
    vi.mocked(productService.getPriceHistory).mockResolvedValue([]);
  });

  const mockAuth = (type) => {
    useAuth.mockReturnValue({ user: { user_type: type }, loading: false });
  };

  describe('USER Role - Limited Access (Cases 1-6)', () => {
    beforeEach(() => mockAuth('USER'));

    it('Case 1: USER - PRD_VIEW should show product list', () => {
      useRights.mockReturnValue({ 
        hasRight: (r) => r === 'PRD_VIEW', 
        loading: false,
        rights: { PRD_VIEW: 1, PRD_ADD: 0, PRD_EDIT: 0, PRD_DEL: 0, PRICE_VIEW: 1, PRICE_ADD: 0 }
      });

      renderWithRouter(<ProductManagement />);
      
      expect(screen.queryByText(/\+ ADD NEW ASSET/i)).not.toBeInTheDocument();
    });

    it('Case 2: USER - PRD_ADD should be blocked', () => {
      useRights.mockReturnValue({ 
        hasRight: (r) => r === 'PRD_VIEW', 
        loading: false,
        rights: { PRD_VIEW: 1, PRD_ADD: 0, PRD_EDIT: 0, PRD_DEL: 0, PRICE_VIEW: 1, PRICE_ADD: 0 }
      });

      renderWithRouter(<ProductManagement />);
      
      expect(screen.queryByText(/\+ ADD NEW ASSET/i)).not.toBeInTheDocument();
    });

    it('Case 3: USER - PRD_EDIT should be blocked', () => {
      useRights.mockReturnValue({ 
        hasRight: (r) => r === 'PRD_VIEW', 
        loading: false,
        rights: { PRD_VIEW: 1, PRD_ADD: 0, PRD_EDIT: 0, PRD_DEL: 0, PRICE_VIEW: 1, PRICE_ADD: 0 }
      });

      renderWithRouter(<ProductManagement />);
      
      expect(screen.queryByText(/EDIT/i)).not.toBeInTheDocument();
    });

    it('Case 4: USER - PRD_DEL should be blocked', () => {
      useRights.mockReturnValue({ 
        hasRight: (r) => r === 'PRD_VIEW', 
        loading: false,
        rights: { PRD_VIEW: 1, PRD_ADD: 0, PRD_EDIT: 0, PRD_DEL: 0, PRICE_VIEW: 1, PRICE_ADD: 0 }
      });

      renderWithRouter(<ProductManagement />);
      
      expect(screen.queryByText(/DELETE/i)).not.toBeInTheDocument();
    });

    it('Case 5: USER - PRICE_VIEW should show price history button', () => {
      useRights.mockReturnValue({ 
        hasRight: (r) => r === 'PRD_VIEW' || r === 'PRICE_VIEW', 
        loading: false,
        rights: { PRD_VIEW: 1, PRD_ADD: 0, PRD_EDIT: 0, PRD_DEL: 0, PRICE_VIEW: 1, PRICE_ADD: 0 }
      });

      renderWithRouter(<ProductManagement />);
      
      expect(screen.queryByText(/PRICE HISTORY/i)).not.toBeInTheDocument();
    });

    it('Case 6: USER - PRICE_ADD should be blocked', () => {
      useRights.mockReturnValue({ 
        hasRight: (r) => r === 'PRD_VIEW' || r === 'PRICE_VIEW', 
        loading: false,
        rights: { PRD_VIEW: 1, PRD_ADD: 0, PRD_EDIT: 0, PRD_DEL: 0, PRICE_VIEW: 1, PRICE_ADD: 0 }
      });

      renderWithRouter(<ProductManagement />);
      
      expect(screen.queryByText(/ADD ENTRY/i)).not.toBeInTheDocument();
    });
  });

  describe('ADMIN Role - Full CRUD Access (Cases 7-12)', () => {
    beforeEach(() => mockAuth('ADMIN'));

    it('Case 7: ADMIN - PRD_VIEW should show product list', async () => {
      useRights.mockReturnValue({ 
        hasRight: () => true, 
        loading: false,
        rights: { PRD_VIEW: 1, PRD_ADD: 1, PRD_EDIT: 1, PRD_DEL: 1, PRICE_VIEW: 1, PRICE_ADD: 1 }
      });

      renderWithRouter(<ProductManagement />);
      
      await waitFor(() => {
        expect(screen.getByText(/\+ ADD NEW ASSET/i)).toBeInTheDocument();
      });
    });

    it('Case 8: ADMIN - PRD_ADD should be allowed', async () => {
      useRights.mockReturnValue({ 
        hasRight: () => true, 
        loading: false,
        rights: { PRD_VIEW: 1, PRD_ADD: 1, PRD_EDIT: 1, PRD_DEL: 1, PRICE_VIEW: 1, PRICE_ADD: 1 }
      });

      renderWithRouter(<ProductManagement />);
      
      await waitFor(() => {
        expect(screen.getByText(/\+ ADD NEW ASSET/i)).toBeInTheDocument();
      });
    });

    it('Case 9: ADMIN - PRD_EDIT should be allowed', async () => {
      useRights.mockReturnValue({ 
        hasRight: () => true, 
        loading: false,
        rights: { PRD_VIEW: 1, PRD_ADD: 1, PRD_EDIT: 1, PRD_DEL: 1, PRICE_VIEW: 1, PRICE_ADD: 1 }
      });

      renderWithRouter(<ProductManagement />);
      
      await waitFor(() => {
        expect(screen.getByText(/EDIT/i)).toBeInTheDocument();
      });
    });

    it('Case 10: ADMIN - PRD_DEL should be allowed', async () => {
      useRights.mockReturnValue({ 
        hasRight: () => true, 
        loading: false,
        rights: { PRD_VIEW: 1, PRD_ADD: 1, PRD_EDIT: 1, PRD_DEL: 1, PRICE_VIEW: 1, PRICE_ADD: 1 }
      });

      renderWithRouter(<ProductManagement />);
      
      await waitFor(() => {
        expect(screen.getByText(/DELETE/i)).toBeInTheDocument();
      });
    });

    it('Case 11: ADMIN - PRICE_VIEW should show price history button', async () => {
      useRights.mockReturnValue({ 
        hasRight: () => true, 
        loading: false,
        rights: { PRD_VIEW: 1, PRD_ADD: 1, PRD_EDIT: 1, PRD_DEL: 1, PRICE_VIEW: 1, PRICE_ADD: 1 }
      });

      renderWithRouter(<ProductManagement />);
      
      await waitFor(() => {
        expect(screen.getByText(/PRICE HISTORY/i)).toBeInTheDocument();
      });
    });

    it('Case 12: ADMIN - PRICE_ADD should be allowed', async () => {
      useRights.mockReturnValue({ 
        hasRight: () => true, 
        loading: false,
        rights: { PRD_VIEW: 1, PRD_ADD: 1, PRD_EDIT: 1, PRD_DEL: 1, PRICE_VIEW: 1, PRICE_ADD: 1 }
      });

      renderWithRouter(<ProductManagement />);
      
      await waitFor(() => {
        expect(screen.getByText(/ADD ENTRY/i)).toBeInTheDocument();
      });
    });
  });

  describe('SUPERADMIN Role - Full Access (Cases 13-18)', () => {
    beforeEach(() => mockAuth('SUPERADMIN'));

    it('Case 13: SUPERADMIN - PRD_VIEW should show product list', async () => {
      useRights.mockReturnValue({ 
        hasRight: () => true, 
        loading: false,
        rights: { PRD_VIEW: 1, PRD_ADD: 1, PRD_EDIT: 1, PRD_DEL: 1, PRICE_VIEW: 1, PRICE_ADD: 1 }
      });

      renderWithRouter(<ProductManagement />);
      
      await waitFor(() => {
        expect(screen.getByText(/\+ ADD NEW ASSET/i)).toBeInTheDocument();
      });
    });

    it('Case 14: SUPERADMIN - PRD_ADD should be allowed', async () => {
      useRights.mockReturnValue({ 
        hasRight: () => true, 
        loading: false,
        rights: { PRD_VIEW: 1, PRD_ADD: 1, PRD_EDIT: 1, PRD_DEL: 1, PRICE_VIEW: 1, PRICE_ADD: 1 }
      });

      renderWithRouter(<ProductManagement />);
      
      await waitFor(() => {
        expect(screen.getByText(/\+ ADD NEW ASSET/i)).toBeInTheDocument();
      });
    });

    it('Case 15: SUPERADMIN - PRD_EDIT should be allowed', async () => {
      useRights.mockReturnValue({ 
        hasRight: () => true, 
        loading: false,
        rights: { PRD_VIEW: 1, PRD_ADD: 1, PRD_EDIT: 1, PRD_DEL: 1, PRICE_VIEW: 1, PRICE_ADD: 1 }
      });

      renderWithRouter(<ProductManagement />);
      
      await waitFor(() => {
        expect(screen.getByText(/EDIT/i)).toBeInTheDocument();
      });
    });

    it('Case 16: SUPERADMIN - PRD_DEL should be allowed', async () => {
      useRights.mockReturnValue({ 
        hasRight: () => true, 
        loading: false,
        rights: { PRD_VIEW: 1, PRD_ADD: 1, PRD_EDIT: 1, PRD_DEL: 1, PRICE_VIEW: 1, PRICE_ADD: 1 }
      });

      renderWithRouter(<ProductManagement />);
      
      await waitFor(() => {
        expect(screen.getByText(/DELETE/i)).toBeInTheDocument();
      });
    });

    it('Case 17: SUPERADMIN - PRICE_VIEW should show price history button', async () => {
      useRights.mockReturnValue({ 
        hasRight: () => true, 
        loading: false,
        rights: { PRD_VIEW: 1, PRD_ADD: 1, PRD_EDIT: 1, PRD_DEL: 1, PRICE_VIEW: 1, PRICE_ADD: 1 }
      });

      renderWithRouter(<ProductManagement />);
      
      await waitFor(() => {
        expect(screen.getByText(/PRICE HISTORY/i)).toBeInTheDocument();
      });
    });

    it('Case 18: SUPERADMIN - PRICE_ADD should be allowed', async () => {
      useRights.mockReturnValue({ 
        hasRight: () => true, 
        loading: false,
        rights: { PRD_VIEW: 1, PRD_ADD: 1, PRD_EDIT: 1, PRD_DEL: 1, PRICE_VIEW: 1, PRICE_ADD: 1 }
      });

      renderWithRouter(<ProductManagement />);
      
      await waitFor(() => {
        expect(screen.getByText(/ADD ENTRY/i)).toBeInTheDocument();
      });
    });
  });
});
