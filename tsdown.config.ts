import { defineConfig } from "tsdown";

export default defineConfig({
	entry: {
		"react/index": "src/react/index.ts",
	},
	format: "esm",
	dts: true,
	clean: true,
	minify: true,
	banner: '"use client";',
	publint: true,
	attw: { profile: "esm-only", level: "error" },
});
