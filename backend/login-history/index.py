'''
История входов сотрудников в систему — доступна только директору.
Args: event с httpMethod (GET), queryStringParameters (email, date_from, date_to, limit, offset)
Returns: HTTP response со списком входов и списком пользователей для фильтра
'''

import json
import os
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

SCHEMA = 't_p35405502_model_agency_website'

def cors_headers(event: Dict[str, Any]) -> Dict[str, str]:
    headers = event.get('headers') or {}
    origin = headers.get('origin') or headers.get('Origin') or '*'
    return {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '86400',
    }


def _resp(event: Dict[str, Any], status: int, body: Dict[str, Any]) -> Dict[str, Any]:
    return {
        'statusCode': status,
        'headers': cors_headers(event),
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


def get_user_info(cur, headers: Dict[str, str]):
    '''Определяет email и роль пользователя ТОЛЬКО по токену из базы данных'''
    token = extract_token(headers)
    if not token:
        return '', ''

    cur.execute(f"""
        SELECT u.email, u.role
        FROM {SCHEMA}.auth_tokens at
        JOIN {SCHEMA}.users u ON at.user_id = u.id
        WHERE at.token = %s
          AND at.expires_at > NOW()
          AND at.is_active = true
          AND u.is_active = true
    """, (token,))
    row = cur.fetchone()
    if not row:
        return '', ''
    return row['email'], row['role']


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method = event.get('httpMethod', 'GET')

    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors_headers(event), 'body': ''}

    if method != 'GET':
        return _resp(event, 405, {'error': 'Method not allowed'})

    dsn = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(dsn, cursor_factory=RealDictCursor)
    cur = conn.cursor()

    try:
        user_email, user_role = get_user_info(cur, event.get('headers') or {})

        if not user_email:
            return _resp(event, 401, {'error': 'Требуется авторизация'})

        if user_role != 'director':
            return _resp(event, 403, {'error': 'Недостаточно прав'})

        params = event.get('queryStringParameters') or {}
        filter_email = (params.get('email') or '').strip().lower()
        date_from = (params.get('date_from') or '').strip()
        date_to = (params.get('date_to') or '').strip()

        try:
            limit = min(int(params.get('limit') or 100), 500)
        except ValueError:
            limit = 100
        try:
            offset = max(int(params.get('offset') or 0), 0)
        except ValueError:
            offset = 0

        conditions = []
        values = []

        if filter_email and filter_email != 'all':
            conditions.append('LOWER(lh.email) = %s')
            values.append(filter_email)

        if date_from:
            conditions.append('lh.created_at >= %s')
            values.append(date_from)

        if date_to:
            conditions.append('lh.created_at < (%s::date + INTERVAL \'1 day\')')
            values.append(date_to)

        where_sql = ('WHERE ' + ' AND '.join(conditions)) if conditions else ''

        cur.execute(f"""
            SELECT COUNT(*) AS total
            FROM {SCHEMA}.login_history lh
            {where_sql}
        """, tuple(values))
        total = cur.fetchone()['total']

        cur.execute(f"""
            SELECT lh.id, lh.email, lh.ip_address, lh.device, lh.browser,
                   lh.success, lh.created_at, u.full_name, u.role
            FROM {SCHEMA}.login_history lh
            LEFT JOIN {SCHEMA}.users u ON lh.user_id = u.id
            {where_sql}
            ORDER BY lh.created_at DESC
            LIMIT %s OFFSET %s
        """, tuple(values) + (limit, offset))

        rows = cur.fetchall()

        items = [{
            'id': r['id'],
            'email': r['email'],
            'fullName': r['full_name'],
            'role': r['role'],
            'ip': r['ip_address'],
            'device': r['device'],
            'browser': r['browser'],
            'success': r['success'],
            'createdAt': r['created_at'].isoformat() if r['created_at'] else None,
        } for r in rows]

        cur.execute(f"""
            SELECT DISTINCT lh.email, u.full_name
            FROM {SCHEMA}.login_history lh
            LEFT JOIN {SCHEMA}.users u ON lh.user_id = u.id
            ORDER BY lh.email
        """)
        users = [{'email': r['email'], 'fullName': r['full_name']} for r in cur.fetchall()]

        return _resp(event, 200, {'items': items, 'total': total, 'users': users})

    finally:
        cur.close()
        conn.close()