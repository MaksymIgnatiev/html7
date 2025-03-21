import { config } from "./config"
import { HTML7Error } from "./errors"
import type { HTML7 } from "./types/html7"
import { readFileSync } from "fs"
import { join } from "path"

var HTML5_TAGS = new Set(
		readFileSync(
			join(config.private.ROOT, "public", "html5-tags.txt"),
			"utf-8",
		)
			.split("\n")
			.map((tag) => tag.trim()),
	),
	HTML5_SELFCLOSING_TAGS = new Set(
		readFileSync(
			join(config.private.ROOT, "public", "html5-selfclosing-tags.txt"),
			"utf-8",
		)
			.split("\n")
			.map((tag) => tag.trim()),
	),
	HTML5_OPTIONAL_SELFCLOSING_TAGS = new Set(
		readFileSync(
			join(
				config.private.ROOT,
				"public",
				"html5-optional-selfclosing-tags.txt",
			),
			"utf-8",
		)
			.split("\n")
			.map((tag) => tag.trim()),
	)

export function tokenizeHTML7(input: string) {
	input = input.replace(/\n$/, "")
	var regex =
		/<!--([\s\S]*?)-->|\/\*([\s\S]*?)\*\/|\/\/([^\n]*?)\n|<([a-zA-Z0-9_-]+)([^>]*)\/?>|<\/([a-zA-Z0-9_-]*)>|<!([a-zA-Z0-9_-]+)([^>]*)>|([^<>]+)/gs
	var closedCommentRegex = /(<!--|\/\*)[\s\S]*(?<!-->|\*\/)$/
	var tokens: HTML7.Token[] = []
	var match: RegExpExecArray | null
	var incorrectEnding = input.match(closedCommentRegex)

	if (incorrectEnding) {
		var lineNr =
			(input.match(/\n/g)?.length ?? 1) -
			(incorrectEnding[0].match(/\n/g)?.length ?? 1) +
			1
		var syntax =
			incorrectEnding[0] ??
			(input.split(/\n/).pop()?.match(/\S+$/)?.[0] || "")

		return {
			error: "Unexpected character",
			position: input.length - incorrectEnding.length,
			lineNr,
			syntax,
		}
	}

	while ((match = regex.exec(input))) {
		/*
		 * 1 = HTML comment
		 * 2 = HTML7 multiline comment
		 * 3 = HTML7 singleline comment
		 * 4 = opening tag name
		 * 5 = opening tag's attributes
		 * 6 = closing tag with optional name
		 * 7 = rule tag name, e.g: `<!DOCTYPE XXXX>`
		 * 8 = rule tag attributes, e.g: `<!XXXXXX html7>`
		 * 9 = text
		 */
		if (match[1]) {
			tokens.push({
				type: "comment",
				value: match[1].trim(),
				style: "html",
			})
		} else if (match[2]) {
			tokens.push({
				type: "comment",
				value: match[2].trim(),
				style: "html7:multi",
			})
		} else if (match[3]) {
			tokens.push({
				type: "comment",
				value: match[3].trim(),
				style: "html7:single",
			})
		} else if (match[4]) {
			tokens.push({
				type: "open",
				name: match[4],
				attributes: parseAttributes(match[5]),
				selfClosing: match[5]?.endsWith("/"), // Detect self-closing tags
			})
		} else if (match[6] !== undefined) {
			tokens.push({ type: "close", name: match[6] || null })
		} else if (match[7]) {
			tokens.push({
				type: "rule",
				name: match[7],
				attributes: parseAttributes(match[8]),
			})
		} else if (match[9]?.trim()) {
			tokens.push({ type: "text", value: match[9].trim() })
		}
	}
	return tokens
}

export function parseHTML7(input: string): HTML7.Syntax | HTML7Error {
	try {
		var tokens = tokenizeHTML7(input),
			root: HTML7.Syntax = [],
			stack: HTML7.Node[] = [],
			lastNode = {} as HTML7.Node

		if (!Array.isArray(tokens)) {
			return new HTML7Error(tokens.syntax, tokens.error, {
				syntaxOffset:
					tokens.syntax.length -
					1 -
					(tokens.syntax.match(/\n/g)?.length ?? 0),
				syntaxStartLine: tokens.lineNr,
			})
		}

		while (tokens.length) {
			var token = tokens.shift()!

			if (token.type === "open") {
				var tokenName = token.name as HTML7.Node<"tag">["tag"],
					isSelfClosing = HTML5_SELFCLOSING_TAGS.has(tokenName)
				if (isSelfClosing && !token.selfClosing) {
					return new HTML7Error(
						`<${tokenName}>`,
						`${tokenName} is a selfclosing tag`,
					)
				}
				HTML5_OPTIONAL_SELFCLOSING_TAGS.has(tokenName)

				if (!isSelfClosing && token.selfClosing)
					return new HTML7Error(
						`<${tokenName}>`,
						`${tokenName} is not a selfclosing tag`,
					)
				var node: HTML7.Node<"tag"> = {
					type: "tag",
					tag: tokenName,
					attributes: token.attributes,
					selfClosing: token.selfClosing,
					next: [],
				}
				if (stack.length && lastNode.type === "tag")
					lastNode.next.push(node)
				else root.push(node)

				if (!token.selfClosing) {
					stack.push(node)
					lastNode = node
				}
			} else if (token.type === "close") {
				if (
					!stack.length ||
					lastNode.type !== "tag" ||
					(token.name && lastNode.tag !== token.name)
				) {
					return new HTML7Error(
						`</${token.name}>`,
						`Mismatched closing tag: </${token.name}>`,
					)
				}
				stack.pop()
				lastNode = stack[stack.length - 1]
			} else if (token.type === "text") {
				var textNode: HTML7.Node = { type: "text", value: token.value }
				if (!stack.length || lastNode.type !== "tag") {
					return new HTML7Error(
						`${token.value}`,
						"Text outside of root element",
					)
				}
				lastNode.next.push(textNode)
			} else if (token.type === "rule") {
				var ruleNode: HTML7.Node = {
					type: "rule",
					tag: token.name,
					attributes: token.attributes,
				}
				if (!stack.length || lastNode.type !== "tag") {
					root.push(ruleNode)
				} else lastNode.next.push(ruleNode)
			}
		}

		if (stack.length) {
			if (lastNode.type === "tag")
				return new HTML7Error(
					`<${lastNode.tag}>`,
					`Unclosed tag: <${lastNode.tag}>`,
				)
		}

		return root
	} catch (error) {
		return new HTML7Error("Unexpected error", String(error))
	}
}

