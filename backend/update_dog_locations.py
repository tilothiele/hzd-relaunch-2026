#!/usr/bin/env python3
"""
Update Dog Locations and Relations Script

Dieses Skript iteriert über alle Dogs und:
1. Sucht Member mit cId=dog.cBreederId
2. Erstellt/aktualisiert Breeder mit Member Relation (wenn Breeder Member gefunden)
3. Sucht Member mit cId=dog.cOwnerId
4. Stellt sicher, dass Dog -> Owner Relation existiert
5. Geocodiert die PLZ des Members (Breeder hat Priorität, sonst Owner)
6. Aktualisiert Dog Location mit den Koordinaten

Usage:
    python update_dog_locations.py [--api-url URL] [--api-token TOKEN] [--dry-run]

Example:
    python update_dog_locations.py --api-url http://localhost:1337 --api-token YOUR_API_TOKEN
"""

import sys
import argparse
import requests
import time
from typing import Dict, Optional, Any, Tuple

# Rate limiting für Nominatim API (max 1 Request pro Sekunde)
NOMINATIM_DELAY = 1.0

def get_all_dogs(api_url: str, api_token: Optional[str]) -> list:
    """Hole alle Dogs über GraphQL."""
    url = f"{api_url}/graphql"

    headers = {
        'Content-Type': 'application/json',
    }

    if api_token:
        headers['Authorization'] = f'Bearer {api_token}'

    # GraphQL Query für alle Dogs mit cBreederId, cOwnerId, Location und owner Relation
    query = """
    query GetAllDogs {
        hzdPluginDogs(pagination: { limit: 10000 }) {
            data {
                id
                attributes {
                    cId
                    cBreederId
                    cOwnerId
                    givenName
                    fullKennelName
                    Location {
                        lat
                        lng
                    }
                    owner {
                        data {
                            id
                            attributes {
                                cId
                            }
                        }
                    }
                }
            }
        }
    }
    """

    try:
        response = requests.post(
            url,
            json={'query': query},
            headers=headers,
            timeout=30
        )

        if response.status_code == 200:
            result = response.json()

            if 'errors' in result:
                print(f"✗ GraphQL Fehler beim Abrufen der Dogs: {result['errors']}")
                return []

            dogs = result.get('data', {}).get('hzdPluginDogs', {}).get('data', [])
            return dogs
        else:
            print(f"✗ Fehler beim Abrufen der Dogs: {response.status_code} - {response.text}")
            return []
    except requests.exceptions.RequestException as e:
        print(f"✗ Fehler beim Abrufen der Dogs: {e}")
        return []

def find_member_by_cid(api_url: str, api_token: Optional[str], c_id: int) -> Optional[Dict[str, Any]]:
    """Finde Member anhand von cId über GraphQL."""
    if not c_id:
        return None

    url = f"{api_url}/graphql"

    headers = {
        'Content-Type': 'application/json',
    }

    if api_token:
        headers['Authorization'] = f'Bearer {api_token}'

    query = """
    query FindMemberByCId($cId: Int!) {
        hzdPluginMembers(filters: { cId: { eq: $cId } }) {
            data {
                id
                attributes {
                    cId
                    firstName
                    lastName
                    zip
                    city
                    countryCode
                }
            }
        }
    }
    """

    try:
        response = requests.post(
            url,
            json={'query': query, 'variables': {'cId': c_id}},
            headers=headers,
            timeout=30
        )

        if response.status_code == 200:
            result = response.json()

            if 'errors' in result:
                return None

            members = result.get('data', {}).get('hzdPluginMembers', {}).get('data', [])
            if members and len(members) > 0:
                return members[0]
    except Exception as e:
        print(f"  ⚠ Fehler beim Suchen nach Member (cId: {c_id}): {e}")

    return None

