'''Управление задачами и комментариями — директор назначает всем, продюсер только своим операторам'''

import json
import os
import psycopg2
from typing import Dict, Any

SCHEMA = 't_p35405502_model_agency_website'


def get_cors_headers(event):
    headers = event.get('headers', {})
    origin = headers.get('origin') or headers.get('Origin') or '*'
    return {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-User-Email, X-User-Role, X-Auth-Token',
        'Access-Control-Allow-Credentials': 'true'
    }


def resp(event, status, body):
    return {
        'statusCode': status,
        'headers': get_cors_headers(event),
        'body': json.dumps(body, default=str)
    }


def get_user_info(headers):
    h = {k.lower(): v for k, v in headers.items()}
    return h.get('x-user-email', ''), h.get('x-user-role', '')


def get_producer_operators(cur, producer_email):
    cur.execute(f"""
        SELECT operator_email FROM {SCHEMA}.producer_assignments 
        WHERE producer_email = %s AND assignment_type = 'operator' AND operator_email IS NOT NULL
    """, (producer_email,))
    return [r[0] for r in cur.fetchall()]


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method = event.get('httpMethod', 'GET')

    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': get_cors_headers(event),
            'body': ''
        }

    headers = event.get('headers', {})
    user_email, user_role = get_user_info(headers)

    dsn = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(dsn)
    cur = conn.cursor()

    try:
        if method == 'GET':
            return handle_get(event, cur, user_email, user_role)
        elif method == 'POST':
            return handle_post(event, cur, conn, user_email, user_role)
        elif method == 'PUT':
            return handle_put(event, cur, conn, user_email, user_role)
        elif method == 'DELETE':
            return handle_delete(event, cur, conn, user_email, user_role)
        else:
            return resp(event, 405, {'error': 'Method not allowed'})
    finally:
        cur.close()
        conn.close()


def handle_get(event, cur, user_email, user_role):
    qp = event.get('queryStringParameters', {}) or {}
    action = qp.get('action', 'list')

    if action == 'assignees':
        return get_assignees(event, cur, user_email, user_role)

    if action == 'comments':
        return get_comments(event, cur, qp)

    if user_role == 'director':
        cur.execute(f"""
            SELECT t.id, t.title, t.description, t.status, t.priority, 
                   t.assigned_to_email, t.assigned_by_email, t.due_date, 
                   t.created_at, t.updated_at, t.completed_at,
                   u1.full_name as assigned_to_name, u2.full_name as assigned_by_name
            FROM {SCHEMA}.tasks t
            LEFT JOIN {SCHEMA}.users u1 ON u1.email = t.assigned_to_email
            LEFT JOIN {SCHEMA}.users u2 ON u2.email = t.assigned_by_email
            ORDER BY t.created_at DESC
        """)
    elif user_role == 'producer':
        operator_emails = get_producer_operators(cur, user_email)
        if not operator_emails:
            return resp(event, 200, [])
        placeholders = ','.join(['%s'] * len(operator_emails))
        all_emails = operator_emails + [user_email, user_email]
        cur.execute(f"""
            SELECT t.id, t.title, t.description, t.status, t.priority, 
                   t.assigned_to_email, t.assigned_by_email, t.due_date, 
                   t.created_at, t.updated_at, t.completed_at,
                   u1.full_name as assigned_to_name, u2.full_name as assigned_by_name
            FROM {SCHEMA}.tasks t
            LEFT JOIN {SCHEMA}.users u1 ON u1.email = t.assigned_to_email
            LEFT JOIN {SCHEMA}.users u2 ON u2.email = t.assigned_by_email
            WHERE t.assigned_to_email IN ({placeholders})
               OR t.assigned_by_email = %s
               OR t.assigned_to_email = %s
            ORDER BY t.created_at DESC
        """, all_emails)
    else:
        cur.execute(f"""
            SELECT t.id, t.title, t.description, t.status, t.priority, 
                   t.assigned_to_email, t.assigned_by_email, t.due_date, 
                   t.created_at, t.updated_at, t.completed_at,
                   u1.full_name as assigned_to_name, u2.full_name as assigned_by_name
            FROM {SCHEMA}.tasks t
            LEFT JOIN {SCHEMA}.users u1 ON u1.email = t.assigned_to_email
            LEFT JOIN {SCHEMA}.users u2 ON u2.email = t.assigned_by_email
            WHERE t.assigned_to_email = %s
            ORDER BY t.created_at DESC
        """, (user_email,))

    rows = cur.fetchall()
    task_ids = [r[0] for r in rows]

    comment_counts = {}
    if task_ids:
        placeholders = ','.join(['%s'] * len(task_ids))
        cur.execute(f"""
            SELECT task_id, COUNT(*) FROM {SCHEMA}.task_comments 
            WHERE task_id IN ({placeholders}) GROUP BY task_id
        """, task_ids)
        for r in cur.fetchall():
            comment_counts[r[0]] = r[1]

    tasks = [{
        'id': r[0], 'title': r[1], 'description': r[2], 'status': r[3],
        'priority': r[4], 'assignedToEmail': r[5], 'assignedByEmail': r[6],
        'dueDate': r[7], 'createdAt': r[8], 'updatedAt': r[9],
        'completedAt': r[10], 'assignedToName': r[11], 'assignedByName': r[12],
        'commentCount': comment_counts.get(r[0], 0)
    } for r in rows]

    return resp(event, 200, tasks)


