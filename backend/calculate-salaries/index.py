import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Dict, Any, List
from datetime import datetime

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Calculate salaries for operators, models, and producers based on financial data
    Args: event - dict with httpMethod, queryStringParameters (period_start, period_end)
          context - object with attributes: request_id, function_name
    Returns: HTTP response with salary calculations
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Email, X-User-Role',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    if method != 'GET':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    params = event.get('queryStringParameters') or {}
    period_start = params.get('period_start')
    period_end = params.get('period_end')
    
    if not period_start or not period_end:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'period_start and period_end are required'})
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
        cur.execute("""
            SELECT 
                u.id as user_id,
                u.email,
                u.full_name,
                u.role
            FROM t_p35405502_model_agency_website.users u
            WHERE u.role IN ('operator', 'content_maker', 'producer')
        """)
        users = cur.fetchall()
        
        cur.execute("""
            SELECT 
                oma.operator_email,
                oma.model_email,
                oma.model_id,
                u.id as model_user_id
            FROM t_p35405502_model_agency_website.operator_model_assignments oma
            JOIN t_p35405502_model_agency_website.users u ON u.email = oma.model_email
        """)
        assignments = cur.fetchall()
        
        cur.execute("""
            SELECT 
                pma.producer_email,
                pma.model_email,
                u.id as model_user_id
            FROM t_p35405502_model_agency_website.producer_assignments pma
            JOIN t_p35405502_model_agency_website.users u ON u.email = pma.model_email
            WHERE pma.assignment_type = 'model'
        """)
        producer_assignments = cur.fetchall()
        
        cur.execute("""
            SELECT 
                mf.model_id,
                mf.date,
                mf.chaturbate_tokens,
                mf.stripchat_tokens,
                mf.camsoda_tokens,
                mf.cam4_value,
                mf.transfers,
                mf.operator_name
            FROM t_p35405502_model_agency_website.model_finances mf
            WHERE mf.date BETWEEN %s AND %s
        """, (period_start, period_end))
        finances = cur.fetchall()
        
        operator_salaries = {}
        model_salaries = {}
        producer_salaries = {}
        
        for finance in finances:
            model_id = finance['model_id']
            operator_name = finance['operator_name']
            
            cb_tokens = finance['chaturbate_tokens'] or 0
            sp_tokens = finance['stripchat_tokens'] or 0
            soda_tokens = finance['camsoda_tokens'] or 0
            cam4_value = finance['cam4_value'] or 0
            transfers = finance['transfers'] or 0
            
            total_check = cb_tokens + sp_tokens + (soda_tokens * 0.05) + cam4_value + transfers
            
            operator_salary = total_check * 0.2
            model_salary = total_check * 0.3
            producer_salary = total_check * 0.1
            
            model_assignment = next((a for a in assignments if a['model_id'] == model_id), None)
            if model_assignment:
                operator_email = model_assignment['operator_email']
                model_email = model_assignment['model_email']
                
                if operator_name:
                    if operator_email not in operator_salaries:
                        operator_salaries[operator_email] = {
                            'email': operator_email,
                            'total': 0,
                            'details': []
                        }
                    operator_salaries[operator_email]['total'] += operator_salary
                    operator_salaries[operator_email]['details'].append({
                        'date': finance['date'].isoformat(),
                        'model_id': model_id,
                        'amount': operator_salary,
                        'check': total_check
                    })
                
                if model_email not in model_salaries:
                    model_salaries[model_email] = {
                        'email': model_email,
                        'total': 0,
                        'details': []
                    }
                model_salaries[model_email]['total'] += model_salary
                model_salaries[model_email]['details'].append({
                    'date': finance['date'].isoformat(),
                    'amount': model_salary,
                    'check': total_check
                })
                
                producer_assignment = next((pa for pa in producer_assignments if pa['model_email'] == model_email), None)
                if producer_assignment:
                    producer_email = producer_assignment['producer_email']
                    if producer_email not in producer_salaries:
                        producer_salaries[producer_email] = {
                            'email': producer_email,
                            'total': 0,
                            'details': []
                        }
                    producer_salaries[producer_email]['total'] += producer_salary
                    producer_salaries[producer_email]['details'].append({
                        'date': finance['date'].isoformat(),
                        'model_id': model_id,
                        'model_email': model_email,
                        'amount': producer_salary,
                        'check': total_check
                    })
        
        result = {
            'operators': operator_salaries,
            'models': model_salaries,
            'producers': producer_salaries
        }
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'isBase64Encoded': False,
            'body': json.dumps(result, default=str)
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)})
        }
    finally:
        cur.close()
        conn.close()