def geocode_zipcode(zipcode: str, country: str = 'DE') -> Optional[Tuple[float, float]]:
    """
    Geocode eine deutsche PLZ zu Koordinaten.
    Verwendet OpenStreetMap Nominatim API.
    """
    if not zipcode or not zipcode.strip():
        return None

    # Bereinige PLZ (nur Zahlen)
    zipcode_clean = ''.join(filter(str.isdigit, zipcode.strip()))

    if not zipcode_clean or len(zipcode_clean) < 4:
        return None

    url = "https://nominatim.openstreetmap.org/search"
    params = {
        'postalcode': zipcode_clean,
        'countrycodes': country.lower(),
        'format': 'json',
        'limit': 1
    }

    headers = {
        'User-Agent': 'HZD-Dog-Location-Updater/1.0'  # Nominatim erfordert User-Agent
    }

    try:
        # Rate limiting
        time.sleep(NOMINATIM_DELAY)

        response = requests.get(url, params=params, headers=headers, timeout=10)

        if response.status_code == 200:
            results = response.json()
            if results and len(results) > 0:
                lat = float(results[0]['lat'])
                lng = float(results[0]['lon'])
                return (lat, lng)
    except Exception as e:
        print(f"  ⚠ Fehler beim Geocoding von PLZ {zipcode}: {e}")

    return None

def find_breeder_by_member(api_url: str, api_token: Optional[str], member_id: str) -> Optional[Dict[str, Any]]:
    """Finde Breeder anhand von Member ID über GraphQL."""
    url = f"{api_url}/graphql"

    headers = {
        'Content-Type': 'application/json',
    }

    if api_token:
        headers['Authorization'] = f'Bearer {api_token}'

    query = """
    query FindBreederByMember($memberId: ID!) {
        hzdPluginBreeders(filters: { member: { id: { eq: $memberId } } }) {
            data {
                id
                attributes {
                    member {
                        data {
                            id
                        }
                    }
                }
            }
        }
    }
    """

    try:
        response = requests.post(
            url,
            json={'query': query, 'variables': {'memberId': member_id}},
            headers=headers,
            timeout=30
        )

        if response.status_code == 200:
            result = response.json()

            if 'errors' in result:
                return None

            breeders = result.get('data', {}).get('hzdPluginBreeders', {}).get('data', [])
            if breeders and len(breeders) > 0:
                return breeders[0]
    except Exception as e:
        print(f"  ⚠ Fehler beim Suchen nach Breeder (memberId: {member_id}): {e}")

    return None

def create_or_update_breeder(api_url: str, api_token: Optional[str], member_id: str,
                             dry_run: bool = False) -> Optional[str]:
    """Erstelle oder aktualisiere Breeder mit Member Relation."""
    url = f"{api_url}/graphql"

    headers = {
        'Content-Type': 'application/json',
    }

    if api_token:
        headers['Authorization'] = f'Bearer {api_token}'

    # Prüfe ob Breeder bereits existiert
    existing_breeder = find_breeder_by_member(api_url, api_token, member_id)

    if existing_breeder:
        breeder_id = existing_breeder.get('id')
        # Prüfe ob Relation bereits gesetzt ist
        breeder_attrs = existing_breeder.get('attributes', {})
        breeder_member = breeder_attrs.get('member', {}).get('data')

        if breeder_member and breeder_member.get('id') == member_id:
            print(f"  ✓ Breeder existiert bereits mit korrekter Member Relation (ID: {breeder_id})")
            return breeder_id

        # Update Breeder mit Member Relation
        mutation = """
        mutation UpdateBreeder($id: ID!, $data: HzdPluginBreederInput!) {
            updateHzdPluginBreeder(id: $id, data: $data) {
                data {
                    id
                    attributes {
                        member {
                            data {
                                id
                            }
                        }
                    }
                }
            }
        }
        """

        if dry_run:
            print(f"  [DRY RUN] Würde Breeder {breeder_id} mit Member {member_id} updaten")
            return breeder_id

        try:
            response = requests.post(
                url,
                json={
                    'query': mutation,
                    'variables': {
                        'id': breeder_id,
                        'data': {
                            'member': member_id
                        }
                    }
                },
                headers=headers,
                timeout=30
            )

            if response.status_code == 200:
                result = response.json()
                if 'errors' not in result:
                    print(f"  ✓ Breeder aktualisiert mit Member Relation (ID: {breeder_id})")
                    return breeder_id
        except Exception as e:
            print(f"  ⚠ Fehler beim Update von Breeder: {e}")
            return None
    else:
        # Erstelle neuen Breeder
        mutation = """
        mutation CreateBreeder($data: HzdPluginBreederInput!) {
            createHzdPluginBreeder(data: $data) {
                data {
                    id
                    attributes {
                        member {
                            data {
                                id
                            }
                        }
                    }
                }
            }
        }
        """

        if dry_run:
            print(f"  [DRY RUN] Würde neuen Breeder mit Member {member_id} erstellen")
            return "dry-run-breeder-id"

        try:
            response = requests.post(
                url,
                json={
                    'query': mutation,
                    'variables': {
                        'data': {
                            'member': member_id
                        }
                    }
                },
                headers=headers,
                timeout=30
            )

            if response.status_code == 200:
                result = response.json()
                if 'errors' not in result:
                    data = result.get('data', {}).get('createHzdPluginBreeder', {}).get('data', {})
                    if data:
                        breeder_id = data.get('id')
                        print(f"  ✓ Breeder erstellt mit Member Relation (ID: {breeder_id})")
                        return breeder_id
        except Exception as e:
            print(f"  ⚠ Fehler beim Erstellen von Breeder: {e}")
            return None

    return None

