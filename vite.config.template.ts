import { spawn } from "bun" // need fix
// import { spawn } from "child_process"
import { defineConfig } from "vite"

export default defineConfig({
	root: "%html-root",
	server: {
		watch: { usePolling: true },
		hmr: {
			protocol: "ws",
			host: "localhost",
		},
	},
	build: {
		emptyOutDir: false,
		outDir: "%html-root",
		lib: {
			entry: "%bundle-file",
			formats: ["es"],
			fileName: () => "react-html.js",
		},
		rollupOptions: {
			output: {
				inlineDynamicImports: true,
				format: "es",
			},
		},
	},
	plugins: [
		{
			name: "watch-dist",
			configureServer(server) {
				server.watcher.add("%html-root/**/*")
				server.watcher.on("change", (path) => {
					if (path.startsWith("%html-root")) {
						spawn(["notify-send", "HMR", "server reloaded"])
						server.ws.send({ type: "full-reload" })
					}
				})
			},
		},
		{
			name: "watch-html7",
			configureServer(server) {
				server.watcher.add(["%html7-index"])
				server.watcher.on("change", () => {
					spawn(["bun", "run", "transpile"])
					// spawn("bun", ["run", "transpile"])
				})
			},
		},
	],
})
