'''
Business: Ежедневное копирование таблицы model_finances в архив model_finances_archive.
         Если за сегодняшний день снимок уже сделан — возвращает информацию без повторного копирования.
Args: event с httpMethod (GET или POST), context с request_id
Returns: HTTP response со статусом и количеством скопированных строк
'''
import json
import os
from typing import Dict, Any
import psycopg2


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'POST')

    cors_headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
        'Access-Control-Max-Age': '86400',
    }

    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors_headers, 'body': ''}

    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        return {
            'statusCode': 500,
            'headers': {**cors_headers, 'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'DATABASE_URL not configured'}),
        }

    conn = psycopg2.connect(dsn)
    cur = conn.cursor()

    try:
        cur.execute('''
            SELECT COUNT(*)
            FROM t_p35405502_model_agency_website.model_finances_archive
            WHERE snapshot_date = CURRENT_DATE
        ''')
        already = cur.fetchone()[0]

        if already > 0:
            return {
                'statusCode': 200,
                'headers': {**cors_headers, 'Content-Type': 'application/json'},
                'body': json.dumps({
                    'status': 'skipped',
                    'message': f'Snapshot for today already exists ({already} rows)',
                    'rows': already,
                }),
            }

        cur.execute('''
            INSERT INTO t_p35405502_model_agency_website.model_finances_archive (
                snapshot_date, snapshot_at, id, model_id, date,
                cb_tokens, sp_tokens, soda_tokens,
                cb_income, sp_income, soda_income,
                operator_name, has_shift, created_at, updated_at,
                transfers, stripchat_tokens,
                cb_online, sp_online, soda_online,
                cam4_tokens, cam4_income
            )
            SELECT
                CURRENT_DATE, CURRENT_TIMESTAMP, id, model_id, date,
                cb_tokens, sp_tokens, soda_tokens,
                cb_income, sp_income, soda_income,
                operator_name, has_shift, created_at, updated_at,
                transfers, stripchat_tokens,
                cb_online, sp_online, soda_online,
                cam4_tokens, cam4_income
            FROM t_p35405502_model_agency_website.model_finances
        ''')
        copied = cur.rowcount
        conn.commit()

        cur.execute('''
            DELETE FROM t_p35405502_model_agency_website.model_finances_archive
            WHERE snapshot_date < CURRENT_DATE - INTERVAL '90 days'
        ''')
        cleaned = cur.rowcount
        conn.commit()

        return {
            'statusCode': 200,
            'headers': {**cors_headers, 'Content-Type': 'application/json'},
            'body': json.dumps({
                'status': 'success',
                'rows_copied': copied,
                'old_snapshots_removed': cleaned,
            }),
        }
    except Exception as e:
        conn.rollback()
        return {
            'statusCode': 500,
            'headers': {**cors_headers, 'Content-Type': 'application/json'},
            'body': json.dumps({'error': str(e)}),
        }
    finally:
        cur.close()
        conn.close()
