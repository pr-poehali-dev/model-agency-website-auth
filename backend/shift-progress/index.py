import json
import os
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Получает прогресс посещения смен оператора или контент-мейкера за период.
    Args: event - queryStringParameters: user_email, role (operator/content_maker), period_start, period_end
    Returns: { shifts_count, target, models_assigned, bonus_ready }
    '''
    method = event.get('httpMethod', 'GET')
    headers = event.get('headers', {})
    origin = headers.get('origin') or headers.get('Origin') or '*'

    cors_headers = {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '86400',
        'Content-Type': 'application/json'
    }

    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors_headers, 'body': ''}

    if method != 'GET':
        return {'statusCode': 405, 'headers': cors_headers, 'body': json.dumps({'error': 'Method not allowed'})}

    params = event.get('queryStringParameters') or {}
    user_email = params.get('user_email', '').strip()
    user_role = params.get('role', '').strip()
    period_start = params.get('period_start', '').strip()
    period_end = params.get('period_end', '').strip()

    if not user_email or not period_start or not period_end:
        return {
            'statusCode': 400,
            'headers': cors_headers,
            'body': json.dumps({'error': 'user_email, period_start и period_end обязательны'})
        }

    schema = 't_p35405502_model_agency_website'
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor(cursor_factory=RealDictCursor)

    shifts_count = 0
    models_assigned = 1

    if user_role == 'operator':
        cur.execute(
            f"SELECT COUNT(DISTINCT model_email) AS c FROM {schema}.operator_model_assignments WHERE operator_email = %s",
            (user_email,)
        )
        row = cur.fetchone()
        models_assigned = max(1, int(row['c'] or 0))

        cur.execute(
            f"""SELECT COUNT(*) AS c
                FROM {schema}.model_finances
                WHERE has_shift = true
                  AND LOWER(operator_name) = LOWER(%s)
                  AND date >= %s AND date <= %s""",
            (user_email, period_start, period_end)
        )
        shifts_count = int(cur.fetchone()['c'] or 0)

    elif user_role == 'content_maker':
        cur.execute(
            f"""SELECT DISTINCT model_email
                FROM {schema}.producer_assignments
                WHERE producer_email = %s AND assignment_type = 'model'""",
            (user_email,)
        )
        model_emails = [r['model_email'] for r in cur.fetchall()]
        models_assigned = max(1, len(model_emails))

        if model_emails:
            cur.execute(
                f"""SELECT COUNT(*) AS c
                    FROM {schema}.model_finances mf
                    JOIN {schema}.users u ON u.id = mf.model_id
                    WHERE mf.has_shift = true
                      AND u.email = ANY(%s)
                      AND mf.operator_name IS NOT NULL AND mf.operator_name <> ''
                      AND mf.date >= %s AND mf.date <= %s""",
                (model_emails, period_start, period_end)
            )
            shifts_count = int(cur.fetchone()['c'] or 0)

    else:
        cur.close()
        conn.close()
        return {
            'statusCode': 200,
            'headers': cors_headers,
            'body': json.dumps({
                'shifts_count': 0,
                'target': 10,
                'models_assigned': 0,
                'bonus_ready': False,
                'supported': False
            })
        }

    cur.close()
    conn.close()

    target = 10 * models_assigned
    bonus_ready = shifts_count >= target

    return {
        'statusCode': 200,
        'headers': cors_headers,
        'body': json.dumps({
            'shifts_count': shifts_count,
            'target': target,
            'models_assigned': models_assigned,
            'bonus_ready': bonus_ready,
            'supported': True
        })
    }
