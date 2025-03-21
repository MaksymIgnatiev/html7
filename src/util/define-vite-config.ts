import { join } from "path"
import { config } from "../config"
import type { HTML7 } from "../types/html7"
import { existsSync, readFileSync } from "fs"
import { parseHTML7Config, setConfig } from "../functions"

var viteTemplateFilePath = join(config.private.ROOT, "vite.config.template.ts"),
	viteConfigFilePath = join(config.private.ROOT, "vite.config.ts"),
	viteTemplateFileExists = existsSync(viteTemplateFilePath)

function fileDoesntExist(filepath: string) {
	console.log(`File ${filepath} does not exist!`)
	process.exit(1)
}

if (!viteTemplateFileExists) {
	fileDoesntExist(viteTemplateFilePath)
}

var viteTemplateContent = readFileSync(viteTemplateFilePath, "utf-8")

parseHTML7Config()
	.then((conf) => setConfig(conf))
	.then(() => {
		viteTemplateContent = viteTemplateContent
			.replace(/%html-root/g, config.public.outDir)
			.replace(/%bundle-file/g, join("src", "react-html.ts"))
			.replace(/%html7-index/g, config.private.baseFilename)

		return Bun.write(viteConfigFilePath, viteTemplateContent).then((_) => {
			if (process.argv[2] !== "--quiet")
				console.log(`Defined vite config!`)
		})
	})
