'''
Business: Get aggregated financial data across all models for a given period
Args: event with queryStringParameters (period_start, period_end)
Returns: HTTP response with daily aggregated stats and platform summary
'''
import json
import os
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'GET':
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    params = event.get('queryStringParameters', {}) or {}
    period_start = params.get('period_start')
    period_end = params.get('period_end')
    
    if not period_start or not period_end:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'period_start and period_end are required'}),
            'isBase64Encoded': False
        }
    
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Database configuration missing'}),
            'isBase64Encoded': False
        }
    
    conn = psycopg2.connect(database_url)
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    daily_query = f'''
        SELECT 
            date,
            SUM(cb_tokens) as cb_total,
            SUM(stripchat_tokens) as sp_total,
            SUM(soda_tokens) as soda_total,
            SUM(cam4_tokens) as cam4_total,
            SUM(cb_income) as cb_income_total,
            SUM(sp_income) as sp_income_total,
            SUM(soda_income) as soda_income_total,
            SUM(cam4_income) as cam4_income_total,
            SUM(transfers) as transfers_total
        FROM t_p35405502_model_agency_website.model_finances
        WHERE date BETWEEN '{period_start}' AND '{period_end}'
        GROUP BY date
        ORDER BY date ASC
    '''
    
    cursor.execute(daily_query)
    daily_rows = cursor.fetchall()
    
    summary_query = f'''
        SELECT 
            SUM(cb_tokens) as cb_tokens,
            SUM(stripchat_tokens) as sp_tokens,
            SUM(soda_tokens) as soda_tokens,
            SUM(cam4_tokens) as cam4_tokens,
            SUM(cb_income) as cb_income,
            SUM(sp_income) as sp_income,
            SUM(soda_income) as soda_income,
            SUM(cam4_income) as cam4_income,
            SUM(transfers) as transfers
        FROM t_p35405502_model_agency_website.model_finances
        WHERE date BETWEEN '{period_start}' AND '{period_end}'
    '''
    
    cursor.execute(summary_query)
    summary_row = cursor.fetchone()
    
    cursor.close()
    conn.close()
    
    daily_data = []
    for row in daily_rows:
        date_obj = row['date']
        daily_data.append({
            'date': f"{date_obj.day:02d}.{date_obj.month:02d}",
            'cb': int(row['cb_total'] or 0),
            'sp': int(row['sp_total'] or 0),
            'soda': int(row['soda_total'] or 0),
            'cam4': float(row['cam4_total'] or 0),
            'cbIncome': float(row['cb_income_total'] or 0),
            'spIncome': float(row['sp_income_total'] or 0),
            'sodaIncome': float(row['soda_income_total'] or 0),
            'cam4Income': float(row['cam4_income_total'] or 0),
            'transfers': float(row['transfers_total'] or 0)
        })
    
    platform_summary = [
        {
            'platform': 'Chaturbate',
            'tokens': float(summary_row['cb_tokens'] or 0),
            'income': float(summary_row['cb_income'] or 0)
        },
        {
            'platform': 'Stripchat',
            'tokens': float(summary_row['sp_tokens'] or 0),
            'income': float(summary_row['sp_income'] or 0)
        },
        {
            'platform': 'CamSoda',
            'tokens': float(summary_row['soda_tokens'] or 0),
            'income': float(summary_row['soda_income'] or 0)
        },
        {
            'platform': 'Cam4',
            'tokens': float(summary_row['cam4_tokens'] or 0),
            'income': float(summary_row['cam4_income'] or 0)
        },
        {
            'platform': 'Transfers',
            'tokens': 0,
            'income': float(summary_row['transfers'] or 0)
        }
    ]
    
    result = {
        'dailyData': daily_data,
        'platformSummary': platform_summary,
        'graphOnlineData': [
            {
                'date': d['date'],
                'onlineSP': d['sp'],
                'onlineCB': d['cb']
            } for d in daily_data
        ]
    }
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps(result),
        'isBase64Encoded': False
    }
