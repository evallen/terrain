use noise::utils::{NoiseMap, NoiseMapBuilder, PlaneMapBuilder};
use noise::{Fbm, OpenSimplex};

use color_hex::color_from_hex;

use wasm_bindgen::prelude::*;
use wasm_bindgen::Clamped;
use wasm_bindgen::JsCast;

const WIDTH: u32 = 500;
const HEIGHT: u32 = 500;
const SEED: u32 = 45;

// TODO: Clean this up
enum RenderMethod {
    #[allow(dead_code)]
    Colors,

    #[allow(dead_code)]
    Values,
}

const RENDER_METHOD: RenderMethod = RenderMethod::Colors;
// const RENDER_METHOD: RenderMethod = RenderMethod::Values;

// ==== INITIALIZATION ============================================================================

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

// ==== RENDERING =================================================================================

type RGBA = [u8; 4];

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
enum TerrainLayer {
    Ocean,
    Beach,
    Land,
    Mountain,
    Icecap,
}

impl TerrainLayer {
    fn color(&self) -> RGBA {
        match self {
            TerrainLayer::Ocean => color_from_hex!("#3779BFFF"),
            TerrainLayer::Beach => color_from_hex!("#E7E4D4FF"),
            TerrainLayer::Land => color_from_hex!("#699E88FF"),
            TerrainLayer::Mountain => color_from_hex!("#ABB6B1FF"),
            TerrainLayer::Icecap => color_from_hex!("#DAEEEFFF"),
        }
    }

    fn from_height(h: f64) -> TerrainLayer {
        assert!(h >= 0.0 && h <= 1.0);

        match h {
            h if h < 0.48 => TerrainLayer::Ocean,
            h if h <= 0.50 => TerrainLayer::Beach,
            h if h <= 0.54 => TerrainLayer::Land,
            h if h <= 0.60 => TerrainLayer::Mountain,
            _ => TerrainLayer::Icecap,
        }
    }
}

fn render_image_colors(plane: &NoiseMap) -> Vec<u8> {
    // First concept: map 0..1 to 0..255
    plane
        .iter()
        .flat_map(|h| {
            let normalized = (h + 1.0) / 2.0;
            TerrainLayer::from_height(normalized).color()
        })
        .collect()
}

fn render_image_values(plane: &NoiseMap) -> Vec<u8> {
    // First concept: map 0..1 to 0..255
    plane
        .iter()
        .flat_map(|h| {
            let normalized = (h + 1.0) / 2.0;
            let value = (normalized * f64::from(u8::MAX)) as u8;
            [value, value, value, u8::MAX]
        })
        .collect()
}

fn render_image(plane: &NoiseMap) -> Vec<u8> {
    match RENDER_METHOD {
        RenderMethod::Colors => render_image_colors(plane),
        RenderMethod::Values => render_image_values(plane),
    }
}

fn fill_canvas(ctx: &web_sys::CanvasRenderingContext2d) -> Result<(), JsValue> {
    let fbm = Fbm::<OpenSimplex>::new(SEED);
    let noise_map = PlaneMapBuilder::new(fbm)
        .set_size(WIDTH as usize, HEIGHT as usize)
        .set_x_bounds(-5.0, 5.0)
        .set_y_bounds(-5.0, 5.0)
        .build();

    let image_data =
        web_sys::ImageData::new_with_u8_clamped_array(Clamped(&render_image(&noise_map)), WIDTH)?;

    ctx.put_image_data(&image_data, 0.0, 0.0)?;

    Ok(())
}
