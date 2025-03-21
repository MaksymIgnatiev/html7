import type { StringContains } from "./util"

export namespace HTML7 {
	export type String<
		T extends "string" | "template",
		S extends string = string,
	> = {
		type: T
		value: T extends "template"
			? S extends StringContains<S, ",">
				? S
				: S extends StringContains<S, " ">
					? S
					: string
			: string
	}
	/** Representation of the attributes in form of JavaScript map, where:
	 *	keys are name of the attribute
	 *	values are assigned values with `attribute=value` syntax, or boolean, if just attribute was specified
	 * */
	export type Attributes = Map<string, string | boolean>
	export type NodeType = "tag" | "rule" | "text"
	/** HTML7 node. Can be one of:
	 * regular string node (regular text)
	 * template string (specific formating allowed; reactive (re-renders if value inside format changes))
	 * rule (e.g. <!DOCTYPE html7>)
	 * nodes array (recursive nodes)
	 */
	export type Node<T extends NodeType = NodeType> = {
		type: T
	} & (T extends "tag"
		? {
				type: "tag"
				/** Tag name (for elements and self-closing tags) */
				tag: keyof HTMLElementTagNameMap
				/** Attributes of the node */
				attributes: Attributes
				/** Wether tag is selfclosing or not (`next` field must be an empty array)*/
				selfClosing: boolean
				/** Child nodes (empty for self-closing tags) */
				next: Array<Node>
			}
		: T extends "rule"
			? { type: "rule"; tag: string; attributes: Attributes }
			: T extends "text"
				? { type: "text"; value: string }
				: never)
	/**
	 * Representation of the whole HTML7 syntax in one map, where:
	 * values are HTML7 values, which can be one of:
	 *   - string
	 *   - template string
	 *   - HTML7 nodes (recursive map)
	 * */
	export type Syntax = Array<Node>

	export type Token = Tokens[keyof Tokens]
	export type TokenKind = "comment" | "open" | "close" | "text" | "rule"
	export type TokenType<T extends TokenKind = TokenKind> = {
		type: T
	}
	type Tokens = {
		Comment: TokenType<"comment"> & {
			value: string
			style: "html" | `html7:${"single" | "multi"}`
		}
		Text: TokenType<"text"> & { value: string }
		Open: TokenType<"open"> & {
			name: string
			attributes: Attributes
			selfClosing: boolean
		}
		Close: TokenType<"close"> & { name: string | null }
		Rule: TokenType<"rule"> & { name: string; attributes: Attributes }
	}
	export type PrivateConfig = {
		/** Absolute path to the root of the project */
		ROOT: string
		/** Filename of the root HTML7 entry point */
		baseFilename: string
		/** Filename of the root HTML transpiled file */
		baseOutFilename: string
	}
	export type GeneralConfig = Readonly<{
		private: Readonly<PrivateConfig>
		public: FileConfig
	}>
	export type FileConfig = {
		/** Directory where to look for `index.html7` file (default: `"."`) */
		root: string
		/** Output directory in the root (default: `"dist-html7"`)*/
		outDir: string
		/** Minify the output html/css/js */
		minify: boolean
	}
	export type HTML5String = string
	export type CSS3String = string
	export type JSString = string
	export type ParsedSyntax = {
		/** Output HTML to write to a file (empty by default, and needs to be updated manualy) */
		outHtml: string
		/** Raw HTML that was parsed after `parseHTML7Syntax()` function */
		rawHtml: HTML5String
		/** Raw CSS that was parsed after `parseHTML7Syntax()` function */
		rawCss: CSS3String
		/** Raw JS (with optional reactivity) that was parsed after `parseHTML7Syntax()` function */
		rawJs: JSString
		/** Raw extended JS (with required reactivity) that was parsed after `parseHTML7Syntax()` function */
		extendedJs: JSString
	}
}
