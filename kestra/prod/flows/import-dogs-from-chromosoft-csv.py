#!/usr/bin/env python3
from __future__ import annotations

import argparse
import csv
import sys
import time
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any, Optional
from dotenv import load_dotenv
import os
import requests

load_dotenv()


try:
	import requests
	from requests.exceptions import ConnectionError, RequestException, Timeout
except ImportError as exc:  # pragma: no cover
	print('Das Skript benötigt das Paket "requests". Installiere es mit "pip install requests".', file=sys.stderr)
	sys.exit(1)

# python scripts/import-dogs-from-chromosoft-csv.py \
#  pfad/zur/chromosoft.csv \
#  --verbose

DOG_BY_CID_QUERY = """
query DogByCId($cId: Int) {
  hzdPluginDogs(filters: { cId: { eq: $cId } }) {
    documentId
  }
}
"""

DOG_BY_STUDBOOK_NUMBER_QUERY = """
query DogByStudBookNumber($studBookNumber: String) {
  hzdPluginDogs(filters: { cStudBookNumber: { eq: $studBookNumber } }) {
    documentId
  }
}
"""

CREATE_DOG_MUTATION = """
mutation CreateDog($data: HzdPluginDogInput!) {
  createHzdPluginDog(data: $data) {
    documentId
  }
}
"""

UPDATE_DOG_MUTATION = """
mutation UpdateDog($documentId: ID!, $data: HzdPluginDogInput!) {
  updateHzdPluginDog(documentId: $documentId, data: $data) {
    documentId
  }
}
"""

BREEDER_BY_CID_QUERY = """
query BreederByCId($cId: Int!) {
  hzdPluginBreeders(filters: { cId: { eq: $cId } }) {
    documentId
  }
}
"""

CREATE_BREEDER_MUTATION = """
mutation CreateBreeder($data: HzdPluginBreederInput!) {
  createHzdPluginBreeder(data: $data) {
    documentId
  }
}
"""

UPDATE_BREEDER_MUTATION = """
mutation UpdateBreeder($documentId: ID!, $data: HzdPluginBreederInput!) {
  updateHzdPluginBreeder(documentId: $documentId, data: $data) {
    documentId
  }
}
"""

USER_BY_CID_QUERY = """
query UserByCId($cId: Int!) {
  usersPermissionsUsers(filters: { cId: { eq: $cId } }) {
    documentId
  }
}
"""

SEX_ENUM_MAP = {
	'': None,
	'hündin': 'F',
	'rüde': 'M',
	'weiblich': 'F',
	'männlich': 'M',
	'f': 'F',
	'm': 'M',
	'female': 'F',
	'male': 'M',
	'1': 'F',
	'0': 'M',
}

COLOR_ENUM_MAP = {
       '': None,
       '-': None,
       'schwarz': 'S',
       'schwarzmarken': 'SM',
       'blond': 'B',
}

@dataclass
class ChromosoftDogRecord:
	c_id: int
	given_name: str
	full_name: str
	breeder_id: Optional[int]
	owner_id: Optional[int]
	chip_number: str
	sex: str
	date_of_birth: str
	date_of_death: str
	color: str
	richterbericht: str
	breed_survey: str
	breeder_kennel_name: str
	fertile: str
	studbook_number: str
	sire_studbook_number: str
	dam_studbook_number: str


