import React, { useState } from 'react';
import { definePanel } from '@/panel-os/define-panel';
import { PanelShell } from '@/panel-os/panel-shell';
import { Layers } from 'lucide-react';
import { GooeySlider } from '../components/GooeySlider';
import { BubbleRatingSlider } from '../components/BubbleRatingSlider';
import { ElasticMenu } from '../components/ElasticMenu';

import { defaultPanelCapabilities } from '@/panel-os/panel-types';

function ComponentLibraryDemo() {
  const [val1, setVal1] = useState(50);
  const [rating, setRating] = useState(2);

  return (
    <PanelShell>
      <div className="flex flex-col h-full overflow-y-auto custom-scrollbar p-6 space-y-12 bg-[#0c0c0c]">
        
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium text-white/90 tracking-wide">Elastic Drag Menu</h3>
            <p className="text-xs text-white/50 mt-1">A dynamic physics-driven liquid menu using Framer Motion SVG features.</p>
          </div>
          <div className="bg-black/20 rounded-xl border border-white/5 mt-4 overflow-hidden">
             <ElasticMenu uiColor="#FF5EAE" />
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium text-white/90 tracking-wide">Gooey Slider</h3>
            <p className="text-xs text-white/50 mt-1">A sleek, fluid slider with a sticky liquid effect.</p>
          </div>
          <div className="px-4 bg-black/20 p-6 rounded-xl border border-white/5">
             <div className="mb-4 flex items-center justify-between">
                <span className="text-xs font-mono text-white/70">Value: {val1}%</span>
             </div>
             <GooeySlider value={val1} onChange={setVal1} color="#03A9F4" textColor="#0c0c0c" />
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium text-white/90 tracking-wide">Bubble Rating Slider</h3>
            <p className="text-xs text-white/50 mt-1">An emoticon satisfaction slider using the same liquid elasticity.</p>
          </div>
          <div className="px-6 bg-black/20 p-6 rounded-xl border border-white/5 mt-4">
             <div className="mb-8 flex items-center justify-between">
                <span className="text-xs font-mono text-white/70">Rating: {rating} / 4</span>
             </div>
             <BubbleRatingSlider value={rating} onChange={setRating} color="#F59E0B" />
          </div>
        </div>

      </div>
    </PanelShell>
  );
}

export const ComponentLibraryPanel = definePanel({
  id: 'component-library',
  title: 'Component Library',
  description: 'Playground for custom interactive components',
  icon: Layers,
  defaultPlacement: 'center',
  defaultSize: 320,
  minSize: 300,
  maxSize: 500,
  capabilities: { ...defaultPanelCapabilities },
  component: ComponentLibraryDemo,
});


