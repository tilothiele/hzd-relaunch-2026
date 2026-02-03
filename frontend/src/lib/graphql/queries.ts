export const GET_LAYOUT = `
	query GetLayout {
		globalLayout {
			Menu
			MenuStyle
			DrawerMenu
			SOS {
				ShowSOS
				SosTitle
				SosLink
			}
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
			Impressum {
				documentId
				slug
				title
			}
			PrivacyPolicy {
				url
				name
				ext
				mime
				size
				alternativeText
				width
				height
				caption
				previewUrl
			}
			page {
				LogoBackground
				Sections {
					__typename
					... on ComponentBlocksRichTextSection {
						Title
						Subtitle
						RichTextContent
						RichTextOddEven
						RichTextAnchor
						RichTextPadding {
							Top
							Bottom
						}
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
						CardHeadline
						CardColumnsOddEven
						CardLayout
						CardItem {
							id
							Headline
							Subheadline
							TeaserText
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
						CardsAnchor
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
						TeaserAnchor
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
						TextColumnsAnchor
						Padding {
							Top
							Bottom
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
						ImageGalleryAnchor
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
						SimpleCtaAnchor
					}
					... on ComponentBlocksNewsArticlesSection {
					MaxArticles
								news_article_category {
									documentId
								}
						NewsArticlesAnchor
					}
					... on ComponentBlocksContactGroupSection {
						ContactGroup {
							documentId
							ContactGroupName
							GroupDescription
							contacts(sort: ["position:asc"]) {
								documentId
								position
								Headline
								Name
								Street
								ZipCity
								Phone
								Email1
								Email2
								Introduction
								avatar {
									url
									alternativeText
									width
									height
									caption
									previewUrl
								}
								member {
									documentId
									firstName
									lastName
								}
							}
						}
						ContactGroupAnchor
					}
					... on ComponentBlocksContactMailerSection {
						ContactMailerAnchor
						ContactMailerHeadline
						ContactMailerInfotext
						ReceipientOptions {
	 						id
	 						Email
	 						DisplayName
	 					}
	 				}
	 				... on ComponentBlocksSimpleHeroSection {
	 					HeroAnchor
	 					HeroHeadline
	 					HeroTeaser
	 					HeroImage {
	 						url
	 						alternativeText
	 						width
	 						height
	 						caption
	 						previewUrl
	 					}
	 					HeroLayout
	 					HeroCta {
	 						Label
	 						Link
	 						Primary
	 					}
	 					FullWidth
	 					ShowLog
						FadingBorder
	 				}
				}
			}
		}
		hzdSetting {
			DefaultAvatarS {
				url
				alternativeText
				width
				height
			}
			DefaultAvatarSM {
				url
				alternativeText
				width
				height
			}
			DefaultAvatarB {
				url
				alternativeText
				width
				height
			}
			DefaultBreederAvatar {
				url
				alternativeText
				width
				height
			}
		}
	}
`

