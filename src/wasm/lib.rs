mod render;

use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn setup_canvas_tile(
    canvas: &web_sys::HtmlCanvasElement,
    width: u32,
    height: u32,
    x: i32,
    y: i32,
) -> Result<(), JsValue> {
    // Panic hook
    console_error_panic_hook::set_once();

    render::setup_canvas_tile(
        canvas,
        &render::CanvasInfo {
            width,
            height,
            x,
            y,
        },
    )
}
