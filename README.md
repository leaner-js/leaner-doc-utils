# leaner-doc-utils

A collection of Vite plugins for generating static HTML documentation from Markdown files.


## Usage

To use `leaner-doc-utils`, you need:

 - a `vite.config.js` file which imports the plugins
 - an `index.html` template file using [Handlebars](https://handlebarsjs.com/) syntax
 - a subdirectory containing Markdown files
 - CSS and (optionally) JavaScript files loaded by `index.html` and processed using Vite

### `buildDocs()`

The `buildDocs()` Vite plugin runs after Vite has finished transforming the `index.html` file and generating the bundle. It reads the transformed `index.html` as a Handlebars template, converts the Markdown files into HTML using [markdown-it](https://github.com/markdown-it/markdown-it) and renders the final HTML files using the template.

When Vite is started in watch mode, the plugin automatically updates the HTML files when the source Markdown files are modified. It also starts a simple development server with hot-reloading. The plugin is not compatible with Vite's own development server.

The following options can be passed to the plugin:

```js
buildDocs( {
  title: 'My Site',
  nav: [
    { text: 'Link', link: '/file.html' },
    // ...
  ],
  sidebar: {
    'example': {
      text: 'Example',
      items: [
        { text: 'Link', link: '/file.html' },
        // ...
      ],
    },
    // ...
  },
  dir: 'docs',
  port: 3000,
  tags: {
    '$TAG$': 'replacement',
    // ...
  },
  onStartup( server ) {
    console.log( `Listening on ${server.baseUrl}` );
  },
} );
```

 - `title` is appended to the `H1` heading to create the page title
 - `nav` contains an array of links included in the page header
 - `sidebar` contains one or more menus that can be included in the sidebar
 - `dir` is the path of the directory containing `.md` files, relative to the root path (default: `'docs'`)
 - `port` is used by the development server (default: 3000)
 - `tags` is an optional object containing tags which are replaced in the `.md` files using simple search and replace
 - `onStartup` is an optional callback executed when the development server is started

### `inlineScript()`

The `inlineScript()` Vite plugin makes it possible to inline JavaScript files into `index.html` using the following syntax:

```html
<script src="./src/inline.js" type="inline"></script>
```

The script is minified with esbuild and wrapped in IIFE:

```html
<script>(()=>{...})();</script>
```


## Markdown Extensions

The following Markdown extensions are supported:

### Front Matter

```yml
---
title: Custom Title
meta:
  description: Description of the page
sidebar: example
---
```

The front matter is a fenced block indicated by three dashes. It must contain a valid YAML document. The following front matter options are supported:

 - `title` - custom page title which overrides the default one
 - `meta` - dictionary used to generate `<meta>` tags
 - `sidebar` - name of the menu inserted into the sidebar (if not given, no sidebar is included)

### Hero Block

```html
::: hero
<h2>Hero title</h2>
<p>Hero content.</p>
:::
```

The hero is a fenced block indicated by three colons and the `hero` keyword. It should contain HTML inserted into the hero section of the template page.

### Alert Block

```
::: warning
The content of the alert.
:::
```

The alert is a fenced block indicated by three colons and one of the following keywords: `info`, `tip`, `warning` or `danger`, followed by an optional custom heading.

### Code Highlighting

[Shiki](https://shiki.style/) is used for code highlighting. Light and dark themes are supported.

### Table of Contents

A TOC is automatically generated from `H2` headings and inserted into the sidebar menu.


## License

The leaner-doc-utils package is open-source software released under the MIT License. &copy; 2025 Michał Męciński.
