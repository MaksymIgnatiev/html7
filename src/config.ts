import { join, dirname } from "path"
import { fileURLToPath } from "url"
import type { HTML7 } from "./types/html7"

export var config: HTML7.GeneralConfig = {
	private: {
		ROOT: join(dirname(fileURLToPath(import.meta.url)), ".."),
		baseFilename: "index.html7",
		baseOutFilename: "index.html",
	},
	public: {
		root: ".",
		outDir: "dist-html7",
		minify: false,
	},
}
