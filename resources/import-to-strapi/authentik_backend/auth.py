from __future__ import annotations

import os
from dataclasses import dataclass
from typing import Any, Optional
from urllib.parse import urljoin

import requests

DEFAULT_AUTH_FLOW = 'default-authentication-flow'
MAX_FLOW_STEPS = 12
MAX_REDIRECTS = 8
SESSION_COOKIE_NAME = 'authentik_session'


class AuthentikAuthError(RuntimeError):
    pass


@dataclass
class AuthentikAuthSettings:
    base_url: str
    api_token: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None
    auth_flow: Optional[str] = None
    timeout: int = 30


def get_first_env(keys: tuple[str, ...]) -> Optional[str]:
    for key in keys:
        value = os.getenv(key)
        if value:
            return value

    return None


def get_authentik_api_token(explicit: Optional[str] = None) -> Optional[str]:
    return explicit or get_first_env(('AUTHENTIK_API_TOKEN', 'AUTHENTIK_TOKEN'))


def get_authentik_username(explicit: Optional[str] = None) -> Optional[str]:
    return explicit or get_first_env(('AUTHENTIK_USERNAME',))


def get_authentik_password(explicit: Optional[str] = None) -> Optional[str]:
    return explicit or get_first_env(('AUTHENTIK_PASSWORD',))


def get_authentik_auth_flow(explicit: Optional[str] = None) -> Optional[str]:
    return explicit or get_first_env(('AUTHENTIK_AUTH_FLOW',))


def build_authentik_auth_settings(
    authentik_url: Optional[str] = None,
    authentik_token: Optional[str] = None,
    username: Optional[str] = None,
    password: Optional[str] = None,
    auth_flow: Optional[str] = None,
    timeout: Optional[int] = None,
) -> AuthentikAuthSettings:
    base_url = require_value(
        authentik_url or get_first_env(('AUTHENTIK_BASE_URL', 'AUTHENTIK_URL')),
        'AUTHENTIK_BASE_URL',
    )

    return AuthentikAuthSettings(
        base_url=base_url,
        api_token=get_authentik_api_token(authentik_token),
        username=get_authentik_username(username),
        password=get_authentik_password(password),
        auth_flow=get_authentik_auth_flow(auth_flow),
        timeout=timeout or get_int_env(
            ('AUTHENTIK_HTTP_TIMEOUT', 'IMPORT_HTTP_TIMEOUT'),
            30,
        ),
    )


def validate_authentik_auth_settings(settings: AuthentikAuthSettings) -> None:
    if settings.api_token:
        return

    if settings.username and settings.password:
        return

    raise AuthentikAuthError(
        'Authentik API authentication is not configured: set AUTHENTIK_API_TOKEN '
        'or both AUTHENTIK_USERNAME and AUTHENTIK_PASSWORD'
    )


def create_authentik_session(
    settings: Optional[AuthentikAuthSettings] = None,
    **kwargs: Any,
) -> requests.Session:
    auth_settings = settings or build_authentik_auth_settings(**kwargs)
    validate_authentik_auth_settings(auth_settings)

    session = requests.Session()
    session.headers.update({'Accept': 'application/json'})

    if auth_settings.api_token:
        session.headers['Authorization'] = f'Bearer {auth_settings.api_token}'
        return session

    authenticate_with_username_password(session, auth_settings)
    session.headers['Referer'] = auth_settings.base_url.rstrip('/') + '/'
    return session


def authenticate_with_username_password(
    session: requests.Session,
    settings: AuthentikAuthSettings,
) -> None:
    username = require_value(settings.username, 'AUTHENTIK_USERNAME')
    password = require_value(settings.password, 'AUTHENTIK_PASSWORD')
    flow_slug = settings.auth_flow or DEFAULT_AUTH_FLOW
    executor_url = build_flow_executor_url(settings.base_url, flow_slug)

    response = session.get(
        executor_url,
        timeout=settings.timeout,
        allow_redirects=False,
        headers={'Referer': executor_url},
    )
    if response.status_code >= 400:
        raise AuthentikAuthError(
            f'Authentik login flow failed: HTTP {response.status_code} {response.text}'
        )

    challenge = response.json()
    execute_flow(session, executor_url, challenge, username, password, settings)
    verify_authenticated_session(session, settings)


