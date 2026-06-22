import React, { type ReactNode } from 'react';
import * as RadixTooltip from '@radix-ui/react-tooltip';

export interface TooltipProps {
  key?: React.Key;
  children: ReactNode;
  text: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
}

export function Tooltip({ children, text, side = 'top' }: TooltipProps) {
  return (
    <RadixTooltip.Provider delayDuration={120}>
      <RadixTooltip.Root>
        <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
        <RadixTooltip.Portal>
          <RadixTooltip.Content
            side={side}
            sideOffset={7}
            className="fluidity-tooltip z-[400] px-3 py-1.5 rounded-full text-[10px] font-semibold uppercase tracking-wider shadow-xl select-none"
            style={{
              color: 'var(--color-text)',
              background: 'var(--color-surface-raised)',
              border: '1px solid var(--color-border)',
            }}
          >
            {text}
            <RadixTooltip.Arrow
              width={14}
              height={7}
              style={{ fill: 'var(--color-surface-raised)' }}
            />
          </RadixTooltip.Content>
        </RadixTooltip.Portal>
      </RadixTooltip.Root>
    </RadixTooltip.Provider>
  );
}
