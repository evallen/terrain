use noise::utils::{NoiseMap, NoiseMapBuilder, PlaneMapBuilder};
use noise::{Fbm, NoiseFn, OpenSimplex};

use glam::DVec2;

use color_hex::color_from_hex;

use wasm_bindgen::Clamped;

const PIXELS_PER_NOISE_UNIT: f64 = 200.0;

// TODO: Clean this up
enum RenderMethod {
    #[allow(dead_code)]
    Colors,

    #[allow(dead_code)]
    Values,
}

#[derive(Debug, Clone)]
pub struct GenerationOptions {
    pub seed: u32,
}

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

const RENDER_METHOD: RenderMethod = RenderMethod::Colors;
//const RENDER_METHOD: RenderMethod = RenderMethod::Values;

// ==== INITIALIZATION ============================================================================

#[derive(Debug)]
struct IslandNoise {
    fbm: Fbm<OpenSimplex>,
}

impl IslandNoise {
    fn new(seed: u32) -> IslandNoise {
        IslandNoise {
            fbm: Fbm::<OpenSimplex>::new(seed),
        }
    }
}

impl NoiseFn<f64, 3> for IslandNoise {
    fn get(&self, point: [f64; 3]) -> f64 {
        let point_vec = DVec2::new(point[0], point[1]);
        let offset = point_vec.distance(DVec2::new(0.0, 0.0));

        let result = self.fbm.get(point) * 2.0 - 0.5 * offset + 0.75;

        result.clamp(-1.0, 1.0)
    }
}

pub fn compute_tile_pixels(info: &TileQuery) -> Clamped<Vec<u8>> {
    let pos = &info.pos;
    let island_noise = IslandNoise::new(info.options.seed);

    let x_bounds = (
        pos.x as f64 / PIXELS_PER_NOISE_UNIT,
        (pos.x + pos.width as i32) as f64 / PIXELS_PER_NOISE_UNIT,
    );
    let y_bounds = (
        pos.y as f64 / PIXELS_PER_NOISE_UNIT,
        (pos.y + pos.height as i32) as f64 / PIXELS_PER_NOISE_UNIT,
    );

    let noise_map = PlaneMapBuilder::new(island_noise)
        .set_size(pos.width as usize, pos.height as usize)
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
            h if h <= 0.0 => TerrainLayer::Ocean,
            h if h <= 0.1 => TerrainLayer::Beach,
            h if h <= 0.4 => TerrainLayer::Land,
            h if h <= 0.8 => TerrainLayer::Mountain,
            _ => TerrainLayer::Icecap,
        }
    }
}

fn render_image_colors(plane: &NoiseMap) -> Vec<u8> {
    // First concept: map 0..1 to 0..255
    plane
        .iter()
        .flat_map(|h| {
            let normalized = h.clamp(0.0, 1.0);
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
