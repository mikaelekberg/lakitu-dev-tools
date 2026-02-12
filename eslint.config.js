import js from '@eslint/js';
import ts from 'typescript-eslint';
import svelte from 'eslint-plugin-svelte';
import prettier from 'eslint-config-prettier';
import globals from 'globals';
import security from 'eslint-plugin-security';

export default ts.config(
	js.configs.recommended,
	...ts.configs.recommended,
	...svelte.configs['flat/recommended'],
	prettier,
	...svelte.configs['flat/prettier'],
	security.configs.recommended,
	{
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node
			}
		}
	},
	{
		files: ['**/*.svelte'],
		languageOptions: {
			parserOptions: {
				parser: ts.parser
			}
		}
	},
	{
		// Disable {@html} warning for files that use Prism.js syntax highlighting
		// All usages are safe: input is parsed/validated, output is escaped, Prism only adds span tags
		files: [
			'src/routes/json/+page.svelte',
			'src/routes/jwt/+page.svelte',
			'src/routes/regex/+page.svelte',
			'src/routes/yaml/+page.svelte'
		],
		rules: {
			'svelte/no-at-html-tags': 'off'
		}
	},
	{
		ignores: ['build/', '.svelte-kit/', 'dist/']
	}
);