def execute_flow(
    session: requests.Session,
    executor_url: str,
    challenge: dict[str, Any],
    username: str,
    password: str,
    settings: AuthentikAuthSettings,
) -> None:
    current_challenge: Optional[dict[str, Any]] = challenge
    last_component = ''
    repeated_component_count = 0

    for step in range(MAX_FLOW_STEPS):
        if current_challenge is None:
            return

        component = current_challenge.get('component')
        if not component:
            raise AuthentikAuthError(
                'Authentik login flow returned a challenge without component'
            )

        if component == last_component:
            repeated_component_count += 1
        else:
            repeated_component_count = 1
            last_component = component

        if repeated_component_count >= 3:
            raise AuthentikAuthError(
                f"Authentik login flow stalled at stage '{component}'"
            )

        if component == 'xak-flow-redirect':
            complete_flow_redirect(session, current_challenge, settings)
            return

        if component == 'ak-stage-access-denied':
            message = current_challenge.get('error_message', 'Authentik login was denied')
            raise AuthentikAuthError(f'Authentik login failed: {message}')

        if component == 'ak-stage-user-login':
            login_get_response = session.get(
                executor_url,
                timeout=settings.timeout,
                allow_redirects=False,
                headers={'Referer': executor_url},
            )
            current_challenge = advance_flow(
                session,
                executor_url,
                login_get_response,
                settings,
            )
            if current_challenge is None:
                return

            component = current_challenge.get('component')
            if component == 'xak-flow-redirect':
                complete_flow_redirect(session, current_challenge, settings)
                return
            if component != 'ak-stage-user-login':
                continue

        response = submit_challenge(
            session,
            executor_url,
            build_challenge_response(current_challenge, component, username, password),
            settings.timeout,
        )
        current_challenge, executor_url = advance_flow_with_url(
            session,
            executor_url,
            response,
            settings,
        )

    raise AuthentikAuthError(
        'Authentik login flow exceeded maximum number of stages'
        + (f" (last stage: {last_component})" if last_component else '')
    )


def advance_flow(
    session: requests.Session,
    executor_url: str,
    response: requests.Response,
    settings: AuthentikAuthSettings,
) -> Optional[dict[str, Any]]:
    challenge, _executor_url = advance_flow_with_url(
        session,
        executor_url,
        response,
        settings,
    )
    return challenge


def advance_flow_with_url(
    session: requests.Session,
    executor_url: str,
    response: requests.Response,
    settings: AuthentikAuthSettings,
) -> tuple[Optional[dict[str, Any]], str]:
    if response.status_code in (301, 302):
        redirect_response, executor_url = follow_redirect_chain(
            session,
            executor_url,
            response,
            settings,
            0,
        )
        return advance_flow_with_url(
            session,
            executor_url,
            redirect_response,
            settings,
        )

    if response.status_code >= 400:
        raise AuthentikAuthError(
            f'Authentik login flow failed: HTTP {response.status_code} {response.text}'
        )

    challenge = response.json()
    assert_no_challenge_errors(challenge)
    component = challenge.get('component')
    if component == 'xak-flow-redirect':
        complete_flow_redirect(session, challenge, settings)
        return None, executor_url

    return challenge, executor_url


def complete_flow_redirect(
    session: requests.Session,
    challenge: dict[str, Any],
    settings: AuthentikAuthSettings,
) -> None:
    redirect_target = challenge.get('to')
    if not redirect_target:
        return

    redirect_url = resolve_url(settings.base_url, redirect_target)
    session.get(
        redirect_url,
        timeout=settings.timeout,
        allow_redirects=False,
        headers={'Referer': redirect_url},
    )


def follow_redirect_chain(
    session: requests.Session,
    executor_url: str,
    response: requests.Response,
    settings: AuthentikAuthSettings,
    depth: int,
) -> tuple[requests.Response, str]:
    if depth >= MAX_REDIRECTS:
        raise AuthentikAuthError('Authentik login redirect chain exceeded maximum length')

    location = response.headers.get('Location')
    if not location:
        return response, executor_url

    redirect_url = resolve_url(settings.base_url, location)
    if '/flows/executor/' in redirect_url:
        executor_url = redirect_url

    redirect_response = session.get(
        redirect_url,
        timeout=settings.timeout,
        allow_redirects=False,
        headers={'Referer': executor_url},
    )
    if redirect_response.status_code in (301, 302):
        return follow_redirect_chain(
            session,
            executor_url,
            redirect_response,
            settings,
            depth + 1,
        )

    return redirect_response, executor_url


