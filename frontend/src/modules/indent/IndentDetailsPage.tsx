import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useIndent } from '../../hooks/useIndents';
import { IndentDetails } from './components/IndentDetails';
import { ArrowLeft, Edit, Printer, Copy } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export const IndentDetailsPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: indent, isLoading } = useIndent(id || '');

  if (isLoading) {
    return <div className="flex justify-center p-12">Loading indent details...</div>;
  }

  if (!indent) {
    return <div className="flex justify-center p-12 text-status-error">Indent not found.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate('/indents')} className="p-2">
            <ArrowLeft size={16} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Indent {indent.indentNumber}</h1>
            <p className="text-sm text-text-secondary mt-1">
              View comprehensive details and workflow progress
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="flex items-center gap-2"
          >
            <Printer size={16} />
            Print
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/indents/create')}
            className="flex items-center gap-2"
          >
            <Copy size={16} />
            Duplicate
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate(`/indents/${id}/edit`)}
            className="flex items-center gap-2"
          >
            <Edit size={16} />
            Edit
          </Button>
        </div>
      </div>

      <IndentDetails indent={indent} />
    </div>
  );
};
