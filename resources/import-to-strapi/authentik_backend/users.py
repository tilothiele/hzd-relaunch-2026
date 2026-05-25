from __future__ import annotations

import os
from typing import Any, Optional, TypeAlias, TypedDict, cast
from urllib.parse import urljoin

import requests

DEFAULT_HTTP_TIMEOUT = 30
DEFAULT_PAGE_SIZE = 100

class AuthentikUser(TypedDict, total=False):
    pk: int
    username: str
    name: str
    email: str
    is_active: bool
    last_login: str
    path: str
    type: str
    attributes: dict[str, Any]


class AuthentikUsersPage(TypedDict, total=False):
    pagination: dict[str, Any]
    results: list[AuthentikUser]


ExistingAuthentikUsersByUsername: TypeAlias = dict[str, AuthentikUser]


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


def get_authentik_base_url(explicit: Optional[str] = None) -> str:
    return require_value(
        explicit or get_first_env(('AUTHENTIK_BASE_URL', 'AUTHENTIK_URL')),
        'AUTHENTIK_BASE_URL',
    )


def get_authentik_api_token(explicit: Optional[str] = None) -> Optional[str]:
    return explicit or get_first_env(('AUTHENTIK_API_TOKEN', 'AUTHENTIK_TOKEN'))


def get_int_env(keys: tuple[str, ...], default: int) -> int:
    value = get_first_env(keys)
    if value is None:
        return default

    try:
        return int(value)
    except ValueError as exc:
        raise ValueError(f'Invalid integer value for {", ".join(keys)}: {value}') from exc


def get_authentik_http_timeout(explicit: Optional[int] = None) -> int:
    if explicit is not None:
        return explicit

    return get_int_env(
        ('AUTHENTIK_HTTP_TIMEOUT', 'IMPORT_HTTP_TIMEOUT'),
        DEFAULT_HTTP_TIMEOUT,
    )


def get_authentik_page_size(explicit: Optional[int] = None) -> int:
    if explicit is not None:
        return explicit

    return get_int_env(('AUTHENTIK_PAGE_SIZE',), DEFAULT_PAGE_SIZE)


def build_authentik_users_url(authentik_url: Optional[str] = None) -> str:
    authentik_url = get_authentik_base_url(authentik_url)
    base_url = authentik_url.rstrip('/')
    if base_url.endswith('/api/v3/core/users'):
        return base_url + '/'

    return urljoin(base_url + '/', 'api/v3/core/users/')


def build_headers(authentik_token: Optional[str] = None) -> dict[str, str]:
    headers = {
        'Accept': 'application/json',
    }

    authentik_token = get_authentik_api_token(authentik_token)
    if authentik_token:
        headers['Authorization'] = f'Bearer {authentik_token}'

    return headers


def fetch_existing_users_from_authentik(
    authentik_url: Optional[str] = None,
    authentik_token: Optional[str] = None,
    page_size: Optional[int] = None,
    timeout: Optional[int] = None,
) -> ExistingAuthentikUsersByUsername:
    """Fetch all Authentik users from the Core Users API, indexed by username."""
    page_size = get_authentik_page_size(page_size)
    if page_size < 1:
        raise ValueError('page_size must be greater than zero')

    existing_users: ExistingAuthentikUsersByUsername = {}
    users_url = build_authentik_users_url(authentik_url)
    headers = build_headers(authentik_token)
    timeout = get_authentik_http_timeout(timeout)
    page = 1

    while True:
        response = requests.get(
            users_url,
            params={
                'page': page,
                'page_size': page_size,
            },
            headers=headers,
            timeout=timeout,
        )
        response.raise_for_status()

        payload = response.json()
        users = extract_users(payload)

        for user in users:
            username = user.get('username')
            if username:
                existing_users[username] = user

        if len(users) < page_size or not has_next_page(payload, page):
            break

        page += 1

    return existing_users


def extract_users(payload: Any) -> list[AuthentikUser]:
    if isinstance(payload, list):
        return cast(list[AuthentikUser], payload)

    if isinstance(payload, dict):
        page = cast(AuthentikUsersPage, payload)
        return page.get('results', [])

    return []


def has_next_page(payload: Any, current_page: int) -> bool:
    if not isinstance(payload, dict):
        return False

    page = cast(AuthentikUsersPage, payload)
    pagination = page.get('pagination', {})

    next_page = pagination.get('next')
    if isinstance(next_page, int):
        return next_page > current_page
    if isinstance(next_page, str):
        return bool(next_page)

    total_pages = pagination.get('total_pages')
    if isinstance(total_pages, int):
        return current_page < total_pages

    return False
