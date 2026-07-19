use noise::utils::{NoiseMap, NoiseMapBuilder, PlaneMapBuilder};
use noise::{Fbm, OpenSimplex};

use color_hex::color_from_hex;

use wasm_bindgen::Clamped;

const SEED: u32 = 45;
const PIXELS_PER_NOISE_UNIT: f64 = 50.0;

// TODO: Clean this up
enum RenderMethod {
    #[allow(dead_code)]
    Colors,

    #[allow(dead_code)]
    Values,
}

#[derive(Debug, Clone)]
pub struct CanvasInfo {
    /// The width of the canvas, in pixels.
    pub width: u32,

    /// The height of the canvas, in pixels.
    pub height: u32,

    /// The x-coordinate of the top left of the canvas.
    pub x: i32,

    /// The y-coordinate of the top left of the canvas.
    pub y: i32,
}

const RENDER_METHOD: RenderMethod = RenderMethod::Colors;

// ==== INITIALIZATION ============================================================================

pub fn compute_tile_pixels(info: &CanvasInfo) -> Clamped<Vec<u8>> {
    let fbm = Fbm::<OpenSimplex>::new(SEED);

    let x_bounds = (
        info.x as f64 / PIXELS_PER_NOISE_UNIT,
        (info.x + info.width as i32) as f64 / PIXELS_PER_NOISE_UNIT,
    );
    let y_bounds = (
        info.y as f64 / PIXELS_PER_NOISE_UNIT,
        (info.y + info.height as i32) as f64 / PIXELS_PER_NOISE_UNIT,
    );

    let noise_map = PlaneMapBuilder::new(fbm)
        .set_size(info.width as usize, info.height as usize)
        .set_x_bounds(x_bounds.0, x_bounds.1)
        .set_y_bounds(y_bounds.0, y_bounds.1)
        .build();

    Clamped(render_image(&noise_map))
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
