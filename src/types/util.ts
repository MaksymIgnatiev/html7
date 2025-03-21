/** Check if input string contains the given substring (default: `" "`) */
export type StringContains<
	Source extends string,
	Search extends string = " ",
> = Source extends `${infer _}${Search}${infer _}` ? true : false
