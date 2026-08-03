import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FormContainer, FormGrid } from '../components/ui/FormLayout';
import { DatePicker } from '../components/ui/DatePicker';
import { OtpInput } from '../components/ui/OtpInput';
import { z } from 'zod';

const emailSchema = z.object({
  email: z.string().email('Invalid email address'),
});

describe('UI Form System & Inputs', () => {
  it('FormContainer and FormGrid should render children correctly', () => {
    const { container } = render(
      <FormContainer>
        <FormGrid cols={2}>
          <div>Input 1</div>
          <div>Input 2</div>
        </FormGrid>
      </FormContainer>,
    );
    expect(container.firstChild).toHaveClass('space-y-6');
    expect(screen.getByText('Input 1')).toBeInTheDocument();
  });

  it('DatePicker range should render start and end input fields', () => {
    const handleChangeEnd = vi.fn();
    render(
      <DatePicker
        label="Date Interval"
        variant="range"
        value="2026-08-01"
        valueEnd="2026-08-15"
        onChangeEnd={handleChangeEnd}
      />,
    );
    expect(screen.getByText('Date Interval')).toBeInTheDocument();
    expect(screen.getByText('to')).toBeInTheDocument();
  });

  it('OtpInput should trigger change callback on entry', () => {
    const handleChange = vi.fn();
    render(<OtpInput value="" onChange={handleChange} length={6} />);
    const inputs = screen.getAllByRole('textbox');
    expect(inputs).toHaveLength(6);
    fireEvent.change(inputs[0], { target: { value: '9' } });
    expect(handleChange).toHaveBeenCalledWith('9');
  });

  it('Zod validation should assert correct error string', () => {
    const res = emailSchema.safeParse({ email: 'incorrect-format' });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues[0].message).toBe('Invalid email address');
    }
  });
});
