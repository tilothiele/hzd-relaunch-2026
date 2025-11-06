export interface Image {
	url: string
	alternativeText?: string
	width?: number
	height?: number
}

export interface Homepage {
	documentId: string
	heroTitle: string
	heroSubtitle: string
	heroImage: {
		data: {
			attributes: Image
		}
	}
	heroButtonText: string
	heroButtonLink: string
	welcomeTitle: string
	welcomeText: string
	welcomeButtonText: string
	welcomeButtonLink: string
	welcomeBulletPoints: string[]
	membershipTitle: string
	membershipText: string
	membershipButtonText: string
	membershipButtonLink: string
	createdAt: string
	updatedAt: string
	publishedAt: string
}

export interface NewsArticle {
	id: string
	attributes: {
		title: string
		slug: string
		excerpt: string
		content: string
		category: string
		image: {
			data: {
				attributes: Image
			}
		}
		publishedAt: string
	}
}

export interface HomepageSection {
	id: string
	attributes: {
		title: string
		text: string
		buttonText: string
		buttonLink: string
		backgroundColor: string
		textColor: string
		order: number
	}
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


