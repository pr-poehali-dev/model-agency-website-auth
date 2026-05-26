'''
Business: Ежедневный снимок таблицы model_finances в model_finances_archive.
         GET — список доступных снимков. POST с action=restore и snapshot_date — восстановление.
Args: event с httpMethod (GET, POST, OPTIONS); POST body может содержать action и snapshot_date.
Returns: HTTP response с результатом операции.
'''
import json
import os
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor


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

    try:
        if method == 'GET':
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute('''
                SELECT snapshot_date::text AS snapshot_date,
                       COUNT(*) AS rows_count,
                       MIN(snapshot_at)::text AS snapshot_at
                FROM t_p35405502_model_agency_website.model_finances_archive
                GROUP BY snapshot_date
                ORDER BY snapshot_date DESC
            ''')
            snapshots = cur.fetchall()
            cur.close()
            return {
                'statusCode': 200,
                'headers': {**cors_headers, 'Content-Type': 'application/json'},
                'body': json.dumps({'snapshots': [dict(r) for r in snapshots]}),
            }

        body_raw = event.get('body') or '{}'
        try:
            body = json.loads(body_raw) if body_raw else {}
        except Exception:
            body = {}
        action = body.get('action', 'snapshot')

        cur = conn.cursor()

        if action == 'restore':
            snapshot_date = body.get('snapshot_date')
            if not snapshot_date:
                return {
                    'statusCode': 400,
                    'headers': {**cors_headers, 'Content-Type': 'application/json'},
                    'body': json.dumps({'error': 'snapshot_date is required'}),
                }
            safe_date = str(snapshot_date).replace("'", "''")

            cur.execute(f'''
                SELECT COUNT(*) FROM t_p35405502_model_agency_website.model_finances_archive
                WHERE snapshot_date = '{safe_date}'
            ''')
            archive_rows = cur.fetchone()[0]
            if archive_rows == 0:
                return {
                    'statusCode': 404,
                    'headers': {**cors_headers, 'Content-Type': 'application/json'},
                    'body': json.dumps({'error': f'No snapshot for date {snapshot_date}'}),
                }

            cur.execute('TRUNCATE t_p35405502_model_agency_website.model_finances RESTART IDENTITY')

            cur.execute(f'''
                INSERT INTO t_p35405502_model_agency_website.model_finances (
                    id, model_id, date,
                    cb_tokens, sp_tokens, soda_tokens,
                    cb_income, sp_income, soda_income,
                    operator_name, has_shift, created_at, updated_at,
                    transfers, stripchat_tokens,
                    cb_online, sp_online, soda_online,
                    cam4_tokens, cam4_income
                )
                SELECT
                    id, model_id, date,
                    cb_tokens, sp_tokens, soda_tokens,
                    cb_income, sp_income, soda_income,
                    operator_name, has_shift, created_at, updated_at,
                    transfers, stripchat_tokens,
                    cb_online, sp_online, soda_online,
                    cam4_tokens, cam4_income
                FROM t_p35405502_model_agency_website.model_finances_archive
                WHERE snapshot_date = '{safe_date}'
            ''')
            restored = cur.rowcount

            cur.execute('''
                SELECT setval(
                    pg_get_serial_sequence('t_p35405502_model_agency_website.model_finances','id'),
                    COALESCE((SELECT MAX(id) FROM t_p35405502_model_agency_website.model_finances), 1),
                    true
                )
            ''')
            conn.commit()

            return {
                'statusCode': 200,
                'headers': {**cors_headers, 'Content-Type': 'application/json'},
                'body': json.dumps({
                    'status': 'restored',
                    'snapshot_date': snapshot_date,
                    'rows_restored': restored,
                }),
            }

        force = bool(body.get('force', False))

        cur.execute('''
            SELECT COUNT(*)
            FROM t_p35405502_model_agency_website.model_finances_archive
            WHERE snapshot_date = CURRENT_DATE
        ''')
        already = cur.fetchone()[0]

        if already > 0 and not force:
            return {
                'statusCode': 200,
                'headers': {**cors_headers, 'Content-Type': 'application/json'},
                'body': json.dumps({
                    'status': 'skipped',
                    'message': f'Snapshot for today already exists ({already} rows)',
                    'rows': already,
                }),
            }

        if already > 0 and force:
            cur.execute('''
                DELETE FROM t_p35405502_model_agency_website.model_finances_archive
                WHERE snapshot_date = CURRENT_DATE
            ''')
            conn.commit()

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
        conn.close()