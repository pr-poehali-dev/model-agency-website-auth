'''
Business: Управление назначением моделей для операторов (продюсеры/директора назначают, операторы видят)
Args: event с httpMethod (GET/POST/DELETE), body для POST/DELETE
Returns: JSON с назначениями или статусом операции
'''

import json
import os
import psycopg2
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
                    SELECT id, operator_email, model_email, assigned_by, assigned_at 
                    FROM t_p35405502_model_agency_website.operator_model_assignments 
                    WHERE operator_email = '{escape_sql_string(operator_email)}'
                """)
            else:
                cur.execute("""
                    SELECT id, operator_email, model_email, assigned_by, assigned_at 
                    FROM t_p35405502_model_agency_website.operator_model_assignments
                """)
            
            rows = cur.fetchall()
            assignments = [{
                'id': r[0],
                'operatorEmail': r[1],
                'modelEmail': r[2],
                'assignedBy': r[3],
                'assignedAt': r[4].isoformat() if r[4] else None
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
            
            # Проверить, не назначена ли уже
            cur.execute(f"""
                SELECT id FROM t_p35405502_model_agency_website.operator_model_assignments 
                WHERE operator_email = '{escape_sql_string(operator_email)}' AND model_email = '{escape_sql_string(model_email)}'
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
            
            cur.execute(f"""
                INSERT INTO t_p35405502_model_agency_website.operator_model_assignments 
                (operator_email, model_email, assigned_by) 
                VALUES ('{escape_sql_string(operator_email)}', '{escape_sql_string(model_email)}', '{escape_sql_string(user_email)}') 
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
            
            cur.execute(f"""
                DELETE FROM t_p35405502_model_agency_website.operator_model_assignments 
                WHERE operator_email = '{escape_sql_string(operator_email)}' AND model_email = '{escape_sql_string(model_email)}'
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
