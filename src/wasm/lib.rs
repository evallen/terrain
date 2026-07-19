mod render;

use wasm_bindgen::prelude::*;
use wasm_bindgen::Clamped;

#[wasm_bindgen]
pub fn compute_tile_pixels(seed: u32, width: u32, height: u32, x: i32, y: i32) -> Clamped<Vec<u8>> {
    // Panic hook
    console_error_panic_hook::set_once();

    render::compute_tile_pixels(&render::TileQuery {
        pos: render::CanvasPositionInfo {
            width,
            height,
            x,
            y,
        },
        options: render::GenerationOptions { seed },
    })
}
