module.exports = {
    async up(knex) {
        // Check if the table exists to avoid errors on fresh installs
        const hasTable = await knex.schema.hasTable('components_blocks_simple_cta_sections');
        if (!hasTable) return;

        console.log('Migration: Fix cta_info_text - Overwriting all values with empty JSON array...');

        // User requested to overwrite all values to ensure the column can be safely converted to JSONB.
        // This removes any potential "invalid input syntax" errors by standardizing all data.
        await knex.raw(`
      UPDATE "components_blocks_simple_cta_sections"
      SET "cta_info_text" = '[]';
    `);

        console.log('Migration: cleanup complete.');
    },
};
