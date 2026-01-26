export const UPDATE_BREEDER = `
	mutation UpdateBreeder($documentId: ID!, $data: HzdPluginBreederInput!) {
		updateHzdPluginBreeder(documentId: $documentId, data: $data) {
			documentId
			WebsiteUrl
			WebsiteUrlDraft
			BreedersIntroduction
			BreedersIntroDraft
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
			AmountRS { Total Available }
			AmountRSM { Total Available }
			AmountRB { Total Available }
			AmountHS { Total Available }
			AmountHSM { Total Available }
			AmountHB { Total Available }
		}
	}
`
