import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
var host = process.env.TAURI_DEV_HOST;
export default defineConfig({
    plugins: [react(), tailwindcss()],
    clearScreen: false,
    server: {
        port: 1420,
        strictPort: true,
        host: host || false,
        hmr: host
            ? {
                protocol: "ws",
                host: host,
                port: 1421,
            }
            : undefined,
        watch: {
            ignored: ["**/src-tauri/**"],
        },
    },
});
