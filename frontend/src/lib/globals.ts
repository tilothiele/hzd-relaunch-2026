import type { Menu } from '@/types'

export const menu: Menu = {
	items: [
		{
			name: 'Startseite',
			url: '/',
		},
        {
            name: 'HZD',
            url: '/hzd',
            children: [
                {
                    name: 'HZD',
                    url: '/hzd',
                },
            ],
        },
        {
            name: 'Hovawart',
            url: '/hovawart',
            children: [
                {
                    name: 'Hovawart',
                    url: '/hovawart',
                },
            ],
        },
        {
            name: 'Zucht',
            url: '/zucht',
            children: [
                {
                    name: 'Zucht',
                    url: '/zucht',
                },
            ],
        },
	],
}