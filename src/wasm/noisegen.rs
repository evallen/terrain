use glam::DVec2;

use noise::utils::{NoiseMap, NoiseMapBuilder, PlaneMapBuilder};
use noise::{Fbm, NoiseFn, OpenSimplex};

use crate::TileQuery;

// ==== CONSTANTS =================================================================================

const PIXELS_PER_NOISE_UNIT: f64 = 200.0;

// ==== HELPER STRUCTS ============================================================================

#[derive(Debug, Clone)]
pub struct GenerationOptions {
    pub seed: u32,
}

// ==== NOISE GENERATION ALGORITHMS ===============================================================

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

// ==== PUBLIC API ================================================================================

pub fn compute_tile_heights(info: &TileQuery) -> NoiseMap {
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

    PlaneMapBuilder::new(island_noise)
        .set_size(pos.width as usize, pos.height as usize)
        .set_x_bounds(x_bounds.0, x_bounds.1)
        .set_y_bounds(y_bounds.0, y_bounds.1)
        .build()
}
