import type { PluginOption } from "vite"
import { spawn } from "bun"

export function watchHtmlPlugin(): PluginOption {
	return {
		name: "watch-html7",
		configureServer(server) {
			server.watcher.add(["index.html7"])
			server.watcher.on("change", () => {
				spawn(["bun", "run", "build"])
			})
		},
	}
}
