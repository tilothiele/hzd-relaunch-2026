# Strapi-Payloads: Insert und Update

Stand der Mapper in `StrapiPayloadMapper`.

- **ja**: das Feld wird immer gesetzt.
- **ja, wenn vorhanden**: das Feld geht nur mit, wenn der Quellwert nicht leer ist.

## User

Quelle: `toUserInsertInput`, `toUserUpdateInput`.

| Attribut | in insert? | in update? |
|---|---|---|
| username | ja | ja |
| email | ja | ja |
| provider | ja | ja |
| confirmed | ja | ja |
| blocked | ja | ja |
| role | ja | ja |
| cId | ja | ja |
| cEmail | ja, wenn vorhanden | ja, wenn vorhanden |
| cFlagAccess | ja, wenn vorhanden | ja, wenn vorhanden |
| title | ja, wenn vorhanden | ja, wenn vorhanden |
| firstName | ja, wenn vorhanden | ja, wenn vorhanden |
| lastName | ja, wenn vorhanden | ja, wenn vorhanden |
| address1 | ja, wenn vorhanden | ja, wenn vorhanden |
| zip | ja, wenn vorhanden | ja, wenn vorhanden |
| city | ja, wenn vorhanden | ja, wenn vorhanden |
| countryCode | ja, wenn vorhanden | ja, wenn vorhanden |
| phone | ja, wenn vorhanden | ja, wenn vorhanden |
| sex | ja, wenn vorhanden | ja, wenn vorhanden |
| cFlagBreeder | ja, wenn vorhanden | ja, wenn vorhanden |
| membershipNumber | ja, wenn vorhanden | ja, wenn vorhanden |
| dateOfBirth | ja, wenn vorhanden | ja, wenn vorhanden |
| dateOfDeath | ja, wenn vorhanden | ja, wenn vorhanden |
| memberSince | ja, wenn vorhanden | ja, wenn vorhanden |
| cancellationOn | ja, wenn vorhanden | ja, wenn vorhanden |
| region | ja, wenn vorhanden | ja, wenn vorhanden |
| publishMyData | ja | ja |
| password | ja | nein |

Zusätzlich gibt es zwei eigene User-Updates außerhalb dieser Payloads: nur `publishMyData` vor dem Züchter-Speichern, und nur `email` in `setEmail`.

## Dog

Quelle: `toDogInsertInput`, `toDogUpdateInput`.

| Attribut | in insert? | in update? |
|---|---|---|
| cId | ja | ja |
| givenName | ja, wenn vorhanden | ja, wenn vorhanden |
| fullKennelName | ja, wenn vorhanden | ja, wenn vorhanden |
| cBreederId | ja, wenn vorhanden | ja, wenn vorhanden |
| cOwnerId | ja, wenn vorhanden | ja, wenn vorhanden |
| microchipNo | ja, wenn vorhanden | ja, wenn vorhanden |
| sex | ja, wenn vorhanden | ja, wenn vorhanden |
| dateOfBirth | ja, wenn vorhanden | ja, wenn vorhanden |
| dateOfDeath | ja, wenn vorhanden | ja, wenn vorhanden |
| cFertile | ja, wenn vorhanden | ja, wenn vorhanden |
| HD | ja, wenn vorhanden | ja, wenn vorhanden |
| SOD1 | ja, wenn vorhanden | ja, wenn vorhanden |
| HeartCheck | ja, wenn vorhanden | ja, wenn vorhanden |
| EyesCheck | ja, wenn vorhanden | ja, wenn vorhanden |
| Genprofil | ja, wenn vorhanden | ja, wenn vorhanden |
| color | ja, wenn vorhanden | ja, wenn vorhanden |
| cStudBookNumber | ja, wenn vorhanden | ja, wenn vorhanden |
| cStudBookNumberFather | ja, wenn vorhanden | ja, wenn vorhanden |
| cStudBookNumberMother | ja, wenn vorhanden | ja, wenn vorhanden |
| Exhibitions | ja, wenn vorhanden | ja, wenn vorhanden |
| BreedSurvey | ja, wenn vorhanden | ja, wenn vorhanden |

## Breeder

Quelle: `toBreederInsertInput`, `toBreederUpdateInput`.

| Attribut | in insert? | in update? |
|---|---|---|
| cId | ja | ja |
| IsActive | ja, wenn vorhanden | ja, wenn vorhanden |
| BreederRole | ja (`B`) | nein |
| kennelName | ja, wenn vorhanden | ja, wenn vorhanden |
| member | ja, wenn documentId da | ja, wenn documentId da |
| owner_members | ja, wenn documentId da | ja, wenn documentId da |

`member` und `owner_members` setzt der Mitgliederimport, wenn die documentId des Users bekannt ist. Der Hundimport für Züchter mit Rolle `B` übergibt keine documentId, deshalb fehlen dort beide Relationen und auch `IsActive`.

## Deckrüdenbesitzer

Ein Deckrüdenbesitzer ist ein User, dem ein zuchtfähiger Rüde gehört (`cFertile` und Geschlecht `M`). Dafür legt der Hundimport einen Breeder an (`toStudBreederInput`), sofern für diese `cId` noch keiner existiert. Ein bestehender Breeder, zum Beispiel Rolle `B`, wird nicht überschrieben.

| Attribut | in insert? | in update? |
|---|---|---|
| cId | ja | — |
| IsActive | ja (`true`) | — |
| BreederRole | ja (`S`) | — |
| kennelName | ja, wenn vorhanden (`DRB ` + Name) | — |
| Address | ja, wenn vorhanden | — |
| member | ja, wenn documentId da | — |
| owner_members | ja, wenn documentId da | — |

`kennelName` entsteht aus Vor- und Nachname des Users, `Address` aus dessen Adressfeldern. `member` und `owner_members` zeigen auf denselben User. Ein Update dieses Payloads gibt es nicht.
