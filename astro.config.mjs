// @ts-check
import { defineConfig } from "astro/config";

// Static HTML/CSS/JS only. Do not enable SSR, adapters, or server actions
// without explicit approval.
export default defineConfig({
  output: "static",
  site: "https://angelbulldogs.com",
});
