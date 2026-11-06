import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Combobox } from '../components/ui/Combobox';
import { extractVendorName } from '../modules/indent/components/IndentForm';

describe('Combobox Component & Vendor Logic', () => {
  const options = [
    { label: 'N.R.S. Engineering (AGIPL-VEN-019)', value: 'N.R.S. Engineering' },
    { label: 'Sabari Spark (AGIPL-VEN-018)', value: 'Sabari Spark' },
    { label: 'GSM Engineers (AGIPL-VEN-017)', value: 'GSM Engineers' },
  ];

  it('renders input with placeholder and does not prefill with "Vendor"', () => {
    const handleChange = vi.fn();
    render(
      <Combobox
        label="Select Vendor"
        placeholder="Type or select vendor from master..."
        value=""
        onChange={handleChange}
        options={options}
      />,
    );

    const input = screen.getByPlaceholderText('Type or select vendor from master...') as HTMLInputElement;
    expect(input.value).toBe('');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('opens dropdown and lists all vendors below when focused or clicked', () => {
    const handleChange = vi.fn();
    render(
      <Combobox
        label="Select Vendor"
        placeholder="Type or select vendor from master..."
        value=""
        onChange={handleChange}
        options={options}
      />,
    );

    const input = screen.getByPlaceholderText('Type or select vendor from master...');
    fireEvent.focus(input);

    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.getByText('N.R.S. Engineering (AGIPL-VEN-019)')).toBeInTheDocument();
    expect(screen.getByText('Sabari Spark (AGIPL-VEN-018)')).toBeInTheDocument();
    expect(screen.getByText('GSM Engineers (AGIPL-VEN-017)')).toBeInTheDocument();
  });

  it('filters vendor list below as user types into search bar', () => {
    const handleChange = vi.fn();
    render(
      <Combobox
        label="Select Vendor"
        placeholder="Type or select vendor from master..."
        value=""
        onChange={handleChange}
        options={options}
      />,
    );

    const input = screen.getByPlaceholderText('Type or select vendor from master...');
    fireEvent.change(input, { target: { value: 'Sabari' } });

    expect(handleChange).toHaveBeenCalledWith('Sabari');
    expect(screen.getByText('Sabari Spark (AGIPL-VEN-018)')).toBeInTheDocument();
    expect(screen.queryByText('N.R.S. Engineering (AGIPL-VEN-019)')).not.toBeInTheDocument();
  });

  it('filters by vendor code as user types code into search bar', () => {
    const handleChange = vi.fn();
    render(
      <Combobox
        label="Select Vendor"
        placeholder="Type or select vendor from master..."
        value=""
        onChange={handleChange}
        options={options}
      />,
    );

    const input = screen.getByPlaceholderText('Type or select vendor from master...');
    fireEvent.change(input, { target: { value: '017' } });

    expect(screen.getByText('GSM Engineers (AGIPL-VEN-017)')).toBeInTheDocument();
    expect(screen.queryByText('Sabari Spark (AGIPL-VEN-018)')).not.toBeInTheDocument();
  });

  it('selects vendor when clicking an option in the list', () => {
    const handleChange = vi.fn();
    render(
      <Combobox
        label="Select Vendor"
        placeholder="Type or select vendor from master..."
        value=""
        onChange={handleChange}
        options={options}
      />,
    );

    const input = screen.getByPlaceholderText('Type or select vendor from master...');
    fireEvent.focus(input);

    const option = screen.getByText('Sabari Spark (AGIPL-VEN-018)');
    fireEvent.mouseDown(option);

    expect(handleChange).toHaveBeenCalledWith('Sabari Spark');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('clears selection cleanly via the clear button without reverting to "Vendor"', () => {
    const handleChange = vi.fn();
    render(
      <Combobox
        label="Select Vendor"
        placeholder="Type or select vendor from master..."
        value="Sabari Spark"
        onChange={handleChange}
        options={options}
      />,
    );

    const clearBtn = screen.getByRole('button', { name: /clear selection/i });
    expect(clearBtn).toBeInTheDocument();

    fireEvent.click(clearBtn);

    expect(handleChange).toHaveBeenCalledWith('');
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.getByText('N.R.S. Engineering (AGIPL-VEN-019)')).toBeInTheDocument();
  });

  it('supports keyboard navigation and enter to select', () => {
    const handleChange = vi.fn();
    render(
      <Combobox
        label="Select Vendor"
        placeholder="Type or select vendor from master..."
        value=""
        onChange={handleChange}
        options={options}
      />,
    );

    const input = screen.getByPlaceholderText('Type or select vendor from master...');
    fireEvent.focus(input);
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(handleChange).toHaveBeenCalledWith('N.R.S. Engineering');
  });

  describe('extractVendorName helper', () => {
    it('returns empty string when raw value is "Vendor" or case variants', () => {
      expect(extractVendorName('Vendor')).toBe('');
      expect(extractVendorName('vendor')).toBe('');
      expect(extractVendorName('VENDOR')).toBe('');
      expect(extractVendorName('Vendor: ')).toBe('');
      expect(extractVendorName('Vendor: Vendor')).toBe('');
      expect(extractVendorName('')).toBe('');
      expect(extractVendorName(null)).toBe('');
      expect(extractVendorName(undefined)).toBe('');
    });

    it('extracts vendor name cleanly from formatted strings', () => {
      expect(extractVendorName('Vendor: Sabari Spark')).toBe('Sabari Spark');
      expect(extractVendorName('Vendor - GSM Engineers')).toBe('GSM Engineers');
      expect(extractVendorName('N.R.S. Engineering')).toBe('N.R.S. Engineering');
    });
  });
});