export const GET_INDEX_PAGE = `
	query GetIndexPage {
		indexPage {
			LogoBackground
			Sections {
				__typename
			    ... on ComponentBlocksRichTextSection {
					Title
					Subtitle
					RichTextContent
					RichTextOddEven
					RichTextAnchor
					RichTextPadding {
						Top
						Bottom
					}
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
					CardHeadline
					CardColumnsOddEven
					CardLayout
					CardItem {
						id
						Headline
						Subheadline
						TeaserText
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
					CardsAnchor
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
					TeaserAnchor
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
					TextColumnsAnchor
					Padding {
						Top
						Bottom
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
					ImageGalleryAnchor
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
					SimpleCtaAnchor
				}
				... on ComponentBlocksNewsArticlesSection {
				MaxArticles
							news_article_category {
								documentId
							}
					NewsArticlesAnchor
				}
				... on ComponentBlocksContactGroupSection {
					ContactGroup {
						documentId
						ContactGroupName
						GroupDescription
						contacts(sort: ["position:asc"]) {
							documentId
							position
							Headline
							Name
							Street
							ZipCity
							Phone
							Email1
							Email2
							Introduction
							avatar {
								url
								alternativeText
								width
								height
								caption
								previewUrl
							}
							member {
								documentId
								firstName
								lastName
							}
						}
					}
					ContactGroupAnchor
				}
				... on ComponentBlocksContactMailerSection {
					ContactMailerAnchor
					ContactMailerHeadline
					ContactMailerInfotext
					ReceipientOptions {
 						id
 						Email
 						DisplayName
 					}
 				}
 				... on ComponentBlocksSimpleHeroSection {
 					HeroAnchor
 					HeroHeadline
 					HeroTeaser
 					HeroImage {
 						url
 						alternativeText
 						width
 						height
 						caption
 						previewUrl
 					}
 					HeroLayout
 					HeroCta {
 						Label
 						Link
 						Primary
 					}
 					FullWidth
 					ShowLog
					FadingBorder
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
					LogoBackground
					Restriction {
						Public
					}
					Sections {
						__typename
						... on ComponentBlocksRichTextSection {
							Title
							Subtitle
							RichTextContent
							RichTextOddEven
							RichTextAnchor
							RichTextPadding {
								Top
								Bottom
							}
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
						CardHeadline
						CardColumnsOddEven
						CardLayout
						CardItem {
							id
							Headline
							Subheadline
							TeaserText
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
						CardsAnchor
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
							GroupAnchor
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
							TeaserAnchor
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
							TextColumnsAnchor
							Padding {
								Top
								Bottom
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
							ImageGalleryAnchor
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
							SimpleCtaAnchor
						}
						... on ComponentBlocksContactGroupSection {
							ContactGroup {
								documentId
								ContactGroupName
								GroupDescription
								contacts(sort: ["position:asc"]) {
									documentId
									position
									Headline
									Name
									Street
									ZipCity
									Phone
									Email1
									Email2
									Introduction
									avatar {
										url
										alternativeText
										width
										height
										caption
										previewUrl
									}
									member {
										documentId
										firstName
										lastName
									}
								}
							}
							ContactGroupAnchor
						}
						... on ComponentBlocksContactMailerSection {
							ContactMailerAnchor
							ContactMailerHeadline
							ContactMailerInfotext
							ReceipientOptions(pagination: { limit: 100 }) {
 								id
 								Email
 								DisplayName
 							}
 						}
 						... on ComponentBlocksSimpleHeroSection {
 							HeroAnchor
 							HeroHeadline
 							HeroTeaser
 							HeroImage {
 								url
 								alternativeText
 								width
 								height
 								caption
 								previewUrl
 							}
 							HeroLayout
 							HeroCta {
 								Label
 								Link
 								Primary
 							}
 							FullWidth
 							ShowLog
							FadingBorder
 						}
						... on ComponentBlocksNewsArticlesSection {
							MaxArticles
							news_article_category {
								documentId
							}
							NewsArticlesAnchor
						}
					}
				}
	}
`

export const SEARCH_DOGS = `
	query SearchDogs($filters: HzdPluginDogFiltersInput, $pagination: PaginationArg, $sort: [String]) {
		hzdPluginDogs_connection(
			filters: $filters
			pagination: $pagination
			sort: $sort
		) {
			nodes {
				documentId
				givenName
				fullKennelName
				sex
				color
				dateOfBirth
				dateOfDeath
				microchipNo
				cStudBookNumber
				owner {
					documentId
					firstName
					lastName
				}
				withersHeight
				Exhibitions
				BreedSurvey
				Images {
					url
					alternativeText
					width
					height
					caption
					previewUrl
				}
				cFertile
				MemosReleased
				breeder {
					BreedersIntroduction
				}
				father {
					documentId
					fullKennelName
					givenName
					dateOfBirth
					dateOfDeath
					owner {
						firstName
						lastName
					}
					father {
						documentId
						fullKennelName
						givenName
						dateOfBirth
						dateOfDeath
						owner {
							firstName
							lastName
						}
						father {
							documentId
							fullKennelName
							givenName
							dateOfBirth
							dateOfDeath
							owner {
								firstName
								lastName
							}
						}
						mother {
							documentId
							fullKennelName
							givenName
							dateOfBirth
							dateOfDeath
							owner {
								firstName
								lastName
							}
						}
					}
					mother {
						documentId
						fullKennelName
						givenName
						dateOfBirth
						dateOfDeath
						owner {
							firstName
							lastName
						}
						father {
							documentId
							fullKennelName
							givenName
							dateOfBirth
							dateOfDeath
							owner {
								firstName
								lastName
							}
						}
						mother {
							documentId
							fullKennelName
							givenName
							dateOfBirth
							dateOfDeath
							owner {
								firstName
								lastName
							}
						}
					}
				}
				mother {
					documentId
					fullKennelName
					givenName
					dateOfBirth
					dateOfDeath
					owner {
						firstName
						lastName
					}
					father {
						documentId
						fullKennelName
						givenName
						dateOfBirth
						dateOfDeath
						owner {
							firstName
							lastName
						}
						father {
							documentId
							fullKennelName
							givenName
							dateOfBirth
							dateOfDeath
							owner {
								firstName
								lastName
							}
						}
						mother {
							documentId
							fullKennelName
							givenName
							dateOfBirth
							dateOfDeath
							owner {
								firstName
								lastName
							}
						}
					}
					mother {
						documentId
						fullKennelName
						givenName
						dateOfBirth
						dateOfDeath
						owner {
							firstName
							lastName
						}
						father {
							documentId
							fullKennelName
							givenName
							dateOfBirth
							dateOfDeath
							owner {
								firstName
								lastName
							}
						}
						mother {
							documentId
							fullKennelName
							givenName
							dateOfBirth
							dateOfDeath
							owner {
								firstName
								lastName
							}
						}
					}
				}
				owner {
					documentId
					firstName
					lastName
					address1
					address2
					zip
					city
					countryCode
					phone
					email
				}
				cFertile
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
			pageInfo {
				total
				page
				pageSize
				pageCount
			}
		}
	}
`

