'''
Business: Управление назначениями продюсерам (директор назначает модели и операторов продюсерам)
Args: event с httpMethod (GET/POST/DELETE), body, headers с X-User-Role
Returns: JSON с назначениями продюсеру
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
                'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
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
            # Получить назначения для продюсера
            query_params = event.get('queryStringParameters', {})
            producer_email = query_params.get('producer')
            assignment_type = query_params.get('type')  # 'model' или 'operator'
            
            if producer_email and assignment_type:
                cur.execute("""
                    SELECT id, producer_email, model_id, operator_email, assigned_by, assigned_at, assignment_type 
                    FROM t_p35405502_model_agency_website.producer_assignments 
                    WHERE producer_email = %s AND assignment_type = %s
                """, (producer_email, assignment_type))
            elif producer_email:
                cur.execute("""
                    SELECT id, producer_email, model_id, operator_email, assigned_by, assigned_at, assignment_type 
                    FROM t_p35405502_model_agency_website.producer_assignments 
                    WHERE producer_email = %s
                """, (producer_email,))
            else:
                cur.execute("""
                    SELECT id, producer_email, model_id, operator_email, assigned_by, assigned_at, assignment_type 
                    FROM t_p35405502_model_agency_website.producer_assignments
                """)
            
            rows = cur.fetchall()
            assignments = [{
                'id': r[0],
                'producerEmail': r[1],
                'modelId': r[2],
                'operatorEmail': r[3],
                'assignedBy': r[4],
                'assignedAt': r[5].isoformat() if r[5] else None,
                'assignmentType': r[6]
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
            # Назначить модель или оператора продюсеру (только директор)
            if user_role != 'director':
                return {
                    'statusCode': 403,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Access denied'})
                }
            
            body_data = json.loads(event.get('body', '{}'))
            producer_email = body_data.get('producerEmail')
            assignment_type = body_data.get('assignmentType')  # 'model' или 'operator'
            model_id = body_data.get('modelId')
            operator_email = body_data.get('operatorEmail')
            
            # Проверка дубликатов
            if assignment_type == 'model':
                cur.execute("""
                    SELECT id FROM t_p35405502_model_agency_website.producer_assignments 
                    WHERE producer_email = %s AND model_id = %s AND assignment_type = 'model'
                """, (producer_email, model_id))
            else:
                cur.execute("""
                    SELECT id FROM t_p35405502_model_agency_website.producer_assignments 
                    WHERE producer_email = %s AND operator_email = %s AND assignment_type = 'operator'
                """, (producer_email, operator_email))
            
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
                INSERT INTO t_p35405502_model_agency_website.producer_assignments 
                (producer_email, model_id, operator_email, assigned_by, assignment_type) 
                VALUES (%s, %s, %s, %s, %s) 
                RETURNING id
            """, (producer_email, model_id, operator_email, user_email, assignment_type))
            
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
        
        elif method == 'DELETE':
            # Удалить назначение (только директор)
            if user_role != 'director':
                return {
                    'statusCode': 403,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Access denied'})
                }
            
            body_data = json.loads(event.get('body', '{}'))
            producer_email = body_data.get('producerEmail')
            assignment_type = body_data.get('assignmentType')
            model_id = body_data.get('modelId')
            operator_email = body_data.get('operatorEmail')
            
            if assignment_type == 'model':
                cur.execute("""
                    DELETE FROM t_p35405502_model_agency_website.producer_assignments 
                    WHERE producer_email = %s AND model_id = %s AND assignment_type = 'model'
                """, (producer_email, model_id))
            else:
                cur.execute("""
                    DELETE FROM t_p35405502_model_agency_website.producer_assignments 
                    WHERE producer_email = %s AND operator_email = %s AND assignment_type = 'operator'
                """, (producer_email, operator_email))
            
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
