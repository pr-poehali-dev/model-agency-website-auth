'''
Прошлые аккаунты продакшна: карточки моделей и их аккаунты на площадках.
GET: список моделей с вложенными аккаунтами, owner=email продюсера (директор смотрит любой)
POST: save_person | delete_person | save_account | delete_account
Returns: JSON со списком моделей или статусом операции.
'''

import json
import os
from typing import Dict, Any, List
import psycopg2
from psycopg2.extras import RealDictCursor

SCHEMA = 't_p35405502_model_agency_website'

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token, X-User-Email, X-User-Id',
    'Access-Control-Max-Age': '86400',
}


def _resp(status: int, body: Any) -> Dict[str, Any]:
    return {
        'statusCode': status,
        'headers': {**CORS_HEADERS, 'Content-Type': 'application/json'},
        'body': json.dumps(body, default=str, ensure_ascii=False),
    }


def _get_actor(headers: Dict[str, Any], conn) -> Dict[str, Any]:
    email = (headers.get('X-User-Email') or headers.get('x-user-email') or '').strip().lower()
    token = headers.get('X-Auth-Token') or headers.get('x-auth-token') or ''
    cur = conn.cursor()
    user = None
    if token:
        cur.execute(
            f"""SELECT u.id, u.email, u.role FROM {SCHEMA}.auth_tokens at
                JOIN {SCHEMA}.users u ON at.user_id = u.id
                WHERE at.token = %s AND at.expires_at > NOW() AND at.is_active = TRUE AND u.is_active = TRUE""",
            (token,),
        )
        user = cur.fetchone()
    if not user and email:
        cur.execute(
            f"SELECT id, email, role FROM {SCHEMA}.users WHERE LOWER(email) = %s AND is_active = TRUE",
            (email,),
        )
        user = cur.fetchone()
    cur.close()
    return dict(user) if user else {}


def _resolve_owner(actor: Dict[str, Any], requested: str) -> str:
    """Чей раздел открываем: продюсер видит только свой, директор — любой."""
    own = (actor.get('email') or '').strip().lower()
    role = (actor.get('role') or '').lower()
    asked = (requested or '').strip().lower()
    if role == 'director' and asked:
        return asked
    return own


