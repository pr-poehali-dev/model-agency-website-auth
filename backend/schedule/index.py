'''
Business: Schedule management API for apartments and shifts
Args: event with httpMethod (GET/POST/PUT), body, queryStringParameters
      context with request_id, function_name attributes
Returns: HTTP response with schedule data
'''

import json
import os
from typing import Dict, Any
from datetime import datetime, timedelta
import psycopg2
from psycopg2.extras import RealDictCursor

def get_db_connection():
    dsn = os.environ.get('DATABASE_URL')
    return psycopg2.connect(dsn, cursor_factory=RealDictCursor)

def cleanup_old_schedules(cur):
    '''Удаляет записи расписания старше одной недели назад'''
    one_week_ago = datetime.now() - timedelta(days=7)
    
    cur.execute("""
        DELETE FROM t_p35405502_model_agency_website.schedule 
        WHERE TO_DATE(date, 'DD.MM.YYYY') < %s
    """, (one_week_ago.date(),))

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
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        if method == 'GET':
            cur.execute("""
                SELECT apartment_name, apartment_address, week_number, date, day_name, 
                       time_10, time_17, time_00
                FROM t_p35405502_model_agency_website.schedule
                ORDER BY apartment_name, week_number, date
            """)
            rows = cur.fetchall()
            
            schedule_dict = {}
            for row in rows:
                apt_key = f"{row['apartment_name']}_{row['apartment_address']}"
                if apt_key not in schedule_dict:
                    schedule_dict[apt_key] = {
                        'name': row['apartment_name'],
                        'address': row['apartment_address'],
                        'weeks': {}
                    }
                
                week_key = row['week_number']
                if week_key not in schedule_dict[apt_key]['weeks']:
                    schedule_dict[apt_key]['weeks'][week_key] = []
                
                schedule_dict[apt_key]['weeks'][week_key].append({
                    'day': row['day_name'],
                    'date': row['date'],
                    'times': {
                        '10:00': row['time_10'] or '',
                        '17:00': row['time_17'] or '',
                        '00:00': row['time_00'] or ''
                    }
                })
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Credentials': 'true'},
                'isBase64Encoded': False,
                'body': json.dumps(schedule_dict)
            }
        
        elif method == 'POST':
            cleanup_old_schedules(cur)
            
            body_data = json.loads(event.get('body', '{}'))
            apartment_name = body_data.get('apartment_name')
            apartment_address = body_data.get('apartment_address')
            week_number = body_data.get('week_number')
            date = body_data.get('date')
            day_name = body_data.get('day_name')
            time_10 = body_data.get('time_10', '')
            time_17 = body_data.get('time_17', '')
            time_00 = body_data.get('time_00', '')
            
            cur.execute("""
                INSERT INTO t_p35405502_model_agency_website.schedule 
                (apartment_name, apartment_address, week_number, date, day_name, time_10, time_17, time_00)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT DO NOTHING
                RETURNING id
            """, (apartment_name, apartment_address, week_number, date, day_name, time_10, time_17, time_00))
            
            result = cur.fetchone()
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Credentials': 'true'},
                'isBase64Encoded': False,
                'body': json.dumps({'success': True, 'id': result['id'] if result else None})
            }
        
        elif method == 'PUT':
            cleanup_old_schedules(cur)
            
            body_data = json.loads(event.get('body', '{}'))
            apartment_name = body_data.get('apartment_name')
            apartment_address = body_data.get('apartment_address')
            week_number = body_data.get('week_number')
            date = body_data.get('date')
            time_slot = body_data.get('time_slot')
            value = body_data.get('value', '')
            
            time_column_map = {
                '10:00': 'time_10',
                '17:00': 'time_17',
                '00:00': 'time_00'
            }
            
            time_column = time_column_map.get(time_slot)
            
            if not time_column:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Credentials': 'true'},
                    'isBase64Encoded': False,
                    'body': json.dumps({'error': 'Invalid time slot'})
                }
            
            cur.execute(f"""
                INSERT INTO t_p35405502_model_agency_website.schedule 
                (apartment_name, apartment_address, week_number, date, day_name, {time_column})
                VALUES (%s, %s, %s, %s, %s, %s)
                ON CONFLICT (apartment_name, apartment_address, week_number, date) 
                DO UPDATE SET {time_column} = EXCLUDED.{time_column}, updated_at = CURRENT_TIMESTAMP
            """, (apartment_name, apartment_address, week_number, date, '', value))
            
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Credentials': 'true'},
                'isBase64Encoded': False,
                'body': json.dumps({'success': True})
            }
        
        else:
            return {
                'statusCode': 405,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Credentials': 'true'},
                'isBase64Encoded': False,
                'body': json.dumps({'error': 'Method not allowed'})
            }
    
    except Exception as e:
        conn.rollback()
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'isBase64Encoded': False,
            'body': json.dumps({'error': str(e)})
        }
    finally:
        cur.close()
        conn.close()