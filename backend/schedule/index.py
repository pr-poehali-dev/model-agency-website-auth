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
                'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, OPTIONS',
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
            
            cur.execute("""
                SELECT apartment_name, apartment_address, shift_morning, shift_day, shift_night,
                       time_slot_1, time_slot_2, time_slot_3
                FROM t_p35405502_model_agency_website.apartment_shifts
            """)
            shifts_rows = cur.fetchall()
            shifts_dict = {}
            for shift_row in shifts_rows:
                apt_key = f"{shift_row['apartment_name']}_{shift_row['apartment_address']}"
                shifts_dict[apt_key] = {
                    'morning': shift_row['shift_morning'],
                    'day': shift_row['shift_day'],
                    'night': shift_row['shift_night'],
                    'time_slot_1': shift_row['time_slot_1'],
                    'time_slot_2': shift_row['time_slot_2'],
                    'time_slot_3': shift_row['time_slot_3']
                }
            
            schedule_dict = {}
            for row in rows:
                apt_key = f"{row['apartment_name']}_{row['apartment_address']}"
                if apt_key not in schedule_dict:
                    shifts = shifts_dict.get(apt_key, {
                        'morning': '10:00 - 16:00',
                        'day': '17:00 - 23:00',
                        'night': '00:00 - 06:00',
                        'time_slot_1': '10:00',
                        'time_slot_2': '17:00',
                        'time_slot_3': '00:00'
                    })
                    schedule_dict[apt_key] = {
                        'name': row['apartment_name'],
                        'address': row['apartment_address'],
                        'shifts': {
                            'morning': shifts['morning'],
                            'day': shifts['day'],
                            'night': shifts['night']
                        },
                        'time_slots': {
                            'slot1': shifts['time_slot_1'],
                            'slot2': shifts['time_slot_2'],
                            'slot3': shifts['time_slot_3']
                        },
                        'weeks': {}
                    }
                
                week_key = row['week_number']
                if week_key not in schedule_dict[apt_key]['weeks']:
                    schedule_dict[apt_key]['weeks'][week_key] = []
                
                time_slot_1 = shifts.get('time_slot_1', '10:00')
                time_slot_2 = shifts.get('time_slot_2', '17:00')
                time_slot_3 = shifts.get('time_slot_3', '00:00')
                
                schedule_dict[apt_key]['weeks'][week_key].append({
                    'day': row['day_name'],
                    'date': row['date'],
                    'times': {
                        time_slot_1: row['time_10'] or '',
                        time_slot_2: row['time_17'] or '',
                        time_slot_3: row['time_00'] or ''
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
        
        elif method == 'PATCH':
            body_data = json.loads(event.get('body', '{}'))
            print(f"PATCH request body: {body_data}")
            apartment_name = body_data.get('apartment_name')
            apartment_address = body_data.get('apartment_address')
            update_type = body_data.get('update_type')
            
            if update_type == 'shift_time':
                shift_type = body_data.get('shift_type')
                new_time = body_data.get('new_time')
                
                shift_column_map = {
                    'morning': 'shift_morning',
                    'day': 'shift_day',
                    'night': 'shift_night'
                }
                
                shift_column = shift_column_map.get(shift_type)
                if not shift_column:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Credentials': 'true'},
                        'isBase64Encoded': False,
                        'body': json.dumps({'error': 'Invalid shift type'})
                    }
                
                cur.execute(f"""
                    INSERT INTO t_p35405502_model_agency_website.apartment_shifts 
                    (apartment_name, apartment_address, {shift_column})
                    VALUES (%s, %s, %s)
                    ON CONFLICT (apartment_name, apartment_address)
                    DO UPDATE SET {shift_column} = EXCLUDED.{shift_column}, updated_at = CURRENT_TIMESTAMP
                """, (apartment_name, apartment_address, new_time))
                
            elif update_type == 'time_label':
                slot_name = body_data.get('slot_name')
                new_label = body_data.get('new_label')
                
                valid_slots = ['time_slot_1', 'time_slot_2', 'time_slot_3']
                if slot_name not in valid_slots:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Credentials': 'true'},
                        'isBase64Encoded': False,
                        'body': json.dumps({'error': 'Invalid slot name'})
                    }
                
                cur.execute(f"""
                    INSERT INTO t_p35405502_model_agency_website.apartment_shifts 
                    (apartment_name, apartment_address, {slot_name})
                    VALUES (%s, %s, %s)
                    ON CONFLICT (apartment_name, apartment_address)
                    DO UPDATE SET {slot_name} = EXCLUDED.{slot_name}, updated_at = CURRENT_TIMESTAMP
                """, (apartment_name, apartment_address, new_label))
            
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