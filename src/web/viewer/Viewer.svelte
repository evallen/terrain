<script lang="ts" module>
    export const CANVAS_SIZE = 500;
    export const CANVAS_BORDER_WIDTH = 2;
    export const NUM_WORKERS = 8;
</script>

<script lang="ts">
    import { onMount } from "svelte";
    import { Mover } from "./navigation.svelte";
    import {
        type CanvasInfo,
        type CanvasPositionInfo,
        type TileData,
    } from "../types/types";
    import { WorkerPool } from "../workers/threadpool";

    const full_canvas_size = CANVAS_SIZE + CANVAS_BORDER_WIDTH;

    let canvases: CanvasInfo[] = $state(
        Array.from({ length: 3 }, (_, i) => i - 1).flatMap((x) =>
            Array.from({ length: 3 }, (_, i) => i - 1).flatMap((y) => [
                {
                    element: null,
                    pos: {
                        width: full_canvas_size,
                        height: full_canvas_size,
                        x: (CANVAS_SIZE / 2) * (x - 1),
                        y: (CANVAS_SIZE / 2) * (y - 1),
                    },
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
        new Mover(canvasViewport!, canvasGroup!, canvasState.transform);

        let workerPool = new WorkerPool<CanvasPositionInfo, TileData>(
            NUM_WORKERS,
            new URL("../workers/chunk_generator.ts", import.meta.url),
        );

        canvases.forEach(async (canvasInfo) => {
            canvasInfo.element!.width = CANVAS_SIZE;
            canvasInfo.element!.height = CANVAS_SIZE;

            let ctx = canvasInfo.element!.getContext("2d")!;
            ctx.imageSmoothingEnabled = false;

            const pixels: TileData = await workerPool.submit(
                $state.snapshot(canvasInfo.pos),
            );
            const imageData = new ImageData(pixels, canvasInfo.pos.width);
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
                style:transform={`translate(${canvasInfo.pos.x}px, ${canvasInfo.pos.y}px)`}
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
