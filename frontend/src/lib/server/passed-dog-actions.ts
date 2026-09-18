'use server'

import {
	fetchApprovedPassedDogsPage,
	type PassedDogCardData,
	type PassedDogsPageResult,
} from './passed-dog-utils'
import {
	createPassedDogFromForm,
	fetchPendingPassedDogsForSession,
	updatePassedDogFromForm,
	type PassedDogMutationResult,
} from './passed-dog-submit'

export async function getMoreApprovedPassedDogs(
	page: number,
	pageSize: number,
): Promise<PassedDogsPageResult> {
	return fetchApprovedPassedDogsPage(page, pageSize)
}

export async function submitPassedDog(
	formData: FormData,
): Promise<PassedDogMutationResult> {
	return createPassedDogFromForm(formData)
}

export async function submitPassedDogUpdate(
	documentId: string,
	formData: FormData,
): Promise<PassedDogMutationResult> {
	return updatePassedDogFromForm(documentId, formData)
}

export async function getMyPendingPassedDogs(): Promise<PassedDogCardData[]> {
	return fetchPendingPassedDogsForSession()
}
