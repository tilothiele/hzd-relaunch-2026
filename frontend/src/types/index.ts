export interface Image {
	url: string
	alternativeText?: string
	width?: number
	height?: number
}

export interface Startpage {
	documentId: string
	menu: any
	logo: Image
}

export interface Contact {
	id: string
	attributes: {
		title: string
		name: string
		email: string
		phone?: string
		address?: string
		role?: string
		region?: string
		topic?: string
	}
}

export interface Menu {
	items: MenuItem[];
}

export interface MenuItem {
	name: string
	url?: string
	children?: MenuItem[];
}