def get_comments(event, cur, qp):
    task_id = qp.get('taskId')
    if not task_id:
        return resp(event, 400, {'error': 'taskId required'})

    cur.execute(f"""
        SELECT c.id, c.task_id, c.author_email, c.text, c.created_at,
               u.full_name as author_name
        FROM {SCHEMA}.task_comments c
        LEFT JOIN {SCHEMA}.users u ON u.email = c.author_email
        WHERE c.task_id = %s
        ORDER BY c.created_at ASC
    """, (task_id,))

    rows = cur.fetchall()
    comments = [{
        'id': r[0], 'taskId': r[1], 'authorEmail': r[2], 'text': r[3],
        'createdAt': r[4], 'authorName': r[5]
    } for r in rows]

    return resp(event, 200, comments)


def get_assignees(event, cur, user_email, user_role):
    if user_role == 'director':
        cur.execute(f"""
            SELECT email, full_name, role FROM {SCHEMA}.users 
            WHERE is_active = true AND role IN ('producer', 'operator')
            ORDER BY role, full_name
        """)
    elif user_role == 'producer':
        operator_emails = get_producer_operators(cur, user_email)
        if not operator_emails:
            return resp(event, 200, [])
        placeholders = ','.join(['%s'] * len(operator_emails))
        cur.execute(f"""
            SELECT email, full_name, role FROM {SCHEMA}.users 
            WHERE email IN ({placeholders}) AND is_active = true
            ORDER BY full_name
        """, operator_emails)
    else:
        return resp(event, 200, [])

    rows = cur.fetchall()
    users = [{'email': r[0], 'fullName': r[1], 'role': r[2]} for r in rows]
    return resp(event, 200, users)


def handle_post(event, cur, conn, user_email, user_role):
    body = json.loads(event.get('body', '{}'))
    action = body.get('action')

    if action == 'comment':
        return add_comment(event, cur, conn, user_email, body)

    if user_role not in ('director', 'producer'):
        return resp(event, 403, {'error': 'Access denied'})

    title = body.get('title', '').strip()
    description = body.get('description', '').strip()
    priority = body.get('priority', 'medium')
    assigned_to = body.get('assignedToEmail', '').strip()
    due_date = body.get('dueDate')

    if not title or not assigned_to:
        return resp(event, 400, {'error': 'Title and assignee required'})

    if user_role == 'producer':
        operator_emails = get_producer_operators(cur, user_email)
        if assigned_to not in operator_emails:
            return resp(event, 403, {'error': 'Can only assign tasks to your operators'})

    cur.execute(f"""
        INSERT INTO {SCHEMA}.tasks (title, description, priority, assigned_to_email, assigned_by_email, due_date)
        VALUES (%s, %s, %s, %s, %s, %s)
        RETURNING id, created_at
    """, (title, description, priority, assigned_to, user_email, due_date))

    row = cur.fetchone()
    conn.commit()

    return resp(event, 201, {'id': row[0], 'createdAt': row[1]})


