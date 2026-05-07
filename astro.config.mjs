// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightCatppuccin from '@catppuccin/starlight'
import rehypeExternalLinks from 'rehype-external-links';
import sitemap from '@astrojs/sitemap';

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
					dark: { flavor: "macchiato", accent: "sky" },
					light: { flavor: "latte", accent: "sky" },
				}),
			],
			social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/dipe/' }],
			customCss: [
		        '/src/styles/custom.css',
      		],
			lastUpdated: true,
		}),
		sitemap(),
	],
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
