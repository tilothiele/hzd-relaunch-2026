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
from typing import Dict, Optional, Any, List
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

def is_valid_email(email: str) -> bool:
    """Check if email format is valid."""
    if not email:
        return False
    # Simple regex for email validation
    # Disallow leading/trailing dots and consecutive dots in local part
    pattern = r'^[a-zA-Z0-9_%+-]+(\.[a-zA-Z0-9_%+-]+)*@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

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
        if is_valid_email(email):
            member_data['cEmail'] = email
        else:
            # print(f"Warning: Invalid email found: {email} - ignoring")
            pass

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

    # cFlagActiveBreeder - person is an active breeder
    active_breeder_flag = parse_boolean(row.get('person is an active breeder', ''))
    if active_breeder_flag is not None:
        member_data['IsActiveBreeder'] = active_breeder_flag

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
    
    # Calculate blocked status based on dates
    today = datetime.now().date()
    is_blocked_by_date = False

    if member_since:
        try:
             # member_since is YYYY-MM-DD string
             ms_date = datetime.strptime(member_since, '%Y-%m-%d').date()
             if ms_date > today:
                 is_blocked_by_date = True
        except ValueError:
            pass

    if cancellation_on:
        try:
            co_date = datetime.strptime(cancellation_on, '%Y-%m-%d').date()
            if co_date < today:
                is_blocked_by_date = True
        except ValueError:
             pass

    if is_member is not None:
        # Blocked if NOT member OR blocked by date logic
        member_data['blocked'] = (not is_member) or is_blocked_by_date
    elif is_blocked_by_date:
        # If is_member is missing but date logic says blocked, set blocked
        member_data['blocked'] = True

    # kennelName - breeding station
    kennel_name = clean_string(row.get('breeding station', ''))
    if kennel_name:
        member_data['kennelName'] = kennel_name

    return member_data

def validate_chromosoft_users(rows: List[Dict[str, str]]) -> bool:
    """
    Validate all loaded CSV rows.
    Returns True if validation passes (or warnings only), False if critical errors (optional).
    Currently just prints report.
    """
    print(f"\nValidating {len(rows)} CSV rows...")
    today = datetime.now().date()
    email_counts = {}
    active_members_with_invalid_email = []

    msg_list = []

    for i, row in enumerate(rows, 1):
        # Logic to determine if active
        doj_str = parse_date(row.get('date of joining', ''))
        dol_str = parse_date(row.get('date of leaving', ''))
        
        is_active_candidate = False
        
        if doj_str:
            try:
                doj = datetime.strptime(doj_str, '%Y-%m-%d').date()
                if doj <= today:
                    # Check leaving date
                    if not dol_str:
                        is_active_candidate = True
                    else:
                        dol = datetime.strptime(dol_str, '%Y-%m-%d').date()
                        if dol >= today: # Future or today
                            is_active_candidate = True
            except ValueError:
                pass
                
        if is_active_candidate:
            email = row.get('email', '').strip()
            
            # Check validity
            if not is_valid_email(email):
                status = row.get('person is a member', '')
                # membership status field? User mentioned 'membership status' in last edit to verification logic
                # checking what key is in CSV. 'person is a member' is 0/1. 
                # 'membership status' might be another column? 
                # In previous file view of verification.py, user changed 'person is a member' to 'membership status'.
                # I should check if 'membership status' exists in row, else fallback.
                
                status_val = row.get('membership status') or row.get('person is a member', '')

                active_members_with_invalid_email.append({
                    'row': i,
                    'name': f"{row.get('firstname', '')} {row.get('lastname', '')}",
                    'id': row.get('ID Person', ''),
                    'email': email,
                    'status': status_val,
                    'issue': 'Invalid or Empty Email'
                })
            else:
                # Check uniqueness (only for valid emails)
                email_lower = email.lower()
                status_val = row.get('membership status') or row.get('person is a member', '')
                member_info = {
                    'row': i, 
                    'id': row.get('ID Person', ''), 
                    'name': f"{row.get('firstname', '')} {row.get('lastname', '')}",
                    'status': status_val
                }
                if email_lower in email_counts:
                    email_counts[email_lower].append(member_info)
                else:
                    email_counts[email_lower] = [member_info]

    # Report
    invalid_count = len(active_members_with_invalid_email)
    
    duplicates = {email: members for email, members in email_counts.items() if len(members) > 1}
    duplicate_count = len(duplicates)
    
    print("\n--- Validation Report (Pre-Import) ---")
    
    if invalid_count > 0:
        print(f"\n[WARN] Found {invalid_count} active members with invalid/empty emails:")
        for item in active_members_with_invalid_email:
             print(f"  ({item['id']} {item['name']}) - Status: {item['status']} - Email: '{item['email']}'")
    else:
        print("\n[PASS] All active members have valid email format.")

    if duplicate_count > 0:
         print(f"\n[WARN] Found {duplicate_count} emails used by multiple active members:")
         for email, members in list(duplicates.items()):
             members_str = ", ".join([f"({m['id']} {m['name']} Status: {m['status']})" for m in members])
             print(f"  Email '{email}' used by: {members_str}")
    else:
         print("\n[PASS] All active members have unique emails.")
         
    return True # Always return True to allow import to proceed (just warning)
    
