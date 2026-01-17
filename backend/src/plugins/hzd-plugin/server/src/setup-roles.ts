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
      name: 'Züchter',
      type: 'zuechter',
      description: 'Züchter',
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

