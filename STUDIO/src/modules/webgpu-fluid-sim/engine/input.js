import { Color } from 'three/webgpu';
import { config } from './config.js';

export class FluidInput {
    constructor(canvas) {
        this.canvas = canvas;
        this.pointers = [new FluidPointer(-1)];
        this.paused = false;
        this.randomSplats = 0;
        this.activity = 0;

        this.attach();
    }

    attach() {
        this.canvas.addEventListener('mousedown', (event) => {
            const pointer = this.pointers[0];
            this.updatePointerDown(pointer, -1, event.offsetX, event.offsetY);
        });

        this.canvas.addEventListener('mousemove', (event) => {
            const pointer = this.pointers[0];
            if (!pointer.down) {
                return;
            }

            this.updatePointerMove(pointer, event.offsetX, event.offsetY);
        });

        window.addEventListener('mouseup', () => {
            this.updatePointerUp(this.pointers[0]);
        });

        this.canvas.addEventListener('touchstart', (event) => {
            event.preventDefault();

            const touches = event.targetTouches;
            while (touches.length >= this.pointers.length) {
                this.pointers.push(new FluidPointer());
            }

            for (let i = 0; i < touches.length; i += 1) {
                const touch = touches[i];
                this.updatePointerDown(this.pointers[i + 1], touch.identifier, touch.pageX, touch.pageY);
            }
        }, { passive: false });

        this.canvas.addEventListener('touchmove', (event) => {
            event.preventDefault();

            const touches = event.targetTouches;
            for (let i = 0; i < touches.length; i += 1) {
                const touch = touches[i];
                const pointer = this.pointers[i + 1];
                if (!pointer?.down) {
                    continue;
                }

                this.updatePointerMove(pointer, touch.pageX, touch.pageY);
            }
        }, { passive: false });

        window.addEventListener('touchend', (event) => {
            const touches = event.changedTouches;
            for (let i = 0; i < touches.length; i += 1) {
                const pointer = this.pointers.find((candidate) => candidate.id === touches[i].identifier);
                if (pointer) {
                    this.updatePointerUp(pointer);
                }
            }
        });

        window.addEventListener('keydown', (event) => {
            if (event.code === 'KeyP') {
                this.paused = !this.paused;
            }

            if (event.key === ' ' || event.code === 'Space') {
                this.randomSplats += Math.floor(Math.random() * 20) + 5;
            }
        });
    }

    updatePointerDown(pointer, id, posX, posY) {
        pointer.id = id;
        pointer.down = true;
        pointer.moved = false;
        pointer.x = this.toTexcoordX(posX);
        pointer.y = this.toTexcoordY(posY);
        pointer.previousX = pointer.x;
        pointer.previousY = pointer.y;
        pointer.deltaX = 0;
        pointer.deltaY = 0;
        pointer.color.copy(generateColor());
        this.activity = 1;
        this.writeDebugState('down', pointer);
    }

    updatePointerMove(pointer, posX, posY) {
        pointer.previousX = pointer.x;
        pointer.previousY = pointer.y;
        pointer.x = this.toTexcoordX(posX);
        pointer.y = this.toTexcoordY(posY);
        pointer.deltaX = correctDeltaX(pointer.x - pointer.previousX, this.canvas);
        pointer.deltaY = correctDeltaY(pointer.y - pointer.previousY, this.canvas);
        pointer.moved = Math.abs(pointer.deltaX) > 0 || Math.abs(pointer.deltaY) > 0;
        this.activity = 1;
        this.writeDebugState('move', pointer);
    }

    updatePointerUp(pointer) {
        pointer.down = false;
        this.writeDebugState('up', pointer);
    }

    writeDebugState(type, pointer) {
        document.documentElement.dataset.fluidInputType = type;
        document.documentElement.dataset.fluidInputX = String(pointer.x);
        document.documentElement.dataset.fluidInputY = String(pointer.y);
        document.documentElement.dataset.fluidInputDx = String(pointer.deltaX);
        document.documentElement.dataset.fluidInputDy = String(pointer.deltaY);
        document.documentElement.dataset.fluidInputMoved = String(pointer.moved);
    }

    toTexcoordX(posX) {
        const rect = this.canvas.getBoundingClientRect();
        const localX = posX > rect.width ? posX - rect.left : posX;
        return clamp01(localX / Math.max(rect.width, 1));
    }

    toTexcoordY(posY) {
        const rect = this.canvas.getBoundingClientRect();
        const localY = posY > rect.height ? posY - rect.top : posY;
        return 1 - clamp01(localY / Math.max(rect.height, 1));
    }

    update(dt) {
        this.activity = Math.max(0, this.activity - dt * 0.7);
    }
}

class FluidPointer {
    constructor(id = -1) {
        this.id = id;
        this.x = 0;
        this.y = 0;
        this.previousX = 0;
        this.previousY = 0;
        this.deltaX = 0;
        this.deltaY = 0;
        this.down = false;
        this.moved = false;
        this.color = generateColor();
    }
}

function clamp01(value) {
    return Math.min(1, Math.max(0, value));
}

export function generateColor() {
    const color = new Color();

    if (config.COLOR_MODE === 'single') {
        color.setRGB(config.SINGLE_COLOR.r / 255, config.SINGLE_COLOR.g / 255, config.SINGLE_COLOR.b / 255);
    } else if (config.COLOR_MODE === 'dual') {
        const t = Math.random();
        color.setRGB(
            mix(config.SINGLE_COLOR.r, config.SECONDARY_COLOR.r, t) / 255,
            mix(config.SINGLE_COLOR.g, config.SECONDARY_COLOR.g, t) / 255,
            mix(config.SINGLE_COLOR.b, config.SECONDARY_COLOR.b, t) / 255
        );
    } else if (config.COLOR_MODE === 'multiStop' && Array.isArray(config.COLOR_STOPS) && config.COLOR_STOPS.length > 0) {
        const stop = config.COLOR_STOPS[Math.floor(Math.random() * config.COLOR_STOPS.length)].color;
        color.setRGB(stop.r / 255, stop.g / 255, stop.b / 255);
    } else if (config.COLOR_MODE === 'velocity') {
        color.setRGB(config.VELOCITY_COLOR_HIGH.r / 255, config.VELOCITY_COLOR_HIGH.g / 255, config.VELOCITY_COLOR_HIGH.b / 255);
    } else if (config.COLOR_MODE === 'temperature') {
        color.setRGB(config.TEMP_COLOR_HOT.r / 255, config.TEMP_COLOR_HOT.g / 255, config.TEMP_COLOR_HOT.b / 255);
    } else {
        color.setHSL(Math.random(), 1, 0.5);
    }

    color.r *= 0.15;
    color.g *= 0.15;
    color.b *= 0.15;
    return color;
}

function mix(a, b, t) {
    return a * (1 - t) + b * t;
}

function correctDeltaX(delta, canvas) {
    const aspectRatio = canvas.width / Math.max(canvas.height, 1);
    return aspectRatio < 1 ? delta * aspectRatio : delta;
}

function correctDeltaY(delta, canvas) {
    const aspectRatio = canvas.width / Math.max(canvas.height, 1);
    return aspectRatio > 1 ? delta / aspectRatio : delta;
}
