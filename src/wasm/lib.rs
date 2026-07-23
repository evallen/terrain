mod noisegen;
mod render;

use noisegen::GenerationOptions;

use wasm_bindgen::{prelude::*, Clamped};

#[derive(Debug, Clone)]
pub struct TileQuery {
    pub pos: CanvasPositionInfo,
    pub options: GenerationOptions,
}

#[derive(Debug, Clone)]
pub struct CanvasPositionInfo {
    /// The width of the canvas, in pixels.
    pub width: u32,

    /// The height of the canvas, in pixels.
    pub height: u32,

    /// The x-coordinate of the top left of the canvas.
    pub x: i32,

    /// The y-coordinate of the top left of the canvas.
    pub y: i32,
}

#[wasm_bindgen]
pub fn compute_tile_pixels(seed: u32, width: u32, height: u32, x: i32, y: i32) -> Clamped<Vec<u8>> {
    // Panic hook
    console_error_panic_hook::set_once();

    let noise_map = noisegen::compute_tile_heights(&TileQuery {
        pos: CanvasPositionInfo {
            width,
            height,
            x,
            y,
        },
        options: GenerationOptions { seed },
    });

    Clamped(render::render_image(
        &noise_map,
        render::RenderMethod::Colors,
    ))
}