class GraphQLClient:
	def __init__(self, endpoint: str, token: Optional[str], timeout: int = 30, max_retries: int = 3, retry_delay: float = 1.0, verbose: bool = False) -> None:
		self.endpoint = endpoint
		self.timeout = timeout
		self.max_retries = max_retries
		self.retry_delay = retry_delay
		self.verbose = verbose
		self.session = requests.Session()
		self.session.headers.update({'Content-Type': 'application/json'})
		if token:
			self.session.headers['Authorization'] = f'Bearer {token}'

	def execute(self, query: str, variables: dict[str, Any]) -> dict[str, Any]:
		"""Führt eine GraphQL-Query/Mutation aus mit deterministischer Retry-Logik."""
		max_attempts = max(1, min(self.max_retries, 10))  # Begrenze auf 1-10 Versuche
		last_exception = None
		
		for attempt in range(max_attempts):
			try:
				if attempt > 0:
					# Exponential backoff: 1s, 2s, 4s, etc.
					delay = self.retry_delay * (2 ** (attempt - 1))
					if self.verbose:
						print(f'Warte {delay:.1f}s vor Wiederholung {attempt + 1}/{max_attempts}...', file=sys.stderr)
					time.sleep(delay)

				if self.verbose:
					print(f'Verbinde mit: {self.endpoint}', file=sys.stderr)

				response = self.session.post(
					self.endpoint,
					json={'query': query, 'variables': variables},
					timeout=self.timeout,
				)
				if(response.status_code != 200):
					print(response.json())
				response.raise_for_status()
				payload = response.json()
				errors = payload.get('errors', [])
				if errors:
					# GraphQL-Fehler werden nicht wiederholt, da sie deterministisch sind
					raise RuntimeError(f'GraphQL Fehler: {errors}')
				return payload
			except (ConnectionError, Timeout, RequestException) as e:
				last_exception = e
				# Nur bei Verbindungsfehlern wiederholen, maximal max_attempts-1 mal
				if attempt < max_attempts - 1:
					if self.verbose:
						print(f'Verbindungsfehler (Versuch {attempt + 1}/{max_attempts}): {e}', file=sys.stderr)
					continue
				# Bei finalem Fehler ausführliche Fehlermeldung
				raise ConnectionError(
					f'Konnte keine Verbindung zu {self.endpoint} herstellen nach {max_attempts} Versuchen: {e}\n'
					f'Hinweis: Prüfe, ob der Endpoint korrekt ist. '
					f'Versuche ggf. "127.0.0.1" statt "localhost" oder umgekehrt.'
				) from e
			except RuntimeError as e:
				# GraphQL-Fehler werden nicht wiederholt
				raise e

		# Diese Zeile sollte nie erreicht werden, da die Schleife deterministisch terminiert
		if last_exception:
			raise last_exception
		raise RuntimeError(f'Unerwarteter Fehler bei der Ausführung nach {max_attempts} Versuchen')

	def find_by_studbook_number(self, studbook_number: Optional[str]) -> Optional[str]:
		if not studbook_number:
			return None
		data = self.execute(DOG_BY_STUDBOOK_NUMBER_QUERY, {"studBookNumber": studbook_number})
		d = data.get('data') or {}
		items = d.get('hzdPluginDogs') or []
		if not items:
			return None
		return items[0].get('documentId')

	def find_by_cid(self, c_id: Optional[int]) -> Optional[str]:
		if c_id is None:
			return None
		data = self.execute(DOG_BY_CID_QUERY, {"cId": c_id})
		d = data.get('data') or {}
		items = d.get('hzdPluginDogs') or []
		if not items:
			return None
		return items[0].get('documentId')

	def create_dog(self, payload: dict[str, Any]) -> Optional[str]:
		data = self.execute(CREATE_DOG_MUTATION, {'data': payload})
		result = data.get('data', {}).get('createHzdPluginDog')
		if result:
			return result.get('documentId')
		return None

	def update_dog(self, dog_id: str, payload: dict[str, Any]) -> Optional[str]:
		if self.verbose:
			print(f'Update payload: {payload}', file=sys.stderr)
		data = self.execute(UPDATE_DOG_MUTATION, {'documentId': dog_id, 'data': payload})
		result = data.get('data', {}).get('updateHzdPluginDog')
		if result:
			return result.get('documentId')
		return None

	def find_breeder_by_cid(self, c_id: Optional[int]) -> Optional[str]:
		"""Finde Breeder anhand der Chromosoft-ID (cId)."""
		if c_id is None:
			return None
		data = self.execute(BREEDER_BY_CID_QUERY, {"cId": c_id})
		d = data.get('data') or {}
		items = d.get('hzdPluginBreeders') or []
		if not items:
			return None
		return items[0].get('documentId')

	def create_breeder(self, payload: dict[str, Any]) -> Optional[str]:
		"""Erstelle einen neuen Breeder."""
		data = self.execute(CREATE_BREEDER_MUTATION, {'data': payload})
		result = data.get('data', {}).get('createHzdPluginBreeder')
		if result:
			return result.get('documentId')
		return None

	def update_breeder(self, breeder_id: str, payload: dict[str, Any]) -> Optional[str]:
		"""Aktualisiere einen existierenden Breeder."""
		data = self.execute(UPDATE_BREEDER_MUTATION, {'documentId': breeder_id, 'data': payload})
		result = data.get('data', {}).get('updateHzdPluginBreeder')
		if result:
			return result.get('documentId')
		return None

	def find_user_by_cid(self, c_id: Optional[int]) -> Optional[str]:
		"""Finde User anhand der Chromosoft-ID (cId)."""
		if c_id is None:
			return None
		data = self.execute(USER_BY_CID_QUERY, {"cId": c_id})
		d = data.get('data') or {}
		items = d.get('usersPermissionsUsers') or []
		if not items:
			return None
		return items[0].get('documentId')

	def test_connection(self) -> bool:
		"""Testet die Verbindung zum GraphQL-Endpoint mit einer einfachen Query."""
		try:
			# Einfache Introspection-Query zum Testen
			test_query = 'query { __typename }'
			self.execute(test_query, {})
			return True
		except Exception as e:
			print(f'Verbindungstest fehlgeschlagen: {e}', file=sys.stderr)
			return False


