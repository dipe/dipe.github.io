// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightCatppuccin from '@catppuccin/starlight'
import rehypeExternalLinks from 'rehype-external-links';
import license from 'vite-plugin-license';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://astro.build/config
export default defineConfig({
	site: 'https://dipe.de',
	integrations: [
		starlight({
			title: '[dipe]',
	     	logo: {
        		src: './src/assets/dipe-logo.png',
				replacesTitle: true,
      		},
			components: {
				Footer: './src/components/Footer.astro',
			},
			plugins: [
				starlightCatppuccin({
					dark: { flavor: "mocha", accent: "sapphire" },
					light: { flavor: "latte", accent: "sky" },
				}),
			],
			social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/dipe/' }],
			customCss: [
		        '/src/styles/custom.css',
      		],
			lastUpdated: true,
		}),
	],
	vite: {
    	plugins: [
      		license({
        		thirdParty: {
          			output: path.resolve(__dirname, './dist/3rd-party-licenses.txt'),
				},
			}),
		],
	},
	markdown: {
    	rehypePlugins: [
		[
			rehypeExternalLinks,
			{ 
				content: [],
				target: '_blank', 
				rel: ['nofollow', 'noopener', 'noreferrer'],
				properties: { class: 'external-link' },
			}
		],
	],
  },
});
