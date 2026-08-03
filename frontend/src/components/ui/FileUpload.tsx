import React, { useState, useRef } from 'react';
import { UploadCloud, File, Trash2 } from 'lucide-react';

interface FileUploadProps {
  label?: string;
  maxSizeMb?: number;
  acceptedTypes?: string[];
  onFileSelect?: (file: File) => void;
  onFileRemove?: () => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  label = 'Upload Cost sheets or drawings',
  maxSizeMb = 10,
  acceptedTypes = ['.pdf', '.xlsx', '.xls', '.docx'],
  onFileSelect,
  onFileRemove,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): boolean => {
    setError(null);
    const sizeLimit = maxSizeMb * 1024 * 1024;

    if (file.size > sizeLimit) {
      setError(`File exceeds the maximum limit of ${maxSizeMb}MB.`);
      return false;
    }

    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!acceptedTypes.includes(ext)) {
      setError(`Supported formats: ${acceptedTypes.join(', ')}`);
      return false;
    }

    return true;
  };

  const simulateProgress = (file: File) => {
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setSelectedFile(file);
          onFileSelect?.(file);
          return 100;
        }
        return prev + 10;
      });
    }, 100);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        simulateProgress(file);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        simulateProgress(file);
      }
    }
  };

  const handleRemove = () => {
    setSelectedFile(null);
    setProgress(0);
    setError(null);
    onFileRemove?.();
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="w-full font-sans text-xs">
      {label && (
        <span className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wide">
          {label}
        </span>
      )}

      {!selectedFile && progress === 0 && (
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center flex flex-col items-center justify-center cursor-pointer transition-all ${
            dragActive
              ? 'border-accent-primary bg-accent-primary/5'
              : 'border-border-default hover:border-accent-primary hover:bg-surface-elevated'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept={acceptedTypes.join(',')}
            onChange={handleChange}
          />
          <UploadCloud className="w-8 h-8 text-text-muted mb-3" />
          <p className="font-semibold text-text-primary mb-1">Drag and drop attachment files</p>
          <p className="text-[10px] text-text-muted">
            Formats: {acceptedTypes.join(', ')} up to {maxSizeMb}MB
          </p>
        </div>
      )}

      {progress > 0 && progress < 100 && (
        <div className="border border-border-default rounded-xl p-4 bg-surface-card space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-text-primary">Uploading attachment...</span>
            <span className="text-[10px] text-text-muted">{progress}%</span>
          </div>
          <div className="w-full h-1.5 bg-background-primary rounded-full overflow-hidden">
            <div
              className="h-full bg-accent-primary transition-all duration-150"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {selectedFile && (
        <div className="border border-border-default rounded-xl p-3 bg-surface-card flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-background-secondary flex items-center justify-center text-accent-primary shrink-0">
              <File className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-text-primary truncate">{selectedFile.name}</p>
              <p className="text-[10px] text-text-muted mt-0.5">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={handleRemove}
              className="p-1.5 text-text-secondary hover:text-status-error hover:bg-background-secondary rounded-lg transition-colors focus:outline-none"
              title="Remove File"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {error && <p className="mt-1.5 text-[10px] text-status-error font-semibold">{error}</p>}
    </div>
  );
};
