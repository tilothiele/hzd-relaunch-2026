#!/usr/bin/env python3
"""
CSV Import Script for HZD Member Collection
Refactored to use modular components.
"""

import csv
import sys
import argparse
import os
from pathlib import Path
from typing import Dict, Optional, Any, List
from datetime import datetime
from dotenv import load_dotenv

from lib.chromosoft_member import ChromosoftMember, sanitize_chromosoft_users, resolve_email_conflicts, validate_chromosoft_users
from lib.website_user import WebsiteClient, WebsiteUser

load_dotenv()

def block_conflicting_email(client: WebsiteClient, real_email: str, 
                          website_users_by_email: Dict[str, Any], dry_run: bool) -> None:
    """
    Check if email is occupied by another user.
    If so, block that user and rename their email to free it up.
    """
    if not real_email:
        return

    existing_email_user = website_users_by_email.get(real_email.lower())
    
    if existing_email_user:
        # Check if we should block? 
        # Logic relies on import_member_process to identify if it's a true conflict.
        pass

def has_changes(new_member: ChromosoftMember, existing_user: Any) -> bool:
    """
    Compare new member data (from CSV object) with existing user data (from Website object).
    Returns True if there are differences that need updating.
    """
    def get_val(obj, attr):
        if isinstance(obj, dict): return obj.get(attr)
        return getattr(obj, attr, None)

    # Convert new_member to dict for easier iteration over fields or manual check
    # Manual check is safer to control types
    
    # Fields to compare
    # Note: ChromosoftMember fields vs WebsiteUser fields
    
    params = [
        ('firstName', new_member.firstName, get_val(existing_user, 'firstName')),
        ('lastName', new_member.lastName, get_val(existing_user, 'lastName')),
        ('title', new_member.title, get_val(existing_user, 'title')),
        ('sex', new_member.sex, get_val(existing_user, 'sex')),
        ('address1', new_member.address1, get_val(existing_user, 'address1')),
        ('zip', new_member.zip, get_val(existing_user, 'zip')),
        ('city', new_member.city, get_val(existing_user, 'city')),
        ('region', new_member.region, get_val(existing_user, 'region')),
        ('countryCode', new_member.countryCode, get_val(existing_user, 'countryCode')),
        # Phone: website might store it differently? Assuming string identity.
        ('phone', new_member.phone, get_val(existing_user, 'phone')),
        
        ('cFlagBreeder', new_member.cFlagBreeder, get_val(existing_user, 'cFlagBreeder')),
        ('IsActiveBreeder', new_member.IsActiveBreeder, get_val(existing_user, 'IsActiveBreeder')),
        ('blocked', new_member.blocked, get_val(existing_user, 'blocked')),
        ('cEmail', new_member.cEmail, get_val(existing_user, 'cEmail')),
        ('membershipNumber', new_member.membershipNumber, get_val(existing_user, 'membershipNumber')),
        ('kennelName', new_member.kennelName, get_val(existing_user, 'kennelName')),
        
        # Dates - both strings YYYY-MM-DD
        ('dateOfBirth', new_member.dateOfBirth, get_val(existing_user, 'dateOfBirth')),
        ('dateOfDeath', new_member.dateOfDeath, get_val(existing_user, 'dateOfDeath')),
        ('memberSince', new_member.memberSince, get_val(existing_user, 'memberSince')),
        ('cancellationOn', new_member.cancellationOn, get_val(existing_user, 'cancellationOn')),
    ]
    
    for field_name, new_val, old_val in params:
        # Normalize comparisons
        # None vs '' vs None
        if new_val == '' and old_val is None: continue
        if new_val is None and old_val == '': continue
        if new_val is None and old_val is None: continue
        
        # Convert to string for loose comparison if not None/Bool
        n_str = str(new_val).strip() if new_val is not None else ''
        o_str = str(old_val).strip() if old_val is not None else ''
        
        # Special case: booleans
        if isinstance(new_val, bool) or isinstance(old_val, bool):
            if new_val != old_val:
                # print(f"Change in {field_name}: {new_val} != {old_val}")
                return True
        elif n_str != o_str:
            # print(f"Change in {field_name}: '{n_str}' != '{o_str}'")
            return True
            
    return False