export const SEARCH_BREEDERS = `
	query SearchBreeders($filters: HzdPluginBreederFiltersInput, $pagination: PaginationArg, $sort: [String]) {
		hzdPluginBreeders_connection(
			filters: $filters
			pagination: $pagination
			sort: $sort
		) {
			nodes {
				documentId
				kennelName
				breedingLicenseSince
				IsActive
				member {
					documentId
					firstName
					lastName
					region
					phone
					email
					city
					address1
					address2
					zip
					countryCode
					geoLocation {
						lat
						lng
					}
				}
				WebsiteUrl
				avatar {
					url
					alternativeText
					width
					height
				}
			}
			pageInfo {
				total
				page
				pageSize
				pageCount
			}
		}
	}
`

export const SEARCH_LITTERS = `
	query SearchLitters($filters: HzdPluginLitterFiltersInput, $pagination: PaginationArg, $sort: [String]) {
		hzdPluginLitters_connection(
			filters: $filters
			pagination: $pagination
			sort: $sort
		) {
			nodes {
				documentId
				dateOfManting
				expectedDateOfBirth
				dateOfBirth
				LitterStatus
				StatusMessage
				OrderLetter
				PuppyImage {
					url
					alternativeText
					width
					height
				}
				AmountRS {
					id
					Total
					Available
				}
				AmountRSM {
					id
					Total
					Available
				}
				AmountRB {
					id
					Total
					Available
				}
				AmountHS {
					id
					Total
					Available
				}
				AmountHSM {
					id
					Total
					Available
				}
				AmountHB {
					id
					Total
					Available
				}
				breeder {
					documentId
					kennelName
					breedingLicenseSince
					IsActive
					BreedersIntroduction
					WebsiteUrl
					WebsiteUrlDraft
					InternalNotes
					member {
						firstName
						lastName
						region
						phone
						address1
						address2
						zip
						countryCode
					}
					GeoLocation {
						lat
						lng
					}
				}
				mother {
					documentId
					fullKennelName
					givenName
					sex
					color
					dateOfBirth
					dateOfDeath
					microchipNo
					Exhibitions
					BreedSurvey
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
				stuntDog {
					documentId
					fullKennelName
					givenName
					sex
					color
					dateOfBirth
					dateOfDeath
					microchipNo
					Exhibitions
					BreedSurvey
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
			pageInfo {
				total
				page
				pageSize
				pageCount
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
			Time
			DateTo
			Headline
			Description
			LongDescription
			AnmeldeLink
			ErgebnisLink
			ErgebnisText
			Region
		    form {
                documentId
            }
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
			VisibleFrom
			VisibleTo
			DueDate
			createdAt
			updatedAt
			publishedAt
		}
	}
`

