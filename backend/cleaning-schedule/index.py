'''
Business: CRUD-операции с графиком уборки + список новых назначений для оператора.
         GET без параметров — список всех записей.
         GET ?pending_for=email — список ещё не показанных оператору назначений (для toast-уведомления).
         GET ?operators_for=producer_email — список email'ов операторов, закреплённых за продюсером.
         POST {action: 'create'|'update'|'delete'|'mark_notified', ...}
Args: event с httpMethod, body (JSON), queryStringParameters
Returns: HTTP response с данными записей
'''
import json
import os
from typing import Dict, Any, List
import psycopg2
from psycopg2.extras import RealDictCursor


SCHEMA = 't_p35405502_model_agency_website'


def _resp(status: int, body: Dict[str, Any]) -> Dict[str, Any]:
    return {
        'statusCode': status,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
        },
        'body': json.dumps(body, default=str),
    }


def _esc(value: str) -> str:
    return str(value).replace("'", "''")


def _emails_to_list(s: str) -> List[str]:
    if not s:
        return []
    return [e.strip() for e in s.split(',') if e.strip()]


def _list_to_emails(lst: List[str]) -> str:
    return ','.join([str(e).strip() for e in lst if str(e).strip()])


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method = event.get('httpMethod', 'GET')

    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
                'Access-Control-Max-Age': '86400',
            },
            'body': '',
        }

    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        return _resp(500, {'error': 'DATABASE_URL not configured'})

    conn = psycopg2.connect(dsn)

    try:
        if method == 'GET':
            qs = event.get('queryStringParameters') or {}
            pending_for = (qs.get('pending_for') or '').strip().lower()
            operators_for = (qs.get('operators_for') or '').strip().lower()

            cur = conn.cursor(cursor_factory=RealDictCursor)

            if operators_for:
                safe_email = _esc(operators_for)
                cur.execute(f'''
                    SELECT DISTINCT operator_email
                    FROM {SCHEMA}.producer_assignments
                    WHERE LOWER(producer_email) = '{safe_email}'
                      AND operator_email IS NOT NULL
                      AND operator_email <> ''
                ''')
                rows = cur.fetchall()
                emails = [r['operator_email'] for r in rows if r.get('operator_email')]
                cur.close()
                return _resp(200, {'operator_emails': emails})

            if pending_for:
                safe_email = _esc(pending_for)
                cur.execute(f'''
                    SELECT id, cleaning_date::text AS cleaning_date,
                           apartment_name, comment, operator_emails,
                           created_by_email, notified_emails,
                           is_general, producer_emails
                    FROM {SCHEMA}.cleaning_schedule
                    WHERE cleaning_date >= CURRENT_DATE
                      AND LOWER(operator_emails) LIKE '%{safe_email}%'
                      AND (notified_emails IS NULL OR LOWER(notified_emails) NOT LIKE '%{safe_email}%')
                    ORDER BY cleaning_date ASC
                ''')
                rows = cur.fetchall()
                pending = []
                for r in rows:
                    emails = [e.lower() for e in _emails_to_list(r['operator_emails'])]
                    notified = [e.lower() for e in _emails_to_list(r.get('notified_emails') or '')]
                    if pending_for in emails and pending_for not in notified:
                        pending.append(dict(r))
                cur.close()
                return _resp(200, {'pending': pending})

            cur.execute(f'''
                SELECT id, cleaning_date::text AS cleaning_date,
                       apartment_name, comment, operator_emails,
                       created_by_email, notified_emails,
                       is_general, producer_emails,
                       created_at::text AS created_at,
                       updated_at::text AS updated_at
                FROM {SCHEMA}.cleaning_schedule
                ORDER BY cleaning_date DESC, id DESC
            ''')
            items = [dict(r) for r in cur.fetchall()]
            cur.close()
            return _resp(200, {'items': items})

        body_raw = event.get('body') or '{}'
        try:
            body = json.loads(body_raw) if body_raw else {}
        except Exception:
            body = {}

        action = body.get('action', 'create')
        cur = conn.cursor()

        if action == 'create':
            cleaning_date = body.get('cleaning_date', '')
            apartment_name = body.get('apartment_name', '') or ''
            comment = body.get('comment', '') or ''
            operator_emails = body.get('operator_emails') or []
            producer_emails = body.get('producer_emails') or []
            is_general = bool(body.get('is_general', False))
            if isinstance(operator_emails, str):
                operator_emails = _emails_to_list(operator_emails)
            if isinstance(producer_emails, str):
                producer_emails = _emails_to_list(producer_emails)
            created_by = body.get('created_by_email', '') or ''

            if not cleaning_date or not created_by:
                return _resp(400, {'error': 'cleaning_date and created_by_email required'})

            emails_str = _list_to_emails(operator_emails)
            producers_str = _list_to_emails(producer_emails)
            cur.execute(f'''
                INSERT INTO {SCHEMA}.cleaning_schedule
                    (cleaning_date, apartment_name, comment, operator_emails,
                     created_by_email, is_general, producer_emails)
                VALUES ('{_esc(cleaning_date)}', '{_esc(apartment_name)}', '{_esc(comment)}',
                        '{_esc(emails_str)}', '{_esc(created_by)}',
                        {str(is_general).upper()}, '{_esc(producers_str)}')
                RETURNING id
            ''')
            new_id = cur.fetchone()[0]

            prefix = 'Генеральная уборка' if is_general else 'Уборка'
            for email in _emails_to_list(emails_str):
                title = f"{prefix} {cleaning_date}" + (f" — {apartment_name}" if apartment_name else '')
                desc = comment or ('Назначена генеральная уборка' if is_general else 'Назначена уборка')
                cur.execute(f'''
                    INSERT INTO {SCHEMA}.tasks
                        (title, description, status, priority, assigned_to_email, assigned_by_email, due_date)
                    VALUES ('{_esc(title)}', '{_esc(desc)}', 'pending',
                            '{"high" if is_general else "medium"}',
                            '{_esc(email)}', '{_esc(created_by)}', '{_esc(cleaning_date)}'::timestamp)
                ''')

            conn.commit()
            return _resp(200, {'id': new_id, 'status': 'created'})

        if action == 'update':
            rec_id = body.get('id')
            if not rec_id:
                return _resp(400, {'error': 'id required'})
            cleaning_date = body.get('cleaning_date', '')
            apartment_name = body.get('apartment_name', '') or ''
            comment = body.get('comment', '') or ''
            operator_emails = body.get('operator_emails') or []
            producer_emails = body.get('producer_emails') or []
            is_general = bool(body.get('is_general', False))
            if isinstance(operator_emails, str):
                operator_emails = _emails_to_list(operator_emails)
            if isinstance(producer_emails, str):
                producer_emails = _emails_to_list(producer_emails)
            emails_str = _list_to_emails(operator_emails)
            producers_str = _list_to_emails(producer_emails)

            cur.execute(f'''
                SELECT operator_emails, notified_emails, created_by_email
                FROM {SCHEMA}.cleaning_schedule WHERE id = {int(rec_id)}
            ''')
            row = cur.fetchone()
            if not row:
                return _resp(404, {'error': 'not found'})
            old_emails = set([e.lower() for e in _emails_to_list(row[0] or '')])
            notified = set([e.lower() for e in _emails_to_list(row[1] or '')])
            created_by = row[2] or ''

            new_set = set([e.lower() for e in _emails_to_list(emails_str)])
            added = new_set - old_emails
            removed_notified = notified - new_set
            kept_notified = notified - removed_notified
            notified_str = _list_to_emails(sorted(kept_notified))

            cur.execute(f'''
                UPDATE {SCHEMA}.cleaning_schedule
                SET cleaning_date='{_esc(cleaning_date)}',
                    apartment_name='{_esc(apartment_name)}',
                    comment='{_esc(comment)}',
                    operator_emails='{_esc(emails_str)}',
                    notified_emails='{_esc(notified_str)}',
                    is_general={str(is_general).upper()},
                    producer_emails='{_esc(producers_str)}',
                    updated_at=CURRENT_TIMESTAMP
                WHERE id = {int(rec_id)}
            ''')

            prefix = 'Генеральная уборка' if is_general else 'Уборка'
            for email in added:
                title = f"{prefix} {cleaning_date}" + (f" — {apartment_name}" if apartment_name else '')
                desc = comment or ('Назначена генеральная уборка' if is_general else 'Назначена уборка')
                cur.execute(f'''
                    INSERT INTO {SCHEMA}.tasks
                        (title, description, status, priority, assigned_to_email, assigned_by_email, due_date)
                    VALUES ('{_esc(title)}', '{_esc(desc)}', 'pending',
                            '{"high" if is_general else "medium"}',
                            '{_esc(email)}', '{_esc(created_by)}', '{_esc(cleaning_date)}'::timestamp)
                ''')

            conn.commit()
            return _resp(200, {'status': 'updated'})

        if action == 'delete':
            rec_id = body.get('id')
            if not rec_id:
                return _resp(400, {'error': 'id required'})
            cur.execute(f'DELETE FROM {SCHEMA}.cleaning_schedule WHERE id = {int(rec_id)}')
            conn.commit()
            return _resp(200, {'status': 'deleted'})

        if action == 'mark_notified':
            rec_id = body.get('id')
            email = (body.get('email') or '').strip().lower()
            if not rec_id or not email:
                return _resp(400, {'error': 'id and email required'})

            cur.execute(f'''
                SELECT notified_emails FROM {SCHEMA}.cleaning_schedule WHERE id = {int(rec_id)}
            ''')
            row = cur.fetchone()
            if not row:
                return _resp(404, {'error': 'not found'})
            current = set([e.lower() for e in _emails_to_list(row[0] or '')])
            current.add(email)
            new_str = _list_to_emails(sorted(current))
            cur.execute(f'''
                UPDATE {SCHEMA}.cleaning_schedule
                SET notified_emails='{_esc(new_str)}', updated_at=CURRENT_TIMESTAMP
                WHERE id = {int(rec_id)}
            ''')
            conn.commit()
            return _resp(200, {'status': 'ok'})

        return _resp(400, {'error': f'unknown action: {action}'})

    except Exception as e:
        conn.rollback()
        return _resp(500, {'error': str(e)})
    finally:
        conn.close()
