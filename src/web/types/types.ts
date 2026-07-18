// Fields (width, height, x, y) must match the wasm setup_canvas_tile params.
export type CanvasPositionInfo = {
    width: number;
    height: number;
    x: number;
    y: number;
}

export type CanvasInfo = {
    element: HTMLCanvasElement | null;
    pos: CanvasPositionInfo;
};

export type TileData = Uint8ClampedArray<ArrayBuffer>;