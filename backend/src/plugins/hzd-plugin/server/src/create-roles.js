/**
 * Direktes Skript zum Anlegen der Rollen (JavaScript-Version für Console)
 * Führe aus: pnpm strapi console
 * Dann: Kopiere den Code unten direkt in die Console
 */

// Kopiere diesen Code direkt in die Strapi Console:

const rolesToCreate = [
  { name: 'Präsidium', type: 'praesidium', description: 'Präsidium' },
  { name: 'Deckrüdenstelle', type: 'deckruedenstelle', description: 'Deckrüdenstelle' },
  { name: 'Ehrenrat', type: 'ehrenrat', description: 'Ehrenrat' },
  { name: 'Finanzverwaltung', type: 'finanzverwaltung', description: 'Finanzverwaltung' },
  { name: 'Geschäftsstelle', type: 'geschaeftsstelle', description: 'Geschäftsstelle' },
  { name: 'HD-Stelle', type: 'hd-stelle', description: 'HD-Stelle' },
  { name: 'Ehrenmitglied', type: 'ehrenmitglied', description: 'Ehrenmitglied' },
  { name: 'Koordinator Zuchtwarte', type: 'koordinator-zuchtwarte', description: 'Koordinator Zuchtwarte' },
  { name: 'Koordinator Körmeister', type: 'koordinator-koermeister', description: 'Koordinator Körmeister' },
  { name: 'Körmeister', type: 'koermeister', description: 'Körmeister' },
  { name: 'Körmeisteranwärter', type: 'koermeisteranwaerter', description: 'Körmeisteranwärter' },
  { name: 'IT', type: 'it', description: 'IT' },
  { name: 'Leiter', type: 'leiter', description: 'Leiter' },
  { name: 'Stellvertretender Leiter', type: 'stellvertretender-leiter', description: 'Stellvertretender Leiter' },
  { name: 'Tierschutzbeauftragter', type: 'tierschutzbeauftragter', description: 'Tierschutzbeauftragter' },
  { name: 'TIK', type: 'tik', description: 'TIK' },
  { name: 'Zuchtbuchstelle', type: 'zuchtbuchstelle', description: 'Zuchtbuchstelle' },
  { name: 'Zuchtrichter', type: 'zuchtrichter', description: 'Zuchtrichter' },
  { name: 'Zuchtrichteranwärter', type: 'zuchtrichteranwaerter', description: 'Zuchtrichteranwärter' },
  { name: 'Zuchtrichterobmann', type: 'zuchtrichterobmann', description: 'Zuchtrichterobmann' },
  { name: 'Zuchtwart', type: 'zuchtwart', description: 'Zuchtwart' },
  { name: 'Zuchtwartanwärter', type: 'zuchtwartanwaerter', description: 'Zuchtwartanwärter' },
];

async function createRoles() {
  console.log('[HZD Plugin] Setting up roles...');
  let created = 0;
  let existingCount = 0;
  let errors = 0;

  for (const roleDef of rolesToCreate) {
    try {
      const existingRole = await strapi
        .query('plugin::users-permissions.role')
        .findOne({
          where: { type: roleDef.type },
        });

      if (existingRole) {
        console.log(`- Role already exists: ${roleDef.name} (${roleDef.type})`);
        existingCount++;
      } else {
        const roleData = {
          name: roleDef.name,
          type: roleDef.type,
          description: roleDef.description || '',
        };

        const createdRole = await strapi
          .query('plugin::users-permissions.role')
          .create({
            data: roleData,
          });

        console.log(`✓ Created role: ${roleDef.name} (${roleDef.type}, ID: ${createdRole.id})`);
        created++;
      }
    } catch (error) {
      console.error(`✗ Error creating role ${roleDef.name}:`, error.message);
      errors++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Created: ${created}`);
  console.log(`   Existing: ${existingCount}`);
  console.log(`   Errors: ${errors}`);
}

// Führe aus: await createRoles();

module.exports = { createRoles };

