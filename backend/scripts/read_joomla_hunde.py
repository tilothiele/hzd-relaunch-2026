#!/usr/bin/env python3
from __future__ import annotations

import argparse
import csv
import os
import sys
from dataclasses import asdict, dataclass
from datetime import datetime
import mimetypes
from pathlib import Path
from typing import Any, Optional
from urllib.parse import urlparse, urljoin

try:
	import requests
except ImportError as exc:  # pragma: no cover
	print('Das Skript benötigt das Paket "requests". Installiere es mit "pip install requests".', file=sys.stderr)
	sys.exit(1)

# python scripts/read_joomla_hunde.py \
#  pfad/zur/hunde.csv \
#  --image-root public/uploads \
#  --graphql-endpoint http://localhost:1337/graphql \
#  --token <API_TOKEN> \
#  --verbose

@dataclass
class DogRecord:
	dog_id: int
	breeder_id: Optional[int]
	breeder_name: str
	dog_name: str
	regional_group: str
	birthday: str
	coat_color: str
	evaluation_notes: str
	litter_codes: str
	mating_count: Optional[int]
	breeding_category: str
	sex: str
	litter_kind: Optional[int]
	withers_height_cm: Optional[float]
	image_filename: Optional[str]
	parents_info: str
	exhibition_results: str
	checked_out_flag: bool
	checked_out_time: str


DOG_BY_JID_QUERY = """
query DogByJId($jid: Int) {
  hzdPluginDogs(filters: { jId: { eq: $jid } }) {
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
mutation UpdateDog($id: ID!, $data: HzdPluginDogInput!) {
  updateHzdPluginDog(id: $id, data: $data) {
    documentId
  }
}
"""


COLOR_MAP = {
	'': None,
	'schwarz': 'S',
	'schwarzmarken': 'SM',
	'schwarz-marken': 'SM',
	'sm': 'SM',
	'schwarz/marken': 'SM',
	'schwarz-markiert': 'SM',
	'braun': 'B',
	'braunmarken': 'B',
	'bm': 'B',
}

SEX_ENUM_MAP = {
	'1': 'F',
	'weiblich': 'F',
	'hündin': 'F',
	'f': 'F',
	'female': 'F',
	'0': 'M',
	'rüde': 'M',
	'männlich': 'M',
	'm': 'M',
	'male': 'M',
}


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
		print('response', response.text)
		response.raise_for_status()
		payload = response.json()
		errors = payload.get('errors', [])
		if errors:
			print('error', error)
			raise RuntimeError(f'GraphQL Fehler: {errors}')
		return payload

	def find_by_jid(self, jid: Optional[int]) -> Optional[str]:
		if jid is None:
			return None
		print('findbyjid', jid)
		data = self.execute(DOG_BY_JID_QUERY, {"jid": jid})
		print('data', data)
		collection = data.get('hzdPluginDogs', {})
		items = collection.get('data') or []
		if not items:
			return None
		return items[0].get('id')

	def create_dog(self, payload: dict[str, Any]) -> Optional[str]:
		print('create_dog', payload)
		data = self.execute(CREATE_DOG_MUTATION, {'data': payload})
		return data.get('createHzdPluginDog', {}).get('data', {}).get('id')

	def update_dog(self, dog_id: str, payload: dict[str, Any]) -> Optional[str]:
		print('update_dog', dog_id, payload)
		data = self.execute(UPDATE_DOG_MUTATION, {'id': dog_id, 'data': payload})
		return data.get('updateHzdPluginDog', {}).get('data', {}).get('id')


class StrapiUploader:
	def __init__(self, endpoint: str, token: Optional[str], timeout: int = 60) -> None:
		self.endpoint = endpoint
		self.timeout = timeout
		self.session = requests.Session()
		if token:
			self.session.headers['Authorization'] = f'Bearer {token}'
		self._cache: dict[Path, int] = {}

	def upload(self, file_path: Path) -> int:
		resolved = file_path.resolve()
		if resolved in self._cache:
			return self._cache[resolved]
		mime_type, _ = mimetypes.guess_type(str(resolved))
		with resolved.open('rb') as handle:
			files = {'files': (resolved.name, handle, mime_type or 'application/octet-stream')}
			response = self.session.post(self.endpoint, files=files, timeout=self.timeout)
		response.raise_for_status()
		payload = response.json()
		if isinstance(payload, list) and payload:
			entry = payload[0]
		else:
			entry = payload
		file_id = entry.get('id')
		if file_id is None:
			raise RuntimeError(f'Upload-Antwort ohne id: {payload}')
		self._cache[resolved] = file_id
		return file_id


