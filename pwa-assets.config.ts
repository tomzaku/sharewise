import { defineConfig, minimal2023Preset as preset } from "@vite-pwa/assets-generator/config";

// icon.svg is full-bleed, so no padding is needed; the OS applies its own mask.
export default defineConfig({
  preset: {
    ...preset,
    transparent: { ...preset.transparent, padding: 0 },
    maskable: { ...preset.maskable, padding: 0 },
    apple: { ...preset.apple, padding: 0 },
  },
  images: ["public/icon.svg"],
});