def add_comment(event, cur, conn, user_email, body):
    task_id = body.get('taskId')
    text = body.get('text', '').strip()

    if not task_id or not text:
        return resp(event, 400, {'error': 'taskId and text required'})

    cur.execute(f"SELECT id FROM {SCHEMA}.tasks WHERE id = %s", (task_id,))
    if not cur.fetchone():
        return resp(event, 404, {'error': 'Task not found'})

    cur.execute(f"""
        INSERT INTO {SCHEMA}.task_comments (task_id, author_email, text)
        VALUES (%s, %s, %s)
        RETURNING id, created_at
    """, (task_id, user_email, text))

    row = cur.fetchone()
    conn.commit()

    cur.execute(f"SELECT full_name FROM {SCHEMA}.users WHERE email = %s", (user_email,))
    name_row = cur.fetchone()

    return resp(event, 201, {
        'id': row[0],
        'taskId': task_id,
        'authorEmail': user_email,
        'authorName': name_row[0] if name_row else None,
        'text': text,
        'createdAt': row[1]
    })


def handle_put(event, cur, conn, user_email, user_role):
    body = json.loads(event.get('body', '{}'))
    task_id = body.get('id')
    new_status = body.get('status')
    title = body.get('title')
    description = body.get('description')
    priority = body.get('priority')
    due_date = body.get('dueDate')

    if not task_id:
        return resp(event, 400, {'error': 'Task id required'})

    cur.execute(f"SELECT assigned_to_email, assigned_by_email FROM {SCHEMA}.tasks WHERE id = %s", (task_id,))
    task = cur.fetchone()
    if not task:
        return resp(event, 404, {'error': 'Task not found'})

    assigned_to, assigned_by = task
    if user_role == 'operator' and user_email != assigned_to:
        return resp(event, 403, {'error': 'Access denied'})
    if user_role == 'producer' and user_email != assigned_by and user_email != assigned_to:
        return resp(event, 403, {'error': 'Access denied'})

    updates = []
    params = []
    if new_status:
        updates.append("status = %s")
        params.append(new_status)
        if new_status == 'completed':
            updates.append("completed_at = CURRENT_TIMESTAMP")
        elif new_status != 'completed':
            updates.append("completed_at = NULL")
    if title is not None:
        updates.append("title = %s")
        params.append(title)
    if description is not None:
        updates.append("description = %s")
        params.append(description)
    if priority is not None:
        updates.append("priority = %s")
        params.append(priority)
    if 'dueDate' in body:
        updates.append("due_date = %s")
        params.append(due_date)

    updates.append("updated_at = CURRENT_TIMESTAMP")
    params.append(task_id)

    cur.execute(f"UPDATE {SCHEMA}.tasks SET {', '.join(updates)} WHERE id = %s", params)
    conn.commit()

    return resp(event, 200, {'message': 'Updated'})


def handle_delete(event, cur, conn, user_email, user_role):
    body = json.loads(event.get('body', '{}'))

    if body.get('deleteAllCompleted'):
        if user_role != 'director':
            return resp(event, 403, {'error': 'Only director can bulk delete completed tasks'})
        cur.execute(f"SELECT id FROM {SCHEMA}.tasks WHERE status = 'completed'")
        ids = [r[0] for r in cur.fetchall()]
        if ids:
            placeholders = ','.join(['%s'] * len(ids))
            cur.execute(f"DELETE FROM {SCHEMA}.task_comments WHERE task_id IN ({placeholders})", ids)
            cur.execute(f"DELETE FROM {SCHEMA}.tasks WHERE id IN ({placeholders})", ids)
            conn.commit()
        return resp(event, 200, {'deleted': len(ids)})

    task_id = body.get('id')

    if not task_id:
        return resp(event, 400, {'error': 'Task id required'})

    cur.execute(f"SELECT assigned_by_email, status FROM {SCHEMA}.tasks WHERE id = %s", (task_id,))
    task = cur.fetchone()
    if not task:
        return resp(event, 404, {'error': 'Task not found'})

    assigned_by, status = task

    if user_role == 'operator':
        return resp(event, 403, {'error': 'Operators cannot delete tasks'})
    if user_role == 'director':
        if status != 'completed':
            return resp(event, 403, {'error': 'Director can only delete completed tasks'})
    if user_role == 'producer':
        if assigned_by != user_email:
            return resp(event, 403, {'error': 'Can only delete your own tasks'})
        if status != 'completed':
            return resp(event, 403, {'error': 'Producer can only delete completed tasks'})

    cur.execute(f"DELETE FROM {SCHEMA}.task_comments WHERE task_id = %s", (task_id,))
    cur.execute(f"DELETE FROM {SCHEMA}.tasks WHERE id = %s", (task_id,))
    conn.commit()

    return resp(event, 200, {'message': 'Deleted'})