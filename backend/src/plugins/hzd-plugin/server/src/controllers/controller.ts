import type { Core } from '@strapi/strapi';

function createUserLabel(user: any): string {
  const displayName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  return displayName || user.email || user.documentId || `User ${user.id}`;
}

function createUserReportHeader(): string[] {
  return [
    'Benutzer-Report',
    `Generiert am: ${new Date().toISOString()}`,
    '',
    'Pruefung: User mit publishMyData=true muessen mindestens einem Breeder als Owner-Member zugeordnet sein.',
    '',
  ];
}

function createBreederReportHeader(): string[] {
  return [
    'Breeder-Report',
    `Generiert am: ${new Date().toISOString()}`,
    '',
    'Pruefung: Aktive, nicht deaktivierte Breeder muessen mindestens ein Owner-Member haben.',
    '',
  ];
}

const controller = ({ strapi }: { strapi: Core.Strapi }): Record<string, any> => ({
  index(ctx: any) {
    ctx.body = strapi
      .plugin('hzd-plugin')
      // the name of the service file & the method.
      .service('service')
      .getWelcomeMessage();
  },

  async userReport(ctx: any) {
    const users = await strapi.db.query('plugin::users-permissions.user').findMany({
      where: {
        publishMyData: true,
      },
      populate: {
        breeders: {
          select: ['id', 'documentId', 'kennelName'],
        },
      },
      select: ['id', 'documentId', 'firstName', 'lastName', 'email', 'publishMyData', 'cFlagBreeder'],
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }, { email: 'asc' }],
    });

    const lines = createUserReportHeader();
    let findings = 0;

    for (const user of users) {
      if (user.cFlagBreeder) {
        continue;
      }
      const breeders = user.breeders ?? [];

      if (breeders.length > 0) {
        continue;
      }

      findings += 1;
      lines.push(
        [
          `WARNUNG ${findings}:`,
          `User "${createUserLabel(user)}"`,
          'hat publishMyData, ist aber keinem Breeder Objekt zugeordnet.',
        ].join(' '),
      );
    }

    if (findings === 0) {
      lines.push('Keine Auffaelligkeiten gefunden.');
    } else {
      lines.push('', `Summe Auffaelligkeiten: ${findings}`);
    }

    ctx.type = 'text/plain; charset=utf-8';
    ctx.set('Content-Disposition', 'inline; filename="benutzer-report.txt"');
    ctx.body = `${lines.join('\n')}\n`;
  },

  async breederReport(ctx: any) {
    const breeders = await strapi.db.query('plugin::hzd-plugin.breeder').findMany({
      where: {
        IsActive: true,
      },
      populate: {
        owner_members: {
          select: ['id'],
        },
      },
      select: ['id', 'documentId', 'kennelName', 'Disable'],
      orderBy: { kennelName: 'asc' },
    });

    const lines = createBreederReportHeader();
    let findings = 0;

    for (const breeder of breeders) {
      if (breeder.Disable) {
        continue;
      }
      const ownerMembers = breeder.owner_members ?? [];

      if (ownerMembers.length > 0) {
        continue;
      }

      findings += 1;
      lines.push(
        [
          `WARNUNG ${findings}:`,
          `Aktiver Breeder "${breeder.kennelName || breeder.documentId || breeder.id}"`,
          'hat keine Owner-Members.',
        ].join(' '),
      );
    }

    if (findings === 0) {
      lines.push('Keine Auffaelligkeiten gefunden.');
    } else {
      lines.push('', `Summe Auffaelligkeiten: ${findings}`);
    }

    ctx.type = 'text/plain; charset=utf-8';
    ctx.set('Content-Disposition', 'inline; filename="breeder-report.txt"');
    ctx.body = `${lines.join('\n')}\n`;
  },
});

export default controller;
