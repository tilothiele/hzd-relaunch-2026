export default [
  {
    method: 'GET',
    path: '/zuchtleitung/breeders',
    handler: 'zuchtleitung.breeders',
    config: {
      // Prüfung im Controller: eingeloggt und Mitglied der Gruppe "zuchtleitung".
      auth: false,
    },
  },
  {
    method: 'PUT',
    path: '/zuchtleitung/breeders/:id/disable',
    handler: 'zuchtleitung.toggleDisable',
    config: {
      // Prüfung im Controller: eingeloggt und Mitglied der Gruppe "zuchtleitung".
      auth: false,
    },
  },
];
