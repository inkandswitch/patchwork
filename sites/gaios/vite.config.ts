import { defineConfig } from "vite";
import wasm from "vite-plugin-wasm";
import patchwork from "@inkandswitch/patchwork-bootloader/vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    tailwindcss(),
    wasm(),
    patchwork({
      importmap: {
        imports: {
          DEV: "data:text/javascript,export%20const%20DEV%20=%20true;",
        },
      },
    }),
  ],
  worker: {
    format: "es",
    plugins: () => [wasm()],
  },
  server: {
    port: process.env.PORT ? +process.env.PORT : 5173,
  },
  build: {
    target: "firefox137",
    minify: false,
    sourcemap: true,
  },
});