def resolve_email_conflicts(rows: List[Dict[str, str]]) -> None:
    """
    Resolve email conflicts within the CSV data.
    If multiple rows share the same email, and at least one is an Active Member,
    remove the email from all Inactive Members sharing it.
    """
    print(f"\nResolving email conflicts in {len(rows)} rows...")
    today = datetime.now().date()
    email_map = {} # email -> list of (index, row)

    # 1. Build Map
    for i, row in enumerate(rows):
        email = row.get('email', '').strip()
        if not email or not is_valid_email(email):
            continue
        
        email_lower = email.lower()
        if email_lower in email_map:
            email_map[email_lower].append((i, row))
        else:
            email_map[email_lower] = [(i, row)]

    # 2. Process Duplicates
    resolved_count = 0
    
    for email, entries in email_map.items():
        if len(entries) < 2:
            continue
            
        # Check functionality to identify priority members (Status == 'Mitglied')
        priority_indices = []
        non_priority_indices = []
        
        for idx, row in entries:
            # Logic: Priority based on 'membership status' == 'Mitglied'
            try:
                # Get status, strip whitespace and check
                status = row.get('membership status', '').strip()
                if status == 'Mitglied':
                    priority_indices.append(idx)
                else:
                    non_priority_indices.append(idx)
            except Exception:
                non_priority_indices.append(idx)
        
        # 3. Resolve
        # If we have at least one Priority Member, clear email from Non-Priority Members
        if len(priority_indices) > 0 and len(non_priority_indices) > 0:
            print(f"  Conflict for '{email}': Found {len(priority_indices)} 'Mitglied' and {len(non_priority_indices)} others.")
            for idx in non_priority_indices:
                rows[idx]['email'] = '' # Clear email
                resolved_count += 1
                # print(f"    -> Removed email from non-member row {idx+1}")
                
    print(f"Resolved {resolved_count} email conflicts.")

def has_changes(new_data: Dict[str, Any], existing_user: Dict[str, Any]) -> bool:
    """
    Compare new member data (from CSV) with existing user data (from Website).
    Returns True if there are differences that need updating.
    """
    # Define fields to compare. 
    # Note: CSV data keys map to Strapi fields as defined in map_csv_to_member
    
    # Simple direct comparison for most fields
    # Special handling might be needed for dates (str vs date obj) or numbers
    
    fields_to_compare = [
        'firstName', 'lastName', 'title', 'sex', 
        'address1', 'zip', 'city', 'region', 'countryCode', 
        'phone', 'cFlagBreeder', 'IsActiveBreeder', 
        'membershipNumber', 'kennelName', 'cEmail',
        'blocked' # Important
    ]

    for field in fields_to_compare:
        new_val = new_data.get(field)
        old_val = existing_user.get(field)

        # Normalize for comparison
        # CSV data might be None, Website data might be None
        
        # Date fields in existing_user are usually strings 'YYYY-MM-DD' from JSON
        # Date fields in new_data might be date objects or strings? 
        # map_csv_to_member returns date objects for date fields.
        
        # Let's verify map_csv_to_member output types
        # parse_date returns 'YYYY-MM-DD' string.
        # map_csv_to_member calls parse_date.
        # So dates are strings in new_data too. Good.
        
        # Specific handling:
        # blocked: boolean.
        # cFlagBreeder: boolean.
        
        if new_val is None and old_val is None:
            continue
            
        if new_val == '' and old_val is None:
             continue
             
        if new_val is None and old_val == '':
             continue
             
        # Convert to string for loose comparison if not None/Bool
        if not isinstance(new_val, (bool, type(None))) and not isinstance(old_val, (bool, type(None))):
            if str(new_val).strip() != str(old_val).strip():
                # print(f"Change detected in {field}: '{new_val}' vs '{old_val}'")
                return True
        elif new_val != old_val:
             # Boolean or None mismatch
            # print(f"Change detected in {field}: '{new_val}' vs '{old_val}'")
            return True
            
    # Date fields
    date_fields = ['dateOfBirth', 'dateOfDeath', 'memberSince', 'cancellationOn']
    for field in date_fields:
        new_val = new_data.get(field)
        old_val = existing_user.get(field)
        
        if new_val is None and old_val is None:
            continue
            
        # Comparison logic for dates (both strings YYYY-MM-DD)
        if new_val != old_val:
             return True

    return False

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

    return None