def _list_persons(cur, owner: str) -> Dict[str, List[Dict[str, Any]]]:
    cur.execute(
        f"""SELECT id, name, sort_order FROM {SCHEMA}.production_past_persons
            WHERE LOWER(owner_email) = %s ORDER BY sort_order ASC, id ASC""",
        (owner,),
    )
    persons = [dict(r) for r in cur.fetchall()]
    cur.execute(
        f"""SELECT id, person_id, platform, login, password, sort_order
            FROM {SCHEMA}.production_past_accounts
            ORDER BY sort_order ASC, id ASC"""
    )
    accounts = [dict(r) for r in cur.fetchall()]
    for person in persons:
        person['accounts'] = [a for a in accounts if a['person_id'] == person['id']]
    return {'persons': persons}


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    headers = event.get('headers') or {}
    conn = psycopg2.connect(os.environ['DATABASE_URL'], cursor_factory=RealDictCursor)
    try:
        actor = _get_actor(headers, conn)
        if (actor.get('role') or '').lower() not in ('director', 'producer'):
            return _resp(403, {'error': 'forbidden'})

        cur = conn.cursor()

        params = event.get('queryStringParameters') or {}

        if method == 'GET':
            owner = _resolve_owner(actor, params.get('owner') or '')
            return _resp(200, _list_persons(cur, owner))

        if method == 'POST':
            body = json.loads(event.get('body') or '{}')
            action = body.get('action') or ''
            owner = _resolve_owner(actor, body.get('owner') or '')

            if action == 'save_person':
                name = (body.get('name') or '').strip()
                person_id = body.get('id')
                if person_id:
                    cur.execute(
                        f"UPDATE {SCHEMA}.production_past_persons SET name = %s, updated_at = NOW() WHERE id = %s AND LOWER(owner_email) = %s RETURNING id",
                        (name, int(person_id), owner),
                    )
                    saved = cur.fetchone()
                    if not saved:
                        return _resp(404, {'error': 'person not found'})
                    conn.commit()
                    return _resp(200, {'success': True, 'id': saved['id']})

                cur.execute(
                    f"SELECT COALESCE(MAX(sort_order), 0) + 1 AS next FROM {SCHEMA}.production_past_persons WHERE LOWER(owner_email) = %s",
                    (owner,),
                )
                next_order = cur.fetchone()['next']
                cur.execute(
                    f"INSERT INTO {SCHEMA}.production_past_persons (name, sort_order, created_by, owner_email) VALUES (%s, %s, %s, %s) RETURNING id",
                    (name, next_order, actor.get('email') or '', owner),
                )
                conn.commit()
                return _resp(200, {'success': True, 'id': cur.fetchone()['id']})

            if action == 'save_account':
                person_id = body.get('person_id')
                account_id = body.get('id')
                values = (
                    (body.get('platform') or '').strip(),
                    (body.get('login') or '').strip(),
                    (body.get('password') or '').strip(),
                )
                if account_id:
                    cur.execute(
                        f"""UPDATE {SCHEMA}.production_past_accounts
                            SET platform = %s, login = %s, password = %s, updated_at = NOW()
                            WHERE id = %s AND person_id IN (
                                SELECT id FROM {SCHEMA}.production_past_persons WHERE LOWER(owner_email) = %s
                            ) RETURNING id""",
                        (*values, int(account_id), owner),
                    )
                    saved = cur.fetchone()
                    if not saved:
                        return _resp(404, {'error': 'account not found'})
                    conn.commit()
                    return _resp(200, {'success': True, 'id': saved['id']})

                if not person_id:
                    return _resp(400, {'error': 'person_id required'})
                cur.execute(
                    f"SELECT id FROM {SCHEMA}.production_past_persons WHERE id = %s AND LOWER(owner_email) = %s",
                    (int(person_id), owner),
                )
                if not cur.fetchone():
                    return _resp(403, {'error': 'forbidden'})
                cur.execute(
                    f"SELECT COALESCE(MAX(sort_order), 0) + 1 AS next FROM {SCHEMA}.production_past_accounts WHERE person_id = %s",
                    (int(person_id),),
                )
                next_order = cur.fetchone()['next']
                cur.execute(
                    f"""INSERT INTO {SCHEMA}.production_past_accounts
                        (person_id, platform, login, password, sort_order)
                        VALUES (%s, %s, %s, %s, %s) RETURNING id""",
                    (int(person_id), *values, next_order),
                )
                conn.commit()
                return _resp(200, {'success': True, 'id': cur.fetchone()['id']})

            if action in ('delete_person', 'delete_account'):
                row_id = body.get('id')
                if not row_id:
                    return _resp(400, {'error': 'id required'})
                if action == 'delete_person':
                    cur.execute(
                        f"SELECT id FROM {SCHEMA}.production_past_persons WHERE id = %s AND LOWER(owner_email) = %s",
                        (int(row_id), owner),
                    )
                    if not cur.fetchone():
                        return _resp(403, {'error': 'forbidden'})
                    cur.execute(
                        f"DELETE FROM {SCHEMA}.production_past_accounts WHERE person_id = %s",
                        (int(row_id),),
                    )
                    cur.execute(
                        f"DELETE FROM {SCHEMA}.production_past_persons WHERE id = %s",
                        (int(row_id),),
                    )
                else:
                    cur.execute(
                        f"""DELETE FROM {SCHEMA}.production_past_accounts
                            WHERE id = %s AND person_id IN (
                                SELECT id FROM {SCHEMA}.production_past_persons WHERE LOWER(owner_email) = %s
                            )""",
                        (int(row_id), owner),
                    )
                conn.commit()
                return _resp(200, {'success': True})

            return _resp(400, {'error': 'unknown action'})

        return _resp(405, {'error': 'method not allowed'})
    finally:
        conn.close()
