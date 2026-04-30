// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightImageZoom from 'starlight-image-zoom'
import starlightCatppuccin from '@catppuccin/starlight'

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
			plugins: [
				starlightCatppuccin({
					dark: { flavor: "macchiato", accent: "sky" },
					light: { flavor: "latte", accent: "sky" },
				}),
				starlightImageZoom()
			],
			social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/dipe/' }],
			// sidebar: [
			// 	{
			// 		label: 'Guides',
			// 		items: [
			// 			// Each item here is one entry in the navigation menu.
			// 			{ label: 'Example Guide', slug: 'guides/example' },
			// 		],
			// 	},
			// 	{
			// 		label: 'Reference',
			// 		autogenerate: { directory: 'reference' },
			// 	},
			// ],
		}),
	],
});