def parse_int(value: str) -> Optional[int]:
	value = value.strip()
	if not value or value == '-':
		return None
	try:
		return int(value)
	except ValueError:
		return None


def parse_iso_date(value: str) -> Optional[str]:
	value = value.strip()
	if not value or value == '-':
		return None
	# Unterstütze verschiedene Datumsformate: DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD
	for fmt in ('%d/%m/%Y', '%d-%m-%Y', '%Y-%m-%d', '%d.%m.%Y'):
		try:
			return datetime.strptime(value, fmt).date().isoformat()
		except ValueError:
			continue
	return None


def map_sex_enum(raw: str) -> Optional[str]:
	key = raw.strip().lower()
	return SEX_ENUM_MAP.get(key)

def map_color_enum(raw: str) -> Optional[str]:
       value = raw.strip()
       if not value or value == '-':
               return None
       return COLOR_ENUM_MAP.get(value) or COLOR_ENUM_MAP.get(value.upper())



def parse_bool_check(value: str) -> Optional[bool]:
	value = value.strip()
	if not value or value == '-':
		return None
	# Wenn ein Wert vorhanden ist (auch "o. B."), bedeutet das, dass die Untersuchung durchgeführt wurde
	# "o. B." bedeutet "ohne Befund" = alles in Ordnung = True
	# Leer oder "-" = nicht durchgeführt = None
	value_lower = value.lower()
	if value_lower in ('o. b.', 'o.b.', 'ohne befund', 'ok', '1', 'true'):
		return True
	# Wenn ein Wert vorhanden ist, aber nicht explizit "o. B.", nehmen wir an, dass es durchgeführt wurde
	return True


def row_to_record(row: dict[str, str]) -> ChromosoftDogRecord:
	c_id_value = parse_int(row.get('ID Animal', ''))
	if c_id_value is None:
		raise ValueError('Jeder Datensatz benötigt eine gültige "ID Animal" (cId).')

	# Sammle alle Spalten mit "Verhalten..." oder "Körung..." für BreedSurvey
	breed_survey_parts = []
	for key, value in row.items():
		if key and value:
			key_lower = key.strip().lower()
			value_stripped = value.strip()
			# Nur relevante Werte (nicht leer, nicht "-")
			if value_stripped and value_stripped != '-':
				if key_lower.startswith('verhalten') or key_lower.startswith('körung'):
					breed_survey_parts.append(f"{value_stripped}")

	breed_survey = '\n'.join(breed_survey_parts) if breed_survey_parts else ''

	# Suche nach kennelName in verschiedenen möglichen Spaltennamen (case-insensitive)
	kennel_name = ''
	# Mögliche Spaltennamen: "Name of Breeding Station" (korrekt) oder "name of breeder station"
	possible_keys = ['Name of Breeding Station', 'name of breeding station', 'Name of breeder station', 'name of breeder station']
	
	# Zuerst versuche exakte Übereinstimmungen
	for key in possible_keys:
		if key in row:
			kennel_name = row.get(key, '').strip()
			if kennel_name:
				break
	
	# Falls nicht gefunden, suche case-insensitive
	if not kennel_name:
		for key, value in row.items():
			if key:
				key_lower = key.strip().lower()
				if key_lower in ['name of breeding station', 'name of breeder station']:
					kennel_name = value.strip() if value else ''
					if kennel_name:
						break

	return ChromosoftDogRecord(
		c_id=c_id_value,
		given_name=row.get('Given Name', '').strip(),
		full_name=row.get('Full Name', '').strip(),
		breeder_id=parse_int(row.get('ID Breeder', '')),
		owner_id=parse_int(row.get('ID Owner', '')),
		chip_number=row.get('chip number', '').strip(),
		sex=row.get('sex', '').strip(),
		date_of_birth=row.get('date of birth', '').strip(),
		date_of_death=row.get('date of death', '').strip(),
		richterbericht=row.get('Richterbericht', '').strip(),
		breed_survey=breed_survey,
		breeder_kennel_name=kennel_name,
		color=row.get('color', '').strip(),
		fertile=row.get('fertile'),
		studbook_number=row.get('studbook number', '').strip(),
		sire_studbook_number=row.get('studbook number (sire)', '').strip(),
		dam_studbook_number=row.get('studbook number (dam)', '').strip(),
	)


