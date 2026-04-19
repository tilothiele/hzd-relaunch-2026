export const GET_MY_ALIVE_DOGS = `
	query MyAliveDogs($ownerId: ID!) {
		hzdPluginDogs(
			filters: {
				owner: { documentId: { eq: $ownerId } }
				dateOfDeath: { null: true }
			}
			pagination: { pageSize: 500 }
			sort: ["fullKennelName:asc"]
		) {
			documentId
			fullKennelName
		}
	}
`

export const GET_MY_PENDING_PASSED_DOGS = `
	query MyPendingPassedDogs($userId: ID!) {
		passedDogs(
			filters: {
				users_permissions_user: { documentId: { eq: $userId } }
				not: { Approved: { eq: true } }
			}
			pagination: { pageSize: 100 }
			sort: ["updatedAt:desc"]
		) {
			documentId
			DogName
			DatePassed
			Message
			Approved
			Consent
			Avatar {
				url
				alternativeText
				width
				height
			}
			hzd_plugin_dog {
				documentId
				fullKennelName
			}
		}
	}
`

export const PASSED_DOGS_APPROVED_PAGE = `
	query PassedDogsApprovedPage($pagination: PaginationArg!) {
		passedDogs_connection(
			filters: {
				Approved: { eq: true }
				Consent: { eq: true }
			}
			pagination: $pagination
			sort: ["DatePassed:desc", "publishedAt:desc"]
		) {
			nodes {
				documentId
				DogName
				DatePassed
				Message
				Approved
				Consent
				Avatar {
					url
					alternativeText
					width
					height
				}
				hzd_plugin_dog {
					documentId
					fullKennelName
				}
			}
			pageInfo {
				page
				pageSize
				pageCount
				total
			}
		}
	}
`
