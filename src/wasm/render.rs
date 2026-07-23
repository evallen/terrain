use color_hex::color_from_hex;
use noise::utils::NoiseMap;

pub enum RenderMethod {
    Colors,
    Values,
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

pub fn render_image(plane: &NoiseMap, render_method: RenderMethod) -> Vec<u8> {
    match render_method {
        RenderMethod::Colors => render_image_colors(plane),
        RenderMethod::Values => render_image_values(plane),
    }
}