def build_challenge_response(
    challenge: dict[str, Any],
    component: str,
    username: str,
    password: str,
) -> dict[str, Any]:
    body: dict[str, Any] = {'component': component}

    if component == 'ak-stage-identification':
        body['uid_field'] = username
        if challenge.get('password_fields'):
            body['password'] = password
    elif component == 'ak-stage-password':
        body['password'] = password
    elif component == 'ak-stage-user-login':
        body['remember_me'] = False
    else:
        raise AuthentikAuthError(
            'Unsupported Authentik login stage: '
            f'{component}. Configure AUTHENTIK_AUTH_FLOW or use an API token.'
        )

    return body


def assert_no_challenge_errors(challenge: dict[str, Any]) -> None:
    errors = challenge.get('response_errors')
    if not isinstance(errors, dict) or not errors:
        return

    details: list[str] = []
    identification_rejected = False
    for field, field_errors in errors.items():
        if not isinstance(field_errors, list):
            continue
        for field_error in field_errors:
            if not isinstance(field_error, dict):
                continue
            detail = field_error.get('string') or field_error.get('code')
            if detail:
                details.append(f'{field} - {detail}')
                if field == 'non_field_errors' and 'failed to authenticate' in str(detail).lower():
                    identification_rejected = True

    if not details:
        return

    message = 'Authentik login failed: ' + '; '.join(details)
    if identification_rejected:
        user_fields = challenge.get('user_fields')
        if isinstance(user_fields, list) and user_fields:
            message += (
                '. AUTHENTIK_USERNAME must match the Authentik web login '
                f'(accepted fields: {user_fields}). Prefer AUTHENTIK_API_TOKEN for automation.'
            )

    raise AuthentikAuthError(message)


def submit_challenge(
    session: requests.Session,
    executor_url: str,
    body: dict[str, Any],
    timeout: int,
) -> requests.Response:
    headers = {
        'Content-Type': 'application/json',
        'Referer': executor_url,
    }
    csrf_token = session.cookies.get('authentik_csrf')
    if csrf_token:
        headers['X-authentik-CSRF'] = csrf_token

    return session.post(
        executor_url,
        json=body,
        headers=headers,
        timeout=timeout,
        allow_redirects=False,
    )


def verify_authenticated_session(
    session: requests.Session,
    settings: AuthentikAuthSettings,
) -> None:
    me_url = urljoin(settings.base_url.rstrip('/') + '/', 'api/v3/core/users/me/')
    response = session.get(
        me_url,
        timeout=settings.timeout,
        allow_redirects=False,
        headers={'Referer': me_url},
    )
    if response.status_code == 200:
        return

    if not session.cookies.get(SESSION_COOKIE_NAME):
        raise AuthentikAuthError(
            'Authentik session cookie missing after login. '
            'Ensure AUTHENTIK_BASE_URL matches the public Authentik URL '
            'and the configured user can complete the authentication flow.'
        )

    raise AuthentikAuthError(
        'Authentik session is not authenticated: HTTP '
        f'{response.status_code} {response.text}'
    )


def build_flow_executor_url(base_url: str, flow_slug: str) -> str:
    normalized_base_url = base_url.rstrip('/')
    return urljoin(
        normalized_base_url + '/',
        f'api/v3/flows/executor/{flow_slug}/',
    )


def resolve_url(base_url: str, location: str) -> str:
    return urljoin(base_url.rstrip('/') + '/', location.lstrip('/'))


def require_value(value: Optional[str], label: str) -> str:
    if value:
        return value

    raise ValueError(f'Missing required configuration value: {label}')


def get_int_env(keys: tuple[str, ...], default: int) -> int:
    value = get_first_env(keys)
    if value is None:
        return default

    try:
        return int(value)
    except ValueError as exc:
        raise ValueError(f'Invalid integer value for {", ".join(keys)}: {value}') from exc
