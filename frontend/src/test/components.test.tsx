import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Input } from '../components/ui/Input';
import { Table, type Column } from '../components/ui/Table';

describe('Reusable UI Components', () => {
  it('Input component should render error message', () => {
    render(<Input label="Username" error="Invalid username" onChange={() => {}} />);
    expect(screen.getByText('Invalid username')).toBeInTheDocument();
  });

  it('Table component should trigger sort callback', () => {
    const handleSort = vi.fn();
    const columns: Column<{ name: string }>[] = [{ key: 'name', header: 'Name', sortable: true }];
    const data = [{ name: 'Test Item' }];

    render(
      <Table
        columns={columns}
        data={data}
        sortColumn="name"
        sortDirection="asc"
        onSort={handleSort}
      />,
    );

    const header = screen.getByText('Name');
    fireEvent.click(header);
    expect(handleSort).toHaveBeenCalledWith('name');
  });
});
