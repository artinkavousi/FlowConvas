export async function requireWebGPU() {
    if (!('gpu' in navigator)) {
        throw new Error('WebGPU is not available in this browser. Use a current Chromium-based browser with WebGPU enabled.');
    }

    const adapter = await navigator.gpu.requestAdapter({ powerPreference: 'high-performance' })
        || await navigator.gpu.requestAdapter()
        || await navigator.gpu.requestAdapter({ forceFallbackAdapter: true });

    if (!adapter) {
        throw new Error('WebGPU is present, but no GPU adapter was returned for this browser/device.');
    }

    return adapter;
}
