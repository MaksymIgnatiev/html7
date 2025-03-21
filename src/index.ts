import { join } from "path"
import { config } from "./config"
import { HTML7Error } from "./errors"
import {
	addCreditsToHtml,
	addCssToHtml,
	addHtmlAdd,
	addJsToHtml,
	checkAndCreateDir,
	laodHtmlAdd,
	parseHTML7Config,
	replaceHtmlAdd,
	setConfig,
} from "./functions"
import { parseHTML7, parseHTML7Syntax, tokenizeHTML7 } from "./parser"
import type { HTML7 } from "./types/html7"

var cwd = process.cwd(),
	sourceFile = join(
		config.private.ROOT,
		config.public.root,
		config.private.baseFilename,
	),
	bunfile = Bun.file(sourceFile),
	html7Add = laodHtmlAdd(),
	destFilePath = join(
		config.private.ROOT,
		config.public.outDir,
		config.private.baseOutFilename,
	)

html7Add = replaceHtmlAdd(html7Add.slice(0, html7Add.length - 1))
bunfile.exists().then((exists) => {
	if (!exists) {
		console.log(
			`File '${/(\\\|\/)?\./.test(config.public.root) ? config.private.baseFilename : join(config.public.root, config.private.baseFilename)}' doesn't exist`,
		)
		process.exit(1)
	}
	var contentPromise = bunfile.text(),
		HTML7: HTML7.Syntax,
		result: HTML7.ParsedSyntax

	contentPromise
		.then((content) => {
			var parsedHTML7 = parseHTML7(content)
			if (parsedHTML7 instanceof HTML7Error) {
				console.log(parsedHTML7.toString())
				process.exit(1)
			}
			HTML7 = parsedHTML7
			var tokens = tokenizeHTML7(content)
			if (!Array.isArray(tokens)) {
				console.log(
					new HTML7Error(tokens.syntax, tokens.error, {
						syntaxOffset:
							tokens.syntax.length -
							1 -
							(tokens.syntax.match(/\n/g)?.length ?? 0),
						syntaxStartLine: tokens.lineNr,
					}).toString(),
				)
				process.exit(1)
			}
			return parseHTML7Config().then((conf) => setConfig(conf))
		})
		.then(() => {
			// main

			if (config.public.minify)
				html7Add = html7Add.replace(/[\t\n]+/g, "")

			var parsedSyntax = parseHTML7Syntax(HTML7)
			if (parsedSyntax instanceof HTML7Error) {
				console.log(parsedSyntax.toString())
				process.exit(1)
			}

			result = parsedSyntax

			var indent =
				result.rawHtml.match(/(?<=<body>\n?)\s+(?=<)/)?.[0] ?? ""

			if (indent !== "") indent = indent.slice(1)

			result.outHtml = result.rawHtml

			if (result.extendedJs)
				result.outHtml = addHtmlAdd(result.outHtml, html7Add, indent)

			if (result.rawJs)
				result.outHtml = addJsToHtml(
					result.outHtml,
					result.rawJs,
					indent,
				)
			if (result.rawCss) {
				result.outHtml = addCssToHtml(
					result.outHtml,
					result.rawCss,
					indent,
				)
			}
			result.outHtml = addCreditsToHtml(
				result.outHtml,
				"<!--' Created with HTML7: https://github.com/MaksymIgnatiev/html7 '-->",
			)

			checkAndCreateDir(config.public.outDir)
			return Bun.write(destFilePath, result.outHtml)
		})
		.then(() => {
			var finalSource = sourceFile.replace(cwd, "").slice(1)
			var finalDest = destFilePath.replace(cwd, "").slice(1)
			console.log(`Successfuly transpiled ${finalSource} -> ${finalDest}`)
		})
})
