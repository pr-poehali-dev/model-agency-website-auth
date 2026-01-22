"""
API для управления заблокированными датами ввода токенов.
Директора могут блокировать/разблокировать даты, чтобы модели не могли вводить токены за эти периоды.
"""
import json
import os
import psycopg2
from datetime import datetime

def handler(event: dict, context) -> dict:
    method = event.get('httpMethod', 'GET')
    
    # CORS preflight
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token'
            },
            'body': ''
        }
    
    # Получаем email директора из заголовков
    director_email = event.get('headers', {}).get('X-User-Id', '')
    if not director_email:
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Unauthorized'})
        }
    
    # Подключение к БД
    dsn = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(dsn)
    cursor = conn.cursor()
    
    try:
        if method == 'GET':
            # Получить список заблокированных дат
            cursor.execute("""
                SELECT blocked_date, reason, created_by, created_at, platform
                FROM t_p35405502_model_agency_website.blocked_dates
                ORDER BY blocked_date DESC
            """)
            
            rows = cursor.fetchall()
            blocked_dates = []
            for row in rows:
                blocked_dates.append({
                    'date': row[0].isoformat() if row[0] else None,
                    'reason': row[1],
                    'created_by': row[2],
                    'created_at': row[3].isoformat() if row[3] else None,
                    'platform': row[4] or 'all'
                })
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'blocked_dates': blocked_dates})
            }
        
        elif method == 'POST':
            # Добавить заблокированную дату
            body = json.loads(event.get('body', '{}'))
            blocked_date = body.get('date')
            reason = body.get('reason', '')
            platform = body.get('platform', 'all')  # all, chaturbate, stripchat
            
            if not blocked_date:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Date is required'})
                }
            
            if platform not in ['all', 'chaturbate', 'stripchat']:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Invalid platform'})
                }
            
            cursor.execute("""
                INSERT INTO t_p35405502_model_agency_website.blocked_dates 
                (blocked_date, reason, created_by, platform)
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (blocked_date, platform) DO NOTHING
                RETURNING id
            """, (blocked_date, reason, director_email, platform))
            
            result = cursor.fetchone()
            conn.commit()
            
            if result:
                return {
                    'statusCode': 201,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True, 'message': 'Date blocked successfully'})
                }
            else:
                return {
                    'statusCode': 409,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Date already blocked for this platform'})
                }
        
        elif method == 'DELETE':
            # Разблокировать дату
            params = event.get('queryStringParameters', {})
            blocked_date = params.get('date')
            platform = params.get('platform', 'all')
            
            if not blocked_date:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Date is required'})
                }
            
            cursor.execute("""
                DELETE FROM t_p35405502_model_agency_website.blocked_dates
                WHERE blocked_date = %s AND platform = %s
            """, (blocked_date, platform))
            
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'message': 'Date unblocked successfully'})
            }
        
        else:
            return {
                'statusCode': 405,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Method not allowed'})
            }
    
    finally:
        cursor.close()
        conn.close()