export const GET_FORM_BY_DOCUMENT_ID = `
	query GetFormByDocumentId($documentId: ID!) {
		forms(filters: { documentId: { eq: $documentId } }, pagination: { pageSize: 1 }) {
			documentId
			Name
			EventAdmin {
				documentId
				firstName
				lastName
			}
			InclPrivacyPolicy
			ThankYouMessage
			FormFields {
				__typename
				... on ComponentFormShortTextInput {
					MinLength
					MultiLine
					STName
					id
				}
				... on ComponentFormEmailAdress {
					EAName
					EARequired
					id
				}
				... on ComponentFormTextArea {
					id
					TAName
				}
				... on ComponentFormNumberInput {
					id
					NIName
					NIMinValue
					NIMaxValue
					NIRequired
				}
				... on ComponentFormChoice {
					id
					CName
					CRequired
					MultipleChoice
					Options
				}
				... on ComponentFormBooleanChoice{
					id
					BCName
					BCRequired
					BCRequiredValue
				}
				... on ComponentFormFldGroupSeparator {
					id
					GroupName
				}
				... on ComponentFormFldStaticText {
					id
					StaticContent
				}
				... on ComponentFormFormSubmitButton {
					id
					FSBName
				}
				... on ComponentFormStandardIdentifiers {
					id
					EMail
					MembershipNumber
					FirstName
					LastName
					Street
					Zip
					City
					CountryCode
					Phone
				}
			}
		}
	}
`

export const GET_ME = `
	query GetMe {
		me {
			id
			documentId
			username
			email
			confirmed
			blocked
			role {
				id
				name
				description
				type
			}
			firstName
			lastName
			address1
			address2
			countryCode
			zip
			city
			phone
			geoLocation {
				id
				lat
				lng
			}
		}
	}
`

export const SEARCH_FORMS = `
	query SearchForms($filters: FormFiltersInput, $pagination: PaginationArg, $sort: [String]) {
		forms(filters: $filters, pagination: $pagination, sort: $sort) {
			documentId
			Name
			createdAt
			updatedAt
		}
	}
`

export const GET_CONTACT_BY_DOCUMENT_ID = `
	query GetContactByDocumentId($documentId: ID!) {
		contact(documentId: $documentId) {
			documentId
			position
			Headline
			Name
			Street
			ZipCity
			Phone
			Email1
			Email2
			Introduction
			avatar {
				url
				alternativeText
				width
				height
				caption
				previewUrl
			}
			member {
				documentId
				firstName
				lastName
			}
		}
	}
`

export const COUNT_FORM_INSTANCES = `
	query CountFormInstances($filters: FormInstanceFiltersInput) {
		formInstances(filters: $filters) {
			documentId
			Content
			createdAt
			updatedAt
		}
	}
`

export const CREATE_FORM_INSTANCE = `
	mutation CreateFormInstance($data: FormInstanceInput!) {
		createFormInstance(data: $data) {
				documentId
				form {
					documentId
				}
				Content
				createdAt
				updatedAt
		}
	}
`

export const REGISTER_USER = `
	mutation RegisterUser($input: UsersPermissionsRegisterInput!) {
		register(input: $input) {
			jwt
			user {
				id
				username
				email
			}
		}
	}
`

export const GET_NEWS_ARTICLES = `
	query GetNewsArticles($filters: NewsArticleFiltersInput, $pagination: PaginationArg, $sort: [String]) {
		newsArticles(filters: $filters, pagination: $pagination, sort: $sort) {
			documentId
			Headline
			SubHeadline
			TeaserText
			Slug
			publishedAt
			Image {
				url
				alternativeText
				width
				height
				caption
				previewUrl
			}
			category {
				CategoryName
			}
		}
	}
`

export const GET_NEWS_ARTICLES_COUNT = `
	query GetNewsArticlesCount($filters: NewsArticleFiltersInput, $pagination: PaginationArg) {
		newsArticles(filters: $filters, pagination: $pagination) {
			documentId
		}
	}
`

export const GET_NEWS_ARTICLE_BY_SLUG = `
	query GetNewsArticleBySlug($slug: String!) {
		newsArticles(filters: { Slug: { eq: $slug } }, pagination: { pageSize: 1 }) {
			documentId
			Headline
			SubHeadline
			TeaserText
			Slug
			Author
			DateOfPublication
			publishedAt
			Image {
				url
				alternativeText
				width
				height
				caption
				previewUrl
			}
			SEO {
				MetaDescription
			}
			category {
				documentId
				CategoryName
			}
			NewsContentSections {
				__typename
				... on ComponentBlocksRichTextSection {
					RichTextContent
					RichTextOddEven
					RichTextAnchor
				}
				... on ComponentBlocksCardSection {
					CardHeadline
					CardColumnsOddEven
					CardLayout
					CardItem {
						id
						Headline
						Subheadline
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
				... on ComponentBlocksContactGroupSection {
					ContactGroup {
						documentId
						ContactGroupName
						GroupDescription
						contacts(sort: ["position:asc"]) {
							documentId
							position
							Headline
							Name
							Street
							ZipCity
							Phone
							Email1
							Email2
							Introduction
							avatar {
								url
								alternativeText
								width
								height
								caption
								previewUrl
							}
							member {
								documentId
								firstName
								lastName
							}
						}
					}
				}
			}
		}
	}
`

