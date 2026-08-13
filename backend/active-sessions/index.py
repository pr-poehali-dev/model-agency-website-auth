'''
Активные сессии сотрудников — просмотр и принудительный выход. Доступно только директору.
Args: event с httpMethod (GET/POST), body для POST (action: terminate_session | terminate_user)
Returns: HTTP response со списком активных сессий или статусом операции
'''

import json
import os
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

SCHEMA = 't_p35405502_model_agency_website'

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
        SELECT u.id, u.email, u.role, at.id AS token_id
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
        current = get_current_user(cur, event.get('headers') or {})

        if not current:
            return _resp(401, {'error': 'Требуется авторизация'})

        if current['role'] != 'director':
            return _resp(403, {'error': 'Недостаточно прав'})

        if method == 'GET':
            cur.execute(f"""
                SELECT at.id, at.user_id, at.created_at, at.expires_at,
                       at.last_seen_at, at.ip_address, at.device, at.browser,
                       u.email, u.full_name, u.role
                FROM {SCHEMA}.auth_tokens at
                JOIN {SCHEMA}.users u ON at.user_id = u.id
                WHERE at.is_active = true
                  AND at.expires_at > NOW()
                  AND u.is_active = true
                ORDER BY at.created_at DESC
            """)

            rows = cur.fetchall()
            items = [{
                'id': r['id'],
                'userId': r['user_id'],
                'email': r['email'],
                'fullName': r['full_name'],
                'role': r['role'],
                'ip': r['ip_address'],
                'device': r['device'],
                'browser': r['browser'],
                'createdAt': r['created_at'].isoformat() if r['created_at'] else None,
                'expiresAt': r['expires_at'].isoformat() if r['expires_at'] else None,
                'lastSeenAt': r['last_seen_at'].isoformat() if r['last_seen_at'] else None,
                'isCurrent': r['id'] == current['token_id'],
            } for r in rows]

            return _resp(200, {'items': items, 'total': len(items)})

        body = json.loads(event.get('body') or '{}')
        action = body.get('action')

        if action == 'terminate_session':
            session_id = body.get('sessionId')
            if not session_id:
                return _resp(400, {'error': 'sessionId is required'})

            if session_id == current['token_id']:
                return _resp(400, {'error': 'Нельзя завершить свою текущую сессию'})

            cur.execute(f"""
                UPDATE {SCHEMA}.auth_tokens
                SET is_active = false
                WHERE id = %s AND is_active = true
            """, (session_id,))
            affected = cur.rowcount
            conn.commit()

            return _resp(200, {'success': True, 'terminated': affected})

        if action == 'terminate_user':
            user_id = body.get('userId')
            if not user_id:
                return _resp(400, {'error': 'userId is required'})

            if user_id == current['id']:
                return _resp(400, {'error': 'Нельзя завершить свои сессии'})

            cur.execute(f"""
                UPDATE {SCHEMA}.auth_tokens
                SET is_active = false
                WHERE user_id = %s AND is_active = true
            """, (user_id,))
            affected = cur.rowcount
            conn.commit()

            return _resp(200, {'success': True, 'terminated': affected})

        return _resp(400, {'error': 'Unknown action'})

    finally:
        cur.close()
        conn.close()
