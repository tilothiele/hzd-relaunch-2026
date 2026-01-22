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
        member_data['cEmail'] = email

    # zip
    zipcode = clean_string(row.get('zipcode', ''), max_length=5)
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

    # cFlagActiveBreeder - person is a breeder
    active_breeder_flag = parse_boolean(row.get('person is an active breeder', ''))
    if active_breeder_flag is not None:
        member_data['cFlagBreeder'] = active_breeder_flag

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

    # person is a member - map to blocked status
    # If not a member (0), then blocked=True
    is_member = parse_boolean(row.get('person is a member', ''))
    #print(c_id, is_member)
    if is_member is not None:
        member_data['blocked'] = not is_member

    # kennelName - breeding station
    kennel_name = clean_string(row.get('breeding station', ''))
    if kennel_name:
        member_data['kennelName'] = kennel_name

    return member_data

def find_existing_user_by_email(api_url: str, api_token: Optional[str], email: str) -> Optional[str]:
    """Find existing member by username using GraphQL. Returns documentId if found, None otherwise."""
    url = f"{api_url}"

    headers = {
        'Content-Type': 'application/json',
    }

    if api_token:
        headers['Authorization'] = f'Bearer {api_token}'

    query = """
    query FindUserByEmail($email: String!) {
        usersPermissionsUsers(filters: { email: { eq: $email } }) {
            documentId
        }
    }
    """

    try:
        response = requests.post(
            url,
            json={'query': query, 'variables': {'email': email}},
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

def find_existing_user(api_url: str, api_token: Optional[str], username: str) -> Optional[str]:
    """Find existing member by username using GraphQL. Returns documentId if found, None otherwise."""
    url = f"{api_url}"

    headers = {
        'Content-Type': 'application/json',
    }

    if api_token:
        headers['Authorization'] = f'Bearer {api_token}'

    query = """
    query FindUserByUsername($username: String!) {
        usersPermissionsUsers(filters: { username: { eq: $username } }) {
            documentId
        }
    }
    """

    try:
        response = requests.post(
            url,
            json={'query': query, 'variables': {'username': username}},
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

def find_existing_user_by_cid(api_url: str, api_token: Optional[str], c_id: int) -> Optional[str]:
    """Find existing member by cId using GraphQL. Returns documentId if found, None otherwise."""
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
        print(f"Warning: Error finding existing member by cId: {e}")
        pass

    return None

def register_user(api_url: str, api_token: Optional[str], username: str, email: str) -> Optional[str]:
    """Register a new user via GraphQL. Returns documentId if successful."""
    url = f"{api_url}"
    headers = {
        'Content-Type': 'application/json',
    }
    if api_token:
        headers['Authorization'] = f'Bearer {api_token}'

    mutation = """
    mutation Register($input: UsersPermissionsRegisterInput!) {
        register(input: $input) {
            user {
                documentId
                username
            }
        }
    }
    """

    # Use a default password for registration
    variables = {
        'input': {
            'username': username,
            'email': email if email else f"{username}@hzd-mitglieder.de", # Fallback email if missing
            'password': 'Startstart123!'
        }
    }

    try:
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
                print(f"✗ Failed to register user {username}: {error_msg}")
                return None
            return result.get('data', {}).get('register', {}).get('user', {}).get('documentId')
    except Exception as e:
        print(f"✗ Error registering user {username}: {e}")
    return None

def update_user_admin(api_url: str, api_token: Optional[str], document_id: str, member_data: Dict[str, Any]) -> bool:
    """Update user attributes via updateUserAdmin mutation."""
    url = f"{api_url}"
    headers = {
        'Content-Type': 'application/json',
    }
    if api_token:
        headers['Authorization'] = f'Bearer {api_token}'

    mutation = """
    mutation UpdateUserAdmin($id: ID!, $data: UsersPermissionsUserInput!) {
        updateUserAdmin(id: $id, data: $data) {
            data {
                documentId
                username
            }
        }
    }
    """

    # Remove fields that shouldn't be in the update data if they are not allowed or redundant
    # For now, we keep them as they are in UsersPermissionsUserInput

    variables = {
        'id': document_id,
        'data': member_data
    }

    try:
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
                print(f"✗ Failed to update user {document_id}: {error_msg}")
                # printf(result)
                return False
            return True
        else:
            print(response.json())
    except Exception as e:
        print(f"✗ Error updating user {document_id}: {e}")
    return False

def find_existing_breeder_by_cid(api_url: str, api_token: Optional[str], c_id: int) -> Optional[str]:
    """Find existing breeder by cId using GraphQL. Returns documentId if found, None otherwise."""
    url = f"{api_url}"

    headers = {
        'Content-Type': 'application/json',
    }

    if api_token:
        headers['Authorization'] = f'Bearer {api_token}'

    query = """
    query FindBreederByCId($cId: Int!) {
        hzdPluginBreeders(filters: { cId: { eq: $cId } }) {
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
            data = result.get('data', {}).get('hzdPluginBreeders', [])
            if data and len(data) > 0:
                return data[0].get('documentId')
    except Exception as e:
        print(f"Warning: Error finding existing breeder: {e}")
        pass

    return None

def create_breeder(api_url: str, api_token: Optional[str], breeder_data: Dict[str, Any]) -> Optional[str]:
    """Create a new breeder via GraphQL. Returns documentId if successful."""
    url = f"{api_url}"
    headers = {
        'Content-Type': 'application/json',
    }
    if api_token:
        headers['Authorization'] = f'Bearer {api_token}'

    mutation = """
    mutation CreateBreeder($data: HzdPluginBreederInput!) {
        createHzdPluginBreeder(data: $data) {
            documentId
        }
    }
    """

    variables = {
        'data': breeder_data
    }

    try:
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
                print(f"✗ Failed to create breeder: {error_msg}")
                return None
            return result.get('data', {}).get('createHzdPluginBreeder', {}).get('documentId')
    except Exception as e:
        print(f"✗ Error creating breeder: {e}")
    return None

def update_breeder(api_url: str, api_token: Optional[str], document_id: str, breeder_data: Dict[str, Any]) -> bool:
    """Update breeder attributes via GraphQL."""
    url = f"{api_url}"
    headers = {
        'Content-Type': 'application/json',
    }
    if api_token:
        headers['Authorization'] = f'Bearer {api_token}'

    mutation = """
    mutation UpdateBreeder($documentId: ID!, $data: HzdPluginBreederInput!) {
        updateHzdPluginBreeder(documentId: $documentId, data: $data) {
            documentId
        }
    }
    """

    variables = {
        'documentId': document_id,
        'data': breeder_data
    }

    try:
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
                print(f"✗ Failed to update breeder {document_id}: {error_msg}")
                return False
            return True
    except Exception as e:
        print(f"✗ Error updating breeder {document_id}: {e}")
    return False

def import_member(api_url: str, api_token: Optional[str], member_data: Dict[str, Any],
                  dry_run: bool = False) -> bool:
    """Import a single member by searching, registering if needed, and then updating."""
    username = member_data.get('username')
    if not username:
        cId = member_data.get("cId")
        if cId:
             username = f"user-{cId}"
        else:
             print("Skipping member without username or cId")
             return False

    email = member_data.get('email')
    if not email:
        email = f"{username}@hovawarte.com"

    # Separate breeder data from member data
    kennel_name = member_data.pop('kennelName', None)
    is_breeder = member_data.get('cFlagBreeder', False)
    
    # 1. Search for existing user
    existing_document_id = None
    existing_breeder_id = None
    c_id = member_data.get('cId')

    if not dry_run:
        # First try finding by cId
        if c_id:
            existing_document_id = find_existing_user_by_cid(api_url, api_token, c_id)

        # Fallback to username
        if not existing_document_id:
            existing_document_id = find_existing_user(api_url, api_token, username)
        
        # Fallback to email
        if not existing_document_id:
            h = find_existing_user_by_email(api_url, api_token, email)
            if h:
                # If found by email, we might want to update the username to match what we expect?
                # For now, just use the found user.
                existing_document_id = h
                # email = f"{username}@hovawarte.com" # This logic was a bit weird in original, keeping it simple.
        
        if c_id and is_breeder:
            existing_breeder_id = find_existing_breeder_by_cid(api_url, api_token, c_id)

    if dry_run:
        if existing_document_id:
            print(f"[DRY RUN] Found existing user: {username} ({existing_document_id}) - Would update")
        else:
            print(f"[DRY RUN] User not found: {username} - Would register and update")
        
        if is_breeder:
             if existing_breeder_id:
                 print(f"[DRY RUN] Found existing breeder for cId {c_id} - Would update with kennel: {kennel_name}")
             else:
                 print(f"[DRY RUN] Breeder not found for cId {c_id} - Would create with kennel: {kennel_name}")
        return True

    # 2. Register if not exists
    document_id = existing_document_id
    if not document_id:
        document_id = register_user(api_url, api_token, username, email)
        if document_id:
            print(f"✓ Registered new user: {username} (ID: {document_id})")
        else:
            print(f"x not Registered new user: {username} (email: {email})")
            return False
    else:
        print(f"ℹ Found existing user: {username} (ID: {document_id})")

    # 3. Update via updateUserAdmin
    if document_id:
        if update_user_admin(api_url, api_token, document_id, member_data):
            print(f"✓ Updated user: {username} (ID: {document_id})")
            
            # 4. Handle Breeder Logic
            if is_breeder and c_id:
                breeder_data = {
                    'cId': c_id,
                    'IsActive': True,
                    'member': document_id, # Link to the member
                }
                if kennel_name:
                    breeder_data['kennelName'] = kennel_name

                if existing_breeder_id:
                    if update_breeder(api_url, api_token, existing_breeder_id, breeder_data):
                        print(f"✓ Updated breeder for user {username}")
                    else:
                        print(f"✗ Failed to update breeder for user {username}")
                else:
                    if create_breeder(api_url, api_token, breeder_data):
                        print(f"✓ Created new breeder for user {username}")
                    else:
                        print(f"✗ Failed to create breeder for user {username}")

            return True
        else:
            print(f"✗ Failed to update user: {username}")
            return False

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
        # print(member_data)
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

