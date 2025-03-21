# HTML7

HTML7 is an improved version of regular HTML that browser renders, but has syntax allowing to execute JavaScript (and probably other languages) as it would be XML.  


> [!Warning]
> HTML7 currently supports only all valid HTML5 tags. No magic for now!


[tl;dr](#how-to-start), bring me to the HTML7 itself.  

Example code:  

1. Alert something on render  
```html
<alert value="Message to display"/>
// or
<alert>"Message to display"</alert>
```

2. Render same div N times  
```html
<for id:i times="N" >
    <div>"i is: {i}"</div>
</for>
```

3. Conditions  
```html
<if condition="JS expression that will return value">
    <p>First condition is true</p>
<else if condition="JS expression that will return value">
    <p>First condition is false, but second is true</p>
<else>
    <p>First and second conditions are false</p>
</>
```

4. Defining and using variables  
```html
// JS currently supports only 3 keywords to define variables: var, let and const
// rules for each one are preserved

// just declaration
<var name />

// declaration + initialization
<let name="value" /> // string type
// or 
<let name>value</let> // string type

// const (can't leave uninitialized)
<const name=4 /> // number type
// or
<const name>value</const> // string type
// uninitialized const declarations will throw a compilation error

// multiple declarations and initializations
<var a="value" b c="value"/>

// or
<var a b c>value_a value_b value_c</var>

// or, variable `c` will be assigned value of the remaining string after `value_b`
<var a b c>value_a value_b value_c1 value_c2 value_c3</var>

// or, variable `c` will be assigned value of array of the remaining strings after `value_b`
<var a b ...c>value_a value_b value_c1 value_c2 value_c3</var>

// or
<var a="value_a" b c="value_c">value_b</var>
// here, `b` will be assigned value between `>` and `<` (<var>'s text node), because it's not assigned in the attributes

// to use variable's value, use `<v:variable_name />` (variable_name - name of the variable that was defined with var/let/const) tag in nodes, or `variable_name` inside template strings surounded with `{}`:
<div>
    value of 'variable_name' is {variable_name}
    <log><v:variable_name /></log>
</div>
```

5. Defining a function
```html
// function declaration

// to define a function with declaration syntax, we use one of the following tags: `function`, `f`
// `function` stands for regular functions
// `f` stands for arrow functions

// parameters are coma separated. We can also use `params` or `p` for short hand
// we can use rest and spread operators
// parameters need to be defined inside `""`.
<function foo parameters="a, b, c, ...d">
    // function body
    <log>a: {a}, b: {b}, c: {c}, d: {d}</log> // we use `{}` inside tag to evaluate JS expression to prevent typecasting to string with ``

    // return a value from the function (optional)
    // we use `` as a template inside tag to evaluate the result of the string expression
    <return value=`{a} and {b}` />
    // we can also omit the `value` attribute
    <return `{a} and {b}` />
    // or
    <return> /* another value. Can be literally anything */ </>
</> // no need for closing </function> tag, because it will be so annoying to type that every time

// arrow function syntax:
<f name p="params" r="return_value"> /* body */ </>
// `p` stands for `parameters`, `r` stands for return (aliases: `return`, `ret`)

// or without `params` attribute (to save space in our gold file)
<f name "args"> /* body */ </>

// same as `() => value` syntax in JS, we can also do it in HTML7:
<f name r={value} />

// we can even create an anonymous arrow function with no name, no parameters, and it will return different types:
<f r={original_value} />
<f {original_value} />
<f `{original_value}` /> // will be converted to string
<f r=`{original_value}` /> // will be converted to string


// because functions can return anything, we can create functional components that will return HTML7:
<function myComponent parameters="greetName">
    <return>
        <div>`Hello, {greetName}!`</div>
    </>
</>


// function expression

// assign value of a function to the variable:
<var foo>
    <f>
        <log>Hello world</log>
    </>
</var>

// return function from another function
<function multiply parameters="a">
    <return>
        <function parameters="b">
            <return>{a * b}</> 
        </>
    </>
</>


// pass function value as a argument to the function

<var numbers>1 2 3 4 5</var> // number array
<f double "a" {a * 2} />

<log>
// `v:a` - accessing Variable named `a`
// `m:map` - we want to CALL a Method named `MAP`,
// providing with a caller argument surrounded with parentheses

// NOTE: that there need to be no spases between `m`, `:`, `map` and `()` (arguments inside parentheses can be space separated for readability). Otherwise it will be interpreted as a multiple separate expressions
    <v:a m:map(double) /> // atension to the self-closing tag `v:a`
    // this expression will produce output that we can use, for example in `<log>` tag
</log>

// we can also pass function as a node:
<log>
    <v:a m:map> // atension to the self-closing tag `v:a`
        <f:double /> // we use `<f:name />` to reference the function value named `name`
    </> // we surounded the accessor of a variable in a empty tag `</>` to pass node value to the `m:map` method to call it 

    <v:a m:map />   // this
    <v:a m:map> </> // or this
    // will result in
    <v:a m:map() /> // calling a method without parameters
</log> 



// calling a function 

// named:

<f foo "a, b, c" `{a}, {b}, {c}` />

<f:foo("hello world", 3, false) /> // we use same syntax as with method calling, and we pass different arguments inside function separated by coma
// NOTE: that function calls like this accept any valid JS value (strings, numbers, boolean, objects, arrays, etc...), or a value from HTML7 ecosystem.  
// If the caller syntax will be extended like this:
<f:foo("a", <>, "b", "c")>
    <p>Hello world</p>
</>
// it means that we also pass HTML7 values cooresponding to the templates defined as `<>` inside function call arguments


// unnamed

// for example, we have an array of functions, and we want to call 4'th one:
<var functions>
    <f return {3} /> // return is the name of the function, not the attribute, because no `=`
    <f bar {5} />
    <f expr "a" `{a} + 3` />
    <f add "a,b" {a + b} />
</var>
// first, we access the variable:
// then, we specify the Property name under which function is saved. Arrays are just objects, so we can index them with numbers or strings
// `p:` - we want to ACCESS the value under the expression after `p:`, for example, number:
<v:functions p:4() />

// or strings expression
<v:functions p:['4']() /> // this is equivalent to `functions['4']()` in js

// if we don't know the index or property name to access and call the function, we can first find it, and then call:
<v:functions m:find>
    <f "function" {function.name === "bar"} /> // callback function to find needed one
<item> // we use `<item>` tag to indicate that expression above can produce output. Name of the tag can't be changed. It's a reserved tag
    <id:item()> // we use `id:item` (identificator:item) tag to reference the value that will be assigned
                // to the `item` when `find` method will return something.
                // And as usual, we can add `()` to call the found function
</>
```




## How to start

1. Clone repo
```sh
git clone https://github.com/MaksymIgnatiev/html7.git
cd html7
```

2. Run 
```sh
bun run transpile
```
to transpile HTML7 -> HTML.  

3. Run (currently does nothing)
```sh
bun run bundle
```
to get the JS code (if needed) of the magic library inside destination directory (needed for extended functionality).  

4. Run
```sh
bun run define:vite
```
to define a vite configuration file with filled templates from `html7.conf.json` file

5. Run (currently experiensing some issues with vite)
```sh
bun run dev 
```
to define vite config file and run in development mode (watch files in destination directory and entry point of HTML7 for changes, and update everything on a fly. No need for vscode tasks or nodemon)


## How it works?

1. Create an application with `HTRL` (HyperText Reactive Language) in `.html7` file.  
2. Tokenizer splits apart all opening `<tag-name atributes or expressions>`, self-closing `<tag-name atributes or expressions />` and closing `</tag-name>` tags into a list of tokens.  
3. Token parser parses all of the tokens into a single HTML7 abstract syntax tree, where each node can be of type: `tag`, `rule`, `comment`, `text`, `html7` (extended functionality).  
4. Syntax parser parses the entire tree based on the config file for HTML7 ([`html7.conf.json`](html7.conf.json)) into plain HTML, CSS, JS, and extended JS needed for custom HTML7 syntax (if some).  
5. Analyzer combines all strings together, and writes to the destination directory.  
6. Vite automaticaly re-runs the server on changes in destination directory, and automaticaly transpiles HTML7 -> HTML on changes in `.html7` files. (currently experiensing some issues with vite)


## Syntax

Syntax of all HTML7 capabilities can be found in the [syntax.md](HTML7DOCS/syntax.md) file.  


## License

This project is licensed under the 0BSD License - see the [LICENSE](LICENSE) file for details.  
