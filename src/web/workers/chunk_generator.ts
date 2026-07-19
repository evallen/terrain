import init, { compute_tile_pixels } from "../../../pkg/terrain";
import { type CanvasPositionInfo, type TileData } from "../types/types";

self.onmessage = async function (event: MessageEvent<CanvasPositionInfo>) {
    // Need to make sure the WASM is set up before this, so we make a second,
    // (possibly-redundant) init() call.
    // Without this, there is an occasional race-condition error.
    await init();
    const result = run(event.data);
    self.postMessage(result);
}

function run(canvasInfo: CanvasPositionInfo): TileData {
    console.log(`Received chunk to compute: ${canvasInfo}`);
    const result = compute_tile_pixels(canvasInfo.width, canvasInfo.height, canvasInfo.x, canvasInfo.y);
    console.log(`Done computing chunk!`);

    // @ts-expect-error because `compute_tile_pixels`
    // doesn't specify what kind of ArrayBuffer it provides, causing
    // a TS error. But it is ArrayBuffer.
    return result;
}