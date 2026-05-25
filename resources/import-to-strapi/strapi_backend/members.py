from __future__ import annotations

import os
from typing import Any, Literal, Mapping, Optional, TypeAlias, TypedDict, cast

import requests

GraphQLID: TypeAlias = str
DateString: TypeAlias = str
DateTimeString: TypeAlias = str

DEFAULT_HTTP_TIMEOUT = 30
DEFAULT_PAGE_SIZE = 100

UserSex = Literal['M', 'F']
UserRegion = Literal['Nord', 'Ost', 'Mitte', 'West', 'Sued']


class UsersPermissionsUserInput(TypedDict, total=False):
    username: str
    email: str
    provider: str
    confirmed: bool
    blocked: bool
    role: GraphQLID
    title: str
    firstName: str
    lastName: str
    address1: str
    address2: str
    zip: str
    countryCode: str
    city: str
    phone: str
    sex: UserSex
    dateOfBirth: DateString
    dateOfDeath: DateString
    cId: int
    cFlagBreeder: bool
    cEmail: str
    cFlagAccess: bool
    memberSince: DateString
    cancellationOn: DateString
    cancellationDueDate: DateString
    membershipNumber: int
    form: GraphQLID
    region: UserRegion
    locationLng: float
    locationLat: float
    DisplayName: str
    publishMyData: bool
    breeders: list[GraphQLID]
    publishedAt: DateTimeString
    password: str


class UsersPermissionsUser(TypedDict, total=False):
    documentId: GraphQLID
    username: str
    email: str
    provider: str
    confirmed: bool
    blocked: bool
    title: str
    firstName: str
    lastName: str
    address1: str
    address2: str
    zip: str
    countryCode: str
    city: str
    phone: str
    sex: UserSex
    dateOfBirth: DateString
    dateOfDeath: DateString
    cId: int
    cFlagBreeder: bool
    cEmail: str
    cFlagAccess: bool
    memberSince: DateString
    cancellationOn: DateString
    cancellationDueDate: DateString
    membershipNumber: int
    region: UserRegion
    locationLng: float
    locationLat: float
    DisplayName: str
    publishMyData: bool
    createdAt: DateTimeString
    updatedAt: DateTimeString
    publishedAt: DateTimeString


class UsersPermissionsUserByCIdVariables(TypedDict):
    cId: int


class CreateUsersPermissionsUserVariables(TypedDict):
    data: UsersPermissionsUserInput


class ExistingMembersVariables(TypedDict):
    page: int
    pageSize: int


ExistingStrapiUsersByCId: TypeAlias = dict[int, UsersPermissionsUser]


def get_first_env(keys: tuple[str, ...]) -> Optional[str]:
    for key in keys:
        value = os.getenv(key)
        if value:
            return value

    return None


def require_value(value: Optional[str], label: str) -> str:
    if value:
        return value

    raise ValueError(f'Missing required configuration value: {label}')


def get_strapi_graphql_url(explicit: Optional[str] = None) -> str:
    return require_value(
        explicit or get_first_env(('STRAPI_GRAPHQL_URL', 'STRAPI_ENDPOINT', 'ENDPOINT')),
        'STRAPI_GRAPHQL_URL',
    )


def get_strapi_api_token(explicit: Optional[str] = None) -> Optional[str]:
    return explicit or get_first_env(('STRAPI_API_TOKEN', 'STRAPI_TOKEN', 'TOKEN'))


def get_int_env(keys: tuple[str, ...], default: int) -> int:
    value = get_first_env(keys)
    if value is None:
        return default

    try:
        return int(value)
    except ValueError as exc:
        raise ValueError(f'Invalid integer value for {", ".join(keys)}: {value}') from exc


def get_strapi_http_timeout(explicit: Optional[int] = None) -> int:
    if explicit is not None:
        return explicit

    return get_int_env(
        ('STRAPI_HTTP_TIMEOUT', 'IMPORT_HTTP_TIMEOUT'),
        DEFAULT_HTTP_TIMEOUT,
    )


def get_strapi_page_size(explicit: Optional[int] = None) -> int:
    if explicit is not None:
        return explicit

    return get_int_env(('STRAPI_PAGE_SIZE',), DEFAULT_PAGE_SIZE)

USER_BY_CID_QUERY = """
query UserByCId($cId: Int!) {
    usersPermissionsUsers(filters: { cId: { eq: $cId } }) {
        documentId
    }
}
"""

EXISTING_MEMBERS_QUERY = """
query ExistingMembers($page: Int!, $pageSize: Int!) {
    usersPermissionsUsers(
        pagination: { page: $page, pageSize: $pageSize }
        sort: ["cId:asc"]
    ) {
        documentId
        username
        email
        firstName
        lastName
        cId
        membershipNumber
    }
}
"""


def build_headers(api_token: Optional[str] = None) -> dict[str, str]:
    headers = {
        'Content-Type': 'application/json',
    }

    api_token = get_strapi_api_token(api_token)
    if api_token:
        headers['Authorization'] = f'Bearer {api_token}'

    return headers


def execute_graphql(
    api_url: Optional[str],
    api_token: Optional[str],
    query: str,
    variables: Mapping[str, Any],
    timeout: Optional[int] = None,
) -> dict[str, Any]:
    response = requests.post(
        get_strapi_graphql_url(api_url),
        json={'query': query, 'variables': variables},
        headers=build_headers(api_token),
        timeout=get_strapi_http_timeout(timeout),
    )
    response.raise_for_status()

    payload = response.json()
    errors = payload.get('errors')
    if errors:
        raise RuntimeError(f'GraphQL errors: {errors}')

    return cast(dict[str, Any], payload)


def find_existing_member_by_c_id(
    c_id: int,
    api_url: Optional[str] = None,
    api_token: Optional[str] = None,
    timeout: Optional[int] = None,
) -> Optional[str]:
    """Find existing member by cId using GraphQL."""
    try:
        variables: UsersPermissionsUserByCIdVariables = {'cId': c_id}
        result = execute_graphql(
            api_url,
            api_token,
            USER_BY_CID_QUERY,
            variables,
            timeout,
        )
        data = cast(
            list[UsersPermissionsUser],
            result.get('data', {}).get('usersPermissionsUsers', []),
        )
        if data:
            return data[0].get('documentId')
    except Exception as e:
        print(f"Warning: Error finding existing member: {e}")

    return None


def fetch_existing_users_from_strapi(
    api_url: Optional[str] = None,
    api_token: Optional[str] = None,
    page_size: Optional[int] = None,
    timeout: Optional[int] = None,
) -> ExistingStrapiUsersByCId:
    """Fetch all existing Strapi users with a Chromosoft cId."""
    page_size = get_strapi_page_size(page_size)
    if page_size < 1:
        raise ValueError('page_size must be greater than zero')

    existing_users: ExistingStrapiUsersByCId = {}
    page = 1

    while True:
        variables: ExistingMembersVariables = {
            'page': page,
            'pageSize': page_size,
        }
        result = execute_graphql(
            api_url,
            api_token,
            EXISTING_MEMBERS_QUERY,
            variables,
            timeout,
        )
        members = cast(
            list[UsersPermissionsUser],
            result.get('data', {}).get('usersPermissionsUsers', []),
        )

        for member in members:
            c_id = member.get('cId')
            if isinstance(c_id, int):
                existing_users[c_id] = member

        if len(members) < page_size:
            break

        page += 1

    return existing_users
