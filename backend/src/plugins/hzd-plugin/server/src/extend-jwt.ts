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
    jwtService.issue = function(payload: any, jwtOptions: any = {}) {
      strapi.log.info('[HZD Plugin] JWT issue called #3', { hasId: !!payload?.id, payloadKeys: Object.keys(payload || {}) });

      // Wenn payload bereits member enthält, verwende es direkt
      if (payload.member) {
        strapi.log.info('[HZD Plugin] Payload already has member, using original issue');
        const result = originalIssue(payload, jwtOptions);
        strapi.log.info('[HZD Plugin] Original issue result  #2', {
          isPromise: result instanceof Promise,
          type: typeof result,
          hasValue: !!result
        });

        strapi.log.info('[HZD Plugin] Original issue result -> ', result);
        return result;
      }

      // Prüfe, ob die originale Methode ein Promise zurückgibt (refresh mode)
      const originalResult = originalIssue(payload, jwtOptions);

      strapi.log.info('[HZD Plugin] Original issue result => ', originalResult);
      strapi.log.info('[HZD Plugin] Original issue result type', {
        isPromise: originalResult instanceof Promise,
        type: typeof originalResult,
        hasValue: !!originalResult,
        isObject: typeof originalResult === 'object' && originalResult !== null
      });

      if (originalResult instanceof Promise) {
        // Asynchroner Modus (refresh mode)
        return originalResult.then(async (token: string) => {
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

            if (!user || !user.member) {
              strapi.log.info('[HZD Plugin] User or member not found, returning original token');
              return token;
            }

            // Erweitere Payload mit Member-Daten und generiere neues Token
            const extendedPayload = {
              ...payload,
              member: {
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
              },
            };

            // Generiere neues Token mit erweitertem Payload
            const extendedToken = await originalIssue.call(this, extendedPayload, jwtOptions);
            strapi.log.info('[HZD Plugin] Extended JWT token generated', {
              hasToken: !!extendedToken,
              tokenType: typeof extendedToken
            });
            return extendedToken;
          } catch (error) {
            strapi.log.error('[HZD Plugin] Error extending JWT token:', error);
            // Fallback: Verwende originales Token
            return token;
          }
        });
      } else {
        // Synchroner Modus (legacy mode)
        // Lade User synchron nicht möglich, daher erweitern wir nur, wenn wir können
        // Für jetzt verwenden wir die originale Methode
        strapi.log.warn('[HZD Plugin] Synchron JWT issue detected, member extension skipped', originalResult);
        return originalResult;
      }
    };

    console.log('[HZD Plugin] ✓ JWT Service extended with member and officer_roles');
  } catch (error) {
    console.error('[HZD Plugin] ✗ Error extending JWT Service:', error);
  }
};

