export const GET_LAYOUT = `
	query GetLayout {
		globalLayout {
			Menu
			Logo {
				url
				alternativeText
				width
				height
				caption
				previewUrl
			}
			UnserHovawartImage {
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
		}
	}
`

export const GET_INDEX_PAGE = `
	query GetIndexPage {
		indexPage {
			Sections {
				__typename
			    ... on ComponentBlocksRichTextSection {
					RichTextContent
				}
				... on ComponentBlocksHeroSectionSlideShow {
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
				... on ComponentBlocksCardSection {
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
				... on ComponentBlocksTeaserTextWithImage {
					TeaserHeadline
					TeaserText
					ImagePosition
					Image {
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
	}
`

/*
*/

export const GET_SECTIONS = `
	query GetSections {
		hzdPluginHomepageSections(sort: ["order:asc"]) {
			data {
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
`

export const GET_CONTACTS = `
	query GetContacts {
		hzdPluginContacts {
			data {
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
`

export const GET_PAGE_BY_SLUG = `
	query GetPageBySlug($slug: String!) {
		pages(filters: { slug: { eq: $slug } }, pagination: { pageSize: 1 }) {
					slug
					title
					FarbThema
					Sections {
						__typename
						... on ComponentBlocksRichTextSection {
							RichTextContent
						}
						... on ComponentBlocksHeroSectionSlideShow {
							Headline {
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
						... on ComponentBlocksCardSection {
							CardItem {
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
						... on ComponentBlocksSupplementalDocumentGroupSection {
							GroupHeadline
							supplemental_document_group {
								documentId
								Name
								SortOrd
								supplemental_documents {
									documentId
									Name
									Description
									ShortId
									DownloadDocument {
										url
										name
										ext
										mime
										size
									}
									VisibilityStart
									VisibilityEnd
								}
							}
						}
						... on ComponentBlocksTeaserTextWithImage {
							TeaserHeadline
							TeaserText
							ImagePosition
							Image {
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
	}
`

export const SEARCH_DOGS = `
	query SearchDogs($filters: HzdPluginDogFiltersInput, $pagination: PaginationArg, $sort: [String]) {
		hzdPluginDogs(
			filters: $filters
			pagination: $pagination
			sort: $sort
		) {
			documentId
				givenName
				fullKennelName
				sex
				color
				dateOfBirth
				dateOfDeath
				microchipNo
				avatar {
					url
					alternativeText
					width
					height
				}
		}
	}
`

export const SEARCH_BREEDERS = `
	query SearchBreeders($filters: HzdPluginBreederFiltersInput, $pagination: PaginationArg, $sort: [String]) {
		hzdPluginBreeders(
			filters: $filters
			pagination: $pagination
			sort: $sort
		) {
			documentId
			kennelName
			breedingLicenseSince
			member {
				fullName
				region
				phone
				adress1
				adress2
				zip
				countryCode
			}
		}
	}
`

export const SEARCH_LITTERS = `
	query SearchLitters($filters: HzdPluginLitterFiltersInput, $pagination: PaginationArg, $sort: [String]) {
		hzdPluginLitters(
			filters: $filters
			pagination: $pagination
			sort: $sort
		) {
			documentId
			dateOfManting
			expectedDateOfBirth
			dateOfBirth
			closed
			breeder {
				kennelName
				member {
					fullName
				}
			}
			mother {
				fullKennelName
				givenName
			}
			stuntDog {
				fullKennelName
				givenName
			}
		}
	}
`

