import daisyui from 'daisyui';

/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			fontFamily: {
				sans: ['"Inter Variable"', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
				mono: ['"JetBrains Mono Variable"', 'JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Consolas', 'monospace']
			}
		}
	},
	plugins: [daisyui],
	daisyui: {
		themes: ['light', 'dark'],
		darkTheme: 'dark',
		base: true,
		styled: true,
		utils: true
	}
};
