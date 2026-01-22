import json
import os
import base64
import psycopg2
from typing import Dict, Any
from cryptography.fernet import Fernet

def get_cipher():
    key = os.environ.get('ENCRYPTION_KEY', '')
    if not key:
        raise ValueError('ENCRYPTION_KEY environment variable not set')
    return Fernet(key.encode())

def encrypt_password(password: str) -> str:
    if not password:
        return ''
    cipher = get_cipher()
    return cipher.encrypt(password.encode()).decode()

def decrypt_password(encrypted: str) -> str:
    if not encrypted:
        return ''
    cipher = get_cipher()
    return cipher.decrypt(encrypted.encode()).decode()

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Manage model platform accounts (CRUD operations)
    Args: event with httpMethod, body, queryStringParameters
    Returns: HTTP response with account data
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-User-Role, X-Auth-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    headers = event.get('headers', {})
    user_role = headers.get('x-user-role', headers.get('X-User-Role', '')).lower()
    
    if user_role not in ['director', 'producer', 'operator', 'solo_maker']:
        return {
            'statusCode': 403,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Access denied', 'role_received': user_role, 'headers': str(headers)})
        }
    
    dsn = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(dsn)
    conn.autocommit = True
    cur = conn.cursor()
    
    try:
        if method == 'GET':
            params = event.get('queryStringParameters', {})
            model_id = params.get('model_id')
            
            if not model_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'model_id is required'})
                }
            
            cur.execute(
                "SELECT platform, login, password FROM model_accounts WHERE model_id = %s",
                (int(model_id),)
            )
            
            rows = cur.fetchall()
            accounts = {}
            for platform, login, encrypted_password in rows:
                try:
                    decrypted_password = decrypt_password(encrypted_password) if encrypted_password else ''
                except:
                    decrypted_password = encrypted_password or ''
                accounts[platform] = {'login': login or '', 'password': decrypted_password}
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'accounts': accounts})
            }
        
        elif method == 'PUT':
            if user_role not in ['director', 'producer']:
                return {
                    'statusCode': 403,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Only director and producer can edit accounts'})
                }
            
            body_data = json.loads(event.get('body', '{}'))
            model_id = body_data.get('model_id')
            model_name = body_data.get('model_name')
            accounts = body_data.get('accounts', {})
            
            if not model_id or not model_name:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'model_id and model_name are required'})
                }
            
            for platform, credentials in accounts.items():
                login = credentials.get('login', '')
                password = credentials.get('password', '')
                encrypted_password = encrypt_password(password) if password else ''
                
                cur.execute(
                    "SELECT login FROM model_accounts WHERE model_id = %s AND platform = %s",
                    (int(model_id), platform)
                )
                result = cur.fetchone()
                old_login = result[0] if result else None
                
                cur.execute("""
                    INSERT INTO model_accounts (model_id, model_name, platform, login, password, updated_at)
                    VALUES (%s, %s, %s, %s, %s, CURRENT_TIMESTAMP)
                    ON CONFLICT (model_id, platform) 
                    DO UPDATE SET 
                        login = EXCLUDED.login,
                        password = EXCLUDED.password,
                        updated_at = CURRENT_TIMESTAMP
                """, (int(model_id), model_name, platform, login, encrypted_password))
                
                action = 'update' if old_login else 'create'
                cur.execute("""
                    INSERT INTO account_audit_log 
                    (model_id, model_name, platform, action, changed_by_role, old_login, new_login, changed_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP)
                """, (int(model_id), model_name, platform, action, user_role, old_login, login))
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'message': 'Accounts updated successfully'})
            }
        
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    finally:
        cur.close()
        conn.close()