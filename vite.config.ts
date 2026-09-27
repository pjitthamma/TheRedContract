import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { collectSiteAssets } from "./scripts/siteAssets";

export default defineConfig({
  plugins: [react(), {
    name: "site-asset-manifest",
    resolveId(id) { if (id === "virtual:site-assets") return "\0virtual:site-assets"; },
    load(id) {
      if (id !== "\0virtual:site-assets") return;
      const manifest = collectSiteAssets(process.cwd());
      if (manifest.missing.length) this.warn("Existing optional sounds not supplied: " + manifest.missing.join(", "));
      return "export default " + JSON.stringify(manifest);
    },
  }],
});
