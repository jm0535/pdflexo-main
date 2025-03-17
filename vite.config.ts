import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import { resolve } from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on mode
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    base: "", // Empty string for relative paths
    resolve: {
      alias: {
        "@": resolve(__dirname, "src"),
      },
    },
    build: {
      sourcemap: true,
      minify: mode === 'development' ? false : true, // Disable minification only for development
      outDir: "dist",
      emptyOutDir: true, // Clear the output directory before building
      rollupOptions: {
        input: resolve(__dirname, "index.html"),
      },
    },
    server: {
      port: 4000,
      open: true,
      watch: {
        usePolling: true, // Helps with file system watchers in some environments
      },
      hmr: {
        overlay: true, // Show errors as overlay
      },
    },
    preview: {
      port: 4001,
      open: true,
    },
    // Make env variables available in the app
    define: {
      'process.env.NODE_ENV': JSON.stringify(mode),
    },
  };
});
