'''
Система достижений: создание типов, назначение сотрудникам, разрешения для продюсеров.
GET: action=types | user&email=... | allowed_for_producer
POST: create_type | update_type | deactivate_type | set_producer_allowed | grant | revoke
Returns: JSON со списком/статусом операции.
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
            f"""SELECT u.id, u.email, u.role, u.full_name FROM {SCHEMA}.auth_tokens at
                JOIN {SCHEMA}.users u ON at.user_id = u.id
                WHERE at.token = %s AND at.expires_at > NOW() AND at.is_active = TRUE AND u.is_active = TRUE""",
            (token,),
        )
        user = cur.fetchone()
    if not user and email:
        cur.execute(
            f"SELECT id, email, role, full_name FROM {SCHEMA}.users WHERE LOWER(email) = %s",
            (email,),
        )
        user = cur.fetchone()
    cur.close()
    return dict(user) if user else {}


def _list_types(cur, only_active: bool = True) -> List[Dict[str, Any]]:
    where = 'WHERE is_active = TRUE' if only_active else ''
    cur.execute(f"SELECT id, title, description, emoji, color, created_by, is_active, created_at FROM {SCHEMA}.achievement_types {where} ORDER BY id ASC")
    return [dict(r) for r in cur.fetchall()]


def _list_user_achievements(cur, email: str) -> List[Dict[str, Any]]:
    cur.execute(
        f"""SELECT ua.id, ua.user_email, ua.granted_by_email, ua.granted_by_name, ua.granted_at, ua.comment,
                   at.id AS type_id, at.title, at.description, at.emoji, at.color
            FROM {SCHEMA}.user_achievements ua
            JOIN {SCHEMA}.achievement_types at ON ua.achievement_type_id = at.id
            WHERE LOWER(ua.user_email) = %s
            ORDER BY ua.granted_at DESC""",
        (email.lower(),),
    )
    return [dict(r) for r in cur.fetchall()]


def _list_allowed_ids(cur) -> List[int]:
    cur.execute(f"SELECT achievement_type_id FROM {SCHEMA}.producer_allowed_achievements")
    return [r['achievement_type_id'] for r in cur.fetchall()]


def _producer_team_emails(cur, producer_email: str) -> List[str]:
    """Почты сотрудников, закреплённых за продюсером (модели и операторы)."""
    cur.execute(
        f"""SELECT DISTINCT LOWER(email) AS email FROM (
                SELECT model_email AS email
                FROM {SCHEMA}.producer_assignments
                WHERE LOWER(producer_email) = LOWER(%s)
                  AND model_email IS NOT NULL AND model_email <> ''
                UNION
                SELECT operator_email AS email
                FROM {SCHEMA}.producer_assignments
                WHERE LOWER(producer_email) = LOWER(%s)
                  AND operator_email IS NOT NULL AND operator_email <> ''
            ) t""",
        (producer_email, producer_email),
    )
    return [r['email'] for r in cur.fetchall()]


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    dsn = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(dsn, cursor_factory=RealDictCursor)
    cur = conn.cursor()

    try:
        headers = event.get('headers') or {}
        actor = _get_actor(headers, conn)
        actor_role = (actor.get('role') or '').lower()
        is_director = actor_role == 'director'
        is_producer = actor_role == 'producer'

        if method == 'GET':
            params = event.get('queryStringParameters') or {}
            action = (params.get('action') or 'types').strip()
            if action == 'types':
                only_active = params.get('include_inactive') != '1'
                return _resp(200, {'types': _list_types(cur, only_active=only_active)})
            if action == 'user':
                email = (params.get('email') or '').strip()
                if not email:
                    return _resp(400, {'error': 'email required'})
                return _resp(200, {'achievements': _list_user_achievements(cur, email)})
            if action == 'allowed_for_producer':
                return _resp(200, {'allowed_ids': _list_allowed_ids(cur)})
            if action == 'my_team':
                if is_director:
                    return _resp(200, {'team': None, 'unlimited': True})
                if not is_producer:
                    return _resp(403, {'error': 'forbidden'})
                return _resp(200, {
                    'team': _producer_team_emails(cur, actor.get('email') or ''),
                    'unlimited': False,
                })
            if action == 'unseen':
                email = (params.get('email') or '').strip()
                if not email:
                    return _resp(400, {'error': 'email required'})
                cur.execute(
                    f"""SELECT ua.id, ua.granted_by_email, ua.granted_by_name, ua.granted_at, ua.comment,
                               at.id AS type_id, at.title, at.description, at.emoji, at.color
                        FROM {SCHEMA}.user_achievements ua
                        JOIN {SCHEMA}.achievement_types at ON ua.achievement_type_id = at.id
                        WHERE LOWER(ua.user_email) = %s AND ua.seen_at IS NULL
                        ORDER BY ua.granted_at ASC""",
                    (email.lower(),),
                )
                return _resp(200, {'unseen': [dict(r) for r in cur.fetchall()]})
            if action == 'history':
                if not is_director:
                    return _resp(403, {'error': 'forbidden'})
                try:
                    limit = min(int(params.get('limit') or 200), 500)
                except (TypeError, ValueError):
                    limit = 200
                cur.execute(
                    f"""SELECT ua.id, ua.user_email, ua.granted_by_email, ua.granted_by_name,
                               ua.granted_at, ua.comment,
                               at.id AS type_id, at.title, at.emoji, at.color,
                               u.full_name AS user_full_name, u.role AS user_role,
                               u.photo_url AS user_photo_url
                        FROM {SCHEMA}.user_achievements ua
                        JOIN {SCHEMA}.achievement_types at ON ua.achievement_type_id = at.id
                        LEFT JOIN {SCHEMA}.users u ON LOWER(u.email) = LOWER(ua.user_email)
                        ORDER BY ua.granted_at DESC
                        LIMIT {limit}"""
                )
                return _resp(200, {'history': [dict(r) for r in cur.fetchall()]})
            return _resp(400, {'error': 'unknown action'})

        if method == 'POST':
            try:
                body = json.loads(event.get('body') or '{}')
            except json.JSONDecodeError:
                return _resp(400, {'error': 'invalid JSON'})

            action = body.get('action')

            if action == 'create_type':
                if not is_director:
                    return _resp(403, {'error': 'forbidden'})
                title = (body.get('title') or '').strip()
                if not title:
                    return _resp(400, {'error': 'title required'})
                description = (body.get('description') or '').strip()
                emoji = (body.get('emoji') or '🏆').strip()[:16] or '🏆'
                color = (body.get('color') or 'from-amber-500/20 to-yellow-500/20 border-amber-500/30').strip()
                cur.execute(
                    f"INSERT INTO {SCHEMA}.achievement_types (title, description, emoji, color, created_by) VALUES (%s, %s, %s, %s, %s) RETURNING id, title, description, emoji, color, is_active, created_at",
                    (title, description, emoji, color, actor.get('email')),
                )
                row = cur.fetchone()
                conn.commit()
                return _resp(200, {'type': dict(row)})

            if action == 'update_type':
                if not is_director:
                    return _resp(403, {'error': 'forbidden'})
                type_id = body.get('id')
                if not type_id:
                    return _resp(400, {'error': 'id required'})
                fields = []
                values: List[Any] = []
                for key in ('title', 'description', 'emoji', 'color'):
                    if key in body:
                        fields.append(f"{key} = %s")
                        values.append(body[key])
                if 'is_active' in body:
                    fields.append('is_active = %s')
                    values.append(bool(body['is_active']))
                if not fields:
                    return _resp(400, {'error': 'no fields to update'})
                values.append(type_id)
                cur.execute(f"UPDATE {SCHEMA}.achievement_types SET {', '.join(fields)} WHERE id = %s", values)
                conn.commit()
                return _resp(200, {'success': True})

            if action == 'deactivate_type':
                if not is_director:
                    return _resp(403, {'error': 'forbidden'})
                type_id = body.get('id')
                if not type_id:
                    return _resp(400, {'error': 'id required'})
                cur.execute(f"UPDATE {SCHEMA}.achievement_types SET is_active = FALSE WHERE id = %s", (type_id,))
                conn.commit()
                return _resp(200, {'success': True})

            if action == 'set_producer_allowed':
                if not is_director:
                    return _resp(403, {'error': 'forbidden'})
                ids = body.get('ids') or []
                if not isinstance(ids, list):
                    return _resp(400, {'error': 'ids must be list'})
                clean_ids = [int(x) for x in ids if str(x).isdigit()]
                if clean_ids:
                    cur.execute(
                        f"DELETE FROM {SCHEMA}.producer_allowed_achievements WHERE achievement_type_id NOT IN %s",
                        (tuple(clean_ids),),
                    )
                else:
                    cur.execute(f"DELETE FROM {SCHEMA}.producer_allowed_achievements")
                for tid in clean_ids:
                    cur.execute(
                        f"INSERT INTO {SCHEMA}.producer_allowed_achievements (achievement_type_id) VALUES (%s) ON CONFLICT DO NOTHING",
                        (tid,),
                    )
                conn.commit()
                return _resp(200, {'success': True, 'allowed_ids': _list_allowed_ids(cur)})

            if action == 'grant':
                if not (is_director or is_producer):
                    return _resp(403, {'error': 'forbidden'})
                user_email = (body.get('user_email') or '').strip().lower()
                type_id = body.get('type_id')
                comment = (body.get('comment') or '').strip() or None
                if not user_email or not type_id:
                    return _resp(400, {'error': 'user_email and type_id required'})
                if is_producer:
                    allowed = _list_allowed_ids(cur)
                    if int(type_id) not in allowed:
                        return _resp(403, {'error': 'this achievement is not allowed for producers'})
                    team = _producer_team_emails(cur, actor.get('email') or '')
                    if user_email not in team:
                        return _resp(403, {'error': 'Можно награждать только своих сотрудников'})
                cur.execute(
                    f"INSERT INTO {SCHEMA}.user_achievements (user_email, achievement_type_id, granted_by_email, granted_by_name, comment) VALUES (%s, %s, %s, %s, %s) RETURNING id, granted_at",
                    (user_email, int(type_id), actor.get('email') or 'system', actor.get('full_name'), comment),
                )
                row = cur.fetchone()
                conn.commit()
                return _resp(200, {'success': True, 'id': row['id'], 'granted_at': row['granted_at']})

            if action == 'mark_seen':
                email = (body.get('user_email') or actor.get('email') or '').strip().lower()
                ids = body.get('ids')
                if not email:
                    return _resp(400, {'error': 'user_email required'})
                if isinstance(ids, list) and ids:
                    clean_ids = tuple(int(x) for x in ids if str(x).isdigit())
                    if clean_ids:
                        cur.execute(
                            f"UPDATE {SCHEMA}.user_achievements SET seen_at = NOW() WHERE LOWER(user_email) = %s AND seen_at IS NULL AND id IN %s",
                            (email, clean_ids),
                        )
                else:
                    cur.execute(
                        f"UPDATE {SCHEMA}.user_achievements SET seen_at = NOW() WHERE LOWER(user_email) = %s AND seen_at IS NULL",
                        (email,),
                    )
                conn.commit()
                return _resp(200, {'success': True})

            if action == 'revoke':
                if not is_director:
                    return _resp(403, {'error': 'forbidden'})
                grant_id = body.get('id')
                if not grant_id:
                    return _resp(400, {'error': 'id required'})
                cur.execute(f"DELETE FROM {SCHEMA}.user_achievements WHERE id = %s", (grant_id,))
                conn.commit()
                return _resp(200, {'success': True})

            return _resp(400, {'error': 'unknown action'})

        return _resp(405, {'error': 'method not allowed'})

    except Exception as e:
        conn.rollback()
        return _resp(500, {'error': str(e)})
    finally:
        cur.close()
        conn.close()