def read_chromosoft_csv(file_path: Path) -> list[ChromosoftDogRecord]:
	with file_path.open('r', encoding='utf-8', newline='') as handle:
		reader = csv.DictReader(handle)
		records = []
		for row_num, row in enumerate(reader, start=2):
			try:
				records.append(row_to_record(row))
			except ValueError as e:
				print(f'Warnung: Zeile {row_num} übersprungen: {e}', file=sys.stderr)
		return records


def build_graphql_payload(
	record: ChromosoftDogRecord, 
	breeder_id: Optional[str] = None
) -> dict[str, Any]:
	payload: dict[str, Any] = {}

	def assign(key: str, value: Any) -> None:
		if value is None:
			return
		if isinstance(value, str) and not value.strip():
			return
		payload[key] = value

	# Basis-Felder
	assign('cId', record.c_id)
	assign('givenName', record.given_name)
	assign('fullKennelName', record.full_name)
	assign('cBreederId', record.breeder_id)
	# cOwnerId wird verwendet für die Verknüpfung Dog -> Owner (gemappt auf user.cId)
	assign('cOwnerId', record.owner_id)
	assign('microchipNo', record.chip_number)
	if(record.fertile=='1'):
		assign("cFertile", True)
	else:
		assign("cFertile", False)

	# Verknüpfungen
	# Breeder-Verknüpfung über breeder: ID (Relation zu HzdPluginBreeder)
	if breeder_id:
		assign('breeder', breeder_id)
	
	# Studbook Number
	assign('cStudBookNumber', record.studbook_number)
	assign('cStudBookNumberFather', record.sire_studbook_number)
	assign('cStudBookNumberMother', record.dam_studbook_number)

	# Geschlecht
	sex_enum = map_sex_enum(record.sex)
	assign('sex', sex_enum)

	# Daten
	assign('dateOfBirth', parse_iso_date(record.date_of_birth))
	assign('dateOfDeath', parse_iso_date(record.date_of_death))


	# Exhibitions - Richterbericht
	if record.richterbericht and record.richterbericht.strip() and record.richterbericht.strip() != '-':
		assign('Exhibitions', record.richterbericht.strip())

	# BreedSurvey - Verhalten und Körung Spalten (nur relevante Werte)
	if record.breed_survey and record.breed_survey.strip():
		assign('BreedSurvey', record.breed_survey.strip())

	return payload


def ensure_breeder_exists(client: GraphQLClient, breeder_c_id: Optional[int], kennel_name: Optional[str] = None, verbose: bool = False) -> Optional[str]:
	"""Erstelle einen neuen Breeder und verknüpfe ihn mit User. Gibt die Breeder-ID zurück."""
	if breeder_c_id is None:
		return None

	# Finde User anhand der cId
	user_id = client.find_user_by_cid(breeder_c_id)
	if not user_id:
		if verbose:
			print(f'Warnung: Kein User mit cId={breeder_c_id} gefunden. Breeder wird ohne User-Verknüpfung erstellt.', file=sys.stderr)

	# Erstelle neuen Breeder
	breeder_payload: dict[str, Any] = {
		'cId': breeder_c_id,
		'IsActive': True,
	}
	if user_id:
		breeder_payload['member'] = user_id
	if kennel_name and kennel_name.strip() and kennel_name.strip() != '-':
		breeder_payload['kennelName'] = kennel_name.strip()
		if verbose:
			print(f'Setze kennelName für Breeder cId={breeder_c_id}: "{kennel_name.strip()}"', file=sys.stderr)
	else:
		if verbose:
			print(f'Kein kennelName für Breeder cId={breeder_c_id} (Wert: "{kennel_name}")', file=sys.stderr)

	if verbose:
		print(f'Breeder Payload für cId={breeder_c_id}: {breeder_payload}', file=sys.stderr)

	breeder_id = client.create_breeder(breeder_payload)
	if breeder_id:
		kennel_info = f', kennelName: {kennel_name}' if kennel_name else ', kennelName: (nicht gefunden)'
		if verbose:
			print(f'Breeder mit cId={breeder_c_id} erstellt (ID: {breeder_id}{kennel_info})', file=sys.stderr)
		else:
			print(f'Breeder mit cId={breeder_c_id} erstellt (ID: {breeder_id}{kennel_info})')
		return breeder_id
	else:
		kennel_info = f', kennelName: {kennel_name}' if kennel_name else ', kennelName: (nicht gefunden)'
		if verbose:
			print(f'Fehler: Konnte Breeder mit cId={breeder_c_id} nicht erstellen{kennel_info}', file=sys.stderr)
		return None