def derive_default_upload_endpoint(graphql_endpoint: str) -> str:
	parsed = urlparse(graphql_endpoint)
	base_path = parsed.path or ''
	if base_path.endswith('/graphql'):
		base_path = base_path[:-len('/graphql')]
	base = parsed._replace(path=base_path, params='', query='', fragment='').geturl().rstrip('/')
	return urljoin(base + '/', 'api/upload')


def parse_int(value: str) -> Optional[int]:
	value = value.strip()
	if not value:
		return None
	try:
		return int(value)
	except ValueError:
		return None


def parse_float(value: str) -> Optional[float]:
	value = value.strip().replace(',', '.')
	if not value:
		return None
	try:
		return float(value)
	except ValueError:
		return None


def parse_bool_flag(value: str) -> bool:
	return value.strip() not in {'', '0', 'false', 'False'}


def parse_iso_date(value: str) -> Optional[str]:
	value = value.strip()
	if not value:
		return None
	for fmt in ('%d.%m.%Y', '%Y-%m-%d', '%d-%m-%Y'):
		try:
			return datetime.strptime(value, fmt).date().isoformat()
		except ValueError:
			continue
	return None


def map_color_enum(coat_color: str) -> Optional[str]:
	key = coat_color.strip().lower()
	return COLOR_MAP.get(key)


def map_sex_enum(raw: str) -> Optional[str]:
	key = raw.strip().lower()
	return SEX_ENUM_MAP.get(key)


def extract_given_name(name: str) -> Optional[str]:
	name = name.strip()
	if not name:
		return None
	parts = name.replace('-', ' ').split()
	return parts[0] if parts else None


def row_to_record(row: dict[str, str]) -> DogRecord:
	dog_id_value = parse_int(row.get('id', ''))
	if dog_id_value is None:
		raise ValueError('Jeder Datensatz benötigt eine gültige id (dog_id).')
	return DogRecord(
		dog_id=dog_id_value,
		breeder_id=parse_int(row.get('breederid', '')),
		breeder_name=row.get('zuechter', '').strip(),
		dog_name=row.get('name', '').strip(),
		regional_group=row.get('regio', '').strip(),
		birthday=row.get('birthday', '').strip(),
		coat_color=row.get('color', '').strip(),
		evaluation_notes=row.get('bonitation', '').strip(),
		litter_codes=row.get('litter', '').strip(),
		mating_count=parse_int(row.get('matings', '')),
		breeding_category=row.get('category', '').strip(),
		sex=row.get('sex', '').strip(),
		litter_kind=parse_int(row.get('litterkind', '')),
		withers_height_cm=parse_float(row.get('withersheight', '')),
		image_filename=row.get('image', '').strip() or None,
		parents_info=row.get('parents', '').strip(),
		exhibition_results=row.get('exhibitions', '').strip(),
		checked_out_flag=parse_bool_flag(row.get('checked_out', '')),
		checked_out_time=row.get('checked_out_time', '').strip(),
	)


def read_joomla_hunde(file_path: Path) -> list[DogRecord]:
	with file_path.open('r', encoding='utf-8', newline='') as handle:
		reader = csv.DictReader(handle, delimiter=';')
		return [row_to_record(row) for row in reader]


def resolve_image_path(image_name: str, image_root: Optional[Path], csv_file: Path) -> Path:
	image_path = Path(image_name)
	if not image_path.is_absolute():
		base_dir = image_root if image_root is not None else csv_file.parent
		image_path = base_dir / image_path
	return image_path


def verify_images(records: list[DogRecord], image_root: Optional[Path], csv_file: Path) -> list[tuple[DogRecord, Path]]:
	missing: list[tuple[DogRecord, Path]] = []
	for record in records:
		if not record.image_filename:
			continue
		candidate = resolve_image_path(record.image_filename, image_root, csv_file)
		if not (candidate.is_file() and os.access(candidate, os.R_OK)):
			missing.append((record, candidate))
	return missing


def build_graphql_payload(record: DogRecord) -> dict[str, Any]:
	payload: dict[str, Any] = {}

	def assign(key: str, value: Any) -> None:
		if value is None:
			return
		if isinstance(value, str) and not value.strip():
			return
		payload[key] = value

	assign('jId', record.dog_id)
	assign('jBreederId', record.breeder_id)
	assign('jBreeder', record.breeder_name)
	assign('jRegion', record.regional_group)
	assign('jBonitation', record.evaluation_notes)
	assign('jLitter', record.litter_codes)
	if record.mating_count is not None:
		assign('jMantings', str(record.mating_count))
	assign('jCategory', record.breeding_category)
	assign('jSex', parse_int(record.sex))
	assign('jLitterKind', str(record.litter_kind) if record.litter_kind is not None else None)
	if record.withers_height_cm is not None:
		assign('jWithersHeight', int(round(record.withers_height_cm)))
	assign('jExhibitions', record.exhibition_results)
	assign('jImage', record.image_filename)

	assign('fullKennelName', record.dog_name)
	assign('givenName', extract_given_name(record.dog_name))
	assign('dateOfBirth', parse_iso_date(record.birthday))

	color_enum = map_color_enum(record.coat_color)
	assign('color', color_enum)

	sex_enum = map_sex_enum(record.sex)
	assign('sex', sex_enum)

	return payload


