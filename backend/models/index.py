import json
import os
import psycopg2
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Управление моделями агентства - создание, просмотр, обновление, удаление
    Args: event - dict с httpMethod, body, queryStringParameters
          context - объект с атрибутами request_id, function_name
    Returns: HTTP response dict
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Email',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'DATABASE_URL not configured'})
        }
    
    conn = psycopg2.connect(dsn)
    try:
        cur = conn.cursor()
        
        if method == 'GET':
            cur.execute("""
                SELECT id, name, image, height, bust, waist, hips, 
                       experience, specialty, status, created_at, updated_at
                FROM models
                ORDER BY created_at DESC
            """)
            rows = cur.fetchall()
            models = []
            for row in rows:
                models.append({
                    'id': row[0],
                    'name': row[1],
                    'image': row[2],
                    'height': row[3],
                    'bust': row[4],
                    'waist': row[5],
                    'hips': row[6],
                    'experience': row[7],
                    'specialty': row[8],
                    'status': row[9],
                    'createdAt': row[10].isoformat() if row[10] else None,
                    'updatedAt': row[11].isoformat() if row[11] else None
                })
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps(models)
            }
        
        elif method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            
            headers = event.get('headers', {})
            user_email = headers.get('x-user-email', headers.get('X-User-Email', '')).lower()
            
            if not user_email:
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Требуется авторизация'})
                }
            
            cur.execute("SELECT role FROM users WHERE LOWER(email) = %s", (user_email,))
            user = cur.fetchone()
            
            if not user or user[0] != 'director':
                return {
                    'statusCode': 403,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Только директор может добавлять модели'})
                }
            
            name = body_data.get('name', '').strip()
            if not name:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Имя модели обязательно'})
                }
            
            cur.execute("""
                INSERT INTO models (name, image, height, bust, waist, hips, experience, specialty, status)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id, name, image, height, bust, waist, hips, experience, specialty, status, created_at, updated_at
            """, (
                name,
                body_data.get('image', ''),
                body_data.get('height', ''),
                body_data.get('bust', ''),
                body_data.get('waist', ''),
                body_data.get('hips', ''),
                body_data.get('experience', ''),
                body_data.get('specialty', ''),
                body_data.get('status', 'Available')
            ))
            
            conn.commit()
            row = cur.fetchone()
            
            new_model = {
                'id': row[0],
                'name': row[1],
                'image': row[2],
                'height': row[3],
                'bust': row[4],
                'waist': row[5],
                'hips': row[6],
                'experience': row[7],
                'specialty': row[8],
                'status': row[9],
                'createdAt': row[10].isoformat() if row[10] else None,
                'updatedAt': row[11].isoformat() if row[11] else None
            }
            
            return {
                'statusCode': 201,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps(new_model)
            }
        
        elif method == 'PUT':
            body_data = json.loads(event.get('body', '{}'))
            model_id = body_data.get('id')
            
            if not model_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'ID модели обязателен'})
                }
            
            headers = event.get('headers', {})
            user_email = headers.get('x-user-email', headers.get('X-User-Email', '')).lower()
            
            if not user_email:
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Требуется авторизация'})
                }
            
            cur.execute("SELECT role FROM users WHERE LOWER(email) = %s", (user_email,))
            user = cur.fetchone()
            
            if not user or user[0] != 'director':
                return {
                    'statusCode': 403,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Только директор может редактировать модели'})
                }
            
            updates = []
            params = []
            
            for field in ['name', 'image', 'height', 'bust', 'waist', 'hips', 'experience', 'specialty', 'status']:
                if field in body_data:
                    updates.append(f"{field} = %s")
                    params.append(body_data[field])
            
            if not updates:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Нет данных для обновления'})
                }
            
            updates.append("updated_at = CURRENT_TIMESTAMP")
            params.append(model_id)
            
            query = f"UPDATE models SET {', '.join(updates)} WHERE id = %s RETURNING id, name, image, height, bust, waist, hips, experience, specialty, status, created_at, updated_at"
            cur.execute(query, params)
            conn.commit()
            
            row = cur.fetchone()
            if not row:
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Модель не найдена'})
                }
            
            updated_model = {
                'id': row[0],
                'name': row[1],
                'image': row[2],
                'height': row[3],
                'bust': row[4],
                'waist': row[5],
                'hips': row[6],
                'experience': row[7],
                'specialty': row[8],
                'status': row[9],
                'createdAt': row[10].isoformat() if row[10] else None,
                'updatedAt': row[11].isoformat() if row[11] else None
            }
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps(updated_model)
            }
        
        elif method == 'DELETE':
            body_data = json.loads(event.get('body', '{}'))
            model_id = body_data.get('id')
            
            if not model_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'ID модели обязателен'})
                }
            
            headers = event.get('headers', {})
            user_email = headers.get('x-user-email', headers.get('X-User-Email', '')).lower()
            
            if not user_email:
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Требуется авторизация'})
                }
            
            cur.execute("SELECT role FROM users WHERE LOWER(email) = %s", (user_email,))
            user = cur.fetchone()
            
            if not user or user[0] != 'director':
                return {
                    'statusCode': 403,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Только директор может удалять модели'})
                }
            
            cur.execute("DELETE FROM models WHERE id = %s RETURNING name", (model_id,))
            row = cur.fetchone()
            conn.commit()
            
            if not row:
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Модель не найдена'})
                }
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'message': f'Модель {row[0]} удалена'})
            }
        
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Метод не поддерживается'})
        }
    
    finally:
        conn.close()
