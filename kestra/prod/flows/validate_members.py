
import importlib.util
import sys
import os

# Create a mock of the module to load it
file_path = '/work/projekte/hzd/hzd-relaunch-2026/kestra/prod/flows/import-members-from-chromosoft-csv.py'
module_name = 'import_members_from_chromosoft_csv'

spec = importlib.util.spec_from_file_location(module_name, file_path)
module = importlib.util.module_from_spec(spec)
sys.modules[module_name] = module
spec.loader.exec_module(module)

# Now we can direct output to verify our tests
is_valid_email = module.is_valid_email
map_csv_to_member = module.map_csv_to_member
parse_date = module.parse_date

def verify_csv_data(csv_file='alle_hzd_mitglieder.csv'):
    print(f"\nVerifying CSV data in {csv_file}...")
    import csv
    from datetime import datetime
    
    if not os.path.exists(csv_file):
        print(f"File {csv_file} not found. Skipping CSV data verification.")
        return

    today = datetime.now().date()
    email_counts = {}
    active_members_with_invalid_email = []
    
    with open(csv_file, 'r', encoding='utf-8', errors='replace') as f:
        reader = csv.DictReader(f)
        rows = list(reader)
        
    print(f"Scanned {len(rows)} rows.")
    
    for i, row in enumerate(rows, 1):
        # Logic to determine if active
        # 'date of joining' set and in past
        # 'date of leaving' empty or in future
        
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
                status = row.get('membership status', '')
                active_members_with_invalid_email.append({
                    'row': i,
                    'name': f"{row.get('firstname', '')} {row.get('lastname', '')}",
                    'id': row.get('ID Person', ''),
                    'email': email,
                    'status': status,
                    'issue': 'Invalid or Empty Email'
                })
            else:
                # Check uniqueness (only for valid emails)
                email_lower = email.lower()
                status = row.get('membership status', '')
                member_info = {
                    'row': i, 
                    'id': row.get('ID Person', ''), 
                    'name': f"{row.get('firstname', '')} {row.get('lastname', '')}",
                    'status': status
                }
                if email_lower in email_counts:
                    email_counts[email_lower].append(member_info)
                else:
                    email_counts[email_lower] = [member_info]

    # Report
    invalid_count = len(active_members_with_invalid_email)
    duplicate_count = 0
    
    print("\n--- Validation Report ---")
    
    if invalid_count > 0:
        print(f"\n[FAIL] Found {invalid_count} active members with invalid/empty emails:")
        for item in active_members_with_invalid_email:
            print(f"  ({item['id']} {item['name']}) - Status: {item['status']} - Email: '{item['email']}'")
    else:
        print("\n[PASS] All active members have valid email format.")

    # Check duplicates
    duplicates = {email: rows for email, rows in email_counts.items() if len(rows) > 1}
    duplicate_count = len(duplicates)
    
    if duplicate_count > 0:
         print(f"\n[FAIL] Found {duplicate_count} emails used by multiple active members:")
         for email, members in list(duplicates.items()):
             # We want to show the IDs/Names for duplicates too, but we only stored row_nums. 
             # For now, just sticking to the requested change for the invalid list, but the user said "statt rownum gibt aus..." generally.
             # However, retroactively fetching names for duplicates requires storing them.
             # I should probably update the storage above.
             members_str = ", ".join([f"({m['id']} {m['name']} Status: {m['status']})" for m in members])
             print(f"  Email '{email}' used by: {members_str}")
    else:
         print("\n[PASS] All active members have unique emails.")
         
    if invalid_count > 0 or duplicate_count > 0:
        raise Exception(f"Validation failed: {invalid_count} invalid emails, {duplicate_count} duplicate emails among active members.")

