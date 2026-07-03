<script lang="ts">
    import type { CanvasState } from "../App.svelte";

    interface Props {
        canvasState: CanvasState;
    }

    let { canvasState }: Props = $props();

    let scalePercent = $derived(canvasState.transform.scale * 100);
</script>

<div>
    <p>
        <strong>Zoom: </strong>
        {scalePercent.toFixed(1)}%
    </p>
</div>

<style>
    div {
        width: 100%;
        background: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(4px);
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        font-family: "Roboto Mono";
        font-size: large;
        color: #ccc;
        padding: 5px;
    }
</style>
