mod render;

use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn start() -> Result<(), JsValue> {
    // Panic hook
    console_error_panic_hook::set_once();

    render::init()
}
