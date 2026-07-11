<script lang="ts" module>
    export const CANVAS_SIZE = 500;
    export const CANVAS_BORDER_WIDTH = 2;
</script>

<script lang="ts">
    import { onMount } from "svelte";
    import init, { setup_canvas_tile } from "../../../pkg/terrain";
    import { Mover } from "./navigation.svelte";

    type CanvasInfo = {
        element: HTMLCanvasElement | null;
        width: number;
        height: number;
        x: number;
        y: number;
    };

    const full_canvas_size = CANVAS_SIZE + CANVAS_BORDER_WIDTH;

    let canvases: CanvasInfo[] = $state([]);

    [-1, 0, 1].forEach((x) => {
        [-1, 0, 1].forEach((y) => {
            canvases.push({
                element: null,
                width: full_canvas_size,
                height: full_canvas_size,
                x: 250 * (x - 1),
                y: 250 * (y - 1),
            });
        });
    });

    let canvasViewport: HTMLDivElement | null = $state(null);
    let canvasGroup: HTMLDivElement | null = $state(null);
    let { canvasState = $bindable() } = $props();

    // Order of translate() and scale() is important here.
    let canvasGroupTransformStr = $derived(
        `translate(${canvasState.transform.translate.x}px, ${canvasState.transform.translate.y}px) scale(${canvasState.transform.scale})`,
    );

    onMount(async () => {
        await init();
        new Mover(canvasViewport!, canvasGroup!, canvasState.transform);

        canvases.forEach((canvasInfo) => {
            canvasInfo.element!.getContext("2d")!.imageSmoothingEnabled = false;
            setup_canvas_tile(
                canvasInfo.element!,
                canvasInfo.width,
                canvasInfo.height,
                canvasInfo.x,
                canvasInfo.y,
            );
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
