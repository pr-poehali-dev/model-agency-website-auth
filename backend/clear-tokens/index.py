'''
Очистка токенов авторизации для сброса всех сессий
Returns: статус операции
'''

import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor

def get_db_connection():
    dsn = os.environ.get('DATABASE_URL')
    return psycopg2.connect(dsn, cursor_factory=RealDictCursor)

def handler(event: dict, context) -> dict:
    method = event.get('httpMethod', 'POST')
    
    headers = event.get('headers', {})
    origin = headers.get('origin') or headers.get('Origin') or 'https://mba-agency.ru'
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': origin,
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
                'Access-Control-Allow-Credentials': 'true',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': origin,
                'Access-Control-Allow-Credentials': 'true'
            },
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        # Получаем количество токенов перед удалением
        cur.execute("SELECT COUNT(*) as total FROM t_p35405502_model_agency_website.auth_tokens")
        result = cur.fetchone()
        total_before = result['total'] if result else 0
        
        # Удаляем все токены
        cur.execute("DELETE FROM t_p35405502_model_agency_website.auth_tokens")
        conn.commit()
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': origin,
                'Access-Control-Allow-Credentials': 'true'
            },
            'body': json.dumps({
                'success': True,
                'message': f'Удалено {total_before} токенов. Все пользователи должны авторизоваться заново.'
            })
        }
    
    except Exception as e:
        conn.rollback()
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': origin,
                'Access-Control-Allow-Credentials': 'true'
            },
            'body': json.dumps({'error': str(e)})
        }
    
    finally:
        cur.close()
        conn.close()
