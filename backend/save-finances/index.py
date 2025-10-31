'''
Business: Save and load model financial data from database
Args: event with httpMethod, body (JSON array of daily finance records for POST), queryStringParameters (modelId for GET)
Returns: HTTP response with success status or financial data
'''
import json
import os
from typing import Dict, Any, List
from datetime import datetime
import psycopg2
from psycopg2.extras import execute_values, RealDictCursor

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    # Handle CORS OPTIONS request
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
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
    
    # GET: Load financial data for a model
    if method == 'GET':
        params = event.get('queryStringParameters', {}) or {}
        model_id = params.get('modelId')
        
        if not model_id:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'modelId is required'}),
                'isBase64Encoded': False
            }
        
        conn = psycopg2.connect(database_url)
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        query = '''
            SELECT date, cb_tokens, sp_online, soda_tokens, cam4_tokens,
                   cb_income, sp_income, soda_income, cam4_income, 
                   stripchat_tokens, operator_name, has_shift, transfers
            FROM t_p35405502_model_agency_website.model_finances
            WHERE model_id = %s
            ORDER BY date ASC
        '''
        
        cursor.execute(query, (int(model_id),))
        rows = cursor.fetchall()
        cursor.close()
        conn.close()
        
        # Convert to frontend format
        data = []
        for row in rows:
            date_obj = row['date']
            data.append({
                'date': f"{date_obj.year}-{date_obj.month:02d}-{date_obj.day:02d}",
                'cb': row['cb_tokens'] or 0,
                'sp': row['sp_online'] or 0,
                'soda': row['soda_tokens'] or 0,
                'cam4': float(row['cam4_tokens'] or 0),
                'cbIncome': float(row['cb_income'] or 0),
                'spIncome': float(row['sp_income'] or 0),
                'sodaIncome': float(row['soda_income'] or 0),
                'cam4Income': float(row['cam4_income'] or 0),
                'stripchatTokens': row['stripchat_tokens'] or 0,
                'transfers': float(row['transfers'] or 0),
                'operator': row['operator_name'] or '',
                'shift': row['has_shift'] or False
            })
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps(data),
            'isBase64Encoded': False
        }
    
    # POST: Save financial data
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    body_data = json.loads(event.get('body', '{}'))
    model_id: int = body_data.get('modelId')
    finance_data: List[Dict[str, Any]] = body_data.get('data', [])
    
    if not model_id or not finance_data:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'modelId and data are required'}),
            'isBase64Encoded': False
        }
    
    conn = psycopg2.connect(database_url)
    cursor = conn.cursor()
    
    # Prepare data for bulk upsert
    values = []
    for record in finance_data:
        date_str = record.get('date', '')
        # Date comes as YYYY-MM-DD format from frontend
        full_date = date_str
        
        values.append((
            model_id,
            full_date,
            record.get('cb', 0),
            record.get('sp', 0),
            record.get('soda', 0),
            record.get('cam4', 0),
            record.get('cbIncome', 0),
            record.get('spIncome', 0),
            record.get('sodaIncome', 0),
            record.get('cam4Income', 0),
            record.get('stripchatTokens', 0),
            record.get('transfers', 0),
            record.get('operator', ''),
            record.get('shift', False)
        ))
    
    # Use ON CONFLICT to update existing records
    query = '''
        INSERT INTO t_p35405502_model_agency_website.model_finances 
        (model_id, date, cb_tokens, sp_online, soda_tokens, cam4_tokens, 
         cb_income, sp_income, soda_income, cam4_income, stripchat_tokens, 
         transfers, operator_name, has_shift, updated_at)
        VALUES %s
        ON CONFLICT (model_id, date) 
        DO UPDATE SET
            cb_tokens = EXCLUDED.cb_tokens,
            sp_online = EXCLUDED.sp_online,
            soda_tokens = EXCLUDED.soda_tokens,
            cam4_tokens = EXCLUDED.cam4_tokens,
            cb_income = EXCLUDED.cb_income,
            sp_income = EXCLUDED.sp_income,
            soda_income = EXCLUDED.soda_income,
            cam4_income = EXCLUDED.cam4_income,
            stripchat_tokens = EXCLUDED.stripchat_tokens,
            transfers = EXCLUDED.transfers,
            operator_name = EXCLUDED.operator_name,
            has_shift = EXCLUDED.has_shift,
            updated_at = CURRENT_TIMESTAMP
    '''
    
    execute_values(cursor, query, values, template='(%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP)')
    conn.commit()
    
    cursor.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({
            'success': True,
            'message': f'Saved {len(finance_data)} records for model {model_id}'
        }),
        'isBase64Encoded': False
    }