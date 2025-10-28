'''
Business: Authentication API for login and user management
Args: event with httpMethod (GET/POST/PUT/DELETE), body, queryStringParameters
      context with request_id, function_name attributes
Returns: HTTP response with user data or auth status
'''

import json
import os
import hashlib
import secrets
from typing import Dict, Any, Optional
import psycopg2
from psycopg2.extras import RealDictCursor

def get_db_connection():
    dsn = os.environ.get('DATABASE_URL')
    return psycopg2.connect(dsn, cursor_factory=RealDictCursor)

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password: str, password_hash: str) -> bool:
    return hash_password(password) == password_hash

def generate_token() -> str:
    return secrets.token_urlsafe(32)

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token, X-User-Email',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        if method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            action = body_data.get('action', 'login')
            
            if action == 'login':
                email = body_data.get('email', '')
                password = body_data.get('password', '')
                
                cur.execute(
                    "SELECT id, email, role, full_name, is_active, permissions FROM users WHERE email = %s AND password_hash = %s",
                    (email, hash_password(password))
                )
                user = cur.fetchone()
                
                if not user:
                    return {
                        'statusCode': 401,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Неверный email или пароль'})
                    }
                
                if not user['is_active']:
                    return {
                        'statusCode': 403,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Учетная запись деактивирована'})
                    }
                
                token = generate_token()
                permissions = json.loads(user['permissions']) if user['permissions'] else []
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'user': {
                            'id': user['id'],
                            'email': user['email'],
                            'role': user['role'],
                            'fullName': user['full_name'],
                            'permissions': permissions
                        },
                        'token': token
                    })
                }
            
            elif action == 'create_user':
                email = body_data.get('email', '')
                password = body_data.get('password', '')
                role = body_data.get('role', 'content')
                full_name = body_data.get('fullName', '')
                
                permissions = body_data.get('permissions', [])
                permissions_json = json.dumps(permissions)
                
                cur.execute(
                    "INSERT INTO users (email, password_hash, role, full_name, permissions) VALUES (%s, %s, %s, %s, %s) RETURNING id, email, role, full_name, is_active, permissions",
                    (email, hash_password(password), role, full_name, permissions_json)
                )
                new_user = cur.fetchone()
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'id': new_user['id'],
                        'email': new_user['email'],
                        'role': new_user['role'],
                        'fullName': new_user['full_name'],
                        'isActive': new_user['is_active'],
                        'permissions': json.loads(new_user['permissions']) if new_user['permissions'] else []
                    })
                }
        
        elif method == 'GET':
            cur.execute("SELECT id, email, role, full_name, is_active, permissions, created_at FROM users ORDER BY created_at DESC")
            users = cur.fetchall()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps([{
                    'id': u['id'],
                    'email': u['email'],
                    'role': u['role'],
                    'fullName': u['full_name'],
                    'isActive': u['is_active'],
                    'permissions': json.loads(u['permissions']) if u['permissions'] else [],
                    'createdAt': u['created_at'].isoformat()
                } for u in users])
            }
        
        elif method == 'PUT':
            body_data = json.loads(event.get('body', '{}'))
            user_id = body_data.get('id')
            
            headers = event.get('headers', {})
            print(f"All headers: {headers}")
            requesting_email = headers.get('x-user-email', headers.get('X-User-Email', '')).lower()
            print(f"PUT request from email: {requesting_email}")
            
            if not requesting_email:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Отсутствует заголовок x-user-email'})
                }
            
            cur.execute("SELECT role, permissions FROM users WHERE LOWER(email) = %s", (requesting_email,))
            requesting_user = cur.fetchone()
            
            if not requesting_user:
                print(f"User not found: {requesting_email}")
                return {
                    'statusCode': 403,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': f'Пользователь не найден: {requesting_email}'})
                }
            
            requesting_permissions = json.loads(requesting_user['permissions']) if requesting_user['permissions'] else []
            is_director = requesting_user['role'] == 'director'
            has_manage_users = 'manage_users' in requesting_permissions or is_director
            
            if not has_manage_users:
                return {
                    'statusCode': 403,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Недостаточно прав для управления пользователями'})
                }
            
            cur.execute("SELECT role FROM users WHERE id = %s", (user_id,))
            user = cur.fetchone()
            if user and user['role'] == 'director':
                return {
                    'statusCode': 403,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Нельзя изменять права директора'})
                }
            
            updates = []
            params = []
            
            if 'password' in body_data and body_data['password']:
                updates.append("password_hash = %s")
                params.append(hash_password(body_data['password']))
            
            if 'role' in body_data:
                updates.append("role = %s")
                params.append(body_data['role'])
            
            if 'fullName' in body_data:
                updates.append("full_name = %s")
                params.append(body_data['fullName'])
            
            if 'isActive' in body_data:
                updates.append("is_active = %s")
                params.append(body_data['isActive'])
            
            if 'permissions' in body_data:
                new_permissions = body_data['permissions']
                if 'manage_users' in new_permissions and not is_director:
                    return {
                        'statusCode': 403,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Только директор может выдавать права на управление пользователями'})
                    }
                
                updates.append("permissions = %s")
                params.append(json.dumps(new_permissions))
            
            if updates:
                params.append(user_id)
                query = f"UPDATE users SET {', '.join(updates)}, updated_at = CURRENT_TIMESTAMP WHERE id = %s RETURNING id, email, role, full_name, is_active, permissions"
                cur.execute(query, params)
                updated_user = cur.fetchone()
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'id': updated_user['id'],
                        'email': updated_user['email'],
                        'role': updated_user['role'],
                        'fullName': updated_user['full_name'],
                        'isActive': updated_user['is_active'],
                        'permissions': json.loads(updated_user['permissions']) if updated_user['permissions'] else []
                    })
                }
        
        elif method == 'DELETE':
            query_params = event.get('queryStringParameters', {})
            user_id = query_params.get('id')
            
            cur.execute("SELECT role FROM users WHERE id = %s", (user_id,))
            user = cur.fetchone()
            if user and user['role'] == 'director':
                return {
                    'statusCode': 403,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Нельзя удалить директора'})
                }
            
            cur.execute("DELETE FROM users WHERE id = %s", (user_id,))
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True})
            }
        
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    finally:
        cur.close()
        conn.close()