def test_email_validation():
    print("Testing is_valid_email...")
    valid_emails = [
        "test@example.com",
        "user.name@domain.co.uk",
        "user_name@domain.com",
        "user+name@domain.com",
        "123@domain.com"
    ]
    invalid_emails = [
        "plainaddress",
        "#@%^%#$@#$@#.com",
        "@example.com",
        "Joe Smith <email@example.com>",
        "email.example.com",
        "email@example@example.com",
        ".email@example.com",
        "email.@example.com",
        "email..email@example.com",
        "",
        None,
        "email1@example.com, email2@example.com",
        "email1@example.com email2@example.com",
        "email1@example.com;email2@example.com"
    ]

    for email in valid_emails:
        assert is_valid_email(email) == True, f"Failed for valid email: {email}"
        print(f"✓ Valid: {email}")

    for email in invalid_emails:
        assert is_valid_email(email) == False, f"Failed for invalid email: {email}"
        print(f"✓ Invalid: {email}")

def test_map_csv_to_member_email():
    print("\nTesting map_csv_to_member with emails...")
    
    # Case 1: Valid Email
    row_valid = {'email': 'valid@example.com'}
    result_valid = map_csv_to_member(row_valid)
    assert result_valid.get('cEmail') == 'valid@example.com', "Failed: Valid email should be present"
    print("✓ map_csv_to_member handled valid email correctly")

    # Case 2: Invalid Email
    row_invalid = {'email': 'invalid-email'}
    result_invalid = map_csv_to_member(row_invalid)
    assert 'cEmail' not in result_invalid, f"Failed: Invalid email should NOT be present, got {result_invalid.get('cEmail')}"
    print("✓ map_csv_to_member handled invalid email correctly (ignored)")

    # Case 3: Empty Email
    row_empty = {'email': ''}
    result_empty = map_csv_to_member(row_empty)
    assert 'cEmail' not in result_empty, "Failed: Empty email should NOT be present"
    print("✓ map_csv_to_member handled empty email correctly")

def test_map_csv_to_member_blocked_logic():
    print("\nTesting map_csv_to_member blocked logic...")
    from datetime import datetime, timedelta

    today = datetime.now().date()
    future = (today + timedelta(days=365)).strftime('%d/%m/%Y')
    past = (today - timedelta(days=365)).strftime('%d/%m/%Y')
    long_past = (today - timedelta(days=700)).strftime('%d/%m/%Y')

    # Case 1: Member since in future -> Blocked (Active member nominally)
    row_future = {
        'date of joining': future,
        'person is a member': '1'
    }
    res_future = map_csv_to_member(row_future)
    assert res_future.get('blocked') == True, f"Failed: Future joining date {future} should block user"
    # assert res_future.get('cDateOfJoining') == datetime.strptime(future, '%d/%m/%Y').strftime('%Y-%m-%d'), "Failed: cDateOfJoining not mapped"
    print("✓ Future joining date correctly blocks user")

    # Case 2: Member left in past -> Blocked
    row_past_leave = {
        'date of joining': long_past, 
        'date of leaving': past,
        'person is a member': '1'
    }
    res_past_leave = map_csv_to_member(row_past_leave)
    assert res_past_leave.get('blocked') == True, f"Failed: Past leaving date {past} should block user"
    # assert res_past_leave.get('cDateOfLeaving') == datetime.strptime(past, '%d/%m/%Y').strftime('%Y-%m-%d'), "Failed: cDateOfLeaving not mapped"
    print("✓ Past leaving date correctly blocks user")

    # Case 3: Active member, valid dates -> Not Blocked
    # Joining in past, leaving in future (or None)
    row_active = {
        'date of joining': past,
        'person is a member': '1'
    }
    res_active = map_csv_to_member(row_active)
    # blocked should be False (or not present, if default is accessible) - code sets it to False? No, it sets blocked = not is_member
    # if is_member is 1, blocked = not 1 = False.
    assert res_active.get('blocked') == False, "Failed: Active member with valid dates should NOT be blocked"
    print("✓ Active member with valid dates not blocked")

    # Case 4: Not a member -> Blocked (regardless of dates, usually)
    row_not_member = {
        'person is a member': '0'
    }
    res_not_member = map_csv_to_member(row_not_member)
    assert res_not_member.get('blocked') == True, "Failed: Non-member should be blocked"
    print("✓ Non-member correctly blocked")


if __name__ == "__main__":
    try:
        test_email_validation()
        test_map_csv_to_member_email()
        test_map_csv_to_member_blocked_logic()
        verify_csv_data()
        print("\nAll tests passed!")
    except Exception as e:
        print(f"\nTEST FAILED: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
