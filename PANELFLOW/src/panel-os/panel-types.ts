import * as React from 'react';

export interface PanelCapabilities {
  floatable?: boolean;
  closable?: boolean;
  resizable?: boolean;
}

export const defaultPanelCapabilities: PanelCapabilities = {
  floatable: true,
  closable: true,
  resizable: true,
};

export interface PanelDefinition {
  id: string;
  title: string;
  description: string;
  icon: any;
  defaultPlacement: 'left' | 'right' | 'bottom' | 'center';
  defaultSize: number;
  minSize?: number;
  maxSize?: number;
  capabilities: PanelCapabilities;
  component: React.ComponentType;
  tags?: string[];
}
