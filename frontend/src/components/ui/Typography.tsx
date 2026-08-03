import React from 'react';

export type TypographyVariant =
  | 'display'
  | 'heading'
  | 'title'
  | 'subtitle'
  | 'body'
  | 'caption'
  | 'label'
  | 'code'
  | 'monospace';

interface TypographyProps {
  variant?: TypographyVariant;
  children: React.ReactNode;
  className?: string;
  id?: string;
}

const variantStyles: Record<TypographyVariant, string> = {
  display: 'text-3xl md:text-4xl font-extrabold tracking-tight text-text-primary',
  heading: 'text-xl md:text-2xl font-bold tracking-tight text-text-primary',
  title: 'text-base font-bold text-text-primary',
  subtitle: 'text-sm font-semibold text-text-secondary',
  body: 'text-xs text-text-secondary leading-relaxed',
  caption: 'text-[10px] text-text-muted',
  label: 'text-xs font-semibold uppercase tracking-wider text-text-secondary',
  code: 'font-mono text-xs bg-background-secondary border border-border-default px-1 py-0.5 rounded text-accent-primary',
  monospace: 'font-mono text-xs text-text-primary',
};

export const Typography: React.FC<TypographyProps> = ({
  variant = 'body',
  children,
  className = '',
  id,
}) => {
  const Tag = (
    variant === 'display'
      ? 'h1'
      : variant === 'heading'
        ? 'h2'
        : variant === 'title'
          ? 'h3'
          : variant === 'subtitle'
            ? 'h4'
            : variant === 'code'
              ? 'code'
              : 'p'
  ) as any;

  return (
    <Tag id={id} className={`${variantStyles[variant]} ${className}`}>
      {children}
    </Tag>
  );
};
