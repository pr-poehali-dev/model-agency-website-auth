import json
import os
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Управление планом дохода продюсера на период (директор ставит, продюсер читает)
    Args: event с httpMethod (GET/POST), queryStringParameters или body
    Returns: План дохода на период { plan_amount, producer_email, period_start, period_end }
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
            producer_email = (params.get('producer_email') or '').strip()
            period_start = (params.get('period_start') or '').strip()
            period_end = (params.get('period_end') or '').strip()

            if not producer_email or not period_start or not period_end:
                return {'statusCode': 400, 'headers': cors_headers, 'body': json.dumps({'error': 'producer_email, period_start и period_end обязательны'})}

            cur.execute(
                f"""SELECT plan_amount, set_by_email, updated_at
                    FROM {schema}.producer_income_plans
                    WHERE producer_email = %s AND period_start = %s AND period_end = %s""",
                (producer_email, period_start, period_end)
            )
            row = cur.fetchone()
            plan_amount = float(row['plan_amount']) if row else 0.0

            return {
                'statusCode': 200,
                'headers': cors_headers,
                'body': json.dumps({
                    'producer_email': producer_email,
                    'period_start': period_start,
                    'period_end': period_end,
                    'plan_amount': plan_amount,
                    'exists': row is not None
                })
            }

        if method == 'POST':
            body = json.loads(event.get('body') or '{}')
            producer_email = (body.get('producer_email') or '').strip()
            period_start = (body.get('period_start') or '').strip()
            period_end = (body.get('period_end') or '').strip()
            plan_amount = body.get('plan_amount')
            set_by_email = (body.get('set_by_email') or '').strip()
            user_role = (body.get('user_role') or '').strip()

            if not producer_email or not period_start or not period_end or plan_amount is None:
                return {'statusCode': 400, 'headers': cors_headers, 'body': json.dumps({'error': 'Не все поля заполнены'})}

            if user_role != 'director':
                return {'statusCode': 403, 'headers': cors_headers, 'body': json.dumps({'error': 'Только директор может задавать план'})}

            try:
                plan_amount_val = float(plan_amount)
            except (TypeError, ValueError):
                return {'statusCode': 400, 'headers': cors_headers, 'body': json.dumps({'error': 'plan_amount должен быть числом'})}

            cur.execute(
                f"""INSERT INTO {schema}.producer_income_plans (producer_email, period_start, period_end, plan_amount, set_by_email)
                    VALUES (%s, %s, %s, %s, %s)
                    ON CONFLICT (producer_email, period_start, period_end)
                    DO UPDATE SET plan_amount = EXCLUDED.plan_amount,
                                  set_by_email = EXCLUDED.set_by_email,
                                  updated_at = CURRENT_TIMESTAMP
                    RETURNING id, plan_amount""",
                (producer_email, period_start, period_end, plan_amount_val, set_by_email)
            )
            result = cur.fetchone()
            conn.commit()

            return {
                'statusCode': 200,
                'headers': cors_headers,
                'body': json.dumps({'success': True, 'id': result['id'], 'plan_amount': float(result['plan_amount'])})
            }

        return {'statusCode': 405, 'headers': cors_headers, 'body': json.dumps({'error': 'Method not allowed'})}

    finally:
        cur.close()
        conn.close()
