from __future__ import annotations

import os
from typing import Any, Optional, TypeAlias, TypedDict, cast
from urllib.parse import urljoin

import requests

from .auth import (
    AuthentikAuthError,
    build_authentik_auth_settings,
    create_authentik_session,
    get_first_env,
    get_int_env,
    require_value,
)

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


def get_authentik_base_url(explicit: Optional[str] = None) -> str:
    return require_value(
        explicit or get_first_env(('AUTHENTIK_BASE_URL', 'AUTHENTIK_URL')),
        'AUTHENTIK_BASE_URL',
    )


def get_authentik_api_token(explicit: Optional[str] = None) -> Optional[str]:
    return explicit or get_first_env(('AUTHENTIK_API_TOKEN', 'AUTHENTIK_TOKEN'))


def get_authentik_http_timeout(explicit: Optional[int] = None) -> int:
    if explicit is not None:
        return explicit

    return get_int_env(
        ('AUTHENTIK_HTTP_TIMEOUT', 'IMPORT_HTTP_TIMEOUT'),
        30,
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

    auth_settings = build_authentik_auth_settings(
        authentik_url=authentik_url,
        authentik_token=authentik_token,
        timeout=get_authentik_http_timeout(timeout),
    )

    try:
        session = create_authentik_session(auth_settings)
    except AuthentikAuthError as exc:
        raise ValueError(str(exc)) from exc

    existing_users: ExistingAuthentikUsersByUsername = {}
    users_url = build_authentik_users_url(auth_settings.base_url)
    timeout = auth_settings.timeout
    page = 1

    while True:
        response = session.get(
            users_url,
            params={
                'page': page,
                'page_size': page_size,
            },
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
