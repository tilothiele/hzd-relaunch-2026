export default {
    async beforeCreate(event) {
        const { data } = event.params;
        
        data.DisplayName = buildDisplayName(data.AcademicTitle, data.FirstName, data.LastName);
    },

    async beforeUpdate(event) {
        const { data, where } = event.params;

        const isAcademicTitleChanging = data.AcademicTitle !== undefined;
        const isFirstNameChanging = data.FirstName !== undefined;
        const isLastNameChanging = data.LastName !== undefined;

        if (isAcademicTitleChanging || isFirstNameChanging || isLastNameChanging) {
            let academicTitleToUse = data.AcademicTitle;
            let firstNameToUse = data.FirstName;
            let lastNameToUse = data.LastName;

            if (academicTitleToUse === undefined || firstNameToUse === undefined || lastNameToUse === undefined) {
                // @ts-ignore
                const entity = await strapi.entityService.findOne('api::author.author', where.id);
                if (entity) {
                    if (academicTitleToUse === undefined) academicTitleToUse = entity.AcademicTitle;
                    if (firstNameToUse === undefined) firstNameToUse = entity.FirstName;
                    if (lastNameToUse === undefined) lastNameToUse = entity.LastName;
                }
            }

            data.DisplayName = buildDisplayName(academicTitleToUse, firstNameToUse, lastNameToUse);
        }
    }
};

function buildDisplayName(academicTitle?: string | null, firstName?: string | null, lastName?: string | null): string {
    return [academicTitle, firstName, lastName]
        .filter(part => part && part.toString().trim() !== '')
        .join(' ');
}
