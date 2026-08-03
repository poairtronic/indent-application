import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';

vi.mock('../store/authStore', () => {
  const mockAuthStore = vi.fn((selector) => {
    const state = {
      hasPermission: () => true,
      user: { firstName: 'Test', lastName: 'User', role: { roleName: 'Operator' } },
    };
    return selector(state);
  });
  (mockAuthStore as any).getState = () => ({
    hasPermission: () => true,
    user: { firstName: 'Test', lastName: 'User', role: { roleName: 'Operator' } },
  });
  (mockAuthStore as any).setState = vi.fn();

  return {
    useAuthStore: mockAuthStore,
  };
});

describe('Sidebar Component', () => {
  it('should render standard headers and list items', () => {
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>,
    );

    expect(screen.getByText('IMCMS')).toBeInTheDocument();
  });
});
