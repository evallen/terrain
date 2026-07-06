<script lang="ts">
    import { onMount } from "svelte";
    import init, { start } from "../../../pkg/terrain";
    import { Mover } from "./navigation.svelte";

    let canvasViewport: HTMLDivElement | null = $state(null);
    let canvas: HTMLCanvasElement | null = $state(null);
    let { canvasState = $bindable() } = $props();

    // Order of translate() and scale() is important here.
    let canvasTransformStr = $derived(
        `translate(${canvasState.transform.translate.x}px, ${canvasState.transform.translate.y}px) scale(${canvasState.transform.scale})`,
    );

    onMount(async () => {
        await init();
        new Mover(canvasViewport!, canvas!, canvasState.transform);

        let ctx = canvas!.getContext("2d")!;
        ctx.imageSmoothingEnabled = false;

        start(canvas!);
    });
</script>

<div bind:this={canvasViewport} id="canvas-viewport">
    <canvas bind:this={canvas} style:transform={canvasTransformStr} id="canvas"
    ></canvas>
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
</style>
