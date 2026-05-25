'''
Управление галереей фотографий пользователя: список, загрузка, удаление, обновление подписи.
Args: event с httpMethod (GET для списка по email, POST для действий), body action ("add" | "delete" | "update_comment").
Returns: HTTP response со списком фото или результатом действия.
'''

import json
import os
import base64
import uuid
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor
import boto3


MAX_PHOTOS = 6
SCHEMA = 't_p35405502_model_agency_website'

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token, X-User-Id',
    'Access-Control-Max-Age': '86400',
}


def _resp(status: int, body: Dict[str, Any]) -> Dict[str, Any]:
    return {
        'statusCode': status,
        'headers': {**CORS_HEADERS, 'Content-Type': 'application/json'},
        'body': json.dumps(body),
    }


def _upload_to_s3(image_b64: str, owner_email: str) -> str:
    if ',' in image_b64:
        image_b64 = image_b64.split(',', 1)[1]
    data = base64.b64decode(image_b64)

    ext = 'png'
    if data[:3] == b'\xff\xd8\xff':
        ext = 'jpg'
    elif data[:4] == b'\x89PNG':
        ext = 'png'
    elif data[:4] == b'RIFF':
        ext = 'webp'

    safe = ''.join(c if c.isalnum() else '_' for c in owner_email)[:40]
    key = f'gallery/{safe}_{uuid.uuid4().hex}.{ext}'

    s3 = boto3.client(
        's3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
    )
    content_type = {'jpg': 'image/jpeg', 'png': 'image/png', 'webp': 'image/webp'}[ext]
    s3.put_object(Bucket='files', Key=key, Body=data, ContentType=content_type)
    return f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"


def _can_edit(actor_email: str, actor_role: str, target_email: str) -> bool:
    if not target_email:
        return False
    if actor_role == 'director':
        return True
    return (actor_email or '').lower() == (target_email or '').lower()


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    dsn = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(dsn, cursor_factory=RealDictCursor)
    cur = conn.cursor()

    try:
        if method == 'GET':
            params = event.get('queryStringParameters') or {}
            email = (params.get('email') or '').strip().lower()
            if not email:
                return _resp(400, {'error': 'email is required'})
            cur.execute(
                f"SELECT id, photo_url, comment, position, created_at FROM {SCHEMA}.user_photos "
                f"WHERE LOWER(user_email) = %s ORDER BY position ASC, id ASC",
                (email,),
            )
            rows = cur.fetchall()
            photos = [
                {
                    'id': r['id'],
                    'photo_url': r['photo_url'],
                    'comment': r['comment'] or '',
                    'position': r['position'],
                    'created_at': r['created_at'].isoformat() if r['created_at'] else None,
                }
                for r in rows
            ]
            return _resp(200, {'success': True, 'photos': photos, 'max': MAX_PHOTOS})

        if method != 'POST':
            return _resp(405, {'error': 'Method not allowed'})

        try:
            body = json.loads(event.get('body') or '{}')
        except json.JSONDecodeError:
            return _resp(400, {'error': 'Invalid JSON'})

        action = body.get('action')
        target_email = (body.get('target_email') or '').strip().lower()
        actor_email = (body.get('actor_email') or '').strip().lower()
        actor_role = (body.get('actor_role') or '').strip().lower()

        if not target_email:
            return _resp(400, {'error': 'target_email is required'})
        if not _can_edit(actor_email, actor_role, target_email):
            return _resp(403, {'error': 'Forbidden'})

        if action == 'add':
            image_b64 = body.get('image')
            comment = (body.get('comment') or '').strip()[:200]
            if not image_b64:
                return _resp(400, {'error': 'image is required'})

            cur.execute(
                f"SELECT COUNT(*) AS c FROM {SCHEMA}.user_photos WHERE LOWER(user_email) = %s",
                (target_email,),
            )
            count_row = cur.fetchone()
            count = count_row['c'] if count_row else 0
            if count >= MAX_PHOTOS:
                return _resp(400, {'error': f'Достигнут лимит {MAX_PHOTOS} фото'})

            try:
                photo_url = _upload_to_s3(image_b64, target_email)
            except Exception as e:
                return _resp(500, {'error': f'Upload failed: {str(e)}'})

            cur.execute(
                f"INSERT INTO {SCHEMA}.user_photos (user_email, photo_url, comment, position) "
                f"VALUES (%s, %s, %s, %s) RETURNING id, photo_url, comment, position, created_at",
                (target_email, photo_url, comment, count),
            )
            row = cur.fetchone()
            conn.commit()
            return _resp(200, {
                'success': True,
                'photo': {
                    'id': row['id'],
                    'photo_url': row['photo_url'],
                    'comment': row['comment'] or '',
                    'position': row['position'],
                    'created_at': row['created_at'].isoformat() if row['created_at'] else None,
                },
            })

        if action == 'delete':
            photo_id = body.get('photo_id')
            if not photo_id:
                return _resp(400, {'error': 'photo_id is required'})
            cur.execute(
                f"DELETE FROM {SCHEMA}.user_photos WHERE id = %s AND LOWER(user_email) = %s",
                (int(photo_id), target_email),
            )
            conn.commit()
            return _resp(200, {'success': True})

        if action == 'update_comment':
            photo_id = body.get('photo_id')
            comment = (body.get('comment') or '').strip()[:200]
            if not photo_id:
                return _resp(400, {'error': 'photo_id is required'})
            cur.execute(
                f"UPDATE {SCHEMA}.user_photos SET comment = %s, updated_at = CURRENT_TIMESTAMP "
                f"WHERE id = %s AND LOWER(user_email) = %s",
                (comment, int(photo_id), target_email),
            )
            conn.commit()
            return _resp(200, {'success': True})

        return _resp(400, {'error': 'Unknown action'})

    finally:
        cur.close()
        conn.close()
