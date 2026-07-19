import init, { compute_tile_pixels } from "../../../pkg/terrain";
import { type TileData, type TileQuery } from "../types/types";

self.onmessage = async function (event: MessageEvent<TileQuery>) {
    // Need to make sure the WASM is set up before this, so we make a second,
    // (possibly-redundant) init() call.
    // Without this, there is an occasional race-condition error.
    await init();
    const result = run(event.data);
    self.postMessage(result);
}

function run(tileQuery: TileQuery): TileData {
    const pos = tileQuery.pos
    const result = compute_tile_pixels(tileQuery.options.seed, pos.width, pos.height, pos.x, pos.y);

    // @ts-expect-error because `compute_tile_pixels`
    // doesn't specify what kind of ArrayBuffer it provides, causing
    // a TS error. But it is ArrayBuffer.
    return result;
}