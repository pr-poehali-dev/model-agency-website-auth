import json
import os
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Учёт заработанных премий сотрудников (фиксируются один раз при достижении прогресса)
    Args: event с httpMethod (GET/POST)
    Returns: Список премий или результат фиксации
    '''
    method = event.get('httpMethod', 'GET')
    headers = event.get('headers', {})
    origin = headers.get('origin') or headers.get('Origin') or '*'

    cors_headers = {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token, X-User-Email, X-User-Role',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '86400',
        'Content-Type': 'application/json'
    }

    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors_headers, 'body': ''}

    schema = 't_p35405502_model_agency_website'
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        if method == 'GET':
            params = event.get('queryStringParameters') or {}
            user_email = (params.get('user_email') or '').strip()
            period_start = (params.get('period_start') or '').strip()
            period_end = (params.get('period_end') or '').strip()

            if not user_email:
                return {'statusCode': 400, 'headers': cors_headers, 'body': json.dumps({'error': 'user_email обязателен'})}

            if period_start and period_end:
                cur.execute(
                    f"""SELECT id, user_email, user_role, period_start, period_end, amount, reason, earned_at
                        FROM {schema}.earned_bonuses
                        WHERE user_email = %s AND period_start = %s AND period_end = %s""",
                    (user_email, period_start, period_end)
                )
            else:
                cur.execute(
                    f"""SELECT id, user_email, user_role, period_start, period_end, amount, reason, earned_at
                        FROM {schema}.earned_bonuses
                        WHERE user_email = %s
                        ORDER BY period_start DESC""",
                    (user_email,)
                )

            rows = cur.fetchall()
            result = []
            total = 0.0
            for row in rows:
                amount = float(row['amount'])
                total += amount
                result.append({
                    'id': row['id'],
                    'user_email': row['user_email'],
                    'user_role': row['user_role'],
                    'period_start': row['period_start'].isoformat() if row['period_start'] else None,
                    'period_end': row['period_end'].isoformat() if row['period_end'] else None,
                    'amount': amount,
                    'reason': row['reason'],
                    'earned_at': row['earned_at'].isoformat() if row['earned_at'] else None,
                })

            return {
                'statusCode': 200,
                'headers': cors_headers,
                'body': json.dumps({'bonuses': result, 'total': total})
            }

        if method == 'POST':
            body = json.loads(event.get('body') or '{}')
            user_email = (body.get('user_email') or '').strip()
            user_role = (body.get('user_role') or '').strip()
            period_start = (body.get('period_start') or '').strip()
            period_end = (body.get('period_end') or '').strip()
            amount = body.get('amount')
            reason = (body.get('reason') or '').strip() or 'Премия за выполнение плана'

            if not user_email or not period_start or not period_end or amount is None:
                return {'statusCode': 400, 'headers': cors_headers, 'body': json.dumps({'error': 'Не все поля заполнены'})}

            try:
                amount_val = float(amount)
            except (TypeError, ValueError):
                return {'statusCode': 400, 'headers': cors_headers, 'body': json.dumps({'error': 'amount должен быть числом'})}

            cur.execute(
                f"""INSERT INTO {schema}.earned_bonuses (user_email, user_role, period_start, period_end, amount, reason)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    ON CONFLICT (user_email, period_start, period_end) DO NOTHING
                    RETURNING id""",
                (user_email, user_role, period_start, period_end, amount_val, reason)
            )
            inserted = cur.fetchone()
            conn.commit()

            return {
                'statusCode': 200,
                'headers': cors_headers,
                'body': json.dumps({'success': True, 'inserted': inserted is not None, 'amount': amount_val})
            }

        return {'statusCode': 405, 'headers': cors_headers, 'body': json.dumps({'error': 'Method not allowed'})}

    finally:
        cur.close()
        conn.close()
