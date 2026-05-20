module.exports = {
	async up(knex) {
		const hasTable = await knex.schema.hasTable('breeders');
		if (!hasTable) return;

		await knex('breeders')
			.whereNull('BreederRole')
			.update({
				BreederRole: 'B',
			});
	},
};
