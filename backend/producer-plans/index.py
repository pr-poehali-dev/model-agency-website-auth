import json
import os
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

SCHEMA = 't_p35405502_model_agency_website'
PLANNED_ROLES = ('producer', 'operator', 'content_maker')
PLAN_TYPES = ('income', 'shifts')
DEFAULT_BONUS = 5000.0


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Планы сотрудников на период (доход или смены) и размер премии. Директор задаёт, сотрудник читает.
    Args: event с httpMethod (GET/POST), queryStringParameters или body
    Returns: План на период { plan_type, plan_amount, bonus_amount }
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

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        if method == 'GET':
            params = event.get('queryStringParameters') or {}
            user_email = (params.get('user_email') or params.get('producer_email') or '').strip()
            period_start = (params.get('period_start') or '').strip()
            period_end = (params.get('period_end') or '').strip()

            if not period_start or not period_end:
                return {'statusCode': 400, 'headers': cors_headers, 'body': json.dumps({'error': 'period_start и period_end обязательны'})}

            if not user_email:
                cur.execute(
                    f"""SELECT u.email, u.full_name, u.role,
                               p.plan_type, p.plan_amount, p.bonus_amount
                        FROM {SCHEMA}.users u
                        LEFT JOIN {SCHEMA}.employee_plans p
                          ON p.user_email = u.email
                         AND p.period_start = %s AND p.period_end = %s
                        WHERE u.is_active = true AND u.role = ANY(%s)
                        ORDER BY u.role, u.full_name""",
                    (period_start, period_end, list(PLANNED_ROLES))
                )
                employees = []
                for r in cur.fetchall():
                    employees.append({
                        'email': r['email'],
                        'full_name': r['full_name'] or r['email'],
                        'role': r['role'],
                        'plan_type': r['plan_type'] or ('income' if r['role'] == 'producer' else 'shifts'),
                        'plan_amount': float(r['plan_amount']) if r['plan_amount'] is not None else 0.0,
                        'bonus_amount': float(r['bonus_amount']) if r['bonus_amount'] is not None else DEFAULT_BONUS,
                        'exists': r['plan_type'] is not None,
                    })
                return {
                    'statusCode': 200,
                    'headers': cors_headers,
                    'body': json.dumps({'employees': employees, 'period_start': period_start, 'period_end': period_end})
                }

            cur.execute(
                f"""SELECT plan_type, plan_amount, bonus_amount, set_by_email, updated_at
                    FROM {SCHEMA}.employee_plans
                    WHERE user_email = %s AND period_start = %s AND period_end = %s""",
                (user_email, period_start, period_end)
            )
            row = cur.fetchone()

            return {
                'statusCode': 200,
                'headers': cors_headers,
                'body': json.dumps({
                    'user_email': user_email,
                    'producer_email': user_email,
                    'period_start': period_start,
                    'period_end': period_end,
                    'plan_type': row['plan_type'] if row else 'income',
                    'plan_amount': float(row['plan_amount']) if row else 0.0,
                    'bonus_amount': float(row['bonus_amount']) if row else DEFAULT_BONUS,
                    'exists': row is not None
                })
            }

        if method == 'POST':
            body = json.loads(event.get('body') or '{}')
            user_email = (body.get('user_email') or body.get('producer_email') or '').strip()
            period_start = (body.get('period_start') or '').strip()
            period_end = (body.get('period_end') or '').strip()
            plan_amount = body.get('plan_amount')
            plan_type = (body.get('plan_type') or 'income').strip()
            bonus_amount = body.get('bonus_amount', DEFAULT_BONUS)
            set_by_email = (body.get('set_by_email') or '').strip()
            user_role = (body.get('user_role') or '').strip()

            if not user_email or not period_start or not period_end or plan_amount is None:
                return {'statusCode': 400, 'headers': cors_headers, 'body': json.dumps({'error': 'Не все поля заполнены'})}

            if user_role != 'director':
                return {'statusCode': 403, 'headers': cors_headers, 'body': json.dumps({'error': 'Только директор может задавать план'})}

            if plan_type not in PLAN_TYPES:
                return {'statusCode': 400, 'headers': cors_headers, 'body': json.dumps({'error': 'plan_type должен быть income или shifts'})}

            try:
                plan_amount_val = float(plan_amount)
                bonus_amount_val = float(bonus_amount)
            except (TypeError, ValueError):
                return {'statusCode': 400, 'headers': cors_headers, 'body': json.dumps({'error': 'plan_amount и bonus_amount должны быть числами'})}

            if plan_amount_val < 0 or bonus_amount_val < 0:
                return {'statusCode': 400, 'headers': cors_headers, 'body': json.dumps({'error': 'Значения не могут быть отрицательными'})}

            cur.execute(f"SELECT role FROM {SCHEMA}.users WHERE email = %s", (user_email,))
            target = cur.fetchone()
            target_role = target['role'] if target else 'producer'

            cur.execute(
                f"""INSERT INTO {SCHEMA}.employee_plans
                        (user_email, user_role, period_start, period_end, plan_type, plan_amount, bonus_amount, set_by_email)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (user_email, period_start, period_end)
                    DO UPDATE SET plan_type = EXCLUDED.plan_type,
                                  plan_amount = EXCLUDED.plan_amount,
                                  bonus_amount = EXCLUDED.bonus_amount,
                                  set_by_email = EXCLUDED.set_by_email,
                                  updated_at = CURRENT_TIMESTAMP
                    RETURNING id, plan_type, plan_amount, bonus_amount""",
                (user_email, target_role, period_start, period_end, plan_type, plan_amount_val, bonus_amount_val, set_by_email)
            )
            result = cur.fetchone()

            if target_role == 'producer' and plan_type == 'income':
                cur.execute(
                    f"""INSERT INTO {SCHEMA}.producer_income_plans
                            (producer_email, period_start, period_end, plan_amount, set_by_email)
                        VALUES (%s, %s, %s, %s, %s)
                        ON CONFLICT (producer_email, period_start, period_end)
                        DO UPDATE SET plan_amount = EXCLUDED.plan_amount,
                                      set_by_email = EXCLUDED.set_by_email,
                                      updated_at = CURRENT_TIMESTAMP""",
                    (user_email, period_start, period_end, plan_amount_val, set_by_email)
                )

            conn.commit()

            return {
                'statusCode': 200,
                'headers': cors_headers,
                'body': json.dumps({
                    'success': True,
                    'id': result['id'],
                    'plan_type': result['plan_type'],
                    'plan_amount': float(result['plan_amount']),
                    'bonus_amount': float(result['bonus_amount'])
                })
            }

        return {'statusCode': 405, 'headers': cors_headers, 'body': json.dumps({'error': 'Method not allowed'})}

    finally:
        cur.close()
        conn.close()
