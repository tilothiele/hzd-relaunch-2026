# Nur Distanzabfrage
GET /api/dogs?lat=52.5200&lng=13.4050&maxDistance=100

# Distanz + Filter
GET /api/dogs?lat=52.5200&lng=13.4050&maxDistance=50&filters[sex][$eq]=M&filters[color][$eq]=S

# Distanz + Filter + Sortierung + Pagination
GET /api/dogs?lat=52.5200&lng=13.4050&maxDistance=100&filters[Genprofil][$eq]=true&sort=dateOfBirth:desc&pagination[page]=1&pagination[pageSize]=10