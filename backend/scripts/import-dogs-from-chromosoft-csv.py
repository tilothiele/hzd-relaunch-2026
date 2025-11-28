#!/usr/bin/env python3
from __future__ import annotations

import argparse
import csv
import sys
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any, Optional

try:
	import requests
except ImportError as exc:  # pragma: no cover
	print('Das Skript benötigt das Paket "requests". Installiere es mit "pip install requests".', file=sys.stderr)
	sys.exit(1)

# python scripts/import-dogs-from-chromosoft-csv.py \
#  pfad/zur/chromosoft.csv \
#  --graphql-endpoint http://localhost:1337/graphql \
#  --token <API_TOKEN> \
#  --verbose

DOG_BY_CID_QUERY = """
query DogByCId($cId: Int) {
  hzdPluginDogs(filters: { cId: { eq: $cId } }) {
    data {
      id
      documentId
    }
  }
}
"""

CREATE_DOG_MUTATION = """
mutation CreateDog($data: HzdPluginDogInput!) {
  createHzdPluginDog(data: $data) {
    data {
      id
      documentId
    }
  }
}
"""

UPDATE_DOG_MUTATION = """
mutation UpdateDog($id: ID!, $data: HzdPluginDogInput!) {
  updateHzdPluginDog(id: $id, data: $data) {
    data {
      id
      documentId
    }
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

HD_ENUM_MAP = {
	'A1': 'A1',
	'A2': 'A2',
	'B1': 'B1',
	'B2': 'B2',
	'A1(G)': 'A1',
	'A2(G)': 'A2',
	'B1(G)': 'B1',
	'B2(G)': 'B2',
	'-': None,
	'': None,
}

SOD1_ENUM_MAP = {
	'N/N': 'N/N',
	'N/DM': 'N/DM',
	'DM/DM': 'DM/DM',
	'-': None,
	'': None,
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
	hd_g: str
	hd: str
	sod1: str
	herzuntersuchung: str
	augenuntersuchung: str


class GraphQLClient:
	def __init__(self, endpoint: str, token: Optional[str], timeout: int = 30) -> None:
		self.endpoint = endpoint
		self.timeout = timeout
		self.session = requests.Session()
		self.session.headers.update({'Content-Type': 'application/json'})
		if token:
			self.session.headers['Authorization'] = f'Bearer {token}'

	def execute(self, query: str, variables: dict[str, Any]) -> dict[str, Any]:
		response = self.session.post(
			self.endpoint,
			json={'query': query, 'variables': variables},
			timeout=self.timeout,
		)
		response.raise_for_status()
		payload = response.json()
		errors = payload.get('errors', [])
		if errors:
			raise RuntimeError(f'GraphQL Fehler: {errors}')
		return payload

	def find_by_cid(self, c_id: Optional[int]) -> Optional[str]:
		if c_id is None:
			return None
		data = self.execute(DOG_BY_CID_QUERY, {"cId": c_id})
		collection = data.get('hzdPluginDogs', {})
		items = collection.get('data') or []
		if not items:
			return None
		return items[0].get('id')

	def create_dog(self, payload: dict[str, Any]) -> Optional[str]:
		data = self.execute(CREATE_DOG_MUTATION, {'data': payload})
		result = data.get('createHzdPluginDog', {})
		return result.get('data', {}).get('id')

	def update_dog(self, dog_id: str, payload: dict[str, Any]) -> Optional[str]:
		data = self.execute(UPDATE_DOG_MUTATION, {'id': dog_id, 'data': payload})
		result = data.get('updateHzdPluginDog', {})
		return result.get('data', {}).get('id')


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


def map_hd_enum(raw: str) -> Optional[str]:
	value = raw.strip()
	if not value or value == '-':
		return None
	# Entferne (G) falls vorhanden
	value = value.replace('(G)', '').strip()
	return HD_ENUM_MAP.get(value) or HD_ENUM_MAP.get(value.upper())


def map_sod1_enum(raw: str) -> Optional[str]:
	value = raw.strip()
	if not value or value == '-':
		return None
	return SOD1_ENUM_MAP.get(value) or SOD1_ENUM_MAP.get(value.upper())


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
		hd_g=row.get('HD(G)', '').strip(),
		hd=row.get('HD', '').strip(),
		sod1=row.get('Gentest SOD1', '').strip(),
		herzuntersuchung=row.get('Herzuntersuchung', '').strip(),
		augenuntersuchung=row.get('Augenuntersuchung', '').strip(),
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


def build_graphql_payload(record: ChromosoftDogRecord) -> dict[str, Any]:
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
	assign('cOwnerId', record.owner_id)
	assign('microchipNo', record.chip_number)

	# Geschlecht
	sex_enum = map_sex_enum(record.sex)
	assign('sex', sex_enum)

	# Daten
	assign('dateOfBirth', parse_iso_date(record.date_of_birth))
	assign('dateOfDeath', parse_iso_date(record.date_of_death))

	# HD: Verwende HD(G) falls vorhanden, sonst HD
	hd_value = record.hd_g if record.hd_g and record.hd_g != '-' else record.hd
	hd_enum = map_hd_enum(hd_value)
	assign('HD', hd_enum)

	# SOD1
	sod1_enum = map_sod1_enum(record.sod1)
	assign('SOD1', sod1_enum)

	# Boolean Checks
	heart_check = parse_bool_check(record.herzuntersuchung)
	if heart_check is not None:
		assign('HeartCheck', heart_check)

	eyes_check = parse_bool_check(record.augenuntersuchung)
	if eyes_check is not None:
		assign('EyesCheck', eyes_check)

	return payload


def import_records(
	records: list[ChromosoftDogRecord],
	client: GraphQLClient,
	verbose: bool,
) -> dict[str, int]:
	stats = {'created': 0, 'updated': 0, 'failed': 0}
	for record in records:
		try:
			payload = build_graphql_payload(record)
			existing_id = client.find_by_cid(record.c_id)
			if existing_id:
				client.update_dog(existing_id, payload)
				stats['updated'] += 1
				if verbose:
					print(f'Aktualisiert Hund cId={record.c_id} (ID {existing_id}).')
			else:
				created_id = client.create_dog(payload)
				stats['created'] += 1
				if verbose:
					print(f'Importiert Hund cId={record.c_id} (ID {created_id}).')
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
		'--graphql-endpoint',
		default='http://localhost:1337/graphql',
		help='GraphQL Endpoint von Strapi'
	)
	parser.add_argument(
		'--token',
		help='API-Token mit Berechtigung für die Dog-Collection'
	)
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
	return parser


def main() -> None:
	parser = build_arg_parser()
	args = parser.parse_args()

	csv_path: Path = args.csv_path
	if not csv_path.is_file():
		parser.error(f'Datei nicht gefunden: {csv_path}')

	records = read_chromosoft_csv(csv_path)
	print(f'{len(records)} Datensätze aus {csv_path} gelesen.')

	if args.dry_run:
		print('Dry-Run aktiviert – es werden keine GraphQL-Mutationen gesendet.')
		for record in records:
			payload = build_graphql_payload(record)
			if args.verbose:
				print(f'cId={record.c_id}: {payload}')
		return

	if not args.token:
		parser.error('Für den Import muss ein gültiges API-Token angegeben werden (--token).')

	client = GraphQLClient(args.graphql_endpoint, args.token)
	stats = import_records(records, client, verbose=args.verbose)

	print('Import abgeschlossen:')
	for key, value in stats.items():
		print(f'  {key}: {value}')


if __name__ == '__main__':
	main()

