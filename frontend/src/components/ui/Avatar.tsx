import React from 'react';

interface AvatarProps {
  src?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg';
  status?: 'online' | 'offline' | 'none';
  className?: string;
}

const sizeClasses = {
  sm: 'w-6 h-6 text-[10px]',
  md: 'w-8 h-8 text-xs',
  lg: 'w-10 h-10 text-sm',
};

const statusClasses = {
  online: 'bg-status-success ring-2 ring-background-primary',
  offline: 'bg-border-strong ring-2 ring-background-primary',
  none: '',
};

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name = 'User',
  size = 'md',
  status = 'none',
  className = '',
}) => {
  const getInitials = (fullName: string) => {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return fullName.substring(0, 2).toUpperCase();
  };

  const currentSize = sizeClasses[size];

  return (
    <div className={`relative inline-flex shrink-0 select-none font-sans font-bold ${className}`}>
      {src ? (
        <img
          src={src}
          alt={name}
          className={`${currentSize.split(' ')[0]} ${currentSize.split(' ')[1]} rounded-full object-cover`}
        />
      ) : (
        <div
          className={`${currentSize} rounded-full bg-accent-primary/10 text-accent-primary border border-accent-primary/20 flex items-center justify-center`}
        >
          {getInitials(name)}
        </div>
      )}

      {status !== 'none' && (
        <span
          className={`absolute bottom-0 right-0 block w-2 h-2 rounded-full ${statusClasses[status]}`}
        />
      )}
    </div>
  );
};

interface AvatarGroupProps {
  children: React.ReactNode;
  className?: string;
}

export const AvatarGroup: React.FC<AvatarGroupProps> = ({ children, className = '' }) => {
  return <div className={`flex items-center -space-x-2 font-sans ${className}`}>{children}</div>;
};
