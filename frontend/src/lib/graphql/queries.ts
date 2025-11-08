export const GET_HOMEPAGE = `
	query GetStartpage {
		startpage {
			Menu
			Logo {
				url
				alternativeText
				width
				height
				caption
				previewUrl
			}
			Footer {
				ItProjektleitungName
				ItProjektleitungOrt
				ItProjektleitungTelefon
				PraesidiumName
				PraesidiumOrt
				PraesidiumTelefon
			}
			Copyright
			SocialLinkFB
			SocialLinkYT
			UnserHovawartImage {
				url
				alternativeText
				width
				height
				caption
				previewUrl
			}
		}
	}
`

/*
			Sections {
				__typename
				... on BlocksHeroSectionSlideShow {
					Headline {
						id
						Headline
						Subheadline
						HeroImage {
							url
							alternativeText
							width
							height
							caption
							previewUrl
						}
						ActionButton {
							Label
							Link
							Primary
						}
					}
				}
				... on BlocksCardSection {
					CardItem {
						id
						Headline
						Subheadline
						FarbThema
						BackgroundImage {
							url
							alternativeText
							width
							height
							caption
							previewUrl
						}
						ActionButton {
							Label
							Link
							Primary
						}
					}
				}
			}
*/

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

