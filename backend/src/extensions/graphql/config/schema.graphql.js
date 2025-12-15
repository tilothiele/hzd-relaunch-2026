module.exports = {
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
			updateUserAdmin: async (parent, args, context) => {
				const { id, data } = args
				const { strapi, koaContext } = context

				strapi.log.info('[GraphQL Extension] updateUserAdmin called', { id, hasData: !!data })

				// Check if user is authenticated
				if (!koaContext.state.user) {
					strapi.log.warn('[GraphQL Extension] Unauthorized: No user in context')
					throw new Error('Unauthorized: Authentication required')
				}

				// Check if user is super admin
				const user = koaContext.state.user
				const isSuperAdmin = user.isSuperAdmin === true

				strapi.log.info('[GraphQL Extension] User check', {
					userId: user.id,
					username: user.username,
					isSuperAdmin,
				})

				if (!isSuperAdmin) {
					strapi.log.warn('[GraphQL Extension] Unauthorized user update attempt', {
						userId: user.id,
						username: user.username,
					})
					throw new Error('Forbidden: Only super admins can update users')
				}

				try {
					strapi.log.info('[GraphQL Extension] Super admin updating user', {
						adminId: user.id,
						targetUserId: id,
					})

					// Update user using document service
					const updatedUser = await strapi
						.documents('plugin::users-permissions.user')
						.update({
							documentId: id,
							data,
						})

					strapi.log.info('[GraphQL Extension] User updated successfully', {
						userId: id,
					})

					return {
						data: updatedUser,
					}
				} catch (error) {
					strapi.log.error('[GraphQL Extension] Error updating user:', error)
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

