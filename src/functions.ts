import { join } from "path"
import { readFileSync, existsSync, mkdirSync } from "fs"
import { config } from "./config"
import type { HTML7 } from "./types/html7"

export function parseHTML7Config(): Promise<Partial<HTML7.FileConfig>> {
	var bunFile = Bun.file(join(config.private.ROOT, "html7.conf.json"))
	return bunFile.exists().then((exists) => {
		if (!exists) return {}
		return bunFile.json()
	})
}

export function setConfig(conf: Partial<HTML7.FileConfig>) {
	// yeah, it's totaly safe
	Object.assign(config.public, conf)
}

export function laodHtmlAdd() {
	var filepath = join(config.private.ROOT, "public", "html-add.txt")
	return existsSync(filepath) ? readFileSync(filepath, "utf-8") : ""
}

export function replaceHtmlAdd(html: string) {
	return html.replace(
		config.public.minify
			? /%%minify:|(%%!minify:.*\n)/g
			: /%%!minify:|(%%minify:.*\n)/g,
		"",
	)
}

export function addCssToHtml(html: string, css: string, indent = "") {
	return html.replace(
		/<\/head>/,
		config.public.minify
			? `${css}</head>`
			: `${css
					.split(/\n/g)
					.map((e) => `${indent}${e}`)
					.join("\n")}\n</head>`,
	)
}
export function addHtmlAdd(html: string, htmlAdd: string, indent = "") {
	return html.replace(
		/<\/body>/,
		config.public.minify
			? `${htmlAdd}</body>`
			: `${htmlAdd
					.split(/\n/g)
					.map((e) => `${indent}${e}`)
					.join("\n")}\n</body>`,
	)
}

export function addJsToHtml(html: string, js: string, indent = "") {
	return html.replace(
		/<\/body>/,

		config.public.minify
			? `${js}</body>`
			: `${js
					.split(/\n/g)
					.map((e) => `${indent}${e}`)
					.join("\n")}\n</body>`,
	)
}

export function checkAndCreateDir(path: string | URL) {
	var exists = existsSync(path)
	if (!exists) mkdirSync(path, { recursive: true })
	return exists
}

export function addCreditsToHtml(html: string, credits: string, indent = "") {
	return html.replace(
		/<html>/,

		config.public.minify
			? `${credits}<html>`
			: `${credits
					.split(/\n/g)
					.map((e) => `${indent}${e}`)
					.join("\n")}\n<html>`,
	)
}