def import_records(
	records: list[DogRecord],
	client: GraphQLClient,
	uploader: Optional[StrapiUploader],
	csv_path: Path,
	image_root: Optional[Path],
	verbose: bool,
) -> dict[str, int]:
	stats = {'created': 0, 'updated': 0, 'failed': 0}
	for record in records:
		payload = build_graphql_payload(record)
		avatar_id: Optional[int] = None
		if uploader and record.image_filename:
			image_path = resolve_image_path(record.image_filename, image_root, csv_path)
			if image_path.is_file() and os.access(image_path, os.R_OK):
				try:
					avatar_id = uploader.upload(image_path)
					if verbose:
						print(f'Bild für jId={record.dog_id} hochgeladen (Media-ID {avatar_id}).')
				except Exception as exc:  # pragma: no cover
					print(f'Warnung: Bild-Upload fehlgeschlagen für {image_path}: {exc}', file=sys.stderr)
			else:
				if verbose:
					print(f'Warnung: Bildpfad nicht lesbar, überspringe Avatar-Verknüpfung ({image_path}).')
		if avatar_id is not None:
			payload['avatar'] = avatar_id
		try:
			existing_id = client.find_by_jid(record.dog_id)
			print(existing_id)
			if existing_id:
				client.update_dog(existing_id, payload)
				stats['updated'] += 1
				if verbose:
					print(f'Aktualisiert Hund jId={record.dog_id} (ID {existing_id}).')
				continue

			created_id = client.create_dog(payload)
			stats['created'] += 1
			if verbose:
				print(f'Importiert Hund jId={record.dog_id} (ID {created_id}).')
		except Exception as exc:  # pragma: no cover
			stats['failed'] += 1
			print(f'Fehler beim Import von Hund jId={record.dog_id}: {exc}', file=sys.stderr)
	return stats


def build_arg_parser() -> argparse.ArgumentParser:
	parser = argparse.ArgumentParser(description='Importiert Joomla-Hundedaten via GraphQL in Strapi.')
	parser.add_argument('csv_path', type=Path, help='Pfad zur Joomla CSV-Datei')
	parser.add_argument('--image-root', type=Path, default=None, help='Optionales Wurzelverzeichnis für Bilddateien')
	parser.add_argument('--graphql-endpoint', default='http://localhost:1337/graphql', help='GraphQL Endpoint von Strapi')
	parser.add_argument('--token', help='API-Token mit Berechtigung für die Dog-Collection')
	parser.add_argument('--dry-run', action='store_true', help='Nur analysieren, keine Mutationen senden')
	parser.add_argument('--verbose', action='store_true', help='Ausführliche Ausgaben anzeigen')
	parser.add_argument('--upload-endpoint', help='REST Upload Endpoint (Standard: von GraphQL-URL abgeleitet)')
	return parser


def main() -> None:
	parser = build_arg_parser()
	args = parser.parse_args()

	csv_path: Path = args.csv_path
	if not csv_path.is_file():
		parser.error(f'Datei nicht gefunden: {csv_path}')

	records = read_joomla_hunde(csv_path)
	print(f'{len(records)} Datensätze aus {csv_path} gelesen.')

	missing_images = verify_images(records, args.image_root, csv_path)
	if missing_images:
		print('Warnung: Folgende Bilddateien konnten nicht gelesen werden:')
		for record, path in missing_images:
			print(f'  Hund-ID {record.dog_id or "?"}: {path}')
	else:
		print('Alle referenzierten Bilddateien sind lesbar oder nicht angegeben.')

	if args.dry_run:
		print('Dry-Run aktiviert – es werden keine GraphQL-Mutationen gesendet.')
		for record in records:
			print(asdict(record)) if args.verbose else None
		return

	if not args.token:
		parser.error('Für den Import muss ein gültiges API-Token angegeben werden (--token).')

	upload_endpoint = args.upload_endpoint or derive_default_upload_endpoint(args.graphql_endpoint)
	if args.verbose:
		print(f'Verwende Upload Endpoint: {upload_endpoint}')

	uploader = StrapiUploader(upload_endpoint, args.token)
	client = GraphQLClient(args.graphql_endpoint, args.token)
	stats = import_records(
		records,
		client,
		uploader,
		csv_path,
		args.image_root,
		verbose=args.verbose,
	)

	print('Import abgeschlossen:')
	for key, value in stats.items():
			print(f'  {key}: {value}')


if __name__ == '__main__':
	main()