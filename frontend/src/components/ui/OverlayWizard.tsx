import React, { useState } from 'react';
import { Button } from './Button';
import { BaseCard } from './Cards';

interface WizardStep {
  title: string;
  children: React.ReactNode;
}

interface WizardProps {
  steps: WizardStep[];
  onComplete: () => void;
  className?: string;
}

export const WizardContainer: React.FC<WizardProps> = ({ steps, onComplete, className = '' }) => {
  const [current, setCurrent] = useState(0);
  const stepCount = steps.length;
  const activeStep = steps[current];

  const handleNext = () => {
    if (current < stepCount - 1) {
      setCurrent(current + 1);
    } else {
      onComplete();
    }
  };

  return (
    <BaseCard className={`font-sans text-xs space-y-5 ${className}`}>
      <div className="flex justify-between items-center text-[10px] text-text-muted select-none border-b border-border-default/30 pb-3">
        <span className="font-bold uppercase tracking-wider">
          Step {current + 1} of {stepCount}
        </span>
        <div className="flex gap-1">
          {Array.from({ length: stepCount }).map((_, idx) => (
            <div
              key={idx}
              className={`w-4 h-1 rounded-full transition-colors ${
                idx <= current ? 'bg-accent-primary' : 'bg-border-default'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="text-sm font-bold text-text-primary">{activeStep.title}</h4>
        <div className="text-text-secondary py-1">{activeStep.children}</div>
      </div>

      <div className="flex justify-between items-center pt-3 border-t border-border-default/30">
        <Button
          variant="secondary"
          size="sm"
          disabled={current === 0}
          onClick={() => setCurrent(current - 1)}
        >
          Back
        </Button>
        <Button variant="primary" size="sm" onClick={handleNext}>
          {current === stepCount - 1 ? 'Finish' : 'Next'}
        </Button>
      </div>
    </BaseCard>
  );
};

interface TourStep {
  targetSelector: string;
  title: string;
  content: string;
}

interface ProductTourProps {
  steps: TourStep[];
  active: boolean;
  onClose: () => void;
}

export const ProductTour: React.FC<ProductTourProps> = ({ steps, active, onClose }) => {
  const [current, setCurrent] = useState(0);

  if (!active || steps.length === 0) return null;

  const step = steps[current];

  const handleNext = () => {
    if (current < steps.length - 1) {
      setCurrent(current + 1);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed bottom-6 left-6 z-[80] max-w-sm bg-surface-card border border-border-default rounded-xl shadow-2xl p-4 font-sans text-xs text-text-primary space-y-3 animate-slide-in">
      <div>
        <span className="block text-[8px] font-bold text-text-muted uppercase tracking-wider">
          Product Walkthrough Tour ({current + 1}/{steps.length})
        </span>
        <h4 className="font-bold text-text-primary mt-1">{step.title}</h4>
      </div>
      <p className="text-text-secondary leading-normal">{step.content}</p>
      <div className="flex justify-between items-center pt-2 border-t border-border-default/30">
        <button
          onClick={onClose}
          className="text-text-muted hover:text-text-primary text-[10px] font-bold uppercase tracking-wider focus:outline-none"
        >
          Skip Tour
        </button>
        <Button variant="primary" size="sm" onClick={handleNext}>
          {current === steps.length - 1 ? 'Got it' : 'Next Tip'}
        </Button>
      </div>
    </div>
  );
};