def fetch_all_users(api_url: str, api_token: Optional[str]) -> List[Dict[str, Any]]:
    """Fetch all users from Strapi via GraphQL using pagination."""
    url = f"{api_url}"
    headers = {'Content-Type': 'application/json'}
    if api_token:
        headers['Authorization'] = f'Bearer {api_token}'

    all_users = []
    page = 1
    page_size = 100
    has_more = True

    print("Fetching all users from GraphQL...")
    
    while has_more:
        query = """
        query GetAllUsers($page: Int!, $pageSize: Int!) {
            usersPermissionsUsers(pagination: { page: $page, pageSize: $pageSize }) {
                documentId
                username
                email
                cEmail
                cId
                blocked
                firstName
                lastName
                title
                sex
                address1
                zip
                city
                region
                countryCode
                phone
                cFlagBreeder
                IsActiveBreeder
                membershipNumber
                dateOfBirth
                dateOfDeath
                memberSince
                cancellationOn
                kennelName
            }
        }
        """ # Note: Assuming schema allows pagination args on usersPermissionsUsers. 
            # If not, we might need a different approach or the schema is different.
            # Strapi v4 usually requires 'pagination' arg.

        # If the standard query structure is different (e.g. wrapper), act accordingly.
        # Based on existing queries, it returns a list directly? 
        # Existing: usersPermissionsUsers(filters: ...) -> [User]
        # Valid Strapi query usually allows pagination.

        try:
            response = requests.post(
                url,
                json={'query': query, 'variables': {'page': page, 'pageSize': page_size}},
                headers=headers,
                timeout=60
            )

            if response.status_code != 200:
                print(f"Error fetching users page {page}: {response.status_code}")
                break

            result = response.json()
            if 'errors' in result:
                print(f"GraphQL Errors: {result['errors']}")
                break

            data = result.get('data', {}).get('usersPermissionsUsers', [])
            
            if not data:
                has_more = False
            else:
                all_users.extend(data)
                print(f"  Fetched {len(data)} users (Total: {len(all_users)})")
                if len(data) < page_size:
                    has_more = False
                else:
                    page += 1
                    
        except Exception as e:
            print(f"Exception fetching users: {e}")
            break

    return all_users

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
        else:
            print(f"✗ Failed to register user {username}: {response.status_code}")
            print(response.text)
            return None
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


def block_conflicting_email(api_url: str, api_token: Optional[str], real_email: str, 
                          website_users_by_email: Dict[str, Dict], dry_run: bool) -> None:
    """
    Check if email is occupied by another user (different cId or no cId).
    If so, block that user and rename their email to free it up.
    """
    if not real_email:
        return

    existing_email_user = website_users_by_email.get(real_email.lower())
    if existing_email_user:
        conflict_cid = existing_email_user.get('cId')
        conflict_username = existing_email_user.get('username')
        conflict_doc_id = existing_email_user.get('documentId')
        
        print(f"Blocking existing user {conflict_username} (cId: {conflict_cid}) occupying email {real_email}...")
        
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        blocked_email = f"blocked_{timestamp}_{real_email}"
        
        update_data = {
            'blocked': True,
            'email': blocked_email,
            'cEmail': blocked_email
        }
        
        if not dry_run:
            if update_user_admin(api_url, api_token, conflict_doc_id, update_data):
                 print(f"  -> Successfully blocked and renamed email to {blocked_email}")
                 # Remove from map so we can register the new user with this email
                 if real_email.lower() in website_users_by_email:
                     del website_users_by_email[real_email.lower()]
            else:
                 print(f"  -> Failed to block user {conflict_doc_id}")
        else:
             print(f"  [DRY RUN] -> Would block and rename email to {blocked_email}")


