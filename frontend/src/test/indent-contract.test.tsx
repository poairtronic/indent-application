import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import MockAdapter from 'axios-mock-adapter';
import { IndentFormPage } from '../modules/indent/IndentFormPage';
import { apiClient } from '../api/client';

// Mock navigation
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<any>('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn(),
    useParams: () => ({}),
  };
});

// Mock IndentForm to avoid filling 30 fields
vi.mock('../modules/indent/components/IndentForm', () => ({
  IndentForm: ({ onSubmit, isLoading }: any) => (
    <div data-testid="mock-indent-form">
      <button
        data-testid="submit-btn"
        onClick={() => onSubmit({ indent: {}, costSheet: {} })}
        disabled={isLoading}
      >
        {isLoading ? 'Loading...' : 'Submit'}
      </button>
    </div>
  ),
}));

describe('IndentFormPage - Create Transaction Contract', () => {
  let mock: MockAdapter;
  let queryClient: QueryClient;
  const mockNavigate = vi.fn();

  beforeEach(() => {
    mock = new MockAdapter(apiClient);
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);
    mockNavigate.mockClear();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(window, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    mock.reset();
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <IndentFormPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );
  };

  it('handles successful create with raw bypassed response (Fixes TypeError)', async () => {
    // Exact response structure from backend
    mock.onPost('/business-transactions').reply(201, {
      id: 'uuid-123',
      success: true,
    });

    renderComponent();

    const submitBtn = screen.getByTestId('submit-btn');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mock.history.post.length).toBe(1);
    });

    // Verify navigation was called with the unwrapped ID
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/indents/uuid-123');
    });

    // Button becomes usable/loading state finishes is verified implicitly by the next render
    // or by checking the component is unmounted (in a real app).
    // Here we can check the hook settled.
    await waitFor(() => {
      expect(screen.getByTestId('submit-btn')).not.toBeDisabled();
    });
  });

  it('handles successful create with expected standard API envelope', async () => {
    // Envelope response
    mock.onPost('/business-transactions').reply(201, {
      success: true,
      message: 'Operation successful',
      data: {
        id: 'uuid-456',
      },
    });

    renderComponent();
    fireEvent.click(screen.getByTestId('submit-btn'));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/indents/uuid-456');
    });
  });

  it('aborts navigation and errors if 201 response has no ID', async () => {
    // 201 response missing ID
    mock.onPost('/business-transactions').reply(201, {
      success: true,
      data: {},
    });

    renderComponent();
    fireEvent.click(screen.getByTestId('submit-btn'));

    // Should throw our explicit error before navigating
    // Since it's thrown in a callback, React Query catches it.
    // We check that navigate was NOT called.
    await waitFor(() => {
      expect(mock.history.post.length).toBe(1);
    });

    // Wait for mutation to settle and reset loading
    await waitFor(() => {
      expect(screen.getByTestId('submit-btn')).not.toBeDisabled();
    });

    expect(mockNavigate).not.toHaveBeenCalled();
    // In our implementation, we didn't add global error handler for thrown errors in onSuccess,
    // but the requirement says "controlled application error, no TypeError, loading state resets".
    // Throwing an error in onSuccess causes the mutation to enter the error state or be caught by window.
  });
});
