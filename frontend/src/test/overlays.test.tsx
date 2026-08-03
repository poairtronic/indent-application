import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DropdownMenu } from '../components/ui/Menus';
import { ShortcutHelper } from '../components/ui/ShortcutHelper';
import { Popover } from '../components/ui/Popover';

describe('UI Overlay & Menus Framework', () => {
  it('DropdownMenu should toggle options on trigger click', () => {
    const handleSelect = vi.fn();
    const options = [{ label: 'Edit record', onClick: handleSelect }];

    render(<DropdownMenu trigger={<button>Open Actions</button>} options={options} />);

    expect(screen.queryByText('Edit record')).not.toBeInTheDocument();

    const trigger = screen.getByText('Open Actions');
    fireEvent.click(trigger);

    const option = screen.getByText('Edit record');
    expect(option).toBeInTheDocument();

    fireEvent.click(option);
    expect(handleSelect).toHaveBeenCalled();
  });

  it('ShortcutHelper should intercept ? key press and open shortcuts helper', () => {
    render(<ShortcutHelper />);
    expect(screen.queryByText('System Keyboard Shortcuts')).not.toBeInTheDocument();

    fireEvent.keyDown(window, { key: '?' });
    expect(screen.getByText('System Keyboard Shortcuts')).toBeInTheDocument();
  });

  it('Popover should toggle content on trigger click', () => {
    render(
      <Popover trigger={<button>Click Help</button>}>
        <div>Detailed guidance notes</div>
      </Popover>,
    );
    expect(screen.queryByText('Detailed guidance notes')).not.toBeInTheDocument();

    const trigger = screen.getByText('Click Help');
    fireEvent.click(trigger);
    expect(screen.getByText('Detailed guidance notes')).toBeInTheDocument();
  });
});
