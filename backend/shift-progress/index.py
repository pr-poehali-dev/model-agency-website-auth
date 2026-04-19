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

    def lock_bonus(email: str, role: str, amount: float, reason: str):
        try:
            cur.execute(
                f"""INSERT INTO {schema}.earned_bonuses (user_email, user_role, period_start, period_end, amount, reason)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    ON CONFLICT (user_email, period_start, period_end) DO NOTHING""",
                (email, role, period_start, period_end, amount, reason)
            )
            conn.commit()
        except Exception:
            conn.rollback()

    def check_locked(email: str) -> bool:
        cur.execute(
            f"""SELECT 1 FROM {schema}.earned_bonuses
                WHERE user_email = %s AND period_start = %s AND period_end = %s""",
            (email, period_start, period_end)
        )
        return cur.fetchone() is not None

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

    elif user_role == 'producer':
        cur.execute(
            f"""SELECT DISTINCT model_email
                FROM {schema}.producer_assignments
                WHERE producer_email = %s AND assignment_type = 'model'""",
            (user_email,)
        )
        model_emails = [r['model_email'] for r in cur.fetchall()]
        models_assigned = max(1, len(model_emails))

        income_fact = 0.0
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

            cur.execute(
                f"""SELECT COALESCE(SUM(
                        (COALESCE(mf.cb_income,0) + COALESCE(mf.sp_income,0) + COALESCE(mf.soda_income,0)
                         + COALESCE(mf.cam4_income,0) + COALESCE(mf.transfers,0)) * 0.6
                    ), 0) AS total
                    FROM {schema}.model_finances mf
                    JOIN {schema}.users u ON u.id = mf.model_id
                    WHERE u.email = ANY(%s)
                      AND mf.date >= %s AND mf.date <= %s""",
                (model_emails, period_start, period_end)
            )
            income_fact = float(cur.fetchone()['total'] or 0.0)

        cur.execute(
            f"""SELECT plan_amount FROM {schema}.producer_income_plans
                WHERE producer_email = %s AND period_start = %s AND period_end = %s""",
            (user_email, period_start, period_end)
        )
        plan_row = cur.fetchone()
        income_plan = float(plan_row['plan_amount']) if plan_row else 0.0

        target = 10 * models_assigned
        shifts_ready = shifts_count >= target
        income_ready = income_plan > 0 and income_fact >= income_plan
        bonus_ready = shifts_ready and income_ready

        bonus_locked = check_locked(user_email)
        if bonus_ready and not bonus_locked:
            lock_bonus(user_email, 'producer', 5000, 'Премия продюсера за выполнение плана')
            bonus_locked = True

        cur.close()
        conn.close()

        return {
            'statusCode': 200,
            'headers': cors_headers,
            'body': json.dumps({
                'shifts_count': shifts_count,
                'target': target,
                'models_assigned': models_assigned,
                'income_fact': round(income_fact, 2),
                'income_plan': round(income_plan, 2),
                'shifts_ready': shifts_ready,
                'income_ready': income_ready,
                'bonus_ready': bonus_ready or bonus_locked,
                'bonus_locked': bonus_locked,
                'bonus_amount': 5000 if bonus_locked else 0,
                'supported': True
            })
        }

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

    target = 10 * models_assigned
    bonus_ready = shifts_count >= target

    bonus_locked = check_locked(user_email)
    if bonus_ready and not bonus_locked:
        reason = 'Премия оператора за смены' if user_role == 'operator' else 'Премия контент-мейкера за смены'
        lock_bonus(user_email, user_role, 5000, reason)
        bonus_locked = True

    cur.close()
    conn.close()

    return {
        'statusCode': 200,
        'headers': cors_headers,
        'body': json.dumps({
            'shifts_count': shifts_count,
            'target': target,
            'models_assigned': models_assigned,
            'bonus_ready': bonus_ready or bonus_locked,
            'bonus_locked': bonus_locked,
            'bonus_amount': 5000 if bonus_locked else 0,
            'supported': True
        })
    }