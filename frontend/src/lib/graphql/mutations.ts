export const UPDATE_BREEDER = `
	mutation UpdateBreeder($documentId: ID!, $data: HzdPluginBreederInput!) {
		updateHzdPluginBreeder(documentId: $documentId, data: $data) {
			documentId
			WebsiteUrl
			WebsiteUrlDraft
			BreedersIntroduction
			BreedersIntroDraft
			BreederEmail
			owner_member {
				documentId
				firstName
				lastName
				email
				username
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
`

export const UPDATE_LITTER = `
	mutation UpdateLitter($documentId: ID!, $data: HzdPluginLitterInput!) {
		updateHzdPluginLitter(documentId: $documentId, data: $data) {
			documentId
			LitterStatus
			StatusMessageDraft
			OrderLetter
			plannedDateOfBirth
			expectedDateOfBirth
			dateOfBirth
			mother { documentId fullKennelName }
			stuntDog { documentId fullKennelName }
			AmountRS { Total Available }
			AmountRSM { Total Available }
			AmountRB { Total Available }
			AmountHS { Total Available }
			AmountHSM { Total Available }
			AmountHB { Total Available }
		}
	}
`

export const CREATE_LITTER = `
	mutation CreateLitter($data: HzdPluginLitterInput!) {
		createHzdPluginLitter(data: $data) {
			documentId
			LitterStatus
			StatusMessageDraft
			OrderLetter
			plannedDateOfBirth
			expectedDateOfBirth
			dateOfBirth
			mother { documentId fullKennelName }
			stuntDog { documentId fullKennelName }
			AmountRS { Total Available }
			AmountRSM { Total Available }
			AmountRB { Total Available }
			AmountHS { Total Available }
			AmountHSM { Total Available }
			AmountHB { Total Available }
		}
	}
`

export const UPDATE_USER = `
	mutation UpdateUser($id: ID!, $data: UsersPermissionsUserInput!) {
		updateUsersPermissionsUser(id: $id, data: $data) {
			data {
				documentId
				username
				email
				firstName
				lastName
				address1
				address2
				zip
				city
				phone
				title
				countryCode
			}
		}
	}
`

export const CHANGE_PASSWORD = `
	mutation ChangePassword($currentPassword: String!, $password: String!, $passwordConfirmation: String!) {
	changePassword(currentPassword: $currentPassword, password: $password, passwordConfirmation: $passwordConfirmation) {
		jwt
			user {
			id
			username
		}
	}
}
`

export const CREATE_SUBSCRIPTION = `
	mutation CreateSubscription($data: SubscriptionInput!) {
		createSubscription(data: $data) {
			documentId
			endpoint
			p256dh
			auth
			channels
		}
	}
`

export const DELETE_SUBSCRIPTION = `
	mutation DeleteSubscription($documentId: ID!) {
		deleteSubscription(documentId: $documentId) {
			documentId
		}
	}
`

export const UPDATE_SUBSCRIPTION = `
	mutation UpdateSubscription($documentId: ID!, $data: SubscriptionInput!) {
		updateSubscription(documentId: $documentId, data: $data) {
			documentId
			endpoint
			channels
		}
	}
`
