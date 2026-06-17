use crate::terrain::{OpenSimplexOptions, Terrain};

use wasm_bindgen::prelude::*;
use wasm_bindgen::Clamped;
use wasm_bindgen::JsCast;

const WIDTH: u32 = 2200;
const HEIGHT: u32 = 1200;
const SEED: u32 = 42;

pub fn init() -> Result<(), JsValue> {
    let document = web_sys::window()
        .expect("Couldn't get window")
        .document()
        .expect("Couldn't get document");

    let canvas = document
        .get_element_by_id("canvas")
        .expect("Couldn't get canvas");

    let canvas: web_sys::HtmlCanvasElement = canvas.dyn_into::<web_sys::HtmlCanvasElement>()?;

    canvas.set_width(WIDTH);
    canvas.set_height(HEIGHT);

    let ctx = canvas
        .get_context("2d")?
        .expect("Couldn't get 2D canvas context")
        .dyn_into::<web_sys::CanvasRenderingContext2d>()?;

    fill_canvas(&ctx)?;

    Ok(())
}

fn render_image(terrain: &Terrain) -> Vec<u8> {
    // First concept: map 0..1 to 0..255
    terrain
        .heights()
        .iter()
        .flat_map(|h| {
            let value = (h * f64::from(u8::MAX)) as u8;
            vec![value, value, value, u8::MAX]
        })
        .collect()
}

fn fill_canvas(ctx: &web_sys::CanvasRenderingContext2d) -> Result<(), JsValue> {
    let terrain = Terrain::with_open_simplex(WIDTH, HEIGHT, OpenSimplexOptions { seed: SEED });
    let image_data =
        web_sys::ImageData::new_with_u8_clamped_array(Clamped(&render_image(&terrain)), WIDTH)?;

    ctx.put_image_data(&image_data, 0.0, 0.0)?;

    Ok(())
}
