export default {
	typeDefs: `
		extend type Mutation {
			updateUserAdmin(
				id: ID!
				data: UsersPermissionsUserInput!
			): UsersPermissionsUserEntityResponse!
		}
	`,
	resolvers: {
		Mutation: {
			updateUserAdmin: async (parent: any, args: any, context: any) => {
				const { id, data } = args
				const { koaContext } = context
				const strapiInstance = context.strapi || (global as any).strapi

				strapiInstance.log.info('[GraphQL Extension] updateUserAdmin called', { id, hasData: !!data })

				// Get auth from koaContext
				const { user, auth } = koaContext.state;
				const isApiToken = auth?.strategy?.name === 'api-token';
				const isSuperAdmin = user?.isSuperAdmin === true;

				strapiInstance.log.info('[GraphQL Extension] Auth check', {
					hasUser: !!user,
					username: user?.username,
					isSuperAdmin,
					isApiToken,
					strategy: auth?.strategy?.name
				})

				if (!isApiToken && !isSuperAdmin) {
					strapiInstance.log.warn('[GraphQL Extension] Unauthorized user update attempt', {
						userId: user?.id,
						username: user?.username,
						isApiToken,
					})
					throw new Error('Forbidden: Only super admins or API tokens can update users')
				}

				try {
					strapiInstance.log.info('[GraphQL Extension] Super admin updating user', {
						adminId: user?.id,
						targetUserId: id,
					})

					// Update user using document service
					const updatedUser = await (strapiInstance as any)
						.documents('plugin::users-permissions.user')
						.update({
							documentId: id,
							data,
						})

					strapiInstance.log.info('[GraphQL Extension] User updated successfully', {
						userId: id,
					})

					return {
						data: updatedUser,
					}
				} catch (error: any) {
					strapiInstance.log.error('[GraphQL Extension] Error updating user:', error)
					throw new Error(`Failed to update user: ${error.message}`)
				}
			},
		},
	},
	resolversConfig: {
		'Mutation.updateUserAdmin': {
			auth: false, // We handle auth manually
		},
	},
}


