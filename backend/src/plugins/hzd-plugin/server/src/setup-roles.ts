import type { Core } from '@strapi/strapi';

interface RoleDefinition {
  name: string;
  type: string;
  description?: string;
}

/**
 * Legt programmatisch Roles für das users-permissions Plugin an
 */
export const setupRoles = async (strapi: Core.Strapi) => {
  console.log('[HZD Plugin] Setting up roles...');

  // Definiere die Roles, die angelegt werden sollen
  const rolesToCreate: RoleDefinition[] = [
    {
      name: 'Präsidium',
      type: 'praesidium',
      description: 'Präsidium',
    },
    {
      name: 'Deckrüdenstelle',
      type: 'deckruedenstelle',
      description: 'Deckrüdenstelle',
    },
    {
      name: 'Ehrenrat',
      type: 'ehrenrat',
      description: 'Ehrenrat',
    },
    {
      name: 'Finanzverwaltung',
      type: 'finanzverwaltung',
      description: 'Finanzverwaltung',
    },
    {
      name: 'Geschäftsstelle',
      type: 'geschaeftsstelle',
      description: 'Geschäftsstelle',
    },
    {
      name: 'HD-Stelle',
      type: 'hd-stelle',
      description: 'HD-Stelle',
    },
    {
      name: 'Ehrenmitglied',
      type: 'ehrenmitglied',
      description: 'Ehrenmitglied',
    },
    {
      name: 'Koordinator Zuchtwarte',
      type: 'koordinator-zuchtwarte',
      description: 'Koordinator Zuchtwarte',
    },
    {
      name: 'Koordinator Körmeister',
      type: 'koordinator-koermeister',
      description: 'Koordinator Körmeister',
    },
    {
      name: 'Körmeister',
      type: 'koermeister',
      description: 'Körmeister',
    },
    {
      name: 'Körmeisteranwärter',
      type: 'koermeisteranwaerter',
      description: 'Körmeisteranwärter',
    },
    {
      name: 'IT',
      type: 'it',
      description: 'IT',
    },
    {
      name: 'Leiter',
      type: 'leiter',
      description: 'Leiter',
    },
    {
      name: 'Stellvertretender Leiter',
      type: 'stellvertretender-leiter',
      description: 'Stellvertretender Leiter',
    },
    {
      name: 'Tierschutzbeauftragter',
      type: 'tierschutzbeauftragter',
      description: 'Tierschutzbeauftragter',
    },
    {
      name: 'TIK',
      type: 'tik',
      description: 'TIK',
    },
    {
      name: 'Zuchtbuchstelle',
      type: 'zuchtbuchstelle',
      description: 'Zuchtbuchstelle',
    },
    {
      name: 'Zuchtrichter',
      type: 'zuchtrichter',
      description: 'Zuchtrichter',
    },
    {
      name: 'Zuchtrichteranwärter',
      type: 'zuchtrichteranwaerter',
      description: 'Zuchtrichteranwärter',
    },
    {
      name: 'Zuchtrichterobmann',
      type: 'zuchtrichterobmann',
      description: 'Zuchtrichterobmann',
    },
    {
      name: 'Zuchtwart',
      type: 'zuchtwart',
      description: 'Zuchtwart',
    },
    {
      name: 'Zuchtwartanwärter',
      type: 'zuchtwartanwaerter',
      description: 'Zuchtwartanwärter',
    },
  ];

  let created = 0;
  let existingCount = 0;
  let errors = 0;

  for (const roleDef of rolesToCreate) {
    try {
      // Prüfe, ob Role bereits existiert
      const existingRole = await strapi
        .query('plugin::users-permissions.role')
        .findOne({
          where: { type: roleDef.type },
        });

      if (existingRole) {
        console.log(`[HZD Plugin] - Role already exists: ${roleDef.name} (${roleDef.type})`);
        existingCount++;
      } else {
        // Erstelle neue Role
        const roleData: any = {
          name: roleDef.name,
          type: roleDef.type,
          description: roleDef.description || '',
        };

        try {
          const createdRole = await strapi
            .query('plugin::users-permissions.role')
            .create({
              data: roleData,
            });

          console.log(`[HZD Plugin] ✓ Created role: ${roleDef.name} (${roleDef.type}, ID: ${createdRole.id})`);
          created++;
        } catch (createError: any) {
          // Falls Fehler beim Erstellen, versuche es mit Entity Service
          try {
            const createdRole = await strapi.entityService.create(
              'plugin::users-permissions.role',
              {
                data: roleData,
              }
            );
            console.log(`[HZD Plugin] ✓ Created role (via entityService): ${roleDef.name} (${roleDef.type}, ID: ${createdRole.id})`);
            created++;
          } catch (entityError) {
            console.error(`[HZD Plugin] ✗ Error creating role ${roleDef.name}:`, createError.message || entityError);
            errors++;
          }
        }
      }
    } catch (error) {
      console.error(`[HZD Plugin] ✗ Error creating role ${roleDef.name}:`, error);
      errors++;
    }
  }

  console.log(`[HZD Plugin] Role setup completed:`);
  console.log(`   Created: ${created}`);
  console.log(`   Existing: ${existingCount}`);
  console.log(`   Errors: ${errors}`);
};

