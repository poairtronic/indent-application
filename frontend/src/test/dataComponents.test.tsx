import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BaseCard, MetricCard } from '../components/ui/Cards';
import { PriorityBadge } from '../components/ui/StatusBadges';
import { DataGridView } from '../components/ui/DataGridView';

describe('UI Data Components', () => {
  it('BaseCard should render children successfully', () => {
    render(<BaseCard>Test Content</BaseCard>);
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('MetricCard should display correct title and value', () => {
    render(<MetricCard title="Total Indents" value="1,420" trend="+15%" trendDirection="up" />);
    expect(screen.getByText('Total Indents')).toBeInTheDocument();
    expect(screen.getByText('1,420')).toBeInTheDocument();
    expect(screen.getByText('↑ +15%')).toBeInTheDocument();
  });

  it('PriorityBadge should map priority to correct styles', () => {
    const { container } = render(<PriorityBadge priority="HIGH" />);
    expect(container.firstChild).toHaveClass('text-status-error');
  });

  it('DataGridView should toggle view modes correctly', () => {
    const data = ['Item A', 'Item B'];
    render(
      <DataGridView
        data={data}
        renderGridItem={(item) => <div>Grid: {item}</div>}
        renderListItem={(item) => <div>List: {item}</div>}
        renderCardItem={(item) => <div>Card: {item}</div>}
      />,
    );

    expect(screen.getByText('Grid: Item A')).toBeInTheDocument();

    const listBtn = screen.getByTitle('List View');
    fireEvent.click(listBtn);
    expect(screen.getByText('List: Item A')).toBeInTheDocument();

    const cardBtn = screen.getByTitle('Card View');
    fireEvent.click(cardBtn);
    expect(screen.getByText('Card: Item A')).toBeInTheDocument();
  });
});
