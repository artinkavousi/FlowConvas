import React from 'react';

export function PanelShell({
  children,
  noPadding,
}: {
  children?: React.ReactNode;
  noPadding?: boolean;
}) {
  return (
    <div
      className="flex flex-col flex-1 min-h-0 w-full h-full relative"
      style={{ padding: noPadding ? 0 : 16 }}
    >
      {children}
    </div>
  );
}
