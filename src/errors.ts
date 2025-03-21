var defaultHTML7ErrorOptions = {
	syntaxOffset: 0,
	syntaxLength: -1, // whole syntax
	syntaxStartLine: 0, // by default, don't show, or if provided - increment on each new line (if syntax has more than one line)
}
export class HTML7Error extends Error {
	indent = "    " as const
	syntax: string
	syntaxOffset: number
	syntaxLength: number
	syntaxStartLine: number
	constructor(
		syntax: string,
		message: string,
		options: Partial<typeof defaultHTML7ErrorOptions> = {},
	) {
		super(message)
		this.syntax = syntax
		this.syntaxOffset =
			options?.syntaxOffset ?? defaultHTML7ErrorOptions.syntaxOffset
		this.syntaxLength =
			options?.syntaxLength ?? defaultHTML7ErrorOptions.syntaxLength
		this.syntaxStartLine =
			options?.syntaxStartLine ?? defaultHTML7ErrorOptions.syntaxStartLine
		this.name = this.constructor.name
	}
	toString(): string {
		var lines = this.syntax.split("\n"),
			formattedLines = [] as string[],
			syntaxOffsetPointer = 0,
			numberPadding = (this.syntaxStartLine + lines.length - 1).toString()
				.length,
			showLines = this.syntaxStartLine > 0,
			remainingLength = this.syntaxLength

		lines.forEach((line, index) => {
			var lineStartIdx = syntaxOffsetPointer
			var lineEndIdx = syntaxOffsetPointer + line.length

			if (showLines) {
				var lineIdxPadded = (this.syntaxStartLine + index)
					.toString()
					.padEnd(numberPadding, " ")
				formattedLines.push(`${lineIdxPadded}|${this.indent}${line}`)
			} else {
				formattedLines.push(`${this.indent}${line}`)
			}

			if (lineEndIdx > this.syntaxOffset && remainingLength !== 0) {
				var caretStart = Math.max(0, this.syntaxOffset - lineStartIdx)
				var caretLength =
					this.syntaxLength === -1
						? line.length - caretStart
						: Math.min(remainingLength, line.length - caretStart)
				remainingLength -= caretLength
				this.syntaxOffset += caretLength

				var caretLine = `${showLines ? " ".repeat(numberPadding + 1) : ""}${this.indent}${" ".repeat(caretStart)}${"^".repeat(Math.max(0, caretLength))}`
				formattedLines.push(caretLine)
			}
			syntaxOffsetPointer += line.length
		})
		var msg = `${this.name}: ${this.message}, at${lines.length > 1 ? `:\n\`\`\`html7\n${this.syntax}\n\`\`\`` : ` '${this.syntax}'`}`,
			error = formattedLines.join("\n")
		return `${error}\n\n${msg}`
	}
}

export function HTML7ErrorString(
	...args: ConstructorParameters<typeof HTML7Error>
): string
export function HTML7ErrorString(error: HTML7Error): string
export function HTML7ErrorString(
	...args: ConstructorParameters<typeof HTML7Error> | [error: HTML7Error]
) {
	if (args[0] instanceof HTML7Error) return args[0].toString()
	else
		return new HTML7Error(
			...(args as ConstructorParameters<typeof HTML7Error>),
		).toString()
}
