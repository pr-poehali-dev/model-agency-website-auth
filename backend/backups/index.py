import json
import os
import psycopg2
from datetime import datetime

def handler(event: dict, context) -> dict:
    '''API для создания и восстановления бэкапов базы данных'''
    
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Authorization'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'DATABASE_URL not configured'}),
            'isBase64Encoded': False
        }
    
    conn = psycopg2.connect(dsn)
    conn.autocommit = True
    cur = conn.cursor()
    
    try:
        if method == 'GET':
            # Получить список бэкапов
            cur.execute('''
                SELECT id, backup_name, created_at, tables_count, description
                FROM backups
                ORDER BY created_at DESC
            ''')
            
            backups = []
            for row in cur.fetchall():
                backups.append({
                    'id': row[0],
                    'name': row[1],
                    'createdAt': row[2].isoformat() if row[2] else None,
                    'tablesCount': row[3],
                    'description': row[4]
                })
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps(backups),
                'isBase64Encoded': False
            }
        
        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            action = body.get('action')
            
            if action == 'create':
                # Создать новый бэкап
                description = body.get('description', 'Ручной бэкап')
                backup_name = f"backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
                
                # Получить список всех таблиц
                cur.execute('''
                    SELECT table_name 
                    FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_type = 'BASE TABLE'
                    AND table_name != 'backups'
                ''')
                
                tables = [row[0] for row in cur.fetchall()]
                backup_data = {}
                
                # Сохранить данные из каждой таблицы
                for table in tables:
                    cur.execute(f'SELECT * FROM {table}')
                    columns = [desc[0] for desc in cur.description]
                    rows = cur.fetchall()
                    
                    backup_data[table] = {
                        'columns': columns,
                        'rows': [[str(cell) if cell is not None else None for cell in row] for row in rows]
                    }
                
                # Сохранить бэкап в таблицу
                cur.execute('''
                    INSERT INTO backups (backup_name, backup_data, tables_count, description)
                    VALUES (%s, %s, %s, %s)
                    RETURNING id
                ''', (backup_name, json.dumps(backup_data), len(tables), description))
                
                backup_id = cur.fetchone()[0]
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'id': backup_id, 'name': backup_name, 'message': 'Бэкап создан успешно'}),
                    'isBase64Encoded': False
                }
            
            elif action == 'restore':
                # Восстановить из бэкапа
                backup_id = body.get('backupId')
                
                if not backup_id:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Не указан ID бэкапа'}),
                        'isBase64Encoded': False
                    }
                
                # Получить данные бэкапа
                cur.execute('SELECT backup_data FROM backups WHERE id = %s', (backup_id,))
                result = cur.fetchone()
                
                if not result:
                    return {
                        'statusCode': 404,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Бэкап не найден'}),
                        'isBase64Encoded': False
                    }
                
                backup_data = json.loads(result[0])
                
                # Очистить и восстановить каждую таблицу
                for table_name, table_data in backup_data.items():
                    # Очистить таблицу
                    cur.execute(f'TRUNCATE TABLE {table_name} CASCADE')
                    
                    # Восстановить данные
                    if table_data['rows']:
                        columns = ', '.join(table_data['columns'])
                        placeholders = ', '.join(['%s'] * len(table_data['columns']))
                        
                        for row in table_data['rows']:
                            # Преобразовать 'None' строки обратно в NULL
                            row_values = [None if cell == 'None' else cell for cell in row]
                            cur.execute(
                                f'INSERT INTO {table_name} ({columns}) VALUES ({placeholders})',
                                row_values
                            )
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'message': 'Данные восстановлены успешно'}),
                    'isBase64Encoded': False
                }
            
            else:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Неизвестное действие'}),
                    'isBase64Encoded': False
                }
        
        else:
            return {
                'statusCode': 405,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Метод не поддерживается'}),
                'isBase64Encoded': False
            }
    
    finally:
        cur.close()
        conn.close()
