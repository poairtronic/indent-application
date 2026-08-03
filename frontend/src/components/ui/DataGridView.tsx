import React, { useState } from 'react';
import { Grid, List, Layers } from 'lucide-react';
import { ButtonGroup } from './ButtonGroup';
import { Button } from './Button';

export type ViewType = 'grid' | 'list' | 'card';

interface DataGridViewProps<T> {
  data: T[];
  renderGridItem: (item: T) => React.ReactNode;
  renderListItem: (item: T) => React.ReactNode;
  renderCardItem: (item: T) => React.ReactNode;
  defaultView?: ViewType;
  className?: string;
}

export function DataGridView<T>({
  data,
  renderGridItem,
  renderListItem,
  renderCardItem,
  defaultView = 'grid',
  className = '',
}: DataGridViewProps<T>) {
  const [view, setView] = useState<ViewType>(defaultView);

  return (
    <div className={`w-full font-sans text-xs space-y-4 ${className}`}>
      <div className="flex justify-end select-none">
        <ButtonGroup>
          <Button
            variant={view === 'grid' ? 'primary' : 'secondary'}
            size="sm"
            icon={<Grid size={12} />}
            onClick={() => setView('grid')}
            title="Grid View"
          />
          <Button
            variant={view === 'list' ? 'primary' : 'secondary'}
            size="sm"
            icon={<List size={12} />}
            onClick={() => setView('list')}
            title="List View"
          />
          <Button
            variant={view === 'card' ? 'primary' : 'secondary'}
            size="sm"
            icon={<Layers size={12} />}
            onClick={() => setView('card')}
            title="Card View"
          />
        </ButtonGroup>
      </div>

      {view === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map((item, idx) => (
            <div key={idx}>{renderGridItem(item)}</div>
          ))}
        </div>
      )}

      {view === 'list' && (
        <div className="border border-border-default rounded-xl bg-surface-card divide-y divide-border-default/50 overflow-hidden shadow-sm">
          {data.map((item, idx) => (
            <div key={idx} className="p-3 hover:bg-background-secondary transition-colors">
              {renderListItem(item)}
            </div>
          ))}
        </div>
      )}

      {view === 'card' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {data.map((item, idx) => (
            <div key={idx}>{renderCardItem(item)}</div>
          ))}
        </div>
      )}
    </div>
  );
}
