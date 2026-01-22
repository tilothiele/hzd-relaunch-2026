#!/usr/bin/env python3
"""
CSV Import Script for HZD Member Collection

This script imports member data from a CSV file into the Strapi member collection.
It uses the Strapi REST API to create members.

Usage:
    python import_members.py <csv_file> [--api-url URL] [--api-token TOKEN] [--dry-run]

Example:
    python import_members.py members.csv --api-url http://localhost:1337 --api-token YOUR_API_TOKEN
"""

import csv
import sys
import argparse
import requests
import time
from pathlib import Path
from datetime import datetime
from typing import Dict, Optional, Any
import re
from dotenv import load_dotenv
import os

load_dotenv()

# Mapping of country names to ISO 3166-1 alpha-2 codes
COUNTRY_CODES = {
    'Deutschland': 'DE',
    'Germany': 'DE',
    'Österreich': 'AT',
    'Austria': 'AT',
    'Schweiz': 'CH',
    'Switzerland': 'CH',
    # Add more as needed
}

REGION_MAPPING = {
    'Nord': 'Nord',
    'Süd': 'Sued',
    'Ost': 'Ost',
    'West': 'West',
    'Mitte': 'Mitte'
}

def parse_date(date_str: str) -> Optional[str]:
    """Parse date from DD/MM/YYYY format to YYYY-MM-DD format."""
    if not date_str or date_str.strip() == '-' or date_str.strip() == '':
        return None

    try:
        # Handle DD/MM/YYYY format
        date_obj = datetime.strptime(date_str.strip(), '%d/%m/%Y')
        return date_obj.strftime('%Y-%m-%d')
    except ValueError:
        try:
            # Try alternative formats
            date_obj = datetime.strptime(date_str.strip(), '%Y-%m-%d')
            return date_obj.strftime('%Y-%m-%d')
        except ValueError:
            print(f"Warning: Could not parse date '{date_str}'")
            return None

def parse_boolean(value: str) -> Optional[bool]:
    """Parse boolean from CSV value (0/1 or text)."""
    if not value or value.strip() == '-' or value.strip() == '':
        return None

    value = value.strip()
    if value in ['0', 'false', 'False', 'FALSE']:
        return False
    if value in ['1', 'true', 'True', 'TRUE']:
        return True
    return None

def parse_integer(value: str) -> Optional[int]:
    """Parse integer from CSV value."""
    if not value or value.strip() == '-' or value.strip() == '':
        return None

    try:
        # Remove any non-digit characters except minus sign
        cleaned = re.sub(r'[^\d-]', '', value.strip())
        return int(cleaned)
    except ValueError:
        return None

def parse_sex(salutation: str) -> Optional[str]:
    """Convert salutation to sex enum (M or F)."""
    if not salutation or salutation.strip() == '-' or salutation.strip() == '':
        return None

    salutation = salutation.strip().lower()
    if salutation in ['herr', 'mr', 'mr.', 'm']:
        return 'M'
    if salutation in ['frau', 'mrs', 'mrs.', 'ms', 'ms.', 'f']:
        return 'F'
    return None

def get_country_code(country_name: str) -> Optional[str]:
    """Convert country name to ISO 3166-1 alpha-2 code."""
    if not country_name or country_name.strip() == '-' or country_name.strip() == '':
        return None

    country_name = country_name.strip()
    return COUNTRY_CODES.get(country_name, country_name[:2].upper() if len(country_name) >= 2 else None)

def clean_string(value: str, max_length: Optional[int] = None) -> Optional[str]:
    """Clean string value and optionally truncate to max_length."""
    if not value or value.strip() == '-' or value.strip() == '':
        return None

    cleaned = value.strip()
    if max_length and len(cleaned) > max_length:
        cleaned = cleaned[:max_length]
    return cleaned

def map_csv_to_member(row: Dict[str, str]) -> Dict[str, Any]:
    """Map CSV row to Strapi member data structure."""
    member_data = {}

    # cId - unique identifier from CSV
    c_id = parse_integer(row.get('ID Person', ''))
    if c_id:
        member_data['cId'] = c_id

    # cFlagAccess - 0/1 access
