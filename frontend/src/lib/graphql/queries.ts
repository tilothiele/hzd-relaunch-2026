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
			PartnerLink {
				id
				Logo {
					url
					alternativeText
					width
					height
					caption
					previewUrl
				}
				PartnerLinkUrl
				AltText
			}
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
					RichTextOddEven
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
					CardColumnsOddEven
					CardItem {
						id
						Headline
						Subheadline
						ColorTheme {
							ShortName
						}
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
					TeaserOddEven
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
				... on ComponentBlocksTextColumnsSection {
					TextColumnsOddEven
					TextColumnsHeadline
					TextColumnsSubHeadline
					TextColumn {
						id
						ColumnHeadline
						ColumnText
						ColumnActionButton {
							Label
							Link
							Primary
						}
						BulletItems {
							id
							Headline
							ItemBody
						}
					}
				}
				... on ComponentBlocksImageGallerySection {
					GalleryHeadline
					GalleryImages {
						url
						alternativeText
						width
						height
						caption
						previewUrl
					}
				}
				... on ComponentBlocksSimpleCtaSection {
					CtaHeadline
					CtaInfoText
					CtaBackgroundImage {
						url
						alternativeText
						width
						height
						caption
						previewUrl
					}
					CtaActionButton {
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
					ColorTheme {
						ShortName
					}
					Sections {
						__typename
						... on ComponentBlocksRichTextSection {
							RichTextContent
							RichTextOddEven
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
						CardColumnsOddEven
						CardItem {
							id
							Headline
							Subheadline
							ColorTheme {
								ShortName
							}
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
							SupplementalsOddEven
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
									SortOrd
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
							TeaserOddEven
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
						... on ComponentBlocksTextColumnsSection {
							TextColumnsOddEven
							TextColumnsHeadline
							TextColumnsSubHeadline
							TextColumn {
								id
								ColumnHeadline
								ColumnText
								ColumnActionButton {
									Label
									Link
									Primary
								}
								BulletItems {
									id
									Headline
									ItemBody
								}
							}
						}
						... on ComponentBlocksImageGallerySection {
							GalleryHeadline
							GalleryImages {
								url
								alternativeText
								width
								height
								caption
								previewUrl
							}
						}
						... on ComponentBlocksSimpleCtaSection {
							CtaHeadline
							CtaInfoText
							CtaBackgroundImage {
								url
								alternativeText
								width
								height
								caption
								previewUrl
							}
							CtaActionButton {
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
			SOD1
			HD
			stuntLicenseSince
			father {
				documentId
				fullKennelName
				givenName
			}
			mother {
				documentId
				fullKennelName
				givenName
			}
			owner {
				documentId
				firstName
				lastName
			}
			Genprofil
			EyesCheck
			HeartCheck
			ColorCheck
			MemosDraft
			MemosReleased
			Location {
				lat
				lng
			}
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
				firstName
				lastName
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
			StatusMessage
			AmountS {
				Total
				Available
			}
			AmountSM {
				Total
				Available
			}
			AmountB {
				Total
				Available
			}
			breeder {
				kennelName
				member {
					firstName
					lastName
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

export const GET_CALENDARS = `
	query GetCalendars {
		calendars {
			documentId
			Name
			ColorSchema
		}
	}
`

export const SEARCH_CALENDAR_ITEMS = `
query SearchCalendarItems($filters: CalendarEntryFiltersInput , $pagination: PaginationArg, $sort: [String]) {
		calendarEntries (
			filters: $filters
			pagination: $pagination
			sort: $sort
		) {
			documentId
			Date
			Headline
			Description
			LongDescription
			AnmeldeLink
			ErgebnisLink
			Region
			CalendarDocument {
				MediaFile {
					alternativeText
					ext
					name
					url
				}
			}
			calendar {
				documentId
				Name
				ColorSchema
			}
		}
	}
`

