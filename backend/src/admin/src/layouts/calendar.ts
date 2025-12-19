import type { ContentManagerLayout } from '@strapi/content-manager';

const calendarLayout: ContentManagerLayout = {
  listView: {
    settings: {
      searchable: true,
      filters: true,
      bulkable: true,
    },
    columns: [
      { name: 'Name' },
      { name: 'createdAt' },
//      { name: 'updatedAt' },
    ],
  },

  editView: {
    layout: [
      [
        { name: 'Name', size: 9 },
        { name: 'ColorSchema', size: 3 },
      ],
    ],
  },
};

export default calendarLayout;
