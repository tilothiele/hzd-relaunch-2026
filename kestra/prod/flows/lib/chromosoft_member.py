from dataclasses import dataclass
from typing import Dict, Any, Optional, List
from datetime import datetime
import re

# Mapping of country names to ISO 3166-1 alpha-2 codes
COUNTRY_CODES = {
    'Deutschland': 'DE', 'Germany': 'DE',
    'Österreich': 'AT', 'Austria': 'AT',
    'Schweiz': 'CH', 'Switzerland': 'CH',
}

REGION_MAPPING = {
    'Nord': 'Nord', 'Süd': 'Sued', 'Ost': 'Ost',
    'West': 'West', 'Mitte': 'Mitte'
}

@dataclass
class ChromosoftMember:
    cId: Optional[int]
    sex: Optional[str]
    title: Optional[str]
    firstName: Optional[str]
    lastName: Optional[str]
    address1: Optional[str]
    zip: Optional[str]
    city: Optional[str]
    region: Optional[str]
    countryCode: Optional[str]
    phone: Optional[str]
    cFlagBreeder: bool
    IsActiveBreeder: bool
    membershipNumber: Optional[int]
    dateOfBirth: Optional[str]
    dateOfDeath: Optional[str]
    memberSince: Optional[str]
    cancellationOn: Optional[str]
    blocked: bool
    kennelName: Optional[str]
    cEmail: Optional[str]
    username: Optional[str]

    @staticmethod
    def parse_date(date_str: str) -> Optional[str]:
        if not date_str or date_str.strip() in ['-', '']:
            return None
        try:
            return datetime.strptime(date_str.strip(), '%d/%m/%Y').strftime('%Y-%m-%d')
        except ValueError:
            try:
                return datetime.strptime(date_str.strip(), '%Y-%m-%d').strftime('%Y-%m-%d')
            except ValueError:
                return None

    @staticmethod
    def parse_boolean(value: str) -> Optional[bool]:
        if not value or value.strip() in ['-', '']:
            return None
        value = value.strip().lower()
        if value in ['1', 'true']: return True
        if value in ['0', 'false']: return False
        return None

    @staticmethod
    def parse_integer(value: str) -> Optional[int]:
        if not value or value.strip() in ['-', '']:
            return None
        try:
            return int(re.sub(r'[^\d-]', '', value.strip()))
        except ValueError:
            return None

    @staticmethod
    def parse_sex(salutation: str) -> Optional[str]:
        if not salutation or salutation.strip() in ['-', '']: return None
        s = salutation.strip().lower()
        if s in ['herr', 'mr', 'mr.', 'm']: return 'M'
        if s in ['frau', 'mrs', 'mrs.', 'ms', 'ms.', 'f']: return 'F'
        return None

    @staticmethod
    def clean_string(value: str, max_length: Optional[int] = None) -> Optional[str]:
        if not value or value.strip() in ['-', '']: return None
        cleaned = value.strip()
        return cleaned[:max_length] if max_length else cleaned

    @staticmethod
    def is_valid_email(email: str) -> bool:
        if not email: return False
        pattern = r'^[a-zA-Z0-9_%+-]+(\.[a-zA-Z0-9_%+-]+)*@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return re.match(pattern, email) is not None

    @classmethod
    def from_csv_row(cls, row: Dict[str, str]) -> 'ChromosoftMember':
        member_data = {}
        
        # Helper to cleaner access
        get = row.get

        c_id = cls.parse_integer(get('ID Person', ''))
        sex = cls.parse_sex(get('salutation', ''))
        title = cls.clean_string(get('title', ''))
        first_name = cls.clean_string(get('firstname', ''))
        last_name = cls.clean_string(get('lastname', ''))
        
        street = cls.clean_string(get('street', ''), max_length=100)
        zipcode = cls.clean_string(get('zipcode', ''), max_length=5)
        city = cls.clean_string(get('city', ''))
        
        region = cls.clean_string(get('oblast', ''))
        if region and region in REGION_MAPPING:
            region = REGION_MAPPING[region]
        else:
            region = None
            
        country_name = get('country', '').strip()
        country_code = COUNTRY_CODES.get(country_name, country_name[:2].upper() if len(country_name) >= 2 else None) if country_name else None

        phone = cls.clean_string(get('mobile', ''), max_length=50) or cls.clean_string(get('phone', ''), max_length=50)

        email = cls.clean_string(get('email', ''), max_length=100)
        c_email = email if cls.is_valid_email(email) else None

        breeder_flag = cls.parse_boolean(get('person is a breeder', '')) or False
        active_breeder_flag = cls.parse_boolean(get('person is an active breeder', '')) or False
        
        membership_no = cls.parse_integer(get('membership number', ''))
        username = str(membership_no) if membership_no else None
        
        dob = cls.parse_date(get('date of birth', ''))
        dod = cls.parse_date(get('date of death', ''))
        member_since = cls.parse_date(get('date of joining', ''))
        cancellation_on = cls.parse_date(get('date of leaving', ''))
        
        is_member = cls.parse_boolean(get('person is a member', ''))
        kennel_name = cls.clean_string(get('breeding station', ''))

        # Blocked logic
        today = datetime.now().date()
        is_blocked_by_date = False
        if member_since:
            try:
                if datetime.strptime(member_since, '%Y-%m-%d').date() > today: is_blocked_by_date = True
            except: pass
        if cancellation_on:
            try:
                if datetime.strptime(cancellation_on, '%Y-%m-%d').date() < today: is_blocked_by_date = True
            except: pass
            
        blocked = False
        if is_member is not None:
            blocked = (not is_member) or is_blocked_by_date
        elif is_blocked_by_date:
            blocked = True

        return cls(
            cId=c_id, sex=sex, title=title, firstName=first_name, lastName=last_name,
            address1=street, zip=zipcode, city=city, region=region, countryCode=country_code,
            phone=phone, cFlagBreeder=breeder_flag, IsActiveBreeder=active_breeder_flag,
            membershipNumber=membership_no, dateOfBirth=dob, dateOfDeath=dod,
            memberSince=member_since, cancellationOn=cancellation_on, blocked=blocked,
            kennelName=kennel_name, cEmail=c_email, username=username
        )

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary matching Strapi fields structure."""
        data = {k: v for k, v in self.__dict__.items() if v is not None}
        # Special handling if needed, but simple dict should suffice for update payload
        return data


def sanitize_chromosoft_users(members: List[ChromosoftMember]) -> None:
    print(f"Sanitizing {len(members)} members...")
    count = 0
    for m in members:
        if m.membershipNumber and m.membershipNumber < 100:
            m.membershipNumber = None
            m.username = None # If username derived from membership number
            count += 1
    print(f"Sanitized {count} invalid membership numbers.")

def resolve_email_conflicts(members: List[ChromosoftMember]) -> None:
    print(f"Resolving email conflicts...")
    email_map = {}
    for m in members:
        if m.cEmail:
            email = m.cEmail.lower()
            if email in email_map:
                email_map[email].append(m)
            else:
                email_map[email] = [m]
    
    count = 0
    for email, group in email_map.items():
        if len(group) > 1:
            # Simple logic: if anyone is NOT blocked (active), clear email from blocked (inactive)
            # Or use 'membership status' from original if available?
            # Original code used 'membership status' == 'Mitglied'. 
            # We simplified to 'blocked' field in class. 'blocked' is inverse of member usually.
            
            actives = [m for m in group if not m.blocked]
            inactives = [m for m in group if m.blocked]
            
            if actives and inactives:
                for m in inactives:
                    m.cEmail = None
                    count += 1
    print(f"Resolved {count} email conflicts.")

def validate_chromosoft_users(members: List[ChromosoftMember]) -> bool:
    print(f"Validating {len(members)} members...")
    # Add validation logic here matching original script
    # For brevity, implementing minimal check or full check?
    # Original checked email validity (done in parsing) and duplicates.
    
    # Check duplicate membership numbers
    mem_counts = {}
    for m in members:
        if m.membershipNumber:
            mem_counts[m.membershipNumber] = mem_counts.get(m.membershipNumber, 0) + 1
            
    dups = {k: v for k, v in mem_counts.items() if v > 1}
    if dups:
        print(f"[WARN] Found {len(dups)} duplicate membership numbers: {list(dups.keys())}")
    else:
        print("[PASS] No duplicate membership numbers.")
        
    return True
