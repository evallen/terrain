import { mount } from "svelte";
import App from './App.svelte';

const app = mount(App, {
    target: document.getElementById('app')!,
});

export default app;

// -----------------------------------------------

import init, { start } from "../../pkg/terrain";
import { attachCanvasListeners } from "./navigation";

// -----------------------------------------------

await init();

// -----------------------------------------------

attachCanvasListeners();
start();