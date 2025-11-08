export const GET_HOMEPAGE = `
	query GetHomepage {
	  startpage {
    	menu
		logo {
			url
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

