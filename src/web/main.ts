import init from '../../pkg/terrain';
import { mount } from "svelte";
import App from './App.svelte';

// -----------------------------------------------

// Rust WASM init.

await init();

// -----------------------------------------------

// Mount Svelte root-level component.

const app = mount(App, {
    target: document.getElementById('app')!,
});

export default app;