def import_records(
	records: list[ChromosoftDogRecord],
	client: GraphQLClient,
	verbose: bool,
	delay_between_requests: float = 0.1,
) -> dict[str, int]:
	stats = {'created': 0, 'updated': 0, 'failed': 0, 'breeders_created': 0}

	# Sammle alle eindeutigen Breeder-IDs und deren kennelName
	breeder_data: dict[int, Optional[str]] = {}
	for record in records:
		if record.breeder_id:
			# Verwende den ersten gefundenen kennelName für jeden Breeder
			if record.breeder_id not in breeder_data:
				kennel_name = record.breeder_kennel_name if record.breeder_kennel_name and record.breeder_kennel_name.strip() and record.breeder_kennel_name.strip() != '-' else None
				breeder_data[record.breeder_id] = kennel_name
				if verbose and kennel_name:
					print(f'Gefundener kennelName für Breeder cId={record.breeder_id}: {kennel_name}', file=sys.stderr)
				elif verbose and not kennel_name:
					print(f'Kein kennelName gefunden für Breeder cId={record.breeder_id} (Wert: "{record.breeder_kennel_name}")', file=sys.stderr)

	# Erstelle alle Breeder vorab
	breeder_map: dict[int, Optional[str]] = {}
	for breeder_c_id, kennel_name in breeder_data.items():
		try:
			# Prüfe ob Breeder bereits existiert
			existing_breeder_id = client.find_breeder_by_cid(breeder_c_id)
			if existing_breeder_id:
				breeder_map[breeder_c_id] = existing_breeder_id
				# Aktualisiere kennelName falls vorhanden
				kennel_info = f', kennelName: {kennel_name}' if kennel_name else ', kennelName: (nicht gefunden)'
				#if kennel_name:
				#	update_payload: dict[str, Any] = {
				#		'kennelName': kennel_name
				#	}
				#	client.update_breeder(existing_breeder_id, update_payload)
				#	print(f'Breeder mit cId={breeder_c_id} aktualisiert (ID: {existing_breeder_id}{kennel_info})')
				#else:
				#	print(f'Breeder mit cId={breeder_c_id} bereits vorhanden (ID: {existing_breeder_id}{kennel_info})')
			else:
				# Erstelle neuen Breeder
				#breeder_id = ensure_breeder_exists(client, breeder_c_id, kennel_name, verbose)
				breeder_map[breeder_c_id] = breeder_id
				if breeder_id:
					stats['breeders_created'] += 1
			time.sleep(delay_between_requests)
		except Exception as exc:
			if verbose:
				print(f'Fehler beim Erstellen von Breeder cId={breeder_c_id}: {exc}', file=sys.stderr)
			breeder_map[breeder_c_id] = None

	for idx, record in enumerate(records):
		try:
			# Kleine Pause zwischen Anfragen, um den Server nicht zu überlasten
			if idx > 0:
				time.sleep(delay_between_requests)

			# Prüfe Verknüpfungen und erstelle Logmeldung
			owner_status = None
			breeder_status = None

			# Prüfe Owner-Verknüpfung
			if record.owner_id:
				owner_user_id = client.find_user_by_cid(record.owner_id)
				if owner_user_id:
					owner_status = f"gesetzt (User cId={record.owner_id})"
				else:
					owner_status = f"nicht gesetzt (User cId={record.owner_id} nicht gefunden)"
			else:
				owner_status = "nicht vorhanden"

			# Prüfe Breeder-Verknüpfung
			if record.breeder_id:
				breeder_id = breeder_map.get(record.breeder_id)
				if breeder_id:
					breeder_status = f"gesetzt (Breeder cId={record.breeder_id}, Relation gesetzt)"
				else:
					breeder_status = f"nicht gesetzt (Breeder cId={record.breeder_id} nicht gefunden)"
			else:
				breeder_status = "nicht vorhanden"

			# Logmeldung pro Hund
			print(f"Hund cId={record.c_id} ({record.given_name}): Owner={owner_status}, Breeder={breeder_status}")

			# Erstelle Payload
			# Die Verknüpfung Dog -> Owner erfolgt über cOwnerId (gemappt auf user.cId)
			# Die Verknüpfung Dog -> Breeder erfolgt über breeder: ID (Relation)
			breeder_id = breeder_map.get(record.breeder_id) if record.breeder_id else None
			payload = build_graphql_payload(
				record, 
				breeder_id=breeder_id
			)

			existing_id = client.find_by_cid(record.c_id)
			if existing_id:
				if verbose:
					print(f'Gefunden - Hund cId={record.c_id} (ID {existing_id})', file=sys.stderr)
				client.update_dog(existing_id, payload)
				stats['updated'] += 1
				if verbose:
					print(f'Aktualisiert Hund cId={record.c_id} (ID {existing_id})', file=sys.stderr)
			else:
				if verbose:
					print(f'Nicht gefunden - Hund cId={record.c_id}', file=sys.stderr)
				created_id = client.create_dog(payload)
				if created_id:
					stats['created'] += 1
					if verbose:
						print(f'Importiert Hund cId={record.c_id} (ID {created_id})', file=sys.stderr)
				else:
					stats['failed'] += 1
					print(f'Fehler: Konnte Hund cId={record.c_id} nicht erstellen', file=sys.stderr)
		except Exception as exc:  # pragma: no cover
			stats['failed'] += 1
			print(f'Fehler beim Import von Hund cId={record.c_id}: {exc}', file=sys.stderr)
			if verbose:
				import traceback
				traceback.print_exc()
	return stats


