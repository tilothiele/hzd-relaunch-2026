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
    'Pruefung: Jeder User, der als Breeder.owner_members referenziert ist, muss publishMyData=true haben.',
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
    const breeders = await strapi.db.query('plugin::hzd-plugin.breeder').findMany({
      populate: {
        owner_members: {
          select: ['id', 'documentId', 'firstName', 'lastName', 'email', 'publishMyData'],
        },
      },
      select: ['id', 'documentId', 'kennelName'],
      orderBy: { kennelName: 'asc' },
    });

    const findingsByUserId = new Map<string, { user: any; kennelNames: string[] }>();

    for (const breeder of breeders) {
      const kennelName = breeder.kennelName || breeder.documentId || `Breeder ${breeder.id}`;

      for (const user of breeder.owner_members ?? []) {
        if (user.publishMyData === true) {
          continue;
        }

        const userKey = String(user.id ?? user.documentId);
        const existing = findingsByUserId.get(userKey);

        if (existing) {
          existing.kennelNames.push(kennelName);
          continue;
        }

        findingsByUserId.set(userKey, {
          user,
          kennelNames: [kennelName],
        });
      }
    }

    const findings = [...findingsByUserId.values()].sort((left, right) =>
      createUserLabel(left.user).localeCompare(createUserLabel(right.user), 'de'),
    );
    const findingCount = findings.length;
    const lines = createUserReportHeader();

    findings.forEach((finding, index) => {
      const kennelNames = finding.kennelNames.filter(Boolean).join(', ');
      lines.push(
        [
          `WARNUNG ${index + 1}:`,
          `User "${createUserLabel(finding.user)}"`,
          `ist Owner-Member von "${kennelNames}",`,
          'hat aber publishMyData nicht aktiviert.',
        ].join(' '),
      );
    });

    if (findingCount === 0) {
      lines.push('Keine Auffaelligkeiten gefunden.');
    } else {
      lines.push('', `Summe Auffaelligkeiten: ${findingCount}`);
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
