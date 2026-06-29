import { svelte } from '@sveltejs/vite-plugin-svelte';

/** @type {import('vite').UserConfig} */
export default {
    optimizeDeps: {
        exclude: ["terrain"]
    },
    plugins: [
        svelte({
            // Stub
        })
    ]
}