export const FORGOT_PASSWORD = `
	mutation ForgotPassword($email: String!) {
		forgotPassword(email: $email) {
			ok
		}
	}
`

export const RESET_PASSWORD = `
	mutation ResetPassword($input: UsersPermissionsLoginInput!) {
		resetPassword(input: $input) {
			jwt
			user {
				id
				username
				email
			}
		}
	}
`

export const GET_NEWS_ARTICLE_CATEGORY_BY_SLUG = `
	query GetNewsArticleCategoryBySlug($slug: String!) {
		newsArticleCategories(filters: { Slug: { eq: $slug } }, pagination: { pageSize: 1 }) {
			documentId
			CategoryName
			Slug
			CategoryTeaserText
			FeatureTitle
			CategoryDescription
			CategoryImage {
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

export const GET_NEWS_ARTICLES_BY_CATEGORY = `
	query GetNewsArticlesByCategory($categoryId: ID!, $pagination: PaginationArg, $featuredFilter: Boolean) {
		newsArticleCategories(filters: { documentId: { eq: $categoryId } }, pagination: { pageSize: 1 }) {
			documentId
			news_articles(
				filters: { FeaturedArticle: { eq: $featuredFilter } }
				pagination: $pagination
				sort: ["publishedAt:desc"]
			) {
				documentId
				Headline
				SubHeadline
				TeaserText
				Slug
				publishedAt
				FeaturedArticle
				Image {
					url
					alternativeText
					width
					height
					caption
					previewUrl
				}
			}
		}
	}
`

export const GET_SITEMAP_DATA = `
	query GetSitemapData {
		indexPage {
			updatedAt
		}
		pages(pagination: { limit: -1 }) {
			slug
			updatedAt
		}
		newsArticles(pagination: { limit: -1 }) {
			Slug
			updatedAt
		}
		newsArticleCategories(pagination: { limit: -1 }) {
			Slug
			updatedAt
		}
		hzdPluginDogs(sort: "updatedAt:desc", pagination: { limit: 1 }) {
			updatedAt
		}
		hzdPluginBreeders(sort: "updatedAt:desc", pagination: { limit: 1 }) {
			updatedAt
		}
		hzdPluginLitters(sort: "updatedAt:desc", pagination: { limit: 1 }) {
			updatedAt
		}
		calendarEntries(sort: "updatedAt:desc", pagination: { limit: 1 }) {
			updatedAt
		}
	}
`


export const GET_BREEDER_BY_USER = `
	query GetBreederByUser($userId: ID!) {
		hzdPluginBreeders_connection(filters: { member: { documentId: { eq: $userId } } }) {
			nodes {
				documentId
				kennelName
				breedingLicenseSince
				IsActive
				Disable
				WebsiteUrl
				WebsiteUrlDraft
				BreedersIntroduction
				BreedersIntroDraft
				isDirty
				InternalNotes
				member {
					documentId
					firstName
					lastName
					address1
					zip
					city
				}
				avatar {
					url
					alternativeText
					width
					height
				}
				Address {
					id
					FullName
					Address1
					Address2
					CountryCode
					Zip
					City
				}
			}
		}
	}
`

export const GET_LITTERS_BY_BREEDER = `
	query GetLittersByBreeder($breederId: ID!) {
		hzdPluginLitters_connection(filters: { breeder: { documentId: { eq: $breederId } } }, sort: "dateOfBirth:desc") {
			nodes {
				documentId
				OrderLetter
				dateOfManting
				dateOfBirth
				expectedDateOfBirth
				LitterStatus
				StatusMessageDraft
				StatusMessageDirtyFlag
				AmountRS { id Total Available }
				AmountRSM { id Total Available }
				AmountRB { id Total Available }
				AmountHS { id Total Available }
				AmountHSM { id Total Available }
				AmountHB { id Total Available }
				breeder {
					documentId
				}
				mother {
					fullKennelName
				}
				stuntDog {
					fullKennelName
				}
			}
		}
	}
`


