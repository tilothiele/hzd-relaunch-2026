import requests
from typing import Dict, Optional, Any, List
from dataclasses import dataclass, field

@dataclass
class Breeder:
    documentId: str
    IsActive: bool = False
    breederId: str = ""
    member_documentId: str = ""
    kennelName: Optional[str] = None

@dataclass
class WebsiteUser:
    documentId: str
    username: str
    email: str
    cEmail: Optional[str] = None
    cId: Optional[int] = None
    blocked: bool = False
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    title: Optional[str] = None
    sex: Optional[str] = None
    address1: Optional[str] = None
    zip: Optional[str] = None
    city: Optional[str] = None
    region: Optional[str] = None
    countryCode: Optional[str] = None
    phone: Optional[str] = None
    membershipNumber: Optional[int] = None
    dateOfBirth: Optional[str] = None
    dateOfDeath: Optional[str] = None
    memberSince: Optional[str] = None
    cancellationOn: Optional[str] = None
    cFlagBreeder: bool = False
    IsActiveBreeder: bool = False
    breederDocumentId: Optional[str] = None
    kennelName: Optional[str] = None

class WebsiteClient:
    def __init__(self, api_url: str, api_token: Optional[str] = None):
        self.api_url = api_url
        self.headers = {'Content-Type': 'application/json'}
        if api_token:
            self.headers['Authorization'] = f'Bearer {api_token}'

    def _post(self, query: str, variables: Optional[Dict[str, Any]] = None) -> Optional[Dict[str, Any]]:
        try:
            response = requests.post(
                self.api_url,
                json={'query': query, 'variables': variables or {}},
                headers=self.headers,
                timeout=60
            )
            if response.status_code == 200:
                result = response.json()
                if 'errors' in result:
                    print(f"GraphQL Errors: {result['errors']}")
                    return None
                return result.get('data')
            else:
                print(f"API Error {response.status_code}: {response.text}")
                return None
        except Exception as e:
            print(f"Request Exception: {e}")
            return None

    def fetch_all_users(self) -> List[WebsiteUser]:
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
                    membershipNumber
                    dateOfBirth
                    dateOfDeath
                    memberSince
                    cancellationOn
                }
            }
            """
            data = self._post(query, {'page': page, 'pageSize': page_size})
            if not data:
                break

            users_data = data.get('usersPermissionsUsers', [])
            if not users_data:
                has_more = False
            else:
                for u in users_data:
                    user = WebsiteUser(
                        documentId=u.get('documentId'),
                        username=u.get('username'),
                        email=u.get('email'),
                        cEmail=u.get('cEmail'),
                        cId=u.get('cId'),
                        blocked=u.get('blocked', False),
                        firstName=u.get('firstName'),
                        lastName=u.get('lastName'),
                        title=u.get('title'),
                        sex=u.get('sex'),
                        address1=u.get('address1'),
                        zip=u.get('zip'),
                        city=u.get('city'),
                        region=u.get('region'),
                        countryCode=u.get('countryCode'),
                        phone=u.get('phone'),
                        membershipNumber=u.get('membershipNumber'),
                        dateOfBirth=u.get('dateOfBirth'),
                        dateOfDeath=u.get('dateOfDeath'),
                        memberSince=u.get('memberSince'),
                        cancellationOn=u.get('cancellationOn')
                    )
                    all_users.append(user)
                    
                print(f"  Fetched {len(users_data)} users (Total: {len(all_users)})")
                if len(users_data) < page_size:
                    has_more = False
                else:
                    page += 1
        return all_users
        
    def fetch_all_breeders(self) -> Dict[str, Dict[str, Any]]:
        # Similar logic for breeders
        breeder_map = {}
        page = 1
        page_size = 100
        has_more = True
        
        print("Fetching all breeders from GraphQL...")
        while has_more:
            query = """
            query GetAllBreeders($page: Int!, $pageSize: Int!) {
                hzdPluginBreeders(pagination: { page: $page, pageSize: $pageSize }) {
                    documentId
                    IsActive
                    kennelName
                    member {
                        documentId
                    }
                }
            }
            """
            data = self._post(query, {'page': page, 'pageSize': page_size})
            if not data:
                break
                
            breeders_data = data.get('hzdPluginBreeders', [])
            if not breeders_data:
                has_more = False
            else:
                for breeder in breeders_data:
                    member = breeder.get('member')
                    if member and member.get('documentId'):
                        user_doc_id = member.get('documentId')
                        breeder_map[user_doc_id] = {
                            'breederId': breeder.get('documentId'),
                            'IsActive': breeder.get('IsActive', False),
                            'kennelName': breeder.get('kennelName'),
                            'cFlagBreeder': True
                        }
                print(f"  Fetched {len(breeders_data)} breeders")
                if len(breeders_data) < page_size:
                    has_more = False
                else:
                    page += 1
        return breeder_map

    def find_existing_user_by_cid(self, c_id: int) -> Optional[str]:
        query = """
        query FindUserByCId($cId: Int!) {
            usersPermissionsUsers(filters: { cId: { eq: $cId } }) {
                documentId
            }
        }
        """
        data = self._post(query, {'cId': c_id})
        if data:
             users = data.get('usersPermissionsUsers', [])
             if users:
                 return users[0].get('documentId')
        return None

    def find_existing_breeder_by_cid(self, c_id: int) -> Optional[str]:
        query = """
        query FindBreederByCId($cId: Int!) {
            hzdPluginBreeders(filters: { cId: { eq: $cId } }) {
                documentId
            }
        }
        """
        data = self._post(query, {'cId': c_id})
        if data:
             breeders = data.get('hzdPluginBreeders', [])
             if breeders:
                 return breeders[0].get('documentId')
        return None

    def register_user(self, username: str, email: str) -> Optional[str]:
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
        variables = {
            'input': {
                'username': username,
                'email': email,
                'password': 'Startstart123!'
            }
        }
        data = self._post(mutation, variables)
        if data:
            return data.get('register', {}).get('user', {}).get('documentId')
        return None

    def update_user_admin(self, document_id: str, user_data: Dict[str, Any]) -> bool:
        mutation = """
        mutation UpdateUserAdmin($id: ID!, $data: UsersPermissionsUserInput!) {
            updateUserAdmin(id: $id, data: $data) {
                data {
                    documentId
                }
            }
        }
        """
        data = self._post(mutation, {'id': document_id, 'data': user_data})
        return data is not None

    def create_breeder(self, breeder_data: Dict[str, Any]) -> Optional[str]:
        mutation = """
        mutation CreateBreeder($data: HzdPluginBreederInput!) {
            createHzdPluginBreeder(data: $data) {
                documentId
            }
        }
        """
        data = self._post(mutation, {'data': breeder_data})
        if data:
             return data.get('createHzdPluginBreeder', {}).get('documentId')
        return None

    def update_breeder(self, document_id: str, breeder_data: Dict[str, Any]) -> bool:
        mutation = """
        mutation UpdateBreeder($documentId: ID!, $data: HzdPluginBreederInput!) {
            updateHzdPluginBreeder(documentId: $documentId, data: $data) {
                documentId
            }
        }
        """
        data = self._post(mutation, {'documentId': document_id, 'data': breeder_data})
        return data is not None
