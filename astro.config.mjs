// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightImageZoom from 'starlight-image-zoom'
import starlightCatppuccin from '@catppuccin/starlight'
import rehypeExternalLinks from 'rehype-external-links';

// https://astro.build/config
export default defineConfig({
	site: 'https://dipe.github.io',
	integrations: [
		starlight({
			title: '[dipe]',
	     	logo: {
        		src: './src/assets/dipe-logo.svg',
				replacesTitle: true,
      		},
			components: {
				Footer: './src/components/Footer.astro', // Diese Zeile hinzufügen
			},
			plugins: [
				starlightCatppuccin({
					dark: { flavor: "macchiato", accent: "sky" },
					light: { flavor: "latte", accent: "sky" },
				}),
				starlightImageZoom()
			],
			social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/dipe/' }],
			lastUpdated: true,
		}),
	],
	markdown: {
    	rehypePlugins: [
		[
			rehypeExternalLinks,
			{ 
			content: { type: 'text', value: ' ↗' },
			target: '_blank', 
			rel: ['nofollow', 'noopener', 'noreferrer'] 
			}
		],
	],
  },
});
