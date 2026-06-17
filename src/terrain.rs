type Height = f64;

use noise::{NoiseFn, OpenSimplex};

#[derive(Debug)]
pub struct OpenSimplexOptions {
    pub seed: u32,
}

#[derive(Debug, Copy, Clone, Eq, PartialEq)]
/// 2-dimensional coordinate data structure.
struct Coordinate2D<T>
where
    T: num::Num + Copy,
{
    x: T,
    y: T,
}

impl<T: num::Num + Copy> Coordinate2D<T> {
    fn cast<U: From<T> + num::Num + Copy>(&self) -> Coordinate2D<U> {
        Coordinate2D {
            x: self.x.into(),
            y: self.y.into(),
        }
    }
}

#[derive(Debug)]
struct CoordinateSystem {
    /// Width of the Terrain.
    width: u32,
}

impl CoordinateSystem {
    /// Get the coordinate for a given index.
    fn coord(&self, idx: usize) -> Coordinate2D<u32> {
        let idx_u32 = idx as u32;
        Coordinate2D {
            x: idx_u32 % self.width,
            y: idx_u32 / self.width,
        }
    }
}

#[derive(Debug)]
/// Terrain data structure.
pub struct Terrain {
    coordinate_system: CoordinateSystem,

    /// Height buffer. Row major order.
    buffer: Vec<Height>,
}

impl Terrain {
    // Constructors

    /// Construct a new Terrain with a zeroed height buffer.
    pub fn new(width: u32, height: u32) -> Self {
        Self {
            coordinate_system: CoordinateSystem { width },
            buffer: vec![0.0; (width * height) as usize],
        }
    }

    /// Construct a new Terrain with a height buffer
    /// filled with OpenSimplex noise.
    pub fn with_open_simplex(width: u32, height: u32, options: OpenSimplexOptions) -> Self {
        let mut result = Self::new(width, height);

        result.populate_open_simplex(options);

        result
    }

    // Generation

    /// Fill the buffer with OpenSimplex noise.
    fn populate_open_simplex(&mut self, options: OpenSimplexOptions) {
        let generator = OpenSimplex::new(options.seed);

        for (i, h) in self.buffer.iter_mut().enumerate() {
            let c = self.coordinate_system.coord(i).cast::<f64>();
            *h = generator.get([c.x, c.y]);
        }
    }

    // Access

    pub fn heights(&self) -> &Vec<Height> {
        &self.buffer
    }
}
