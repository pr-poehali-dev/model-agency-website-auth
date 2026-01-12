import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Dict, Any
from datetime import datetime

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    API для сохранения и получения данных о затратах и выданных средствах директоров
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Database connection not configured'})
        }
    
    conn = psycopg2.connect(dsn)
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        if method == 'GET':
            params = event.get('queryStringParameters') or {}
            period_start = params.get('period_start')
            period_end = params.get('period_end')
            
            if not period_start or not period_end:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'period_start and period_end are required'})
                }
            
            cur.execute("""
                SELECT expenses, issued_funds
                FROM t_p35405502_model_agency_website.director_finances
                WHERE period_start = %s AND period_end = %s
            """, (period_start, period_end))
            
            result = cur.fetchone()
            
            if result:
                response_data = {
                    'expenses': float(result['expenses'] or 0),
                    'issued_funds': float(result['issued_funds'] or 0)
                }
            else:
                response_data = {'expenses': 0, 'issued_funds': 0}
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps(response_data),
                'isBase64Encoded': False
            }
        
        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            period_start = body.get('period_start')
            period_end = body.get('period_end')
            expenses = float(body.get('expenses', 0))
            issued_funds = float(body.get('issued_funds', 0))
            
            if not period_start or not period_end:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'period_start and period_end are required'})
                }
            
            cur.execute("""
                INSERT INTO t_p35405502_model_agency_website.director_finances 
                (period_start, period_end, expenses, issued_funds, updated_at)
                VALUES (%s, %s, %s, %s, CURRENT_TIMESTAMP)
                ON CONFLICT (period_start, period_end) 
                DO UPDATE SET 
                    expenses = EXCLUDED.expenses,
                    issued_funds = EXCLUDED.issued_funds,
                    updated_at = CURRENT_TIMESTAMP
                RETURNING expenses, issued_funds
            """, (period_start, period_end, expenses, issued_funds))
            
            result = cur.fetchone()
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True,
                    'expenses': float(result['expenses']),
                    'issued_funds': float(result['issued_funds'])
                }),
                'isBase64Encoded': False
            }
        
        else:
            return {
                'statusCode': 405,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Method not allowed'})
            }
    
    except Exception as e:
        import traceback
        conn.rollback()
        error_details = {
            'error': str(e),
            'traceback': traceback.format_exc()
        }
        print(f"ERROR: {error_details}")
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps(error_details),
            'isBase64Encoded': False
        }
    finally:
        cur.close()
        conn.close()