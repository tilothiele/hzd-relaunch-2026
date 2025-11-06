export const GET_HOMEPAGE = `
	query GetHomepage {
		hzdPluginHomepage {
			documentId
			heroTitle
			heroSubtitle
			heroImage {
				data {
					attributes {
						url
						alternativeText
						width
						height
					}
				}
			}
			heroButtonText
			heroButtonLink
			welcomeTitle
			welcomeText
			welcomeButtonText
			welcomeButtonLink
			welcomeBulletPoints
			membershipTitle
			membershipText
			membershipButtonText
			membershipButtonLink
			createdAt
			updatedAt
			publishedAt
		}
	}
`

export const GET_NEWS = `
	query GetNews($limit: Int, $start: Int) {
		hzdPluginNewsArticles(pagination: { limit: $limit, start: $start }, sort: ["publishedAt:desc"]) {
			data {
				id
				attributes {
					title
					slug
					excerpt
					content
					category
					image {
						data {
							attributes {
								url
								alternativeText
								width
								height
							}
						}
					}
					publishedAt
					createdAt
					updatedAt
				}
			}
		}
	}
`

export const GET_SECTIONS = `
	query GetSections {
		hzdPluginHomepageSections(sort: ["order:asc"]) {
			data {
				id
				attributes {
					title
					text
					buttonText
					buttonLink
					backgroundColor
					textColor
					order
				}
			}
		}
	}
`

export const GET_CONTACTS = `
	query GetContacts {
		hzdPluginContacts {
			data {
				id
				attributes {
					title
					name
					email
					phone
					address
					role
					region
					topic
				}
			}
		}
	}
`