export function parseAttributes(attributeString: string) {
	var attributes: Map<string, string | boolean> = new Map()
	/*
	 * TODO: add support for:
	 * <tag attr=`value` />
	 * <tag attr={value} />
	 * <tag `value` />
	 * <tag {value} />
	 */
	attributeString.replace(
		/([a-zA-Z0-9-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([a-zA-Z0-9-]+)))?/g,
		(_, key, doubleQuoted, singleQuoted, unquoted) => {
			attributes.set(
				key,
				doubleQuoted || singleQuoted || unquoted || true,
			)
			return ""
		},
	)
	return attributes
}

export function parseHTML7Syntax(
	syntax: HTML7.Syntax,
): HTML7.ParsedSyntax | HTML7Error {
	var html = "",
		css = "",
		js = "",
		ejs = "",
		min = config.public.minify,
		stack: { node: HTML7.Node; lvl: number }[] = syntax.map((e) => ({
			node: e,
			lvl: 0,
		})),
		tagStack: { tag: string; lvl: number }[] = []

	while (stack.length) {
		var stackElement = stack.shift()!

		// close tags when moving up levels
		while (
			tagStack.length &&
			tagStack[tagStack.length - 1].lvl >= stackElement.lvl
		) {
			html += min
				? `</${tagStack.pop()!.tag}>`
				: `\n${"\t".repeat(tagStack.length - 1)}</${tagStack.pop()!.tag}>`
		}

		var indent = min ? "" : "\n" + "\t".repeat(stackElement.lvl)

		if (stackElement.node.type === "tag") {
			if (HTML5_TAGS.has(stackElement.node.tag)) {
				if (stackElement.node.tag === "style") {
					// extract styles from <style> separately
					css += `${stackElement.node.next[0]?.type === "text" ? stackElement.node.next[0].value : ""}\n`
					continue
				} else if (stackElement.node.tag === "script") {
					// extract code from <script> separately
					js += `${stackElement.node.next[0]?.type === "text" ? stackElement.node.next[0].value : ""}\n`
					continue
				} else {
					html += `${indent}<${stackElement.node.tag}${formatAttributes(stackElement.node.attributes)}`
					if (stackElement.node.selfClosing) {
						html += " />"
					} else {
						html += ">"
						tagStack.push({
							tag: stackElement.node.tag,
							lvl: stackElement.lvl,
						})
					}
				}

				stack.unshift(
					...stackElement.node.next.map((next) => ({
						node: next,
						lvl: stackElement.lvl + 1,
					})),
				)
			} else
				return new HTML7Error(
					`<${stackElement.node.tag}>`,
					`${stackElement.node.tag} is not a valid HTML5 tag `,
				)
		} else if (stackElement.node.type === "text") {
			html += min
				? stackElement.node.value
				: `${indent}${stackElement.node.value}`
		} else if (stackElement.node.type === "rule") {
			html += `${indent}<!${stackElement.node.tag}${formatAttributes(stackElement.node.attributes).replace(/(?<= )html7(?= |$)/, "html")}>`
		}
	}

	// close remaining unclosed tags
	while (tagStack.length) {
		html += min
			? `</${tagStack.pop()!.tag}>`
			: `\n${"\t".repeat(tagStack.length - 1)}</${tagStack.pop()!.tag}>`
	}

	if (js) js = `<script>\n${js}\n</script>`
	if (css) css = `<style>\n${css}\n</style>`

	return {
		rawHtml: html.trim(),
		rawCss: css.trim(),
		rawJs: js.trim(),
		extendedJs: ejs.trim(),
		outHtml: "",
	}
}

function formatAttributes(attributes?: Map<string, string | boolean>): string {
	if (!attributes) return ""
	return Array.from(attributes.entries())
		.map(([key, value]) =>
			typeof value === "boolean" ? ` ${key}` : ` ${key}=\"${value}\"`,
		)
		.join("")
}

function formatCSSAttributes(
	attributes?: Map<string, string | boolean>,
): string {
	if (!attributes) return "{}"
	return `{ ${Array.from(attributes.entries())
		.map(([key, value]) => `${key}: ${value};`)
		.join(" ")} }`
}
