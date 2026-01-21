'''
Business: Управление назначением моделей для операторов (продюсеры/директора назначают, операторы видят)
Args: event с httpMethod (GET/POST/DELETE), body для POST/DELETE
Returns: JSON с назначениями или статусом операции
'''

import json
import os
import psycopg2
from typing import Dict, Any



def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    # CORS preflight
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Email, X-User-Role',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    headers = event.get('headers', {})
    user_email = headers.get('x-user-email') or headers.get('X-User-Email', '')
    user_role = headers.get('x-user-role') or headers.get('X-User-Role', '')
    
    dsn = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(dsn)
    cur = conn.cursor()
    
    try:
        if method == 'GET':
            # Получить назначения (все или для конкретного оператора)
            query_params = event.get('queryStringParameters', {})
            operator_email = query_params.get('operator')
            
            if operator_email:
                cur.execute(f"""
                    SELECT id, operator_email, model_email, model_id, assigned_by, assigned_at, operator_percentage 
                    FROM t_p35405502_model_agency_website.operator_model_assignments 
                    WHERE operator_email = '{escape_sql_string(operator_email)}'
                """)
            else:
                cur.execute("""
                    SELECT id, operator_email, model_email, model_id, assigned_by, assigned_at, operator_percentage 
                    FROM t_p35405502_model_agency_website.operator_model_assignments
                """)
            
            rows = cur.fetchall()
            assignments = [{
                'id': r[0],
                'operatorEmail': r[1],
                'modelEmail': r[2],
                'modelId': r[3],
                'assignedBy': r[4],
                'assignedAt': r[5].isoformat() if r[5] else None,
                'operatorPercentage': float(r[6]) if len(r) > 6 and r[6] is not None else 20
            } for r in rows]
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps(assignments)
            }
        
        elif method == 'POST':
            # Назначить модель оператору (только продюсер/директор)
            if user_role not in ['producer', 'director']:
                return {
                    'statusCode': 403,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Access denied'})
                }
            
            body_data = json.loads(event.get('body', '{}'))
            operator_email = body_data.get('operatorEmail')
            model_email = body_data.get('modelEmail')
            
            # Получить model_id по email модели
            cur.execute("""
                SELECT id FROM t_p35405502_model_agency_website.users 
                WHERE email = %s AND role = 'content_maker'
            """, (model_email,))
            model_row = cur.fetchone()
            model_id = model_row[0] if model_row else 0
            
            # Проверить, не назначена ли уже
            cur.execute("""
                SELECT id FROM t_p35405502_model_agency_website.operator_model_assignments 
                WHERE operator_email = %s AND model_email = %s
            """, (operator_email, model_email))
            
            if cur.fetchone():
                return {
                    'statusCode': 409,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Already assigned'})
                }
            
            cur.execute("""
                INSERT INTO t_p35405502_model_agency_website.operator_model_assignments 
                (operator_email, model_email, model_id, assigned_by) 
                VALUES (%s, %s, %s, %s) 
                RETURNING id
            """, (operator_email, model_email, model_id, user_email))
            
            assignment_id = cur.fetchone()[0]
            conn.commit()
            
            return {
                'statusCode': 201,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'id': assignment_id, 'message': 'Assigned successfully'})
            }
        
        elif method == 'PUT':
            # Обновить процент оператора (только продюсер/директор)
            if user_role not in ['producer', 'director']:
                return {
                    'statusCode': 403,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Access denied'})
                }
            
            body_data = json.loads(event.get('body', '{}'))
            operator_email = body_data.get('operatorEmail')
            model_email = body_data.get('modelEmail')
            operator_percentage = body_data.get('operatorPercentage')
            
            if operator_percentage is None:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Missing operatorPercentage'})
                }
            
            if operator_percentage < 0 or operator_percentage > 30:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Percentage must be between 0 and 30'})
                }
            
            cur.execute("""
                UPDATE t_p35405502_model_agency_website.operator_model_assignments 
                SET operator_percentage = %s
                WHERE operator_email = %s AND model_email = %s
            """, (operator_percentage, operator_email, model_email))
            
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'message': 'Percentage updated successfully'})
            }
        
        elif method == 'DELETE':
            # Удалить назначение (только продюсер/директор)
            if user_role not in ['producer', 'director']:
                return {
                    'statusCode': 403,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Access denied'})
                }
            
            body_data = json.loads(event.get('body', '{}'))
            operator_email = body_data.get('operatorEmail')
            model_email = body_data.get('modelEmail')
            
            cur.execute("""
                DELETE FROM t_p35405502_model_agency_website.operator_model_assignments 
                WHERE operator_email = %s AND model_email = %s
            """, (operator_email, model_email))
            
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'message': 'Assignment removed'})
            }
        
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    finally:
        cur.close()
        conn.close()