def build_arg_parser() -> argparse.ArgumentParser:
	parser = argparse.ArgumentParser(
		description='Importiert Chromosoft-Hundedaten via GraphQL in Strapi.'
	)
	parser.add_argument('csv_path', type=Path, help='Pfad zur Chromosoft CSV-Datei')
	parser.add_argument(
		'--dry-run',
		action='store_true',
		help='Nur analysieren, keine Mutationen senden'
	)
	parser.add_argument(
		'--verbose',
		action='store_true',
		help='Ausführliche Ausgaben anzeigen'
	)
	parser.add_argument(
		'--delay',
		type=float,
		default=0.1,
		help='Pause zwischen Anfragen in Sekunden (Standard: 0.1)'
	)
	parser.add_argument(
		'--max-retries',
		type=int,
		default=3,
		help='Maximale Anzahl Wiederholungen bei Fehlern (Standard: 3)'
	)
	return parser


def main() -> None:
	parser = build_arg_parser()
	args = parser.parse_args()

	csv_path: Path = args.csv_path
	if not csv_path.is_file():
		parser.error(f'Datei nicht gefunden: {csv_path}')

	token = os.getenv("TOKEN")
	endpoint = os.getenv("ENDPOINT")

	records = read_chromosoft_csv(csv_path)
	print(f'{len(records)} Datensätze aus {csv_path} gelesen.')

	if args.dry_run:
		print('Dry-Run aktiviert – es werden keine GraphQL-Mutationen gesendet.')
		for record in records:
			payload = build_graphql_payload(record)
			if args.verbose:
				print(f'cId={record.c_id}: {payload}')
		return

	client = GraphQLClient(endpoint, token, max_retries=args.max_retries, verbose=args.verbose)

	# Verbindungstest vor dem Import
	print(f'Teste Verbindung zu {endpoint}...', file=sys.stderr)
	if not client.test_connection():
		print(
			f'\nFEHLER: Konnte keine Verbindung zum GraphQL-Endpoint herstellen.\n'
			f'Endpoint: {endpoint}\n'
			f'\nMögliche Lösungen:\n'
			f'  1. Prüfe, ob der Server läuft\n'
			f'  2. Versuche "127.0.0.1" statt "localhost" (oder umgekehrt)\n'
			f'  3. Prüfe, ob der Port korrekt ist\n'
			f'  4. Prüfe Firewall-Einstellungen\n'
			f'  5. Teste den Endpoint im Browser: {endpoint}',
			file=sys.stderr
		)
		sys.exit(1)
	print('Verbindung erfolgreich!', file=sys.stderr)

	stats = import_records(records, client, verbose=args.verbose, delay_between_requests=args.delay)

	print('Import abgeschlossen:')
	for key, value in stats.items():
		print(f'  {key}: {value}')


if __name__ == '__main__':
	main()