#    access_flag = parse_boolean(row.get('0/1 access', ''))
#    if access_flag is not None:
#        member_data['cFlagAccess'] = access_flag

    # sex - from salutation
    sex = parse_sex(row.get('salutation', ''))
    if sex:
        member_data['sex'] = sex

    # title
    title = clean_string(row.get('title', ''))
    if title:
        member_data['title'] = title

    # firstName
    first_name = clean_string(row.get('firstname', ''))
    if first_name:
        member_data['firstName'] = first_name

    # lastName
    last_name = clean_string(row.get('lastname', ''))
    if last_name:
        member_data['lastName'] = last_name

    # adress1 - street
    street = clean_string(row.get('street', ''), max_length=100)
    if street:
        member_data['address1'] = street

    email = clean_string(row.get('email', ''), max_length=100)
    if email:
        member_data['email'] = email

    # zip
    zipcode = clean_string(row.get('zipcode', ''), max_length=10)
    if zipcode:
        member_data['zip'] = zipcode

    # city
    city = clean_string(row.get('city', ''))
    if city:
        member_data['city'] = city

    # region - oblast
    region = clean_string(row.get('oblast', ''))
    if region and region in ['Nord', 'Ost', 'Mitte', 'Süd', 'West']:
        mapped_region = REGION_MAPPING.get(region)
        if mapped_region:
            member_data['region'] = mapped_region

    # countryCode
    country_code = get_country_code(row.get('country', ''))
    if country_code:
        member_data['countryCode'] = country_code

    # phone - prefer mobile, fallback to phone
    phone = clean_string(row.get('mobile', ''), max_length=50)
    if not phone:
        phone = clean_string(row.get('phone', ''), max_length=50)
    if phone:
        member_data['phone'] = phone

    # cFlagBreeder - person is a breeder
    breeder_flag = parse_boolean(row.get('person is a breeder', ''))
    if breeder_flag is not None:
        member_data['cFlagBreeder'] = breeder_flag

    # membershipNo
    membership_no = parse_integer(row.get('membership number', ''))
#    if(not membership_no):
#        return None
    if membership_no:
        member_data['membershipNumber'] = membership_no
        member_data['username'] = str(membership_no)

    # dateOfBirth
    dob = parse_date(row.get('date of birth', ''))
    if dob:
        member_data['dateOfBirth'] = dob

    # dateOfDeath
    dod = parse_date(row.get('date of death', ''))
    if dod:
        member_data['dateOfDeath'] = dod

    # memberSince - date of joining
    member_since = parse_date(row.get('date of joining', ''))
    if member_since:
        member_data['memberSince'] = member_since

    # cancellationOn - date of leaving
    cancellation_on = parse_date(row.get('date of leaving', ''))
    if cancellation_on:
        member_data['cancellationOn'] = cancellation_on

    print(member_data)

    return member_data