def update_dog_owner_relation(api_url: str, api_token: Optional[str], dog_id: str,
                              owner_member_id: str, dry_run: bool = False) -> bool:
    """Update Dog -> Owner Relation über GraphQL."""
    url = f"{api_url}/graphql"

    headers = {
        'Content-Type': 'application/json',
    }

    if api_token:
        headers['Authorization'] = f'Bearer {api_token}'

    mutation = """
    mutation UpdateDogOwner($id: ID!, $data: HzdPluginDogInput!) {
        updateHzdPluginDog(id: $id, data: $data) {
            data {
                id
                attributes {
                    owner {
                        data {
                            id
                        }
                    }
                }
            }
        }
    }
    """

    if dry_run:
        print(f"  [DRY RUN] Würde Dog {dog_id} mit Owner {owner_member_id} updaten")
        return True

    try:
        response = requests.post(
            url,
            json={
                'query': mutation,
                'variables': {
                    'id': dog_id,
                    'data': {
                        'owner': owner_member_id
                    }
                }
            },
            headers=headers,
            timeout=30
        )

        if response.status_code == 200:
            result = response.json()

            if 'errors' in result:
                error_msg = '; '.join([err.get('message', str(err)) for err in result['errors']])
                print(f"  ✗ Fehler beim Update Owner Relation: {error_msg}")
                return False

            data = result.get('data', {}).get('updateHzdPluginDog', {}).get('data', {})
            if data:
                return True
        else:
            print(f"  ✗ HTTP Fehler beim Update Owner Relation: {response.status_code} - {response.text}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"  ✗ Fehler beim Update Owner Relation: {e}")
        return False

def update_dog_location(api_url: str, api_token: Optional[str], dog_id: str,
                        lat: float, lng: float, dry_run: bool = False) -> bool:
    """Update Dog Location über GraphQL."""
    url = f"{api_url}/graphql"

    headers = {
        'Content-Type': 'application/json',
    }

    if api_token:
        headers['Authorization'] = f'Bearer {api_token}'

    # GraphQL Mutation für Component Update
    # In Strapi müssen Components als Objekt mit den Feldern übergeben werden
    mutation = """
    mutation UpdateDogLocation($id: ID!, $data: HzdPluginDogInput!) {
        updateHzdPluginDog(id: $id, data: $data) {
            data {
                id
                attributes {
                    givenName
                    Location {
                        lat
                        lng
                    }
                }
            }
        }
    }
    """

    if dry_run:
        print(f"  [DRY RUN] Würde Dog {dog_id} mit Location ({lat}, {lng}) updaten")
        return True

    try:
        # Variables für Component müssen als Objekt übergeben werden
        variables = {
            'id': dog_id,
            'data': {
                'Location': {
                    'lat': lat,
                    'lng': lng
                }
            }
        }

        response = requests.post(
            url,
            json={
                'query': mutation,
                'variables': variables
            },
            headers=headers,
            timeout=30
        )

        if response.status_code == 200:
            result = response.json()

            if 'errors' in result:
                error_msg = '; '.join([err.get('message', str(err)) for err in result['errors']])
                print(f"  ✗ Fehler beim Update: {error_msg}")
                return False

            data = result.get('data', {}).get('updateHzdPluginDog', {}).get('data', {})
            if data:
                return True
            else:
                print(f"  ✗ Keine Daten zurückgegeben")
                return False
        else:
            print(f"  ✗ HTTP Fehler: {response.status_code} - {response.text}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"  ✗ Fehler beim Update: {e}")
        return False

def main():
    parser = argparse.ArgumentParser(description='Update Dog Locations basierend auf Member PLZ')
    parser.add_argument('--api-url', default='http://localhost:1337',
                       help='Strapi API URL (default: http://localhost:1337)')
    parser.add_argument('--api-token', default=None,
                       help='Strapi API token (optional, aber empfohlen)')
    parser.add_argument('--dry-run', action='store_true',
                       help='Dry run ohne tatsächliche Updates')

    args = parser.parse_args()

    print("=" * 60)
    print("Dog Location Update Script")
    print("=" * 60)
    print(f"API URL: {args.api_url}")
    if args.api_token:
        print(f"API Token: {'*' * 20} (provided)")
    else:
        print(f"API Token: Not provided")
    print(f"Dry run: {args.dry_run}")
    print("-" * 60)

    # Hole alle Dogs
    print("\nLade alle Dogs...")
    dogs = get_all_dogs(args.api_url, args.api_token)

    if not dogs:
        print("✗ Keine Dogs gefunden oder Fehler beim Laden")
        sys.exit(1)

    print(f"✓ {len(dogs)} Dogs gefunden")
    print("-" * 60)

    # Statistiken
    stats = {
        'total': len(dogs),
        'location_updated': 0,
        'breeders_created': 0,
        'breeders_updated': 0,
        'owner_relations_updated': 0,
        'skipped_no_member': 0,
        'skipped_no_zip': 0,
        'skipped_no_geocode': 0,
        'skipped_already_has_location': 0,
        'errors': 0
    }

    # Iteriere über alle Dogs
    for i, dog in enumerate(dogs, 1):
        dog_id = dog.get('id')
        attrs = dog.get('attributes', {})
        dog_cid = attrs.get('cId')
        dog_name = attrs.get('givenName') or attrs.get('fullKennelName') or f'Dog #{dog_cid}'
        c_breeder_id = attrs.get('cBreederId')
        c_owner_id = attrs.get('cOwnerId')
        current_location = attrs.get('Location')
        current_owner = attrs.get('owner', {}).get('data')

        print(f"\n[{i}/{len(dogs)}] Processing: {dog_name} (cId: {dog_cid}, ID: {dog_id})")

        # 1. Verarbeite Breeder (wenn cBreederId vorhanden)
        breeder_member = None
        if c_breeder_id:
            print(f"  🔍 Suche Member (Breeder) mit cId: {c_breeder_id}")
            breeder_member = find_member_by_cid(args.api_url, args.api_token, c_breeder_id)

            if breeder_member:
                breeder_member_id = breeder_member.get('id')
                breeder_member_attrs = breeder_member.get('attributes', {})
                breeder_member_name = f"{breeder_member_attrs.get('firstName', '')} {breeder_member_attrs.get('lastName', '')}".strip()
                print(f"  ✓ Breeder Member gefunden: {breeder_member_name} (ID: {breeder_member_id})")

                # Prüfe ob Breeder bereits existiert
                existing_breeder_before = find_breeder_by_member(args.api_url, args.api_token, breeder_member_id)

                # Erstelle/Update Breeder mit Member Relation
                breeder_id = create_or_update_breeder(args.api_url, args.api_token, breeder_member_id, args.dry_run)
                if breeder_id:
                    if existing_breeder_before:
                        stats['breeders_updated'] += 1
                    else:
                        stats['breeders_created'] += 1
                else:
                    print(f"  ⚠ Konnte Breeder nicht erstellen/aktualisieren")
            else:
                print(f"  ⚠ Breeder Member nicht gefunden (cId: {c_breeder_id})")

        # 2. Verarbeite Owner (wenn cOwnerId vorhanden)
        owner_member = None
        if c_owner_id:
            print(f"  🔍 Suche Member (Owner) mit cId: {c_owner_id}")
            owner_member = find_member_by_cid(args.api_url, args.api_token, c_owner_id)

            if owner_member:
                owner_member_id = owner_member.get('id')
                owner_member_attrs = owner_member.get('attributes', {})
                owner_member_name = f"{owner_member_attrs.get('firstName', '')} {owner_member_attrs.get('lastName', '')}".strip()
                print(f"  ✓ Owner Member gefunden: {owner_member_name} (ID: {owner_member_id})")

                # Prüfe ob Owner Relation bereits korrekt ist
                current_owner_id = current_owner.get('id') if current_owner else None
                if current_owner_id != owner_member_id:
                    # Update Dog -> Owner Relation
                    if update_dog_owner_relation(args.api_url, args.api_token, dog_id, owner_member_id, args.dry_run):
                        print(f"  ✓ Dog -> Owner Relation aktualisiert")
                        stats['owner_relations_updated'] += 1
                    else:
                        print(f"  ⚠ Konnte Dog -> Owner Relation nicht aktualisieren")
                else:
                    print(f"  ✓ Dog -> Owner Relation bereits korrekt")
            else:
                print(f"  ⚠ Owner Member nicht gefunden (cId: {c_owner_id})")

        # 3. Verwende Member für Geocoding (Breeder hat Priorität, sonst Owner)
        member_for_location = breeder_member if breeder_member else owner_member

        if not member_for_location:
            print(f"  ⚠ Kein Member gefunden für Geocoding (cBreederId: {c_breeder_id}, cOwnerId: {c_owner_id})")
            stats['skipped_no_member'] += 1
            continue

        # Prüfe ob bereits Location vorhanden
        if current_location and current_location.get('lat') and current_location.get('lng'):
            print(f"  ⏭ Übersprungen: Hat bereits Location ({current_location.get('lat')}, {current_location.get('lng')})")
            stats['skipped_already_has_location'] += 1
            continue

        member_attrs = member_for_location.get('attributes', {})
        member_zip = member_attrs.get('zip')
        member_city = member_attrs.get('city')
        member_name = f"{member_attrs.get('firstName', '')} {member_attrs.get('lastName', '')}".strip()
        member_source = 'breeder' if breeder_member else 'owner'

        print(f"  📍 Verwende Member für Location ({member_source}): {member_name} (PLZ: {member_zip}, Stadt: {member_city})")

        if not member_zip:
            print(f"  ⚠ Member hat keine PLZ")
            stats['skipped_no_zip'] += 1
            continue

        # Geocode PLZ
        print(f"  🌍 Geocode PLZ: {member_zip}")
        location = geocode_zipcode(member_zip, member_attrs.get('countryCode', 'DE'))

        if not location:
            print(f"  ⚠ Konnte PLZ nicht geocoden")
            stats['skipped_no_geocode'] += 1
            continue

        lat, lng = location
        print(f"  ✓ Koordinaten gefunden: ({lat}, {lng})")

        # Update Dog Location
        if update_dog_location(args.api_url, args.api_token, dog_id, lat, lng, args.dry_run):
            print(f"  ✓ Dog Location erfolgreich aktualisiert")
            stats['location_updated'] += 1
        else:
            print(f"  ✗ Fehler beim Update Location")
            stats['errors'] += 1

    # Zusammenfassung
    print("\n" + "=" * 60)
    print("Zusammenfassung")
    print("=" * 60)
    print(f"Gesamt Dogs: {stats['total']}")
    print(f"✓ Locations aktualisiert: {stats['location_updated']}")
    print(f"✓ Breeders erstellt: {stats['breeders_created']}")
    print(f"✓ Breeders aktualisiert: {stats['breeders_updated']}")
    print(f"✓ Owner Relations aktualisiert: {stats['owner_relations_updated']}")
    print(f"⏭ Übersprungen (bereits Location): {stats['skipped_already_has_location']}")
    print(f"⏭ Übersprungen (kein Member): {stats['skipped_no_member']}")
    print(f"⏭ Übersprungen (keine PLZ): {stats['skipped_no_zip']}")
    print(f"⏭ Übersprungen (Geocoding fehlgeschlagen): {stats['skipped_no_geocode']}")
    print(f"✗ Fehler: {stats['errors']}")
    print("=" * 60)

if __name__ == '__main__':
    main()

