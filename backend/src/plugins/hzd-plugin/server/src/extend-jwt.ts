import type { Core } from '@strapi/strapi';

/**
 * Erweitert den JWT-Service von users-permissions,
 * um member und officer_roles im Token zu inkludieren
 */
export const extendJWT = async (strapi: Core.Strapi) => {
  // Warte kurz, damit users-permissions Plugin vollständig geladen ist
  await new Promise((resolve) => setTimeout(resolve, 500));

  try {
    const jwtService = strapi.plugin('users-permissions')?.service('jwt');
    
    if (!jwtService) {
      console.warn('[HZD Plugin] JWT Service not found, skipping JWT extension');
      return;
    }

    // Speichere die originale issue-Methode
    const originalIssue = jwtService.issue.bind(jwtService);

    // Erweitere die issue-Methode
    jwtService.issue = async (payload: any) => {
      // Wenn payload bereits member enthält, verwende es direkt
      if (payload.member) {
        return originalIssue(payload);
      }

      // Lade User mit Member und Officer Roles
      try {
        const user = await strapi
          .query('plugin::users-permissions.user')
          .findOne({
            where: { id: payload.id },
            populate: {
              member: {
                populate: {
                  officer_roles: true,
                },
              },
            },
          });

        // Erweitere Payload mit Member-Daten
        const extendedPayload = {
          ...payload,
          member: user?.member
            ? {
                id: user.member.id,
                fullName: user.member.fullName,
                membershipNo: user.member.membershipNo,
                memberSince: user.member.memberSince,
                region: user.member.region,
                officer_roles: user.member.officer_roles
                  ? user.member.officer_roles.map((role: any) => ({
                      id: role.id,
                      Name: role.Name,
                      RegionalUnit: role.RegionalUnit,
                    }))
                  : [],
              }
            : null,
        };

        return originalIssue(extendedPayload);
      } catch (error) {
        console.error('[HZD Plugin] Error extending JWT token:', error);
        // Fallback: Verwende originalen Payload bei Fehler
        return originalIssue(payload);
      }
    };

    console.log('[HZD Plugin] ✓ JWT Service extended with member and officer_roles');
  } catch (error) {
    console.error('[HZD Plugin] ✗ Error extending JWT Service:', error);
  }
};

