<script lang="ts" module>
    export const CANVAS_SIZE = 500;
    export const CANVAS_BORDER_WIDTH = 2;
</script>

<script lang="ts">
    import { onMount } from "svelte";
    import init, { compute_tile_pixels } from "../../../pkg/terrain";
    import { Mover } from "./navigation.svelte";

    // Fields (width, height, x, y) must match the wasm setup_canvas_tile params.
    type CanvasInfo = {
        element: HTMLCanvasElement | null;
        width: number;
        height: number;
        x: number;
        y: number;
    };

    const full_canvas_size = CANVAS_SIZE + CANVAS_BORDER_WIDTH;

    let canvases: CanvasInfo[] = $state(
        [-1, 0, 1].flatMap((x) =>
            [-1, 0, 1].flatMap((y) => [
                {
                    element: null,
                    width: full_canvas_size,
                    height: full_canvas_size,
                    x: (CANVAS_SIZE / 2) * (x - 1),
                    y: (CANVAS_SIZE / 2) * (y - 1),
                },
            ]),
        ),
    );

    let canvasViewport: HTMLDivElement | null = $state(null);
    let canvasGroup: HTMLDivElement | null = $state(null);
    let { canvasState = $bindable() } = $props();

    // Order of translate() and scale() is important here.
    let canvasGroupTransformStr = $derived(
        `translate(${canvasState.transform.translate.x}px, ${canvasState.transform.translate.y}px) scale(${canvasState.transform.scale})`,
    );

    onMount(async () => {
        // Need to make sure the WASM is set up before this, so we make a second,
        // (possibly-redundant) init() call.
        // Without this, there is an occasional race-condition error.
        await init();

        new Mover(canvasViewport!, canvasGroup!, canvasState.transform);

        canvases.forEach((canvasInfo) => {
            canvasInfo.element!.width = CANVAS_SIZE;
            canvasInfo.element!.height = CANVAS_SIZE;

            let ctx = canvasInfo.element!.getContext("2d")!;
            ctx.imageSmoothingEnabled = false;

            // @ts-expect-error because `compute_tile_pixels`
            // doesn't specify what kind of ArrayBuffer it provides, causing
            // a TS error. But it is ArrayBuffer.
            const pixels: Uint8ClampedArray<ArrayBuffer> = compute_tile_pixels(
                canvasInfo.width,
                canvasInfo.height,
                canvasInfo.x,
                canvasInfo.y,
            );

            const imageData = new ImageData(pixels, canvasInfo.width);
            ctx.putImageData(imageData, 0, 0);
        });
    });
</script>

<div bind:this={canvasViewport} id="canvas-viewport">
    <div
        bind:this={canvasGroup}
        style:transform={canvasGroupTransformStr}
        id="canvas-group"
    >
        {#each canvases as canvasInfo, i}
            <canvas
                bind:this={canvasInfo.element}
                id="canvas-{i}"
                style:transform={`translate(${canvasInfo.x}px, ${canvasInfo.y}px)`}
            ></canvas>
        {/each}
    </div>
</div>

<style>
    canvas {
        position: absolute;
        display: block;
        transform-origin: 50% 50%;

        image-rendering: -moz-crisp-edges;
        image-rendering: -webkit-crisp-edges;
        image-rendering: -webkit-optimize-contrast;
        image-rendering: pixelated;
    }

    #canvas-viewport {
        display: flex;
        width: 100%;
        height: 100%;
        justify-content: center;
        align-items: center;
        overflow: hidden;
    }
</style>
