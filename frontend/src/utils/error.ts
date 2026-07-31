import axios from 'axios';

export function getApiErrorMessage(
  error: unknown,
  fallback = 'Something went wrong. Please try again.',
): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string | string[] } | undefined;

    if (Array.isArray(data?.message)) {
      return data!.message!.join(', ');
    }

    if (typeof data?.message === 'string') {
      return data.message;
    }

    if (error.code === 'ERR_NETWORK') {
      return 'Unable to reach the server. Make sure the backend is running and try again.';
    }

    if (error.response?.status && error.response.status >= 500) {
      return 'The server encountered an error. Please try again later.';
    }
  }

  return fallback;
}
