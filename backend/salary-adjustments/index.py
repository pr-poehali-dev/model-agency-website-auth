"""
Business: Manage salary adjustments (advances, penalties, expenses)
Args: event with httpMethod, queryStringParameters, body
Returns: JSON with salary adjustments data
"""

import json
import os
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    headers = event.get('headers', {})
    origin = headers.get('origin') or headers.get('Origin') or 'https://preview--model-agency-website-auth.poehali.dev'
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': origin,
                'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Email, X-Auth-Token',
                'Access-Control-Allow-Credentials': 'true',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Credentials': 'true'},
            'body': json.dumps({'error': 'DATABASE_URL not configured'})
        }
    
    conn = psycopg2.connect(dsn)
    
    try:
        if method == 'GET':
            return handle_get(event, conn)
        elif method == 'PUT':
            return handle_put(event, conn)
        else:
            return {
                'statusCode': 405,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Credentials': 'true'},
                'body': json.dumps({'error': 'Method not allowed'})
            }
    finally:
        conn.close()


def handle_get(event: Dict[str, Any], conn) -> Dict[str, Any]:
    params = event.get('queryStringParameters') or {}
    period_start = params.get('period_start')
    period_end = params.get('period_end')
    
    if not period_start or not period_end:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Credentials': 'true'},
            'body': json.dumps({'error': 'period_start and period_end required'})
        }
    
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    cursor.execute("""
        SELECT email, role, advance, penalty, expenses
        FROM salary_adjustments
        WHERE period_start = %s AND period_end = %s
    """, (period_start, period_end))
    
    rows = cursor.fetchall()
    cursor.close()
    
    result = {}
    for row in rows:
        result[row['email']] = {
            'advance': float(row['advance']),
            'penalty': float(row['penalty']),
            'expenses': float(row['expenses'])
        }
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps(result)
    }


def handle_put(event: Dict[str, Any], conn) -> Dict[str, Any]:
    body_data = json.loads(event.get('body', '{}'))
    email = body_data.get('email')
    role = body_data.get('role')
    period_start = body_data.get('period_start')
    period_end = body_data.get('period_end')
    field = body_data.get('field')
    value = body_data.get('value', 0)
    
    headers = event.get('headers', {})
    updated_by = headers.get('X-User-Email') or headers.get('x-user-email', '')
    
    if not all([email, role, period_start, period_end, field]):
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Credentials': 'true'},
            'body': json.dumps({'error': 'Missing required fields'})
        }
    
    if field not in ['advance', 'penalty', 'expenses']:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Credentials': 'true'},
            'body': json.dumps({'error': 'Invalid field'})
        }
    
    cursor = conn.cursor()
    
    cursor.execute(f"""
        INSERT INTO salary_adjustments 
        (email, role, period_start, period_end, {field}, updated_by, updated_at)
        VALUES (%s, %s, %s, %s, %s, %s, NOW())
        ON CONFLICT (email, period_start, period_end)
        DO UPDATE SET {field} = EXCLUDED.{field}, 
                      updated_by = EXCLUDED.updated_by,
                      updated_at = NOW()
    """, (email, role, period_start, period_end, value, updated_by))
    
    conn.commit()
    cursor.close()
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'success': True})
    }