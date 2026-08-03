import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Typography } from '../components/ui/Typography';
import { Avatar } from '../components/ui/Avatar';
import { Divider } from '../components/ui/Divider';
import { ButtonGroup } from '../components/ui/ButtonGroup';
import { Button } from '../components/ui/Button';

describe('UI Foundation Components', () => {
  it('Typography should render h1 tag for display variant', () => {
    render(<Typography variant="display">Welcome</Typography>);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toBeInTheDocument();
  });

  it('Avatar should parse name to get initials', () => {
    render(<Avatar name="John Doe" />);
    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('Avatar should fall back to first 2 letters if name is single word', () => {
    render(<Avatar name="Administrator" />);
    expect(screen.getByText('AD')).toBeInTheDocument();
  });

  it('Divider vertical variant should render matching classes', () => {
    const { container } = render(<Divider layout="vertical" />);
    expect(container.firstChild).toHaveClass('w-px');
  });

  it('ButtonGroup should render items grouped together', () => {
    const { container } = render(
      <ButtonGroup>
        <Button>First</Button>
        <Button>Second</Button>
      </ButtonGroup>,
    );
    expect(container.firstChild).toHaveClass('-space-x-px');
  });
});
