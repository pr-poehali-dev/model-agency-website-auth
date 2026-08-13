'''
Общие настройки системы: чтение доступно всем авторизованным, изменение — только директору.
Args: event с httpMethod (GET/POST), body для POST (key, value)
Returns: HTTP response с настройками или статусом сохранения
'''

import json
import os
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

SCHEMA = 't_p35405502_model_agency_website'

ALLOWED_KEYS = {
    'idle_timeout_minutes': {'min': 1, 'max': 480, 'default': '10'},
}

CORS_HEADERS = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
    'Access-Control-Max-Age': '86400',
}


def _resp(status: int, body: Dict[str, Any]) -> Dict[str, Any]:
    return {
        'statusCode': status,
        'headers': CORS_HEADERS,
        'body': json.dumps(body, default=str),
        'isBase64Encoded': False,
    }


def extract_token(headers: Dict[str, str]) -> str:
    h = {k.lower(): v for k, v in headers.items()}
    token = h.get('x-auth-token', '')
    if token:
        return token
    cookie = h.get('x-cookie', '') or h.get('cookie', '')
    if 'auth_token=' in cookie:
        return cookie.split('auth_token=')[1].split(';')[0]
    return ''


def get_current_user(cur, headers: Dict[str, str]):
    '''Определяет текущего пользователя ТОЛЬКО по токену из базы данных'''
    token = extract_token(headers)
    if not token:
        return None

    cur.execute(f"""
        SELECT u.email, u.role
        FROM {SCHEMA}.auth_tokens at
        JOIN {SCHEMA}.users u ON at.user_id = u.id
        WHERE at.token = %s
          AND at.expires_at > NOW()
          AND at.is_active = true
          AND u.is_active = true
    """, (token,))
    return cur.fetchone()


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method = event.get('httpMethod', 'GET')

    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    if method not in ('GET', 'POST'):
        return _resp(405, {'error': 'Method not allowed'})

    dsn = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(dsn, cursor_factory=RealDictCursor)
    cur = conn.cursor()

    try:
        user = get_current_user(cur, event.get('headers') or {})

        if not user:
            return _resp(401, {'error': 'Требуется авторизация'})

        if method == 'GET':
            cur.execute(f"SELECT key, value FROM {SCHEMA}.app_settings")
            rows = cur.fetchall()
            settings = {r['key']: r['value'] for r in rows}

            for key, rules in ALLOWED_KEYS.items():
                settings.setdefault(key, rules['default'])

            return _resp(200, {'settings': settings})

        if user['role'] != 'director':
            return _resp(403, {'error': 'Недостаточно прав'})

        body = json.loads(event.get('body') or '{}')
        key = body.get('key')
        value = body.get('value')

        if key not in ALLOWED_KEYS:
            return _resp(400, {'error': 'Неизвестный параметр'})

        rules = ALLOWED_KEYS[key]

        try:
            numeric = int(value)
        except (TypeError, ValueError):
            return _resp(400, {'error': 'Значение должно быть числом'})

        if numeric < rules['min'] or numeric > rules['max']:
            return _resp(400, {
                'error': f"Значение должно быть от {rules['min']} до {rules['max']}"
            })

        cur.execute(f"""
            INSERT INTO {SCHEMA}.app_settings (key, value, updated_by, updated_at)
            VALUES (%s, %s, %s, CURRENT_TIMESTAMP)
            ON CONFLICT (key) DO UPDATE
            SET value = EXCLUDED.value,
                updated_by = EXCLUDED.updated_by,
                updated_at = CURRENT_TIMESTAMP
        """, (key, str(numeric), user['email']))
        conn.commit()

        return _resp(200, {'success': True, 'key': key, 'value': str(numeric)})

    finally:
        cur.close()
        conn.close()
