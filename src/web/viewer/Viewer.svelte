<script lang="ts" module>
    export const CANVAS_SIZE = 500;
    export const CANVAS_BORDER_WIDTH = 2;
    export const NUM_WORKERS = 8;

    import {
        type CanvasInfo,
        type TileData,
        type TileQuery,
    } from "../types/types";

    const full_canvas_size = CANVAS_SIZE + CANVAS_BORDER_WIDTH;

    let workerPool = new WorkerPool<TileQuery, TileData>(
        NUM_WORKERS,
        new URL("../workers/chunk_generator.ts", import.meta.url),
    );

    let canvases: CanvasInfo[] = $state(
        Array.from({ length: 3 }, (_, i) => i - 1).flatMap((x) =>
            Array.from({ length: 3 }, (_, i) => i - 1).flatMap((y) => [
                {
                    element: null,
                    pos: {
                        width: full_canvas_size,
                        height: full_canvas_size,
                        x: CANVAS_SIZE * (x - 0.5),
                        y: CANVAS_SIZE * (y - 0.5),
                    },
                    loading: true,
                },
            ]),
        ),
    );

    async function populateCanvas(
        seed: number,
        canvasInfo: CanvasInfo,
        workerPool: WorkerPool<TileQuery, TileData>,
    ) {
        let ctx = canvasInfo.element!.getContext("2d")!;

        canvasInfo.loading = true;
        const pixels: TileData = await workerPool.submit({
            pos: $state.snapshot(canvasInfo.pos),
            options: { seed },
        });
        canvasInfo.loading = false;
        const imageData = new ImageData(pixels, canvasInfo.pos.width);
        ctx.putImageData(imageData, 0, 0);
    }

    export async function populateCanvases(seed: number) {
        console.log("populate canvas with seed " + seed);
        canvases.forEach((canvasInfo) => {
            canvasInfo.loading = true;
        });

        // Really, what we want is just to populateCanvas()
        // for each canvas. But that causes synchronous lag
        // on the main thread, because apparently postMessage()
        // can be kind of slow when we do many at once?
        //
        // So with this combination of rAF and setTimeout, we
        // essentially force this to occur after the next frame.
        requestAnimationFrame(() => {
            setTimeout(() => {
                canvases.forEach((canvasInfo) => {
                    populateCanvas(seed, canvasInfo, workerPool);
                });
            }, 0);
        });
    }
</script>

<script lang="ts">
    import { onMount } from "svelte";
    import { Mover } from "./navigation.svelte";
    import { WorkerPool } from "../workers/threadpool";

    let canvasViewport: HTMLDivElement | null = $state(null);
    let canvasGroup: HTMLDivElement | null = $state(null);
    let { canvasState = $bindable() } = $props();

    // Order of translate() and scale() is important here.
    let canvasGroupTransformStr = $derived(
        `translate(${canvasState.transform.translate.x}px, ${canvasState.transform.translate.y}px) scale(${canvasState.transform.scale})`,
    );

    onMount(async () => {
        new Mover(canvasViewport!, canvasGroup!, canvasState.transform);

        canvases.forEach((canvasInfo) => {
            canvasInfo.element!.width = CANVAS_SIZE;
            canvasInfo.element!.height = CANVAS_SIZE;

            let ctx = canvasInfo.element!.getContext("2d")!;
            ctx.imageSmoothingEnabled = false;
        });

        await populateCanvases(45);
    });
</script>

<div bind:this={canvasViewport} id="canvas-viewport">
    <div
        bind:this={canvasGroup}
        style:transform={canvasGroupTransformStr}
        id="canvas-group"
    >
        {#each canvases as canvasInfo, i}
            <div
                class="canvas-wrapper"
                style:transform={`translate(${canvasInfo.pos.x}px, ${canvasInfo.pos.y}px)`}
            >
                <canvas bind:this={canvasInfo.element} id="canvas-{i}"></canvas>
                <div
                    class="canvas-spinner"
                    class:loading={canvasInfo.loading}
                ></div>
            </div>
        {/each}
    </div>
</div>

<style>
    canvas {
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

    .canvas-wrapper {
        position: absolute;
    }

    .canvas-spinner {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
    }

    .loading {
        background: repeating-linear-gradient(
            45deg,
            rgba(255, 255, 255, 0.1),
            rgba(255, 255, 255, 0.1) 1%,
            rgba(255, 255, 255, 0.2) 1%,
            rgba(255, 255, 2552, 0.2) 2%
        );
    }
</style>
