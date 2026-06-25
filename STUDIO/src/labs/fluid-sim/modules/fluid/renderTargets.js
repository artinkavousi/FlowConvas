import {
    ClampToEdgeWrapping,
    HalfFloatType,
    LinearFilter,
    RGBAFormat,
    RenderTarget
} from 'three/webgpu';

export function createRenderTarget(name, width, height, options = {}) {
    const {
        format = RGBAFormat,
        type = HalfFloatType,
        filter = LinearFilter
    } = options;

    const target = new RenderTarget(width, height, {
        format,
        type,
        minFilter: filter,
        magFilter: filter,
        wrapS: ClampToEdgeWrapping,
        wrapT: ClampToEdgeWrapping,
        depthBuffer: false,
        stencilBuffer: false,
        generateMipmaps: false
    });

    target.texture.name = name;
    target.texture.generateMipmaps = false;

    return target;
}

export function createDoubleRenderTarget(name, width, height, options = {}) {
    let read = createRenderTarget(`${name}.read`, width, height, options);
    let write = createRenderTarget(`${name}.write`, width, height, options);

    return {
        get read() {
            return read;
        },
        get write() {
            return write;
        },
        swap() {
            const next = read;
            read = write;
            write = next;
        },
        setSize(nextWidth, nextHeight) {
            read.setSize(nextWidth, nextHeight);
            write.setSize(nextWidth, nextHeight);
        },
        dispose() {
            read.dispose();
            write.dispose();
        }
    };
}

export function getSimulationResolution(width, height, resolution) {
    let aspectRatio = width / Math.max(height, 1);

    if (aspectRatio < 1) {
        aspectRatio = 1 / aspectRatio;
    }

    const min = Math.round(resolution);
    const max = Math.round(resolution * aspectRatio);

    return width > height
        ? { width: max, height: min }
        : { width: min, height: max };
}
