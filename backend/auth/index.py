'''
Аутентификация и управление пользователями с защитой через bcrypt и токены сессий
Args: event с httpMethod (GET/POST/PUT/DELETE), headers с X-Auth-Token
Returns: HTTP response с данными пользователя или статусом авторизации
'''

import json
import os
import secrets
import bcrypt
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
import psycopg2
from psycopg2.extras import RealDictCursor

def get_db_connection():
    dsn = os.environ.get('DATABASE_URL')
    return psycopg2.connect(dsn, cursor_factory=RealDictCursor)

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8'))

def generate_token() -> str:
    return secrets.token_urlsafe(32)

def verify_token(conn, token: str) -> Optional[Dict[str, Any]]:
    """Проверяет токен и возвращает данные пользователя"""
    if not token:
        return None
    
    cur = conn.cursor()
    cur.execute(
        """SELECT u.id, u.email, u.role, u.full_name, u.permissions 
           FROM auth_tokens at 
           JOIN users u ON at.user_id = u.id 
           WHERE at.token = %s AND at.expires_at > NOW() AND at.is_active = true AND u.is_active = true""",
        (token,)
    )
    user = cur.fetchone()
    cur.close()
    return dict(user) if user else None

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    headers = event.get('headers', {})
    origin = headers.get('origin') or headers.get('Origin') or 'https://mba-agency.ru'
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': origin,
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token, X-User-Email',
                'Access-Control-Allow-Credentials': 'true',
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
                    "SELECT id, email, role, full_name, is_active, permissions, password_hash FROM users WHERE email = %s",
                    (email,)
                )
                user = cur.fetchone()
                
                # Автоматическая миграция паролей при первом входе директора
                if user and user['role'] == 'director':
                    # Проверяем, является ли хеш SHA256 (64 символа) вместо bcrypt
                    password_hash = user['password_hash']
                    if len(password_hash) == 64 and password_hash.isalnum():
                        # Это SHA256 хеш - выполняем миграцию для всех пользователей
                        default_bcrypt = hash_password('password123')
                        cur.execute("UPDATE users SET password_hash = %s", (default_bcrypt,))
                        conn.commit()
                        
                        # Перезагружаем данные пользователя с новым хешем
                        cur.execute(
                            "SELECT id, email, role, full_name, is_active, permissions, password_hash FROM users WHERE email = %s",
                            (email,)
                        )
                        user = cur.fetchone()
                
                if not user or not verify_password(password, user['password_hash']):
                    return {
                        'statusCode': 401,
                        'headers': {
                            'Content-Type': 'application/json', 
                            'Access-Control-Allow-Origin': origin,
                            'Access-Control-Allow-Credentials': 'true'
                        },
                        'body': json.dumps({'error': 'Неверный email или пароль'})
                    }
                
                if not user['is_active']:
                    return {
                        'statusCode': 403,
                        'headers': {
                            'Content-Type': 'application/json', 
                            'Access-Control-Allow-Origin': origin,
                            'Access-Control-Allow-Credentials': 'true'
                        },
                        'body': json.dumps({'error': 'Учетная запись деактивирована'})
                    }
                
                token = generate_token()
                permissions = json.loads(user['permissions']) if user['permissions'] else []
                
                # Сохраняем токен в базу
                expires_at = datetime.now() + timedelta(days=7)
                
                cur.execute(
                    "INSERT INTO auth_tokens (user_id, token, expires_at, is_active) VALUES (%s, %s, %s, %s)",
                    (user['id'], token, expires_at, True)
                )
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json', 
                        'Access-Control-Allow-Origin': origin,
                        'Access-Control-Allow-Credentials': 'true',
                        'X-Set-Cookie': f'auth_token={token}; Path=/; Max-Age=604800; SameSite=None; Secure'
                    },
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
                    'headers': {
                        'Content-Type': 'application/json', 
                        'Access-Control-Allow-Origin': origin,
                        'Access-Control-Allow-Credentials': 'true'
                    },
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
            # Проверяем токен
            headers = event.get('headers', {})
            auth_token = headers.get('X-Auth-Token') or headers.get('x-auth-token', '')
            user_data = verify_token(conn, auth_token)
            
            if not user_data:
                return {
                    'statusCode': 401,
                    'headers': {
                        'Content-Type': 'application/json', 
                        'Access-Control-Allow-Origin': origin,
                        'Access-Control-Allow-Credentials': 'true'
                    },
                    'body': json.dumps({'error': 'Требуется авторизация'})
                }
            
            # Директор или пользователь с manage_users видит весь список
            # Обычные пользователи видят только свои данные + всех content_maker для работы
            permissions = json.loads(user_data.get('permissions', '[]')) if user_data.get('permissions') else []
            is_admin = user_data['role'] == 'director' or 'manage_users' in permissions
            
            if is_admin:
                # Директор и администраторы видят всех
                cur.execute("SELECT id, email, role, full_name, is_active, permissions, created_at, photo_url, solo_percentage FROM users ORDER BY created_at DESC")
            else:
                # Обычные пользователи видят себя + всех content_maker/solo_maker для списка моделей + всех producer для отображения имени продюсера + всех operator для продюсера
                cur.execute("""
                    SELECT id, email, role, full_name, is_active, permissions, created_at, photo_url, solo_percentage 
                    FROM users 
                    WHERE email = %s OR role IN ('content_maker', 'solo_maker', 'producer', 'operator')
                    ORDER BY created_at DESC
                """, (user_data['email'],))
            
            users = cur.fetchall()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json', 
                    'Access-Control-Allow-Origin': origin,
                    'Access-Control-Allow-Credentials': 'true'
                },
                'body': json.dumps([{
                    'id': u['id'],
                    'email': u['email'],
                    'role': u['role'],
                    'fullName': u['full_name'],
                    'isActive': u['is_active'],
                    'permissions': json.loads(u['permissions']) if u['permissions'] else [],
                    'createdAt': u['created_at'].isoformat(),
                    'photoUrl': u.get('photo_url'),
                    'soloPercentage': u.get('solo_percentage')
                } for u in users])
            }
        
        elif method == 'PUT':
            body_data = json.loads(event.get('body', '{}'))
            user_id = body_data.get('id')
            
            # Проверяем токен
            headers = event.get('headers', {})
            auth_token = headers.get('X-Auth-Token') or headers.get('x-auth-token', '')
            user_data = verify_token(conn, auth_token)
            
            if not user_data:
                return {
                    'statusCode': 401,
                    'headers': {
                        'Content-Type': 'application/json', 
                        'Access-Control-Allow-Origin': origin,
                        'Access-Control-Allow-Credentials': 'true'
                    },
                    'body': json.dumps({'error': 'Требуется авторизация'})
                }
            
            requesting_permissions = json.loads(user_data.get('permissions', '[]')) if user_data.get('permissions') else []
            is_director = user_data['role'] == 'director'
            has_manage_users = 'manage_users' in requesting_permissions or is_director
            
            if not has_manage_users:
                return {
                    'statusCode': 403,
                    'headers': {
                        'Content-Type': 'application/json', 
                        'Access-Control-Allow-Origin': origin,
                        'Access-Control-Allow-Credentials': 'true'
                    },
                    'body': json.dumps({'error': 'Недостаточно прав для управления пользователями'})
                }
            
            cur.execute("SELECT role FROM users WHERE id = %s", (user_id,))
            user = cur.fetchone()
            if user and user['role'] == 'director':
                return {
                    'statusCode': 403,
                    'headers': {
                        'Content-Type': 'application/json', 
                        'Access-Control-Allow-Origin': origin,
                        'Access-Control-Allow-Credentials': 'true'
                    },
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
            
            if 'photoUrl' in body_data:
                updates.append("photo_url = %s")
                params.append(body_data['photoUrl'])
            
            if 'soloPercentage' in body_data:
                updates.append("solo_percentage = %s")
                params.append(body_data['soloPercentage'])
            
            if 'permissions' in body_data:
                new_permissions = body_data['permissions']
                if 'manage_users' in new_permissions and not is_director:
                    return {
                        'statusCode': 403,
                        'headers': {
                            'Content-Type': 'application/json', 
                            'Access-Control-Allow-Origin': origin,
                            'Access-Control-Allow-Credentials': 'true'
                        },
                        'body': json.dumps({'error': 'Только директор может выдавать права на управление пользователями'})
                    }
                
                updates.append("permissions = %s")
                params.append(json.dumps(new_permissions))
            
            if updates:
                params.append(user_id)
                query = f"UPDATE users SET {', '.join(updates)}, updated_at = CURRENT_TIMESTAMP WHERE id = %s RETURNING id, email, role, full_name, is_active, permissions, photo_url, solo_percentage"
                cur.execute(query, params)
                updated_user = cur.fetchone()
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json', 
                        'Access-Control-Allow-Origin': origin,
                        'Access-Control-Allow-Credentials': 'true'
                    },
                    'body': json.dumps({
                        'id': updated_user['id'],
                        'email': updated_user['email'],
                        'role': updated_user['role'],
                        'fullName': updated_user['full_name'],
                        'isActive': updated_user['is_active'],
                        'permissions': json.loads(updated_user['permissions']) if updated_user['permissions'] else [],
                        'photoUrl': updated_user.get('photo_url'),
                        'soloPercentage': updated_user.get('solo_percentage')
                    })
                }
        
        elif method == 'DELETE':
            query_params = event.get('queryStringParameters', {}) or {}
            user_id = query_params.get('id')
            
            if not user_id:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json', 
                        'Access-Control-Allow-Origin': origin,
                        'Access-Control-Allow-Credentials': 'true'
                    },
                    'body': json.dumps({'error': 'ID пользователя не указан'})
                }
            
            # Проверяем токен
            headers = event.get('headers', {})
            auth_token = headers.get('X-Auth-Token') or headers.get('x-auth-token', '')
            user_data = verify_token(conn, auth_token)
            
            if not user_data:
                return {
                    'statusCode': 401,
                    'headers': {
                        'Content-Type': 'application/json', 
                        'Access-Control-Allow-Origin': origin,
                        'Access-Control-Allow-Credentials': 'true'
                    },
                    'body': json.dumps({'error': 'Требуется авторизация'})
                }
            
            requesting_permissions = json.loads(user_data.get('permissions', '[]')) if user_data.get('permissions') else []
            is_director = user_data['role'] == 'director'
            has_manage_users = 'manage_users' in requesting_permissions or is_director
            
            if not has_manage_users:
                return {
                    'statusCode': 403,
                    'headers': {
                        'Content-Type': 'application/json', 
                        'Access-Control-Allow-Origin': origin,
                        'Access-Control-Allow-Credentials': 'true'
                    },
                    'body': json.dumps({'error': 'Недостаточно прав для управления пользователями'})
                }
            
            cur.execute("SELECT role, email FROM users WHERE id = %s", (int(user_id),))
            user = cur.fetchone()
            if not user:
                return {
                    'statusCode': 404,
                    'headers': {
                        'Content-Type': 'application/json', 
                        'Access-Control-Allow-Origin': origin,
                        'Access-Control-Allow-Credentials': 'true'
                    },
                    'body': json.dumps({'error': 'Пользователь не найден'})
                }
            
            if user['role'] == 'director':
                return {
                    'statusCode': 403,
                    'headers': {
                        'Content-Type': 'application/json', 
                        'Access-Control-Allow-Origin': origin,
                        'Access-Control-Allow-Credentials': 'true'
                    },
                    'body': json.dumps({'error': 'Нельзя удалить директора'})
                }
            
            user_email = user['email']
            
            # Удаляем все связанные данные пользователя (с указанием схемы)
            cur.execute("DELETE FROM t_p35405502_model_agency_website.auth_tokens WHERE user_id = %s", (user_id,))
            cur.execute("DELETE FROM t_p35405502_model_agency_website.model_finances WHERE model_id = %s", (user_id,))
            cur.execute("DELETE FROM t_p35405502_model_agency_website.salary_adjustments WHERE user_id = %s", (user_id,))
            cur.execute("DELETE FROM t_p35405502_model_agency_website.schedule WHERE model_id = %s", (user_id,))
            cur.execute("DELETE FROM t_p35405502_model_agency_website.blocked_dates WHERE model_id = %s", (user_id,))
            cur.execute("DELETE FROM t_p35405502_model_agency_website.model_accounts WHERE model_id = %s", (user_id,))
            
            cur.execute("DELETE FROM t_p35405502_model_agency_website.producer_assignments WHERE producer_email = %s", (user_email,))
            cur.execute("DELETE FROM t_p35405502_model_agency_website.producer_assignments WHERE model_email = %s", (user_email,))
            cur.execute("DELETE FROM t_p35405502_model_agency_website.producer_assignments WHERE operator_email = %s", (user_email,))
            
            cur.execute("DELETE FROM t_p35405502_model_agency_website.operator_model_assignments WHERE operator_email = %s", (user_email,))
            cur.execute("DELETE FROM t_p35405502_model_agency_website.operator_model_assignments WHERE model_email = %s", (user_email,))
            
            cur.execute("DELETE FROM t_p35405502_model_agency_website.users WHERE id = %s", (user_id,))
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json', 
                    'Access-Control-Allow-Origin': origin,
                    'Access-Control-Allow-Credentials': 'true'
                },
                'body': json.dumps({'success': True, 'message': f'Пользователь {user_email} и все его назначения удалены'})
            }
        
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json', 
                'Access-Control-Allow-Origin': origin,
                'Access-Control-Allow-Credentials': 'true'
            },
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    finally:
        cur.close()
        conn.close()