def find_existing_user(api_url: str, api_token: Optional[str], c_id: int) -> Optional[int]:
    """Find existing member by cId using GraphQL. Returns member ID if found, None otherwise."""
    url = f"{api_url}"

    headers = {
        'Content-Type': 'application/json',
    }

    if api_token:
        headers['Authorization'] = f'Bearer {api_token}'

    query = """
    query FindUserByCId($cId: Int!) {
        usersPermissionsUsers(filters: { cId: { eq: $cId } }) {
            documentId
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
            data = result.get('data', {}).get('usersPermissionsUsers', [])
            if data and len(data) > 0:
                return data[0].get('documentId')
    except Exception as e:
        print(f"Warning: Error finding existing member: {e}")
        pass

    return None

def build_graphql_mutation(member_data: Dict[str, Any]) -> tuple[str, Dict[str, Any]]:
    """Build GraphQL mutation string and variables for creating a member."""
    member_data['password'] = 'Startstart'
    mutation = """
    mutation CreateUser($data: UsersPermissionsUserInput!) {
        createUsersPermissionsUser(data: $data) {
            data {
                documentId
                firstName
                lastName
                cId
            }
        }
    }
    """
    variables = {
        'data': member_data
    }

    return mutation, variables

def import_member(api_url: str, api_token: Optional[str], member_data: Dict[str, Any],
                  dry_run: bool = False) -> bool:
    """Import a single member via Strapi GraphQL API."""
    # Check if member with this cId already exists
    c_id = member_data.get('cId')
    existing_id = None

    if c_id and not dry_run:
        existing_id = find_existing_user(api_url, api_token, c_id)

    url = f"{api_url}"

    headers = {
        'Content-Type': 'application/json',
    }

    if api_token:
        headers['Authorization'] = f'Bearer {api_token}'

    if dry_run:
        if existing_id:
            print(f"[DRY RUN] Would skip member (ID: {existing_id}): Already exists")
        else:
            print(f"[DRY RUN] Would create member: {member_data}")
        return True

    if existing_id:
        print(f"⚠ Skipping member (cId: {c_id}): Already exists (ID: {existing_id})")
        return False

    try:
        # Build GraphQL mutation
        mutation, variables = build_graphql_mutation(member_data)

        response = requests.post(
            url,
            json={'query': mutation, 'variables': variables},
            headers=headers,
            timeout=30
        )

        if response.status_code == 200:
            result = response.json()

            if 'errors' in result:
                error_msg = '; '.join([err.get('message', str(err)) for err in result['errors']])
                print(f"✗ Failed to create member (cId: {member_data.get('cId', 'N/A')}): {error_msg}")
                return False

            data = result.get('data', {}).get('createUsersPermissionsUser', {}).get('data')

            if data:
                member_id = data.get('documentId', 'N/A')
                first_name = data.get('firstName', '')
                last_name = data.get('lastName', '')
                member_c_id = data.get('cId', member_data.get('cId', 'N/A'))
                print(f"✓ Created member: {first_name} {last_name} (cId: {member_c_id}, ID: {member_id})")
                return True
            else:
                print(f"✗ Failed to create member (cId: {member_data.get('cId', 'N/A')}): No data returned")
                return False
        else:
            error_msg = response.text
            print(f"✗ Failed to create member (cId: {member_data.get('cId', 'N/A')}): {response.status_code} - {error_msg}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"✗ Error creating member (cId: {member_data.get('cId', 'N/A')}): {e}")
        return False

def main():

    token = os.getenv("TOKEN")
    endpoint = os.getenv("ENDPOINT")


    parser = argparse.ArgumentParser(description='Import members from CSV into Strapi')
    parser.add_argument('csv_file', help='Path to CSV file')
    parser.add_argument('--dry-run', action='store_true',
                       help='Perform a dry run without actually creating members')

    args = parser.parse_args()

    # Read CSV file
    try:
        csv_path= Path(args.csv_file)
        if not csv_path.is_file():
            parser.error(f'Datei nicht gefunden: {csv_path}')

        with csv_path.open('r', encoding='utf-8', newline='') as f:
            # Try to detect delimiter
            sample = f.read(1024)
            f.seek(0)
            reader = csv.DictReader(f, delimiter=',')
            rows = list(reader)



    except FileNotFoundError:
        print(f"Error: File '{args.csv_file}' not found")
        sys.exit(1)
    except Exception as e:
        print(f"Error reading CSV file: {e}")
        sys.exit(1)

    if not rows:
        print("Error: CSV file is empty or has no data rows")
        sys.exit(1)

    print(f"Found {len(rows)} rows in CSV file")
    print(f"API URL: {endpoint}")
    if token:
        print(f"API Token: {'*' * 20} (provided)")
    else:
        print(f"API Token: Not provided (requests may fail if authentication is required)")
    print(f"Dry run: {args.dry_run}")
    print("-" * 60)

    # Process each row
    success_count = 0
    error_count = 0

    for i, row in enumerate(rows, 1):
        # Skip empty rows
        if not any(row.values()):
            continue

        print(f"\nProcessing row {i}/{len(rows)}...")

        # Map CSV to member data
        member_data = map_csv_to_member(row)

        if not member_data:
            print(f"⚠ Skipping row {i}: No valid data found")
            continue

        # Import member
        print(member_data)
        if import_member(endpoint, token, member_data, args.dry_run):
            success_count += 1
        else:
            error_count += 1

#        if(error_count>1):
#            return

        time.sleep(1)

    print("\n" + "=" * 60)
    print(f"Import complete!")
    print(f"Successfully imported: {success_count}")
    print(f"Errors: {error_count}")
    print(f"Total processed: {len(rows)}")

if __name__ == '__main__':
    main()

