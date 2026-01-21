import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Optional, Dict, Any
import os

def get_db_connection():
    dsn = os.environ.get('DATABASE_URL')
    return psycopg2.connect(dsn, cursor_factory=RealDictCursor)

def verify_token(token: str) -> Optional[Dict[str, Any]]:
    """Проверяет токен и возвращает данные пользователя"""
    if not token:
        return None
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        cur.execute("""
            SELECT u.id, u.email, u.role, u.full_name, u.permissions, u.is_active
            FROM auth_tokens at
            JOIN users u ON at.user_id = u.id
            WHERE at.token = %s 
            AND at.expires_at > NOW() 
            AND at.is_active = true
            AND u.is_active = true
        """, (token,))
        
        user = cur.fetchone()
        
        if not user:
            return None
        
        return {
            'id': user['id'],
            'email': user['email'],
            'role': user['role'],
            'fullName': user['full_name'],
            'permissions': user['permissions'],
            'isActive': user['is_active']
        }
    finally:
        cur.close()
        conn.close()

def extract_token_from_headers(headers: Dict[str, str]) -> Optional[str]:
    """Извлекает токен из заголовков (X-Auth-Token или Cookie)"""
    auth_token = headers.get('x-auth-token', headers.get('X-Auth-Token', ''))
    
    if auth_token:
        return auth_token
    
    cookie_header = headers.get('x-cookie', headers.get('X-Cookie', ''))
    if 'auth_token=' in cookie_header:
        return cookie_header.split('auth_token=')[1].split(';')[0]
    
    return None

def require_auth(event: Dict[str, Any]) -> Dict[str, Any]:
    """Middleware для проверки авторизации"""
    headers = event.get('headers', {})
    token = extract_token_from_headers(headers)
    
    user = verify_token(token)
    
    if not user:
        return {
            'statusCode': 401,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': '{"error": "Требуется авторизация"}'
        }
    
    return user

def require_permission(user: Dict[str, Any], permission: str) -> Optional[Dict[str, Any]]:
    """Проверяет наличие прав у пользователя"""
    import json
    
    if user['role'] == 'director':
        return None
    
    permissions = json.loads(user['permissions']) if user['permissions'] else []
    
    if permission not in permissions:
        return {
            'statusCode': 403,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': '{"error": "Недостаточно прав"}'
        }
    
    return None