def import_member_process(client: WebsiteClient, member: ChromosoftMember, 
                          website_users_by_cid: Dict[int, Any], 
                          website_users_by_email: Dict[str, Any],
                          dry_run: bool = False) -> bool:
    
    # 1. Identify User
    c_id = member.cId
    username = member.username
    if not username and c_id:
        username = f"user-{c_id}"
    
    if not username:
        print("Skipping member without username or cId")
        return False

    # 2. Handle Blocked Status / Email Scrubbing
    if member.blocked:
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        dummy_email = f"deleted_{timestamp}_{username}@hovawarte.invalid"
        member.cEmail = dummy_email
    
    # 3. Determine Auth Email
    auth_email = f"user-{c_id}@hovawarte.com" if c_id else f"{username}@hovawarte.com"
    
    # 4. Find Existing User
    existing_user_doc_id = None
    existing_user_data = None
    
    # Try by cId (Primary)
    if c_id and c_id in website_users_by_cid:
        u = website_users_by_cid[c_id]
        existing_user_data = u
        existing_user_doc_id = u.get('documentId') if isinstance(u, dict) else u.documentId
    
    # Try by Email (Secondary)
    if not existing_user_doc_id and member.cEmail:
        email_key = member.cEmail.lower()
        if email_key in website_users_by_email:
            u = website_users_by_email[email_key]
            u_cid = u.get('cId') if isinstance(u, dict) else u.cId
            
            if u_cid and u_cid != c_id:
                # Conflict!
                print(f"Conflict: Email {member.cEmail} used by user {u.get('username') if isinstance(u, dict) else u.username} (cId: {u_cid}). Blocking them.")
                
                conflict_doc_id = u.get('documentId') if isinstance(u, dict) else u.documentId
                conflict_email = u.get('email') if isinstance(u, dict) else u.email
                
                timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
                blocked_email = f"blocked_{timestamp}_{conflict_email}"
                
                if not dry_run:
                    client.update_user_admin(conflict_doc_id, {
                        'blocked': True,
                        'email': blocked_email,
                        'cEmail': blocked_email
                    })
                    if email_key in website_users_by_email:
                        del website_users_by_email[email_key]
                else:
                    print(f"  [DRY RUN] Would block {conflict_doc_id}")
            elif not u_cid:
                 print(f"Found existing user {u.get('username') if isinstance(u, dict) else u.username} via email {member.cEmail} (No cId). Linking...")
                 existing_user_doc_id = u.get('documentId') if isinstance(u, dict) else u.documentId
                 existing_user_data = u

    # 5. Prepare Update Data
    user_data = member.to_dict()
    user_data['email'] = auth_email
    
    # Remove fields that are not part of User Input type (but part of Breeder)
    # IsActiveBreeder and kennelName are stored in breeder relation
    user_data.pop('IsActiveBreeder', None)
    user_data.pop('kennelName', None)
    
    # 6. Execute
    if existing_user_doc_id:
        # Check if update needed
        if not has_changes(member, existing_user_data):
            # print(f"No changes for {username}")
            return True

        # UPDATE
        if not dry_run:
            if client.update_user_admin(existing_user_doc_id, user_data):
                print(f"Updated user {username} (ID: {existing_user_doc_id})")
            else:
                print(f"Failed to update user {username}")
        else:
             print(f"  [DRY RUN] Would update user {username}")
             
        # Handle Breeder Update
        if member.cFlagBreeder:
             existing_breeder_id = existing_user_data.get('breederDocumentId') if isinstance(existing_user_data, dict) else getattr(existing_user_data, 'breederDocumentId', None)
             
             breeder_data = {
                 'IsActive': member.IsActiveBreeder,
                 'kennelName': member.kennelName
             }
             breeder_data = {k: v for k, v in breeder_data.items() if v is not None}

             if existing_breeder_id:
                 # Check breeder changes? (Optional optimization)
                 # For now, update if breeder
                 if not dry_run:
                     client.update_breeder(existing_breeder_id, breeder_data)
                     print(f"Updated breeder profile for user {username}")
             else:
                 breeder_data['member'] = existing_user_doc_id
                 breeder_data['cId'] = c_id
                 if not dry_run:
                     client.create_breeder(breeder_data)
                     print(f"Created new breeder profile for existing user {username}")
                     
    else:
        # CREATE
        print(f"Creating new user {username}")
        if not dry_run:
            new_doc_id = client.register_user(username, auth_email)
            if new_doc_id:
                if client.update_user_admin(new_doc_id, user_data):
                     print(f"Registered and updated {username}")
                     
                     if member.cFlagBreeder:
                         b_data = {
                             'cId': c_id,
                             'IsActive': member.IsActiveBreeder,
                             'member': new_doc_id,
                             'kennelName': member.kennelName
                         }
                         b_data = {k: v for k, v in b_data.items() if v is not None}
                         client.create_breeder(b_data)
                         print(f"Created breeder profile for new user {username}")
                else:
                     print(f"Failed to update profile for new user {username}")
            else:
                print(f"Failed to register user {username}")
        else:
            print(f"  [DRY RUN] Would create user {username}")

    return True

