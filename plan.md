# Goal

The goal is to achieve fast generation and update of the canvas from WASM.

# Phase 1 - switch to shared memory + single worker

Switch a model where WASM writes to a shared memory buffer,
and the JS has raw access to it. 

* Requires recompilation of WASM with atomics:
    * Need proper flags in config.toml

* Expand out `compute_tile_pixels` into larger API
* Add COOP / COEP headers in the Vite configuration for the shared memory.
* Make one canvas, not a multiple-tile grid.
* Workers get the shared array buffer, instantiate WASM with it,
  and only post a notice of their completion, but not the actual data itself.

# Phase 2 - multiple workers

Actually use multiple workers and split the work up.

# Phase 3 - Noise parameter controls

Add a way for users change the noise sliders, or whatever. 
Real time update?