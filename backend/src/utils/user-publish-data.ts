export async function calcPublishMyData(userData: any, userId?: number | string): Promise<boolean> {
    let cFlagBreeder = userData.cFlagBreeder;
    
    if (cFlagBreeder === undefined && userId) {
        const user = await strapi.db.query('plugin::users-permissions.user').findOne({ where: { id: userId } });
        cFlagBreeder = user?.cFlagBreeder;
    }

    let hasDog = false;
    if (userId) {
        const dogCount = await strapi.db.query('plugin::hzd-plugin.dog').count({ where: { owner: userId, cFertile: true } });
        hasDog = dogCount > 0;
    }

    return !!cFlagBreeder || hasDog;
}

export async function syncUserPublishMyData(userId: number | string | undefined | null) {
    if (!userId) return;

    const user = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { id: userId },
        select: ['id', 'cFlagBreeder', 'publishMyData']
    });

    if (!user) return;

    const dogCount = await strapi.db.query('plugin::hzd-plugin.dog').count({
        where: { owner: userId, cFertile: true }
    });

    const shouldPublish = !!user.cFlagBreeder || dogCount > 0;

    if (user.publishMyData !== shouldPublish) {
        await strapi.db.query('plugin::users-permissions.user').update({
            where: { id: userId },
            data: { publishMyData: shouldPublish }
        });
    }
}
