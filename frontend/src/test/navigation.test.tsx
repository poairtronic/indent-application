import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

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

const queryClient = new QueryClient();

describe('Sidebar Component', () => {
  it('should render standard headers and list items', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <Sidebar />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(screen.getByText('MERC')).toBeInTheDocument();
  });
});
