/**
 * ElasticMenuPreview — live preview for the elastic-menu module.
 * UI color comes from the PANELFLOW bridge; selection is internal to the menu.
 */

import { ElasticMenu, useBridgeStore } from '@artinos/panelflow';

export default function ElasticMenuPreview() {
  const values = useBridgeStore((s) => s.componentValues['elastic-menu']);
  const uiColor = (values?.uiColor as string) ?? '#FF5EAE';

  return (
    <div className="w-full h-full flex items-center justify-center p-10">
      <ElasticMenu uiColor={uiColor} />
    </div>
  );
}
