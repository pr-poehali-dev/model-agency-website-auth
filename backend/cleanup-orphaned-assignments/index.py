'''
Очистка устаревших назначений для удалённых пользователей
Args: event с httpMethod (POST), headers с X-User-Role
Returns: JSON с количеством удалённых записей
'''

import json
import os
import psycopg2
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Role',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    headers = event.get('headers', {})
    headers_lower = {k.lower(): v for k, v in headers.items()}
    user_role = headers_lower.get('x-user-role', '')
    
    if user_role != 'director':
        return {
            'statusCode': 403,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Только директор может выполнить очистку'})
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    dsn = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(dsn)
    cur = conn.cursor()
    
    try:
        deleted_counts = {}
        
        cur.execute("""
            DELETE FROM producer_assignments 
            WHERE producer_email NOT IN (SELECT email FROM users)
        """)
        deleted_counts['producer_assignments_by_producer'] = cur.rowcount
        
        cur.execute("""
            DELETE FROM producer_assignments 
            WHERE model_email IS NOT NULL 
            AND model_email NOT IN (SELECT email FROM users)
        """)
        deleted_counts['producer_assignments_by_model'] = cur.rowcount
        
        cur.execute("""
            DELETE FROM producer_assignments 
            WHERE operator_email IS NOT NULL 
            AND operator_email NOT IN (SELECT email FROM users)
        """)
        deleted_counts['producer_assignments_by_operator'] = cur.rowcount
        
        cur.execute("""
            DELETE FROM operator_model_assignments 
            WHERE operator_email NOT IN (SELECT email FROM users)
        """)
        deleted_counts['operator_model_assignments_by_operator'] = cur.rowcount
        
        cur.execute("""
            DELETE FROM operator_model_assignments 
            WHERE model_email IS NOT NULL 
            AND model_email NOT IN (SELECT email FROM users)
        """)
        deleted_counts['operator_model_assignments_by_model'] = cur.rowcount
        
        conn.commit()
        
        total_deleted = sum(deleted_counts.values())
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'success': True,
                'message': f'Удалено {total_deleted} устаревших назначений',
                'details': deleted_counts
            })
        }
    
    except Exception as e:
        conn.rollback()
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': str(e)})
        }
    
    finally:
        cur.close()
        conn.close()
