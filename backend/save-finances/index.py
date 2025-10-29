'''
Business: Save model financial data to database
Args: event with httpMethod, body (JSON array of daily finance records)
Returns: HTTP response with success status
'''
import json
import os
from typing import Dict, Any, List
from datetime import datetime
import psycopg2
from psycopg2.extras import execute_values

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    # Handle CORS OPTIONS request
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
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
    cursor = conn.cursor()
    
    # Prepare data for bulk upsert
    values = []
    for record in finance_data:
        date_str = record.get('date', '')
        # Convert DD.MM format to proper date (assuming current year)
        day, month = date_str.split('.')
        year = datetime.now().year
        full_date = f'{year}-{month.zfill(2)}-{day.zfill(2)}'
        
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
            record.get('operator', ''),
            record.get('shift', False)
        ))
    
    # Use ON CONFLICT to update existing records
    query = '''
        INSERT INTO t_p35405502_model_agency_website.model_finances 
        (model_id, date, cb_tokens, sp_online, soda_tokens, cam4_tokens, 
         cb_income, sp_income, soda_income, cam4_income, stripchat_tokens, 
         operator_name, has_shift, updated_at)
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
            operator_name = EXCLUDED.operator_name,
            has_shift = EXCLUDED.has_shift,
            updated_at = CURRENT_TIMESTAMP
    '''
    
    execute_values(cursor, query, values, template='(%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP)')
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
