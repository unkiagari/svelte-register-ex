const fs = require('fs')
const path = require('path')
const { Module } = require('module')
const { compile } = require('svelte/compiler')

const { transformSync } = require("esbuild")
const scss = require("sass")

const extensions = ['.svelte', '.html']
let compileOptions = {}

function capitalise(name) {
	return name[0].toUpperCase() + name.slice(1)
}

function register(options = {}) {
	if (options.extensions) {
		extensions.forEach(deregisterExtension)
		options.extensions.forEach(registerExtension)
	}

	compileOptions = Object.assign({}, options)
	delete compileOptions.extensions
}

function deregisterExtension(extension) {
	delete Module._extensions[extension]
}

function registerExtension(extension) {
	Module._extensions[extension] = function (module, filename) {
		const name = path.parse(filename).name
			.replace(/^\d/, '_$&')
			.replace(/[^a-zA-Z0-9_$]/g, '')

		const options = Object.assign({}, compileOptions, {
			filename,
			name: capitalise(name),
			generate: 'ssr',
			format: 'cjs'
		})

		let content = fs.readFileSync(filename, 'utf-8')
		content = transformByTagAttr(content, "script", `lang="ts"`, transformTs)
		content = transformByTagAttr(content, "style", `lang="scss"`, transformScss)

		const { js, warnings } = compile(content, options)

		if (options.dev) {
			warnings.forEach(warning => {
				console.warn(`\nSvelte Warning in ${warning.filename}:`)
				console.warn(warning.message)
				console.warn(warning.frame)
			})
		}

		return module._compile(js.code, filename)
	}
}

const transformTs = (content) => {
	const { code } = transformSync(content, {
		target: "esnext",
		loader: "ts",
		tsconfigRaw: {
			compilerOptions: {
				preserveValueImports: true,
			}
		}
	})
	return code
}
const transformScss = content => scss.compileString(content).css

const transformByTagAttr = (str, tag, attr, transform) => {
	const re = new RegExp(`<!--[^]*?-->|<${tag}(\\s[^]*?)?(?:>([^]*?)<\\/${tag}>|\\/>)`, "gi")
	const replacements = []
	str.replace(re, (...args) => {
		const [_match, _attr, _content] = args

		replacements.push({
			offset: args[args.length - 2],
			length: args[0].length,
			replacement: _attr && _attr.match(attr) && _content
				? `<${tag}${_attr}>${transform(_content)}</${tag}>`
				: _match
		})
		return ''
	})
	let out = ''
	let last_end = 0
	for (const { offset, length, replacement } of replacements) {
		out += str.slice(last_end, offset) + replacement
		last_end = offset + length
	}
	out += str.slice(last_end)
	return out
}

registerExtension('.svelte')
registerExtension('.html')

module.exports = register