def main():
    parser = argparse.ArgumentParser(description='Import members from Chromosoft CSV')
    parser.add_argument('csv_file', help='Path to CSV file')
    parser.add_argument('--dry-run', action='store_true', help='Perform a dry run without making changes')
    args = parser.parse_args()

    api_url = os.getenv('ENDPOINT')
    api_token = os.getenv('TOKEN')
    
    if not api_url or not api_token:
        print("Error: ENDPOINT and TOKEN environment variables must be set.")
        return

    client = WebsiteClient(api_url, api_token)

    # 1. Read CSV
    print(f"Reading CSV file: {args.csv_file}")
    rows = []
    try:
        with open(args.csv_file, 'r', encoding='utf-8') as f:
            # Basic read first to check headers? Or assume valid format.
            # Using basic DictReader
            # Check for delimiter sniffing?
            # Standard csv.Sniffer?
            sample = f.read(1024)
            f.seek(0)
            sniffer = csv.Sniffer()
            try:
                dialect = sniffer.sniff(sample)
                has_header = sniffer.has_header(sample)
            except:
                dialect = None
            
            if dialect:
                 reader = csv.DictReader(f, dialect=dialect)
            else:
                 # Fallback
                 reader = csv.DictReader(f)
            
            rows = list(reader)
    except Exception as e:
        print(f"Error reading CSV: {e}")
        return

    # 2. Parse & Sanitize
    members = []
    print("Parsing CSV data...")
    for row in rows:
        if not any(row.values()): continue
        try:
            m = ChromosoftMember.from_csv_row(row)
            members.append(m)
        except Exception as e:
            print(f"Error parsing row: {e}")

    sanitize_chromosoft_users(members)
    resolve_email_conflicts(members)
    validate_chromosoft_users(members)

    # 3. Fetch Existing Data
    print("Fetching existing users from Website...")
    all_users = client.fetch_all_users()
    
    # 4. Build Lookup Maps
    website_users_by_cid = {}
    website_users_by_email = {}
    
    for u in all_users:
        # Normalized access
        def get_attr(obj, attr):
             if isinstance(obj, dict): return obj.get(attr)
             return getattr(obj, attr, None)
             
        cid = get_attr(u, 'cId')
        email = get_attr(u, 'email')
        
        if cid: website_users_by_cid[cid] = u
        if email: website_users_by_email[email.lower()] = u
            
    # Enrich with Breeder Info
    breeders = client.fetch_all_breeders()
    for u in all_users:
        uid = get_attr(u, 'documentId')
        if uid in breeders:
            b_info = breeders[uid]
            if isinstance(u, dict):
                u['cFlagBreeder'] = True
                u['IsActiveBreeder'] = b_info['IsActive']
                u['breederDocumentId'] = b_info['breederId']
                u['kennelName'] = b_info['kennelName']
            else:
                u.cFlagBreeder = True
                u.IsActiveBreeder = b_info['IsActive']
                u.breederDocumentId = b_info['breederId']
                u.kennelName = b_info['kennelName']

    # 5. Run Import
    print(f"Starting Import Process (Dry Run: {args.dry_run})...")
    count = 0
    for m in members:
        if import_member_process(client, m, website_users_by_cid, website_users_by_email, args.dry_run):
            count += 1
            
    print(f"Import process completed. Processed {count} members.")

if __name__ == '__main__':
    main()
