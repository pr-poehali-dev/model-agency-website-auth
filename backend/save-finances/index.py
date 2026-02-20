'''
Business: Save and load model financial data from database
Args: event with httpMethod, body (JSON array of daily finance records for POST), queryStringParameters (modelId, startDate, endDate for GET)
Returns: HTTP response with success status or financial data
'''
import json
import os
from typing import Dict, Any, List
from datetime import datetime
from decimal import Decimal
import psycopg2
from psycopg2.extras import execute_values, RealDictCursor

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    headers = event.get('headers', {})
    origin = headers.get('origin') or headers.get('Origin') or 'https://preview--model-agency-website-auth.poehali.dev'
    
    # Handle CORS OPTIONS request
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': origin,
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token',
                'Access-Control-Allow-Credentials': 'true',
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
                'Access-Control-Allow-Origin': origin,
                'Access-Control-Allow-Credentials': 'true'
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
                    'Access-Control-Allow-Origin': origin,
                    'Access-Control-Allow-Credentials': 'true'
                },
                'body': json.dumps({'error': 'modelId is required'}),
                'isBase64Encoded': False
            }
        
        conn = psycopg2.connect(database_url)
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        query = '''
            SELECT date, cb_tokens, sp_tokens, soda_tokens,
                   cb_income, sp_income, soda_income, 
                   cb_online, sp_online, soda_online,
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
            # Explicitly convert Decimal to float for JSON serialization
            def to_float(val):
                if val is None:
                    return 0
                return float(val) if isinstance(val, Decimal) else float(val or 0)
            
            data.append({
                'date': f"{date_obj.year}-{date_obj.month:02d}-{date_obj.day:02d}",
                'cbTokens': to_float(row['cb_tokens']),
                'spTokens': to_float(row['sp_tokens']),
                'sodaTokens': to_float(row['soda_tokens']),
                'cbIncome': to_float(row['cb_income']),
                'spIncome': to_float(row['sp_income']),
                'sodaIncome': to_float(row['soda_income']),
                'cb': to_float(row['cb_online']),
                'sp': to_float(row['sp_online']),
                'soda': to_float(row['soda_online']),
                'stripchatTokens': to_float(row['stripchat_tokens']),
                'transfers': to_float(row['transfers']),
                'operator': row['operator_name'] or '',
                'shift': row['has_shift'] or False
            })
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': origin,
                'Access-Control-Allow-Credentials': 'true'
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
                'Access-Control-Allow-Origin': origin,
                'Access-Control-Allow-Credentials': 'true'
            },
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    body_data = json.loads(event.get('body', '{}'))
    model_id: int = body_data.get('modelId')
    finance_data: List[Dict[str, Any]] = body_data.get('data', [])
    
    # Debug: log first 3 records to see shift field
    if finance_data:
        print(f"DEBUG: First 3 records: {finance_data[:3]}")
    
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
        
        def r2(val):
            return round(float(val or 0), 2)

        values.append((
            model_id,
            full_date,
            r2(record.get('cbTokens', 0)),
            r2(record.get('spTokens', 0)),
            r2(record.get('sodaTokens', 0)),
            r2(record.get('cbIncome', 0)),
            r2(record.get('spIncome', 0)),
            r2(record.get('sodaIncome', 0)),
            r2(record.get('cb', 0)),
            r2(record.get('sp', 0)),
            r2(record.get('soda', 0)),
            r2(record.get('stripchatTokens', 0)),
            r2(record.get('transfers', 0)),
            record.get('operator', ''),
            bool(record.get('shift', False))
        ))
    
    # Use ON CONFLICT to update existing records
    query = '''
        INSERT INTO t_p35405502_model_agency_website.model_finances 
        (model_id, date, cb_tokens, sp_tokens, soda_tokens, 
         cb_income, sp_income, soda_income, cb_online, sp_online, soda_online,
         stripchat_tokens, transfers, operator_name, has_shift, updated_at)
        VALUES %s
        ON CONFLICT (model_id, date) 
        DO UPDATE SET
            cb_tokens = EXCLUDED.cb_tokens,
            sp_tokens = EXCLUDED.sp_tokens,
            soda_tokens = EXCLUDED.soda_tokens,
            cb_income = EXCLUDED.cb_income,
            sp_income = EXCLUDED.sp_income,
            soda_income = EXCLUDED.soda_income,
            cb_online = EXCLUDED.cb_online,
            sp_online = EXCLUDED.sp_online,
            soda_online = EXCLUDED.soda_online,
            stripchat_tokens = EXCLUDED.stripchat_tokens,
            transfers = EXCLUDED.transfers,
            operator_name = EXCLUDED.operator_name,
            has_shift = EXCLUDED.has_shift,
            updated_at = CURRENT_TIMESTAMP
    '''
    
    execute_values(cursor, query, values, template='(%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP)')
    conn.commit()
    
    cursor.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Credentials': 'true'
        },
        'body': json.dumps({
            'success': True,
            'message': f'Saved {len(finance_data)} records for model {model_id}'
        }),
        'isBase64Encoded': False
    }