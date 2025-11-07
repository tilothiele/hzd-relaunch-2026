#!/usr/bin/env python3
from __future__ import annotations

import argparse
import csv
import os
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Optional


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


def row_to_record(row: dict[str, str]) -> DogRecord:
	return DogRecord(
		dog_id=parse_int(row.get('id', '')) or 0,
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


def build_arg_parser() -> argparse.ArgumentParser:
	parser = argparse.ArgumentParser(description='Liest Joomla-Hundedaten ein und prüft Bilddateien.')
	parser.add_argument('csv_path', type=Path, help='Pfad zur Joomla CSV-Datei')
	parser.add_argument('--image-root', type=Path, default=None, help='Optionales Wurzelverzeichnis für Bilddateien')
	return parser


def main() -> None:
	parser = build_arg_parser()
	args = parser.parse_args()

	csv_path: Path = args.csv_path
	image_root: Optional[Path] = args.image_root

	if not csv_path.is_file():
		parser.error(f'Datei nicht gefunden: {csv_path}')

	records = read_joomla_hunde(csv_path)

	for index, record in enumerate(records, start=1):
		print(f'Hund {index}: {record.dog_name or "<unbenannt>"} (ID {record.dog_id})')
		for field_name, value in asdict(record).items():
			print(f'  {field_name}: {value}')
		print('')

	missing_images = verify_images(records, image_root, csv_path)
	if missing_images:
		print('Warnung: Folgende Bilddateien konnten nicht gelesen werden:')
		for record, path in missing_images:
			print(f'  Hund-ID {record.dog_id} – erwartete Datei: {path}')
	else:
		print('Alle referenzierten Bilddateien sind lesbar.')


if __name__ == '__main__':
	main()