<script lang="ts">
    import type { CanvasState } from "../App.svelte";
    import { populateCanvases } from "../viewer/Viewer.svelte";

    interface Props {
        canvasState: CanvasState;
    }

    let { canvasState }: Props = $props();

    let scalePercent = $derived(canvasState.transform.scale * 100);

    let seed = $state(0);
</script>

<div>
    <p>
        <strong>Zoom: </strong>
        {scalePercent.toFixed(1)}%
    </p>
    <button onclick={() => populateCanvases(seed++)}
        >Regenerate with new seed: {seed}</button
    >
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
        display: flex;
        flex-direction: row;
        align-items: center;
    }

    button {
        background: transparent;
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: #ccc;
        font-family: inherit;
        font-size: inherit;
        padding: 3px 10px;
        border-radius: 3px;
        box-sizing: border-box;
        cursor: pointer;
        margin-left: auto;
    }

    button:hover {
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(255, 255, 255, 0.4);
    }

    button:active {
        background: rgba(255, 255, 255, 0.3);
        border-color: rgba(255, 255, 255, 0.9);
        transform: translateY(1px);
    }
</style>
