'''
Business: Get dashboard statistics from database
Args: event with httpMethod, queryStringParameters
      context with request_id, function_name attributes
Returns: HTTP response with statistics data
'''

import json
import os
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

def get_db_connection():
    dsn = os.environ.get('DATABASE_URL')
    return psycopg2.connect(dsn, cursor_factory=RealDictCursor)

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
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
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        cur.execute("""
            SELECT 
                u.id,
                u.full_name as name,
                COALESCE(SUM((mf.cb_income::numeric + mf.sp_income::numeric + mf.soda_income::numeric + mf.cam4_income::numeric)), 0) as earnings
            FROM t_p35405502_model_agency_website.users u
            LEFT JOIN t_p35405502_model_agency_website.model_finances mf ON u.id = mf.model_id
            WHERE u.role = 'content_maker'
            GROUP BY u.id, u.full_name
            ORDER BY earnings DESC
            LIMIT 10
        """)
        model_performance = [dict(row) for row in cur.fetchall()]
        
        cur.execute("""
            SELECT 
                TO_CHAR(DATE_TRUNC('month', mf.date), 'Mon') as month,
                COALESCE(SUM((mf.cb_income::numeric + mf.sp_income::numeric + mf.soda_income::numeric + mf.cam4_income::numeric)), 0) as revenue,
                COUNT(DISTINCT CASE WHEN mf.has_shift THEN mf.id END) as bookings
            FROM t_p35405502_model_agency_website.model_finances mf
            WHERE mf.date >= CURRENT_DATE - INTERVAL '6 months'
            GROUP BY DATE_TRUNC('month', mf.date)
            ORDER BY DATE_TRUNC('month', mf.date) ASC
        """)
        monthly_revenue = [dict(row) for row in cur.fetchall()]
        
        cur.execute("""
            SELECT 
                mf.date::text as date,
                u.full_name as model,
                'Смена' as project,
                COALESCE((mf.cb_income::numeric + mf.sp_income::numeric + mf.soda_income::numeric + mf.cam4_income::numeric), 0) as amount,
                CASE WHEN mf.has_shift THEN 'Paid' ELSE 'Pending' END as status
            FROM t_p35405502_model_agency_website.model_finances mf
            JOIN t_p35405502_model_agency_website.users u ON u.id = mf.model_id
            WHERE mf.date >= CURRENT_DATE - INTERVAL '30 days'
            AND (mf.cb_income::numeric + mf.sp_income::numeric + mf.soda_income::numeric + mf.cam4_income::numeric) > 0
            ORDER BY mf.date DESC
            LIMIT 20
        """)
        transactions = [dict(row) for row in cur.fetchall()]
        
        for t in transactions:
            t['id'] = hash(t['date'] + t['model'])
            t['amount'] = float(t['amount'])
        
        for mp in model_performance:
            mp['earnings'] = float(mp['earnings'])
        
        for mr in monthly_revenue:
            mr['revenue'] = float(mr['revenue'])
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'modelPerformance': model_performance,
                'monthlyRevenue': monthly_revenue,
                'transactions': transactions
            })
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