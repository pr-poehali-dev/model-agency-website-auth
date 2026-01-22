'''
Обновление пароля пользователя с bcrypt хешированием
Args: event с body содержащим email и новый пароль
Returns: HTTP response со статусом операции
'''

import json
import os
import bcrypt
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'POST')
    
    headers = event.get('headers', {})
    origin = headers.get('origin') or headers.get('Origin') or 'https://preview--model-agency-website-auth.poehali.dev'
    
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
    
    body_data = json.loads(event.get('body', '{}'))
    email = body_data.get('email')
    new_password = body_data.get('password')
    
    if not email or not new_password:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': origin,
                'Access-Control-Allow-Credentials': 'true'
            },
            'body': json.dumps({'error': 'Email and password are required'})
        }
    
    dsn = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(dsn, cursor_factory=RealDictCursor)
    cur = conn.cursor()
    
    try:
        # Проверяем существование пользователя
        cur.execute(
            "SELECT id, email FROM t_p35405502_model_agency_website.users WHERE email = %s",
            (email,)
        )
        user = cur.fetchone()
        
        if not user:
            return {
                'statusCode': 404,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': origin,
                    'Access-Control-Allow-Credentials': 'true'
                },
                'body': json.dumps({'error': 'User not found'})
            }
        
        # Генерируем bcrypt хеш для нового пароля
        password_hash = hash_password(new_password)
        
        # Обновляем пароль
        cur.execute(
            """UPDATE t_p35405502_model_agency_website.users 
               SET password_hash = %s, updated_at = CURRENT_TIMESTAMP 
               WHERE email = %s""",
            (password_hash, email)
        )
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
                'message': f'Password updated for {email}'
            })
        }
    
    finally:
        cur.close()
        conn.close()
