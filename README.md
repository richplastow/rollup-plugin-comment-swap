# rollup-plugin-comment-swap

A powerful and flexible Rollup plugin for injecting values and code into bundled files.

## Comment Swap 101

‘Comment Swap’ currently supports:
- `/* block comments in JavaScript and CSS */`
- `<!-- HTML comments -->`

### Literal Comment Swap

A single literal will be replaced **_after_** a block comment which **_ends_** with an equals sign ‘`=`’.  
In the same way, a single literal will be replaced **_before_** a block which **_begins_** with an equals sign ‘`=`’.  

Any JavaScript literal can be replaced by any other JavaScript literal.  
Typically you will replace like-for-like, for example a string for another string:

```javascript
const hero = /* 'Batman' =*/ 'Bruce Wayne';
const villain = 'Oswald Cobblepot' /*= 'The Penguin' */;

// Source code logs 'Bruce Wayne', bundled code logs 'Batman':
console.log(hero);

// Source code logs 'Oswald Cobblepot', bundled code logs 'The Penguin':
console.log(villain);
```

In HTML, everything is treated as a string:

```html
<dl>

  <!-- Source HTML says 'Bruce Wayne', bundled HTML says 'Batman': -->
  <dt>Hero</dt>
  <dd><!-- Batman =-->Bruce Wayne</dd>

  <!-- Source HTML says 'Oswald Cobblepot', bundled HTML says 'The Penguin': -->
  <dt>Villain</dt>
  <dd>Oswald Cobblepot<!--= The Penguin --></dd>

</dl>
```

Note that the function name `greetBruceWayne` is replaced by `greetBatman`, so the bundled code will call `greetBatman('9:30am')`: 

```javascript
import { greetBruceWayne /*= greetBatman */ } from 'greetings';

// Source code logs 'Morning Bruce!', bundled code logs 'Morning Batman!':
console.log(/* greetBatman =*/ greetBruceWayne('9:30am'));
```

### Variable Comment Swap

A single variable will be replaced _after_ a block comment which _ends_ with a dollar sign ‘`$`’.  
In the same way, a single variable will be replaced _before_ a block which _begins_ with a dollar sign ‘`$`’.  

These variables are copied from the `$` object — see [Usage](#usage), below.  

```javascript
@TODO example
```

In HTML:

```html
@TODO example
```

### Ternary Comment Swap

@TODO describe

### Whitespace

@TODO discuss when and where whitespace is ignored

## Requirements

This plugin requires an [LTS](https://github.com/nodejs/Release) Node version (v14.0.0+) and Rollup v1.20.0+.

## Install

Using npm:

```console
npm install rollup-plugin-comment-swap --save-dev
```

## Usage

Create a `rollup.config.js` [configuration file](https://www.rollupjs.org/guide/en/#configuration-files) and import the plugin:

```js
const commentSwap = require('rollup-plugin-comment-swap');

module.exports = {
  input: 'src/index.js',
  output: {
    dir: 'output',
    format: 'cjs'
  },
  plugins: [commentSwap({
    $: {
      hero: 'Batman!',
      hasThemeTune: true,
    },
  })]
};
```

Create an accompanying file `src/index.js`, containing some Comment Swaps:

```js
// Literal Comment Swap, using `=*/`
console.log(/* 1234 =*/ 'Oh, hello');

// Ternary Comment Swap, using `?*/` and `/*:`
console.log(/* hasThemeTune ?*/ '.'/*: 'na ' */.repeat(4));

// Variable Comment Swap, using `$*/`
console.log(/* hero $*/ 'Bruce Wayne.');
```

Node ignores your Comment Swaps in the original source code:

```console
node src/index.js
Oh hello
....
Bruce Wayne.
```

Then call `rollup` either via the [CLI](https://www.rollupjs.org/guide/en/#command-line-reference) or the [API](https://www.rollupjs.org/guide/en/#javascript-api). Rollup generates the bundle `output/index.js`:

```js
console.log(1234);
console.log('na '.repeat(4));
console.log('Batman!');
```

In the bundled file, your Comment Swaps have been combined with the `$` object passed to `commentSwap()` in `rollup.config.js`:

```console
node output/index.js
1234
na na na na
Batman!
```

## Options

### `exclude` @TODO

Type: `String` | `Array[...String]`<br>
Default: `null`

A [picomatch pattern](https://github.com/micromatch/picomatch), or array of patterns, which specifies the files in the build the plugin should _ignore_. By default no files are ignored.

### `include` @TODO

Type: `String` | `Array[...String]`<br>
Default: `null`

A [picomatch pattern](https://github.com/micromatch/picomatch), or array of patterns, which specifies the files in the build the plugin should operate on. By default all files are targeted.

### `quick` @TODO

Type: `Boolean`<br>
Default: `true`

If `true`, `rollup-plugin-comment-swap` will process source code using a ‘quick and dirty’ string searching algorithm, which ignores code context. Any sequence of characters which looks like a Comment Swap will be processed, even inside strings or inside other comments. Additionally, the `quick` algorithm may not correctly recognise the value being replaced. @TODO elaborate with examples

If `false`, `rollup-plugin-comment-swap` will parse the source code into an [https://en.wikipedia.org/wiki/Abstract_syntax_tree](abstract syntax tree) first, so that only genuine comments are processed. Additionally, the value being replaced should always be recognised.

### `$`

Type: `Object`<br>
Default: `null`

An optional object, containing variables which Comment Swap can access.  
@TODO describe in more detail
