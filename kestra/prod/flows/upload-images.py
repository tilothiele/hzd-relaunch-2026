#!/usr/bin/env python3
from __future__ import annotations

import argparse
import sys
import time
import shutil
import json
from pathlib import Path
from typing import Any, Optional
from dotenv import load_dotenv
import os
import requests
from requests.exceptions import ConnectionError, RequestException, Timeout

load_dotenv()

class StrapiClient:
	def __init__(self, api_url: str, token: Optional[str], timeout: int = 30, max_retries: int = 3, retry_delay: float = 1.0, verbose: bool = False) -> None:
		self.api_url = api_url
		self.timeout = timeout
		self.max_retries = max_retries
		self.retry_delay = retry_delay
		self.verbose = verbose
		self.session = requests.Session()
		if token:
			self.session.headers['Authorization'] = f'Bearer {token}'

	def upload(self, file_path: Path) -> dict[str, Any]:
		"""Führt einen File-Upload via REST API aus."""
		if self.verbose:
			print(f'Starte Upload für: {file_path}', file=sys.stderr)
            
		# Für Uploads muss 'Content-Type' multipart/form-data sein, was requests automatisch setzt, 
		# wenn 'files' übergeben wird. Wir müssen sicherstellen, dass wir keinen fixen JSON Content-Type haben.
		if 'Content-Type' in self.session.headers:
			del self.session.headers['Content-Type']

		max_attempts = max(1, min(self.max_retries, 10))
		last_exception = None

		for attempt in range(max_attempts):
			try:
				if attempt > 0:
					delay = self.retry_delay * (2 ** (attempt - 1))
					if self.verbose:
						print(f'Warte {delay:.1f}s vor Wiederholung {attempt + 1}/{max_attempts}...', file=sys.stderr)
					time.sleep(delay)

				if self.verbose:
					print(f'Verbinde mit: {self.api_url}', file=sys.stderr)

				# Datei öffnen und senden
				with open(file_path, 'rb') as f:
					files = {'files': (file_path.name, f, self._guess_mime_type(file_path))}
					
					response = self.session.post(
						self.api_url,
						files=files,
						timeout=self.timeout
					)
				
				if response.status_code not in (200, 201):
					if self.verbose:
						print(f'Status Code: {response.status_code}', file=sys.stderr)
						print(f'Response: {response.text}', file=sys.stderr)
				
				response.raise_for_status()
				
				# REST API gibt eine Liste von hochgeladenen Files zurück oder ein einzelnes Objekt
				# Strapi v4 upload endpoint returns array of files
				return response.json()
				
			except (ConnectionError, Timeout, RequestException) as e:
				last_exception = e
				if attempt < max_attempts - 1:
					if self.verbose:
						print(f'Verbindungsfehler (Versuch {attempt + 1}/{max_attempts}): {e}', file=sys.stderr)
					continue
				
				raise ConnectionError(
					f'Konnte keine Verbindung zu {self.api_url} herstellen nach {max_attempts} Versuchen: {e}'
				) from e
			except Exception as e:
				# Andere Fehler nicht wiederholen
				raise e

		if last_exception:
			raise last_exception
		raise RuntimeError(f'Unerwarteter Fehler bei der Ausführung nach {max_attempts} Versuchen')

	def _guess_mime_type(self, file_path: Path) -> str:
		import mimetypes
		mime_type, _ = mimetypes.guess_type(file_path)
		return mime_type or 'application/octet-stream'

def main() -> None:
	parser = argparse.ArgumentParser(description='Upload Images to Strapi Media Library via REST API')
	parser.add_argument('--verbose', action='store_true', help='Verbose output')
	args = parser.parse_args()

	token = os.getenv("TOKEN")
	# Wir versuchen, die Base URL aus der ENDPOINT variable abzuleiten (die auf GraphQL zeigt)
	graphql_endpoint = os.getenv("ENDPOINT")
	
	if not token or not graphql_endpoint:
		print("Error: TOKEN and ENDPOINT must be set in .env", file=sys.stderr)
		sys.exit(1)

	# Ermittle REST Upload URL aus GraphQL Endpoint
	# Bsp: http://localhost:1337/graphql -> http://localhost:1337/api/upload
	if '/graphql' in graphql_endpoint:
		base_url = graphql_endpoint.replace('/graphql', '')
	else:
		base_url = graphql_endpoint.rstrip('/')
	
	api_url = f"{base_url}/api/upload"

	print(f"Using Upload API URL: {api_url}")

	client = StrapiClient(api_url, token, verbose=args.verbose)

	images_dir = Path("legacy-images")

	if not images_dir.exists():
		print(f"Error: Directory '{images_dir}' does not exist.", file=sys.stderr)
		sys.exit(1)
        

	files = [f for f in images_dir.iterdir() if f.is_file()]
	
	if not files:
		print("No files found in images directory.")
		return

	print(f"Found {len(files)} files to upload.")

	success_count = 0
	fail_count = 0

	for file_path in files:
		try:
			print(f"Uploading {file_path.name}...")
			result = client.upload(file_path)
			
			# Strapi v4 gibt Array zurück
			is_success = False
			if isinstance(result, list) and len(result) > 0:
				if result[0].get('id') or result[0].get('url'):
					is_success = True
			elif isinstance(result, dict):
				if result.get('id') or result.get('url'):
					is_success = True

			if is_success:
				print(f"Successfully uploaded: {file_path.name}")
				success_count += 1
			else:
				print(f"Upload verification failed for {file_path.name}. Response: {result}", file=sys.stderr)
				fail_count += 1
				
		except Exception as e:
			print(f"Failed to upload {file_path.name}: {e}", file=sys.stderr)
			fail_count += 1

	print("-" * 30)
	print(f"Upload complete.")
	print(f"Success: {success_count}")
	print(f"Failed: {fail_count}")

if __name__ == '__main__':
	main()
