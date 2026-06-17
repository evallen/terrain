mod render;
mod terrain;

use wasm_bindgen::prelude::*;
#[wasm_bindgen(start)]
fn start() -> Result<(), JsValue> {
    // Panic hook
    console_error_panic_hook::set_once();

    render::init()
}
