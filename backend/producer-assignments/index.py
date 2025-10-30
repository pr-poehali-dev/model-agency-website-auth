'''
Business: Управление назначениями продюсерам (директор назначает модели и операторов продюсерам)
Args: event с httpMethod (GET/POST/DELETE), body, headers с X-User-Role
Returns: JSON с назначениями продюсеру
'''

import json
import os
import psycopg2
import psycopg2.extensions
from typing import Dict, Any

def escape_sql_string(s: str) -> str:
    """Escape single quotes for SQL string literals"""
    if s is None:
        return 'NULL'
    return s.replace("'", "''")

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
    # Нормализация заголовков (приведение к lowercase)
    headers_lower = {k.lower(): v for k, v in headers.items()}
    user_email = headers_lower.get('x-user-email', '')
    user_role = headers_lower.get('x-user-role', '')
    
    print(f"Request headers: email={user_email}, role={user_role}")
    
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
                cur.execute(f"""
                    SELECT id, producer_email, model_id, operator_email, assigned_by, assigned_at, assignment_type 
                    FROM t_p35405502_model_agency_website.producer_assignments 
                    WHERE producer_email = '{escape_sql_string(producer_email)}' AND assignment_type = '{escape_sql_string(assignment_type)}'
                """)
            elif producer_email:
                cur.execute(f"""
                    SELECT id, producer_email, model_id, operator_email, assigned_by, assigned_at, assignment_type 
                    FROM t_p35405502_model_agency_website.producer_assignments 
                    WHERE producer_email = '{escape_sql_string(producer_email)}'
                """)
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
                cur.execute(f"""
                    SELECT id FROM t_p35405502_model_agency_website.producer_assignments 
                    WHERE producer_email = '{escape_sql_string(producer_email)}' AND model_id = {model_id} AND assignment_type = 'model'
                """)
            else:
                cur.execute(f"""
                    SELECT id FROM t_p35405502_model_agency_website.producer_assignments 
                    WHERE producer_email = '{escape_sql_string(producer_email)}' AND operator_email = '{escape_sql_string(operator_email)}' AND assignment_type = 'operator'
                """)
            
            if cur.fetchone():
                return {
                    'statusCode': 409,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Already assigned'})
                }
            
            model_id_val = f"{model_id}" if model_id else "NULL"
            operator_email_val = f"'{escape_sql_string(operator_email)}'" if operator_email else "NULL"
            
            cur.execute(f"""
                INSERT INTO t_p35405502_model_agency_website.producer_assignments 
                (producer_email, model_id, operator_email, assigned_by, assignment_type) 
                VALUES ('{escape_sql_string(producer_email)}', {model_id_val}, {operator_email_val}, '{escape_sql_string(user_email)}', '{escape_sql_string(assignment_type)}') 
                RETURNING id
            """)
            
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
                cur.execute(f"""
                    DELETE FROM t_p35405502_model_agency_website.producer_assignments 
                    WHERE producer_email = '{escape_sql_string(producer_email)}' AND model_id = {model_id} AND assignment_type = 'model'
                """)
            else:
                cur.execute(f"""
                    DELETE FROM t_p35405502_model_agency_website.producer_assignments 
                    WHERE producer_email = '{escape_sql_string(producer_email)}' AND operator_email = '{escape_sql_string(operator_email)}' AND assignment_type = 'operator'
                """)
            
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