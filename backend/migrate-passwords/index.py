'''
Служебная функция для миграции паролей с SHA256 на bcrypt
Только для одноразового использования администратором
Args: event с httpMethod и секретным ключом
Returns: Результат миграции
'''

import json
import os
import bcrypt
import psycopg2
from psycopg2.extras import RealDictCursor

MIGRATION_SECRET = os.environ.get('MIGRATION_SECRET', 'temp-secret-key-12345')

def get_db_connection():
    dsn = os.environ.get('DATABASE_URL')
    return psycopg2.connect(dsn, cursor_factory=RealDictCursor)

def hash_password_bcrypt(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def handler(event, context):
    method = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token'
            },
            'body': ''
        }
    
    body = json.loads(event.get('body', '{}'))
    secret = body.get('secret', '')
    
    if secret != MIGRATION_SECRET:
        return {
            'statusCode': 403,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Неверный секретный ключ'})
        }
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        default_password_bcrypt = hash_password_bcrypt('password123')
        
        cur.execute("UPDATE users SET password_hash = %s", (default_password_bcrypt,))
        
        updated_count = cur.rowcount
        conn.commit()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'success': True,
                'message': f'Обновлено {updated_count} паролей на bcrypt',
                'updated': updated_count
            })
        }
    
    except Exception as e:
        conn.rollback()
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': f'Ошибка миграции: {str(e)}'})
        }
    finally:
        cur.close()
        conn.close()