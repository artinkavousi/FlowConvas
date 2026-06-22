import { MeshBasicNodeMaterial, NoBlending, QuadMesh } from 'three/webgpu';

export class FullscreenPass {
    constructor(name, colorNode) {
        this.material = new MeshBasicNodeMaterial({
            depthTest: false,
            depthWrite: false
        });
        this.material.name = name;
        this.material.fragmentNode = colorNode;
        this.material.toneMapped = false;
        this.material.transparent = false;
        this.material.blending = NoBlending;
        this.quad = new QuadMesh(this.material);
    }

    render(renderer, target = null) {
        renderer.setRenderTarget(target);
        this.quad.render(renderer);
        renderer.setRenderTarget(null);
    }

    dispose() {
        this.material.dispose();
    }
}
