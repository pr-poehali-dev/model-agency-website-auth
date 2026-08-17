'''
Управление профилем пользователя: загрузка аватара в S3 и смена пароля с проверкой старого.
Args: event с httpMethod (POST), body содержащим action ("upload_avatar" | "change_password") и нужные поля.
Returns: HTTP response с обновлёнными данными или ошибкой.
'''

import json
import os
import base64
import uuid
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor
import bcrypt
import boto3


CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token, X-User-Id',
    'Access-Control-Max-Age': '86400',
}


def _resp(status: int, body: Dict[str, Any]) -> Dict[str, Any]:
    return {
        'statusCode': status,
        'headers': {**CORS_HEADERS, 'Content-Type': 'application/json'},
        'body': json.dumps(body),
    }


def _verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode('utf-8'), hashed.encode('utf-8'))
    except Exception:
        return False


def _hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def _extract_token(headers: Dict[str, str]) -> str:
    h = {k.lower(): v for k, v in headers.items()}
    token = h.get('x-auth-token', '')
    if token:
        return token
    cookie = h.get('x-cookie', '') or h.get('cookie', '')
    if 'auth_token=' in cookie:
        return cookie.split('auth_token=')[1].split(';')[0]
    return ''


def _get_user_by_token(cur, headers: Dict[str, str]):
    '''Определяет текущего пользователя ТОЛЬКО по токену из базы данных'''
    token = _extract_token(headers)
    if not token:
        return None

    cur.execute(
        """SELECT u.id, u.email, u.password_hash, u.photo_url, u.cover_url
           FROM t_p35405502_model_agency_website.auth_tokens at
           JOIN t_p35405502_model_agency_website.users u ON at.user_id = u.id
           WHERE at.token = %s
             AND at.expires_at > NOW()
             AND at.is_active = true
             AND u.is_active = true""",
        (token,),
    )
    return cur.fetchone()


def _upload_image_to_s3(image_b64: str, folder: str, user_id: int) -> str:
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

    key = f'{folder}/{user_id}_{uuid.uuid4().hex}.{ext}'

    s3 = boto3.client(
        's3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
    )
    content_type = {'jpg': 'image/jpeg', 'png': 'image/png', 'webp': 'image/webp'}[ext]
    s3.put_object(Bucket='files', Key=key, Body=data, ContentType=content_type)
    return f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"


def _upload_avatar_to_s3(image_b64: str, user_id: int) -> str:
    return _upload_image_to_s3(image_b64, 'avatars', user_id)


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method = event.get('httpMethod', 'POST')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}
    if method != 'POST':
        return _resp(405, {'error': 'Method not allowed'})

    try:
        body = json.loads(event.get('body') or '{}')
    except json.JSONDecodeError:
        return _resp(400, {'error': 'Invalid JSON'})

    action = body.get('action')

    dsn = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(dsn, cursor_factory=RealDictCursor)
    cur = conn.cursor()

    try:
        user = _get_user_by_token(cur, event.get('headers', {}))
        if not user:
            return _resp(401, {'error': 'Требуется авторизация'})

        if action == 'get_profile':
            target_email = (body.get('email') or '').strip()
            if target_email and target_email.lower() != user['email'].lower():
                cur.execute(
                    """SELECT email, full_name, role, photo_url, cover_url, created_at
                       FROM t_p35405502_model_agency_website.users
                       WHERE LOWER(email) = LOWER(%s) AND is_active = true""",
                    (target_email,),
                )
                target = cur.fetchone()
                if not target:
                    return _resp(404, {'error': 'Сотрудник не найден'})
                return _resp(200, {
                    'success': True,
                    'email': target['email'],
                    'full_name': target['full_name'],
                    'role': target['role'],
                    'photo_url': target['photo_url'],
                    'cover_url': target['cover_url'],
                    'created_at': target['created_at'].isoformat() if target['created_at'] else None,
                })

            cur.execute(
                """SELECT full_name, role, created_at
                   FROM t_p35405502_model_agency_website.users WHERE id = %s""",
                (user['id'],),
            )
            me = cur.fetchone() or {}
            return _resp(200, {
                'success': True,
                'email': user['email'],
                'full_name': me.get('full_name'),
                'role': me.get('role'),
                'photo_url': user['photo_url'],
                'cover_url': user['cover_url'],
                'created_at': me['created_at'].isoformat() if me.get('created_at') else None,
            })

        if action == 'upload_cover':
            image_b64 = body.get('image')
            if not image_b64:
                return _resp(400, {'error': 'Image is required'})
            try:
                cover_url = _upload_image_to_s3(image_b64, 'covers', user['id'])
            except Exception as e:
                return _resp(500, {'error': f'Upload failed: {str(e)}'})

            cur.execute(
                "UPDATE t_p35405502_model_agency_website.users SET cover_url = %s, updated_at = CURRENT_TIMESTAMP WHERE id = %s",
                (cover_url, user['id']),
            )
            conn.commit()
            return _resp(200, {'success': True, 'cover_url': cover_url})

        if action == 'upload_avatar':
            image_b64 = body.get('image')
            if not image_b64:
                return _resp(400, {'error': 'Image is required'})
            try:
                photo_url = _upload_avatar_to_s3(image_b64, user['id'])
            except Exception as e:
                return _resp(500, {'error': f'Upload failed: {str(e)}'})

            cur.execute(
                "UPDATE t_p35405502_model_agency_website.users SET photo_url = %s, updated_at = CURRENT_TIMESTAMP WHERE id = %s",
                (photo_url, user['id']),
            )
            conn.commit()
            return _resp(200, {'success': True, 'photo_url': photo_url})

        if action == 'change_password':
            old_password = body.get('old_password') or ''
            new_password = body.get('new_password') or ''
            if not old_password or not new_password:
                return _resp(400, {'error': 'Old and new password are required'})
            if len(new_password) < 6:
                return _resp(400, {'error': 'Password must be at least 6 characters'})
            if not _verify_password(old_password, user['password_hash'] or ''):
                return _resp(403, {'error': 'Old password is incorrect'})

            new_hash = _hash_password(new_password)
            cur.execute(
                "UPDATE t_p35405502_model_agency_website.users SET password_hash = %s, updated_at = CURRENT_TIMESTAMP WHERE id = %s",
                (new_hash, user['id']),
            )
            conn.commit()
            return _resp(200, {'success': True, 'message': 'Password updated'})

        return _resp(400, {'error': 'Unknown action'})

    finally:
        cur.close()
        conn.close()