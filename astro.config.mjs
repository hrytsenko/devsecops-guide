// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

const repo = 'https://github.com/hrytsenko/devsecops-guide';

// https://astro.build/config
export default defineConfig({
	site: 'https://hrytsenko.github.io',
	base: '/devsecops-guide',
	integrations: [
		starlight({
			title: 'DevSecOps Guide',
			description: 'An opinionated guide to DevSecOps.',
			social: [{ icon: 'github', label: 'GitHub', href: repo }],
			customCss: ['./src/styles/custom.css'],
		}),
	],
});
