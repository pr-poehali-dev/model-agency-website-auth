'''
Управление парами моделей (две модели работают вместе на одной смене).
GET — список пар, POST — создать пару, PUT — обновить настройки/фото/оператора, DELETE — расформировать.
Доступно директорам и продюсерам.
'''

import json
import os
import psycopg2
from typing import Dict, Any

SCHEMA = 't_p35405502_model_agency_website'

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')

    headers = event.get('headers', {})
    origin = headers.get('origin') or headers.get('Origin') or '*'

    cors_headers = {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-User-Email, X-User-Role, X-Auth-Token',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '86400'
    }

    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors_headers, 'body': ''}

    headers_lower = {k.lower(): v for k, v in headers.items()}
    user_email = headers_lower.get('x-user-email', '')
    user_role = headers_lower.get('x-user-role', '')

    if user_role not in ('director', 'producer'):
        return {
            'statusCode': 403,
            'headers': {**cors_headers, 'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Доступ запрещён'})
        }

    dsn = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(dsn)
    cur = conn.cursor()

    try:
        if method == 'GET':
            cur.execute(f"""
                SELECT
                    mp.id,
                    mp.model1_email,
                    mp.model2_email,
                    mp.pair_photo_url,
                    mp.created_by,
                    mp.created_at,
                    mp.is_active,
                    u1.full_name AS model1_name,
                    u1.photo_url AS model1_photo,
                    u2.full_name AS model2_name,
                    u2.photo_url AS model2_photo,
                    mp.model_percentage,
                    mp.operator_percentage,
                    mp.producer_percentage,
                    mp.operator_email,
                    uop.full_name AS operator_name
                FROM {SCHEMA}.model_pairs mp
                LEFT JOIN {SCHEMA}.users u1 ON u1.email = mp.model1_email
                LEFT JOIN {SCHEMA}.users u2 ON u2.email = mp.model2_email
                LEFT JOIN {SCHEMA}.users uop ON uop.email = mp.operator_email
                WHERE mp.is_active = true
                ORDER BY mp.created_at DESC
            """)
            rows = cur.fetchall()
            pairs = []
            for row in rows:
                pairs.append({
                    'id': row[0],
                    'model1_email': row[1],
                    'model2_email': row[2],
                    'pair_photo_url': row[3],
                    'created_by': row[4],
                    'created_at': str(row[5]),
                    'is_active': row[6],
                    'model1_name': row[7] or row[1],
                    'model1_photo': row[8],
                    'model2_name': row[9] or row[2],
                    'model2_photo': row[10],
                    'model_percentage': float(row[11]) if row[11] is not None else 17.5,
                    'operator_percentage': float(row[12]) if row[12] is not None else 15.0,
                    'producer_percentage': float(row[13]) if row[13] is not None else 10.0,
                    'operator_email': row[14],
                    'operator_name': row[15]
                })
            return {
                'statusCode': 200,
                'headers': {**cors_headers, 'Content-Type': 'application/json'},
                'body': json.dumps({'pairs': pairs})
            }

        elif method == 'POST':
            body = json.loads(event.get('body') or '{}')
            model1_email = body.get('model1_email', '').strip()
            model2_email = body.get('model2_email', '').strip()

            if not model1_email or not model2_email:
                return {
                    'statusCode': 400,
                    'headers': {**cors_headers, 'Content-Type': 'application/json'},
                    'body': json.dumps({'error': 'Укажите обе модели'})
                }

            if model1_email == model2_email:
                return {
                    'statusCode': 400,
                    'headers': {**cors_headers, 'Content-Type': 'application/json'},
                    'body': json.dumps({'error': 'Нельзя объединить модель с самой собой'})
                }

            cur.execute(f"""
                SELECT id FROM {SCHEMA}.model_pairs
                WHERE is_active = true
                AND (model1_email = %s OR model2_email = %s OR model1_email = %s OR model2_email = %s)
            """, (model1_email, model1_email, model2_email, model2_email))
            if cur.fetchone():
                return {
                    'statusCode': 409,
                    'headers': {**cors_headers, 'Content-Type': 'application/json'},
                    'body': json.dumps({'error': 'Одна из моделей уже состоит в активной паре'})
                }

            e1, e2 = sorted([model1_email, model2_email])

            cur.execute(f"""
                INSERT INTO {SCHEMA}.model_pairs (model1_email, model2_email, created_by, is_active)
                VALUES (%s, %s, %s, true)
                ON CONFLICT (model1_email, model2_email) DO UPDATE
                    SET is_active = true, created_by = EXCLUDED.created_by, updated_at = NOW()
                RETURNING id
            """, (e1, e2, user_email))
            pair_id = cur.fetchone()[0]
            conn.commit()

            return {
                'statusCode': 200,
                'headers': {**cors_headers, 'Content-Type': 'application/json'},
                'body': json.dumps({'success': True, 'pair_id': pair_id})
            }

        elif method == 'PUT':
            body = json.loads(event.get('body') or '{}')
            pair_id = body.get('pair_id')

            if not pair_id:
                return {
                    'statusCode': 400,
                    'headers': {**cors_headers, 'Content-Type': 'application/json'},
                    'body': json.dumps({'error': 'Укажите pair_id'})
                }

            # Строим UPDATE динамически — обновляем только переданные поля
            fields = []
            values = []

            if 'pair_photo_url' in body:
                fields.append('pair_photo_url = %s')
                values.append(body['pair_photo_url'])

            if 'model_percentage' in body:
                mp = float(body['model_percentage'])
                op = float(body.get('operator_percentage', 0))
                pp = float(body.get('producer_percentage', 0))
                total = mp * 2 + op + pp
                if round(total, 2) != 60.0:
                    return {
                        'statusCode': 400,
                        'headers': {**cors_headers, 'Content-Type': 'application/json'},
                        'body': json.dumps({'error': f'Сумма процентов должна быть 60%. Сейчас: {total}%'})
                    }
                fields += ['model_percentage = %s', 'operator_percentage = %s', 'producer_percentage = %s']
                values += [mp, op, pp]

            if 'operator_email' in body:
                fields.append('operator_email = %s')
                values.append(body['operator_email'] or None)

            if not fields:
                return {
                    'statusCode': 400,
                    'headers': {**cors_headers, 'Content-Type': 'application/json'},
                    'body': json.dumps({'error': 'Нет данных для обновления'})
                }

            fields.append('updated_at = NOW()')
            values.append(pair_id)

            cur.execute(f"""
                UPDATE {SCHEMA}.model_pairs
                SET {', '.join(fields)}
                WHERE id = %s
                RETURNING id
            """, values)
            updated = cur.fetchone()
            conn.commit()

            if not updated:
                return {
                    'statusCode': 404,
                    'headers': {**cors_headers, 'Content-Type': 'application/json'},
                    'body': json.dumps({'error': 'Пара не найдена'})
                }

            return {
                'statusCode': 200,
                'headers': {**cors_headers, 'Content-Type': 'application/json'},
                'body': json.dumps({'success': True})
            }

        elif method == 'DELETE':
            query_params = event.get('queryStringParameters') or {}
            pair_id = query_params.get('pair_id')

            if not pair_id:
                return {
                    'statusCode': 400,
                    'headers': {**cors_headers, 'Content-Type': 'application/json'},
                    'body': json.dumps({'error': 'Укажите pair_id'})
                }

            cur.execute(f"""
                UPDATE {SCHEMA}.model_pairs
                SET is_active = false, updated_at = NOW()
                WHERE id = %s
                RETURNING id
            """, (pair_id,))
            deleted = cur.fetchone()
            conn.commit()

            if not deleted:
                return {
                    'statusCode': 404,
                    'headers': {**cors_headers, 'Content-Type': 'application/json'},
                    'body': json.dumps({'error': 'Пара не найдена'})
                }

            return {
                'statusCode': 200,
                'headers': {**cors_headers, 'Content-Type': 'application/json'},
                'body': json.dumps({'success': True})
            }

        return {
            'statusCode': 405,
            'headers': {**cors_headers, 'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Метод не поддерживается'})
        }

    finally:
        cur.close()
        conn.close()
