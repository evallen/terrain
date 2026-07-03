<script module lang="ts">
    export type CanvasState = {
        transform: {
            scale: number;
            translate: {
                x: number;
                y: number;
            };
        };
    };
</script>

<script lang="ts">
    import Viewer from "./viewer/Viewer.svelte";
    import StatusBar from "./statusbar/StatusBar.svelte";

    let canvasState: CanvasState = $state({
        transform: {
            scale: 1.0,
            translate: {
                x: 0.0,
                y: 0.0,
            },
        },
    });
</script>

<div id="body">
    <Viewer bind:canvasState />
    <div id="viewer-wrapper">
        <StatusBar {canvasState} />
    </div>
</div>

<style>
    #viewer-wrapper {
        position: absolute;
        left: 0px;
        top: 0px;
        width: 100%;
    }
</style>