def import_member(api_url: str, api_token: Optional[str], member_data: Dict[str, Any],

                  website_users_by_cid: Dict[int, Dict], 
                  website_users_by_email: Dict[str, Dict],
                  website_users_by_username: Dict[str, Dict], # Added username map as fallback
                  dry_run: bool = False) -> bool:
    """Import a single member using in-memory lookups."""
    username = member_data.get('username')
    if not username:
        cId = member_data.get("cId")
        if cId:
             username = f"user-{cId}"
        else:
             print("Skipping member without username or cId")
             return False

    # Updated to use get so cEmail remains in member_data for update
    real_email = member_data.get('cEmail') 
    email = f"{username}@hovawarte.com"
    kennel_name = member_data.pop('kennelName', None)
    is_breeder = member_data.get('cFlagBreeder', False)
    is_active_breeder = member_data.get('IsActiveBreeder', False)
    member_data.pop('IsActiveBreeder', None)

    # 1. Search for existing user using maps
    existing_document_id = None
    existing_user_data = None
    
    c_id = member_data.get('cId')
    
    # Lookup by cId (Primary)
    if c_id and c_id in website_users_by_cid:
        existing_user = website_users_by_cid[c_id]
        existing_document_id = existing_user.get('documentId')
        existing_user_data = existing_user

    # Not strictly falling back to username/email for *identification* if cId is the key.
    # But if cId is missing or mismatch? 
    # User said "common key is cid". So if cId doesn't match, it's a new user (or issue).
    
    if existing_document_id:
        # Check for changes
        if has_changes(member_data, existing_user_data):
             print(f"Updating user {username} (cId: {c_id})...")
             if not dry_run:
                 update_user_admin(api_url, api_token, existing_document_id, member_data)
        else:
             print(f"User {username} (cId: {c_id}) is up to date. Skipping.")
    else:
        # New User
        print(f"Creating new user {username} (cId: {c_id}, email: {real_email})...")
        
        # Use helper
        block_conflicting_email(api_url, api_token, real_email, website_users_by_email, dry_run)

        if not dry_run:
            mid = register_user(api_url, api_token, username, real_email)
            if mid:
                 existing_document_id = mid
                 update_user_admin(api_url, api_token, mid, member_data)


        if c_id and is_breeder:
             # Breeder lookup still uses API? Or should we map breeders too?
             # User didn't ask to map breeders, but for consistency maybe we should?
             # For now, leaving breeder lookup as API call to minimize scope creep unless requested.
             # But this will slow it down.
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

    # 2. Register if not exists (This block seems redundant if we handled it above for new users?)
    # Wait, the logic flow is:
    # 1. Check maps (cId -> docId)
    # 2. If docId -> Update
    # 3. Else (New) -> Register -> Update (lines 1015-1018)
    #
    # So lines 1041-1050 are actually fallback code from original script?
    # Yes, lines 1041+ handle case where `existing_document_id` is still None.
    # In my new logic, if it was None (and not found in map), I call register_user above (lines 1015).
    # So `existing_document_id` would be set if registration succeeded.
    # If registration failed, `existing_document_id` is None.
    
    # But wait, original code (or what I see in view 1000-1050) has a second registration block.
    # Lines 1041-1050:
    # document_id = existing_document_id
    # if not document_id:
    #    document_id = register_user(...)
    
    # This second block handles the case where existing_document_id was NOT set above.
    # In "New User" block above: I set existing_document_id = mid.
    # So if registration succeeded, second block is skipped.
    
    # User said: "und auch vor dem anderen Aufruf von register_user verwenden".
    # This implies I should keep the second block (maybe as a fallback? or maybe for username match case?)
    # Actually, my logic handles "New User" by cId extensively. 
    # Is there a case where we fall through to 1041?
    # - If found by map (cId/username/email) -> `existing_document_id` set.
    # - If NEW (not found) -> block 983 runs -> register_user -> `existing_document_id` set.
    
    # So when does 1041 run?
    # Only if `register_user` failed above? Or dry run?
    # In dry run, `register_user` above is skipped. `existing_document_id` is None.
    # Then `if dry_run: return True` at 1028 returns early.
    # So 1041 is unreachable in dry_run.
    
    # In non-dry run:
    # If register failed above, mid is None -> existing_document_id is None.
    # Then 1041 runs. It tries register_user AGAIN with `email` (constructed fake email) instead of `real_email`?
    # Line 1044: `register_user(..., username, email)` -> context variable `email` which is `username@hovawarte.com`.
    # Ah! The first registration uses `real_email`.
    # The second one uses `email` (fake).
    
    # So if real_email was missing or invalid or failed, we fall back to fake email registration?
    # That seems to be the intent of the legacy code.
    
    # User wants `block_conflicting_email` check before THIS call too.
    # Because `email` (fake) might also be taken?
    # `email = f"{username}@hovawarte.com"`.
    # If that fake email is taken, we should block that user too?
    # Likely yes.
    
    # So I should apply the helper there too.
    
    document_id = existing_document_id
    if not document_id:
        # Fallback registration with constructed email
        
        # Apply blocking logic for constructed email
        block_conflicting_email(api_url, api_token, email, website_users_by_email, dry_run)
        
        document_id = register_user(api_url, api_token, username, email)
        if document_id:
            print(f"✓ Registered new user (fallback): {username} (ID: {document_id})")
        else:
            print(f"x Failed to register new user: {username} (email: {email})")
            return False
    else:
        # print(f"ℹ Found existing user: {username} (ID: {document_id})")
        pass

    # 3. Update via updateUserAdmin
    if document_id:
        if update_user_admin(api_url, api_token, document_id, member_data):
            # print(f"✓ Updated user: {username} (ID: {document_id})")

            # Try to update the real email
            if real_email:
                try:
                    # print(f"Attempting to update email for {username} to {real_email}")
                    if update_user_admin(api_url, api_token, document_id, {'email': real_email, 'cEmail': real_email}):
                        # print(f"✓ Updated email for user {username}: {real_email}")
                        pass
                    else:
                        print(f"⚠ Konnte Email nicht setzen fuer {username}: {real_email} (Update fehlgeschlagen)")
                except Exception as e:
                    print(f"⚠ Konnte Email nicht setzen fuer {username}: {real_email} ({e})")


            # 4. Handle Breeder Logic
            if is_breeder and c_id:
                breeder_data = {
                    'cId': c_id,
                    'IsActive': is_active_breeder,
                    'member': document_id, # Link to the member
                }
                if kennel_name:
                    breeder_data['kennelName'] = kennel_name

                if existing_breeder_id:
                    if update_breeder(api_url, api_token, existing_breeder_id, breeder_data):
                        # print(f"✓ Updated breeder for user {username}")
                        pass
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
            chromosoft_users = list(reader)

    except FileNotFoundError:
        print(f"Error: File '{args.csv_file}' not found")
        sys.exit(1)
    except Exception as e:
        print(f"Error reading CSV file: {e}")
        sys.exit(1)

    if not chromosoft_users:
        print("Error: CSV file is empty or has no data rows")
        sys.exit(1)

    print(f"Found {len(chromosoft_users)} rows in CSV file")
    
    # Resolve Email Conflicts
    resolve_email_conflicts(chromosoft_users)
    
    # Validate CSV Data
    validate_chromosoft_users(chromosoft_users)

    print(f"API URL: {endpoint}")
    if token:
        print(f"API Token: {'*' * 20} (provided)")
    else:
        print(f"API Token: Not provided (requests may fail if authentication is required)")
    print(f"Dry run: {args.dry_run}")
    print("-" * 60)
    
    # Fetch all Website Users
    website_users = []
    # Fetching in dry run allows verifying matches (if read-only token or public read is available/mocked)
    # If no token provided, it might fail or return empty, which is fine.
    try:
        website_users = fetch_all_users(endpoint, token)
        print(f"Fetched {len(website_users)} existing users from Website.")
    except Exception as e:
        print(f"Warning: Could not fetch users: {e}")
        website_users = []
    
    # Build Maps
    website_users_by_cid = {}
    website_users_by_email = {}
    website_users_by_username = {}

    for u in website_users:
        if u.get('cId'):
            website_users_by_cid[u['cId']] = u
        if u.get('email'):
            website_users_by_email[u['email'].lower()] = u
        if u.get('username'):
            website_users_by_username[u['username']] = u

    # Process each row
    success_count = 0
    error_count = 0

    for i, row in enumerate(chromosoft_users, 1):
        # Skip empty rows
        if not any(row.values()):
            continue
            
        if i % 100 == 0:
            print(f"Processing row {i}/{len(chromosoft_users)}...")

        # Map CSV to member data
        member_data = map_csv_to_member(row)
        if not member_data:
            print(f"Skipping row {i}: Could not map to member data")
            error_count += 1
            continue

        # Import member
        # print(member_data)
        if import_member(endpoint, token, member_data, 
                         website_users_by_cid, 
                         website_users_by_email, 
                         website_users_by_username,
                         dry_run=args.dry_run):
            success_count += 1
        else:
            error_count += 1

    print("\n" + "=" * 60)
    print(f"Import completed.")
    print(f"Successful: {success_count}")
    print(f"Errors: {error_count}")
    print(f"Total processed: {len(chromosoft_users)}")

if __name__ == '__main__':
    main()
