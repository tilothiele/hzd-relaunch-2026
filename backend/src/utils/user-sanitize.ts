export function sanitizeUser(user: any): any {
	if (user == null) {
		return user
	}

	let publish = user.forcePublishMyData;
	if (publish === undefined || publish === null) {
		publish = user.publishMyData;
	}

	if (publish === true) {
		return user
	}

	return {
		id: user.id,
		documentId: user.documentId ?? null,
		username: `user-${user.id}`,
		email: `user-${user.id}@hovawarte.com`,
	}
}

export function sanitizeUsers(users: any): any {
	if (!users) {
		return users
	}

	if (Array.isArray(users)) {
		return users.map(sanitizeUser)
	}

	if (Array.isArray(users.nodes)) {
		users.nodes = users.nodes.map(sanitizeUser)
	}

	return users
}
