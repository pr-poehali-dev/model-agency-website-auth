'''
Продакшн: таблицы штата (операторы, модели) и промо-аккаунтов.
GET: table=staff|promo|cash, owner=email продюсера (директор смотрит чужой раздел)
POST: save (создать/обновить строку) | delete (удалить строку), поле table как в GET
Returns: JSON со списками строк или статусом операции.
'''

import json
from typing import Dict, Any, List
import os
import psycopg2
from psycopg2.extras import RealDictCursor

SCHEMA = 't_p35405502_model_agency_website'
KINDS = ('operator', 'model')

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
            f"""SELECT u.id, u.email, u.role, u.full_name FROM {SCHEMA}.auth_tokens at
                JOIN {SCHEMA}.users u ON at.user_id = u.id
                WHERE at.token = %s AND at.expires_at > NOW() AND at.is_active = TRUE AND u.is_active = TRUE""",
            (token,),
        )
        user = cur.fetchone()
    if not user and email:
        cur.execute(
            f"SELECT id, email, role, full_name FROM {SCHEMA}.users WHERE LOWER(email) = %s AND is_active = TRUE",
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


def _list_cash(cur, owner: str) -> Dict[str, List[Dict[str, Any]]]:
    cur.execute(
        f"""SELECT id, employee_name, n5000, n1000, n500, salary, sort_order
            FROM {SCHEMA}.production_cash
            WHERE LOWER(owner_email) = %s
            ORDER BY sort_order ASC, id ASC""",
        (owner,),
    )
    rows = []
    for r in cur.fetchall():
        row = dict(r)
        row['salary'] = float(row['salary'] or 0)
        rows.append(row)
    return {'rows': rows}


def _list_promo(cur, owner: str) -> Dict[str, List[Dict[str, Any]]]:
    cur.execute(
        f"""SELECT id, login, password, sign_name, sign_date, model_name, sort_order
            FROM {SCHEMA}.production_promo
            WHERE LOWER(owner_email) = %s
            ORDER BY sort_order ASC, id ASC""",
        (owner,),
    )
    return {'rows': [dict(r) for r in cur.fetchall()]}


def _list_rows(cur, owner: str) -> Dict[str, List[Dict[str, Any]]]:
    cur.execute(
        f"""SELECT id, kind, full_name, birth_date, phone, telegram, google_account, sort_order
            FROM {SCHEMA}.production_staff
            WHERE LOWER(owner_email) = %s
            ORDER BY sort_order ASC, id ASC""",
        (owner,),
    )
    rows = [dict(r) for r in cur.fetchall()]
    return {
        'operators': [r for r in rows if r['kind'] == 'operator'],
        'models': [r for r in rows if r['kind'] == 'model'],
    }


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    headers = event.get('headers') or {}
    conn = psycopg2.connect(os.environ['DATABASE_URL'], cursor_factory=RealDictCursor)
    try:
        actor = _get_actor(headers, conn)
        role = (actor.get('role') or '').lower()
        if role not in ('director', 'producer'):
            return _resp(403, {'error': 'forbidden'})

        cur = conn.cursor()

        params = event.get('queryStringParameters') or {}

        if method == 'GET':
            table = (params.get('table') or 'staff').lower()
            owner = _resolve_owner(actor, params.get('owner') or '')
            if table == 'promo':
                return _resp(200, _list_promo(cur, owner))
            if table == 'cash':
                return _resp(200, _list_cash(cur, owner))
            return _resp(200, _list_rows(cur, owner))

        if method == 'POST':
            body = json.loads(event.get('body') or '{}')
            action = body.get('action') or 'save'
            table = (body.get('table') or 'staff').strip().lower()
            owner = _resolve_owner(actor, body.get('owner') or '')

            if table == 'cash':
                if action == 'save':
                    def _int(key: str) -> int:
                        try:
                            return max(0, int(body.get(key) or 0))
                        except (TypeError, ValueError):
                            return 0

                    try:
                        salary = float(body.get('salary') or 0)
                    except (TypeError, ValueError):
                        salary = 0.0

                    employee_name = (body.get('employee_name') or '').strip()
                    values = (
                        employee_name,
                        _int('n5000'),
                        _int('n1000'),
                        _int('n500'),
                        salary,
                    )
                    row_id = body.get('id')
                    if employee_name:
                        cur.execute(
                            f"""SELECT id FROM {SCHEMA}.production_cash
                                WHERE LOWER(owner_email) = %s
                                  AND LOWER(employee_name) = LOWER(%s)
                                  AND id <> %s""",
                            (owner, employee_name, int(row_id or 0)),
                        )
                        if cur.fetchone():
                            return _resp(409, {'error': 'Этот сотрудник уже есть в таблице'})
                    if row_id:
                        cur.execute(
                            f"""UPDATE {SCHEMA}.production_cash
                                SET employee_name = %s, n5000 = %s, n1000 = %s,
                                    n500 = %s, salary = %s, updated_at = NOW()
                                WHERE id = %s AND LOWER(owner_email) = %s RETURNING id""",
                            (*values, int(row_id), owner),
                        )
                        saved = cur.fetchone()
                        if not saved:
                            return _resp(404, {'error': 'row not found'})
                        conn.commit()
                        return _resp(200, {'success': True, 'id': saved['id']})

                    cur.execute(
                        f"SELECT COALESCE(MAX(sort_order), 0) + 1 AS next FROM {SCHEMA}.production_cash WHERE LOWER(owner_email) = %s",
                        (owner,),
                    )
                    next_order = cur.fetchone()['next']
                    cur.execute(
                        f"""INSERT INTO {SCHEMA}.production_cash
                            (employee_name, n5000, n1000, n500, salary, sort_order, created_by, owner_email)
                            VALUES (%s, %s, %s, %s, %s, %s, %s, %s) RETURNING id""",
                        (*values, next_order, actor.get('email') or '', owner),
                    )
                    conn.commit()
                    return _resp(200, {'success': True, 'id': cur.fetchone()['id']})

                if action == 'delete':
                    row_id = body.get('id')
                    if not row_id:
                        return _resp(400, {'error': 'id required'})
                    cur.execute(
                        f"DELETE FROM {SCHEMA}.production_cash WHERE id = %s AND LOWER(owner_email) = %s",
                        (int(row_id), owner),
                    )
                    conn.commit()
                    return _resp(200, {'success': True})

                return _resp(400, {'error': 'unknown action'})

            if table == 'promo':
                if action == 'save':
                    values = (
                        (body.get('login') or '').strip(),
                        (body.get('password') or '').strip(),
                        (body.get('sign_name') or '').strip(),
                        (body.get('sign_date') or '').strip(),
                        (body.get('model_name') or '').strip(),
                    )
                    row_id = body.get('id')
                    if row_id:
                        cur.execute(
                            f"""UPDATE {SCHEMA}.production_promo
                                SET login = %s, password = %s, sign_name = %s,
                                    sign_date = %s, model_name = %s, updated_at = NOW()
                                WHERE id = %s AND LOWER(owner_email) = %s RETURNING id""",
                            (*values, int(row_id), owner),
                        )
                        saved = cur.fetchone()
                        if not saved:
                            return _resp(404, {'error': 'row not found'})
                        conn.commit()
                        return _resp(200, {'success': True, 'id': saved['id']})

                    cur.execute(
                        f"SELECT COALESCE(MAX(sort_order), 0) + 1 AS next FROM {SCHEMA}.production_promo WHERE LOWER(owner_email) = %s",
                        (owner,),
                    )
                    next_order = cur.fetchone()['next']
                    cur.execute(
                        f"""INSERT INTO {SCHEMA}.production_promo
                            (login, password, sign_name, sign_date, model_name, sort_order, created_by, owner_email)
                            VALUES (%s, %s, %s, %s, %s, %s, %s, %s) RETURNING id""",
                        (*values, next_order, actor.get('email') or '', owner),
                    )
                    conn.commit()
                    return _resp(200, {'success': True, 'id': cur.fetchone()['id']})

                if action == 'delete':
                    row_id = body.get('id')
                    if not row_id:
                        return _resp(400, {'error': 'id required'})
                    cur.execute(
                        f"DELETE FROM {SCHEMA}.production_promo WHERE id = %s AND LOWER(owner_email) = %s",
                        (int(row_id), owner),
                    )
                    conn.commit()
                    return _resp(200, {'success': True})

                return _resp(400, {'error': 'unknown action'})

            if action == 'save':
                kind = (body.get('kind') or '').strip().lower()
                if kind not in KINDS:
                    return _resp(400, {'error': 'kind must be operator or model'})
                row_id = body.get('id')
                values = (
                    (body.get('full_name') or '').strip(),
                    (body.get('birth_date') or '').strip(),
                    (body.get('phone') or '').strip(),
                    (body.get('telegram') or '').strip(),
                    (body.get('google_account') or '').strip(),
                )
                if row_id:
                    cur.execute(
                        f"""UPDATE {SCHEMA}.production_staff
                            SET full_name = %s, birth_date = %s, phone = %s,
                                telegram = %s, google_account = %s, updated_at = NOW()
                            WHERE id = %s AND LOWER(owner_email) = %s RETURNING id""",
                        (*values, int(row_id), owner),
                    )
                    saved = cur.fetchone()
                    if not saved:
                        return _resp(404, {'error': 'row not found'})
                    conn.commit()
                    return _resp(200, {'success': True, 'id': saved['id']})

                cur.execute(
                    f"SELECT COALESCE(MAX(sort_order), 0) + 1 AS next FROM {SCHEMA}.production_staff WHERE kind = %s AND LOWER(owner_email) = %s",
                    (kind, owner),
                )
                next_order = cur.fetchone()['next']
                cur.execute(
                    f"""INSERT INTO {SCHEMA}.production_staff
                        (kind, full_name, birth_date, phone, telegram, google_account, sort_order, created_by, owner_email)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id""",
                    (kind, *values, next_order, actor.get('email') or '', owner),
                )
                conn.commit()
                return _resp(200, {'success': True, 'id': cur.fetchone()['id']})

            if action == 'delete':
                row_id = body.get('id')
                if not row_id:
                    return _resp(400, {'error': 'id required'})
                cur.execute(
                    f"DELETE FROM {SCHEMA}.production_staff WHERE id = %s AND LOWER(owner_email) = %s",
                    (int(row_id), owner),
                )
                conn.commit()
                return _resp(200, {'success': True})

            return _resp(400, {'error': 'unknown action'})

        return _resp(405, {'error': 'method not allowed'})
    finally:
        conn.close()
