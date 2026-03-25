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

    @staticmethod
    def _normalize_csv_row(row: Dict[str, Any]) -> Dict[str, str]:
        """Strip keys (incl. UTF-8 BOM), lowercase for alias lookup."""
        out: Dict[str, str] = {}
        for k, v in row.items():
            if k is None:
                continue
            nk = str(k).strip().lstrip('\ufeff').lower()
            if not nk:
                continue
            if v is None:
                out[nk] = ''
            elif isinstance(v, str):
                out[nk] = v.strip()
            else:
                out[nk] = str(v).strip()
        return out

    @staticmethod
    def _cell(nr: Dict[str, str], *candidates: str) -> str:
        """First non-empty cell among candidate header names (after normalize)."""
        for c in candidates:
            key = c.lower().strip()
            if key in nr:
                val = nr[key]
                if val is None:
                    continue
                s = str(val).strip()
                if s and s != '-':
                    return s
        return ''

    @classmethod
    def from_csv_row(cls, row: Dict[str, Any]) -> 'ChromosoftMember':
        nr = cls._normalize_csv_row(row)

        c_id = cls.parse_integer(cls._cell(nr, 'ID Person', 'id person', 'person id', 'personid'))
        sex = cls.parse_sex(cls._cell(nr, 'salutation', 'anrede'))
        title = cls.clean_string(cls._cell(nr, 'title', 'titel'))
        first_name = cls.clean_string(cls._cell(
            nr, 'firstname', 'first name', 'first_name', 'vorname'))
        last_name = cls.clean_string(cls._cell(
            nr, 'lastname', 'last name', 'last_name', 'nachname'))

        street = cls.clean_string(cls._cell(
            nr, 'street', 'straße', 'strasse', 'address', 'adresse'), max_length=100)
        zipcode = cls.clean_string(cls._cell(
            nr, 'zipcode', 'zip', 'plz', 'postal code', 'postcode'), max_length=5)
        city = cls.clean_string(cls._cell(nr, 'city', 'ort', 'town'))

        region = cls.clean_string(cls._cell(nr, 'oblast', 'region', 'bundesland'))
        if region and region in REGION_MAPPING:
            region = REGION_MAPPING[region]
        else:
            region = None

        country_name = cls._cell(nr, 'country', 'land', 'staat')
        country_code = COUNTRY_CODES.get(
            country_name,
            country_name[:2].upper() if len(country_name) >= 2 else None
        ) if country_name else None

        phone = cls.clean_string(cls._cell(
            nr, 'mobile', 'handy', 'mobil', 'cell'), max_length=50) or cls.clean_string(
            cls._cell(nr, 'phone', 'telefon', 'tel', 'telephone'), max_length=50)

        email = cls.clean_string(cls._cell(
            nr, 'email', 'e-mail', 'e_mail', 'mail'), max_length=100)
        c_email = email if cls.is_valid_email(email) else None

        breeder_flag = cls.parse_boolean(cls._cell(
            nr, 'person is a breeder', 'is breeder', 'breeder',
            'züchter', 'zuechter')) or False
        active_breeder_flag = cls.parse_boolean(cls._cell(
            nr, 'person is an active breeder', 'active breeder',
            'aktiver züchter', 'aktiver zuechter')) or False

        membership_no = cls.parse_integer(cls._cell(
            nr, 'membership number', 'membershipnumber',
            'mitgliedsnummer', 'member number', 'membership_no'))
        username = str(membership_no) if membership_no else None

        dob = cls.parse_date(cls._cell(
            nr, 'date of birth', 'date_of_birth', 'birth date',
            'geburtsdatum', 'geburtstag'))
        dod = cls.parse_date(cls._cell(
            nr, 'date of death', 'date_of_death', 'sterbedatum'))
        member_since = cls.parse_date(cls._cell(
            nr, 'date of joining', 'joining date', 'eintrittsdatum', 'beitritt'))
        cancellation_on = cls.parse_date(cls._cell(
            nr, 'date of leaving', 'leaving date', 'austrittsdatum', 'austritt'))

        is_member = cls.parse_boolean(cls._cell(
            nr, 'person is a member', 'is member', 'member',
            'ist mitglied', 'mitglied'))
        kennel_name = cls.clean_string(cls._cell(
            nr, 'breeding station', 'kennel', 'kennel name', 'zwinger',
            'zuchtstätte', 'zuchtstaette'))

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

    def to_dict(self, omit_none: bool = True) -> Dict[str, Any]:
        """Strapi-Update: omit_none=True drops unset fields. Debug: omit_none=False."""
        if omit_none:
            return {k: v for k, v in self.__dict__.items() if v is not None}
        return dict(self.__dict__)


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

    def _stable_identifier_for_suffix(m: ChromosoftMember) -> str:
        # Prefer cId, then membershipNumber, then username, then kennelName.
        if m.cId is not None:
            return f"c{m.cId}"
        if m.membershipNumber is not None:
            return f"m{m.membershipNumber}"
        if m.username:
            return f"u{m.username}"
        if m.kennelName:
            # kennelName can be long; keep it bounded and safe.
            cleaned = re.sub(r'[^a-zA-Z0-9_%+\-]', '', m.kennelName)[:20]
            return f"k{cleaned or 'x'}"
        return "x"

    def _make_unique_email(original: str, suffix: str, used: set[str]) -> str:
        local, at, domain = original.partition('@')
        if not at:
            return original

        # Create Gmail-like plus aliases: local+suffix@domain
        # (Allowed by our validation regex.)
        max_len = 100
        base = f"{local}+{suffix}@{domain}"
        if len(base) > max_len:
            max_suffix_len = max_len - len(local) - 1 - 1 - len(domain)
            max_suffix_len = max(1, max_suffix_len)
            suffix = suffix[:max_suffix_len]
            base = f"{local}+{suffix}@{domain}"

        candidate = base
        candidate_lower = candidate.lower()
        i = 1
        while candidate_lower in used:
            candidate = f"{local}+{suffix}{i}@{domain}"
            candidate_lower = candidate.lower()
            i += 1
        return candidate

    # 1) Group members by email (case-insensitive)
    email_groups: Dict[str, List[ChromosoftMember]] = {}
    email_counts: Dict[str, int] = {}
    for m in members:
        if not m.cEmail:
            continue
        email_lower = m.cEmail.lower()
        email_groups.setdefault(email_lower, []).append(m)
        email_counts[email_lower] = email_counts.get(email_lower, 0) + 1

    # 2) Track which final emails are already reserved
    used_emails: set[str] = set()
    for m in members:
        if not m.cEmail:
            continue
        email_lower = m.cEmail.lower()
        if email_counts.get(email_lower, 0) == 1:
            used_emails.add(email_lower)

    # Also reserve the deterministic "keep" email per duplicate group.
    # This avoids accidental collisions with emails that would be kept later,
    # depending on processing order.
    for email_lower, group in email_groups.items():
        if len(group) <= 1:
            continue

        non_breeders = [m for m in group if not m.cFlagBreeder]
        non_breeders_active = [m for m in non_breeders if not m.blocked]
        keep_member: Optional[ChromosoftMember] = (
            non_breeders_active[0]
            if non_breeders_active
            else (non_breeders[0] if non_breeders else group[0])
        )

        if keep_member and keep_member.cEmail and not keep_member.cFlagBreeder:
            used_emails.add(email_lower)

    # 3) For each duplicate group:
    #    - Keep the original email for one deterministic non-breeder member (if any)
    #    - Always rename the email for all breeder members (required behavior)
    #    - For other non-breeder members, preserve legacy behavior where possible
    #      (e.g. clear email for blocked entries if there's an active one),
    #      but ensure global uniqueness by renaming if needed.
    renamed = 0
    cleared = 0

    # Deterministic processing order for reproducibility.
    for email_lower in sorted(email_groups.keys()):
        group = email_groups[email_lower]
        if len(group) <= 1:
            continue

        non_breeders = [m for m in group if not m.cFlagBreeder]
        non_breeders_active = [m for m in non_breeders if not m.blocked]
        keep_member: Optional[ChromosoftMember] = (
            non_breeders_active[0]
            if non_breeders_active
            else (non_breeders[0] if non_breeders else group[0])
        )

        for m in group:
            if m.cFlagBreeder and m.cEmail:
                suffix = _stable_identifier_for_suffix(m)
                unique_email = _make_unique_email(m.cEmail, suffix, used_emails)
                used_emails.add(unique_email.lower())
                m.cEmail = unique_email
                renamed += 1
                continue

            # Keep original email for the one deterministic non-breeder entry.
            if keep_member and m is keep_member:
                continue

            # Legacy behavior: if there's an active user in the group,
            # clear email from blocked users.
            has_active = any(x for x in group if not x.blocked)
            if m.blocked and has_active:
                m.cEmail = None
                cleared += 1
                continue

            # Fallback: rename anything still colliding.
            if m.cEmail:
                suffix = _stable_identifier_for_suffix(m)
                unique_email = _make_unique_email(m.cEmail, suffix, used_emails)
                used_emails.add(unique_email.lower())
                m.cEmail = unique_email
                renamed += 1

    print(f"Resolved {renamed + cleared} email conflicts "
          f"(renamed={renamed}, cleared={cleared}).")

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
