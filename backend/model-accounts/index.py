import json
import os
import psycopg2
from typing import Dict, Any

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
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-User-Role',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    headers = event.get('headers', {})
    user_role = headers.get('x-user-role', headers.get('X-User-Role', '')).lower()
    
    if user_role not in ['director', 'producer', 'operator']:
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
            for platform, login, password in rows:
                accounts[platform] = {'login': login or '', 'password': password or ''}
            
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
                
                cur.execute("""
                    INSERT INTO model_accounts (model_id, model_name, platform, login, password, updated_at)
                    VALUES (%s, %s, %s, %s, %s, CURRENT_TIMESTAMP)
                    ON CONFLICT (model_id, platform) 
                    DO UPDATE SET 
                        login = EXCLUDED.login,
                        password = EXCLUDED.password,
                        updated_at = CURRENT_TIMESTAMP
                """, (int(model_id), model_name, platform, login, password))
            
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