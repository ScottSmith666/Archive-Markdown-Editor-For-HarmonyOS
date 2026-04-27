import {resolve} from "path";
import {defineConfig} from "electron-vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
    main: {
        build: {}
    },
    preload: {
        build: {}
    },
    renderer: {
        build: {
            minify: 'esbuild',
            esbuildOptions: {
                minify: true,
            },
        },
        resolve: {
            alias: {
                "@renderer": resolve("src/renderer/src"),
            },
        },
        plugins: [vue()],
    },
});
