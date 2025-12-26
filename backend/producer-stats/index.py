import json
import os
from datetime import datetime, timedelta
from typing import Dict, Any, List
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Get financial statistics for producers/directors
    Args: event with httpMethod, queryStringParameters (user_email, role, period_start, period_end)
    Returns: Statistics for assigned models/operators with comparisons
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Email, X-User-Role',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    if method != 'GET':
        return {
            'statusCode': 405,
            'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    params = event.get('queryStringParameters', {})
    user_email = params.get('user_email', '')
    user_role = params.get('role', 'producer')
    period_start = params.get('period_start', '')
    period_end = params.get('period_end', '')
    
    db_url = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(db_url)
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    schema = 't_p35405502_model_agency_website'
    
    if user_role == 'director':
        result = get_all_production_stats(cursor, schema, period_start, period_end)
    else:
        result = get_producer_stats(cursor, schema, user_email, period_start, period_end)
    
    cursor.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
        'isBase64Encoded': False,
        'body': json.dumps(result, default=str)
    }

def get_producer_stats(cursor, schema: str, producer_email: str, period_start: str, period_end: str) -> Dict[str, Any]:
    cursor.execute(f'''
        SELECT DISTINCT u.email, u.full_name
        FROM {schema}.producer_assignments pa
        JOIN {schema}.users u ON pa.model_email = u.email
        WHERE pa.producer_email = %s AND pa.assignment_type = 'model'
    ''', (producer_email,))
    models = cursor.fetchall()
    
    cursor.execute(f'''
        SELECT DISTINCT u.email, u.full_name
        FROM {schema}.producer_assignments pa
        JOIN {schema}.users u ON pa.operator_email = u.email
        WHERE pa.producer_email = %s AND pa.assignment_type = 'operator'
    ''', (producer_email,))
    operators = cursor.fetchall()
    
    model_emails = [m['email'] for m in models]
    operator_emails = [o['email'] for o in operators]
    
    model_stats = []
    for model in models:
        stats = get_model_finance_stats(cursor, schema, model['email'], period_start, period_end)
        stats['name'] = model['full_name']
        stats['email'] = model['email']
        model_stats.append(stats)
    
    operator_stats = []
    for operator in operators:
        stats = get_operator_stats(cursor, schema, operator['email'], period_start, period_end)
        stats['name'] = operator['full_name']
        stats['email'] = operator['email']
        operator_stats.append(stats)
    
    all_emails = model_emails + operator_emails
    adjustments = get_salary_adjustments(cursor, schema, all_emails, period_start, period_end)
    
    return {
        'models': model_stats,
        'operators': operator_stats,
        'adjustments': adjustments
    }

def get_all_production_stats(cursor, schema: str, period_start: str, period_end: str) -> Dict[str, Any]:
    cursor.execute(f'''
        SELECT DISTINCT pa.producer_email, u.full_name
        FROM {schema}.producer_assignments pa
        JOIN {schema}.users u ON pa.producer_email = u.email
    ''')
    producers = cursor.fetchall()
    
    producer_stats = []
    all_producer_emails = []
    for producer in producers:
        stats = get_producer_stats(cursor, schema, producer['producer_email'], period_start, period_end)
        stats['producer_name'] = producer['full_name']
        stats['producer_email'] = producer['producer_email']
        producer_stats.append(stats)
        all_producer_emails.append(producer['producer_email'])
    
    # Add solo makers as a separate "producer" group
    cursor.execute(f'''
        SELECT email, full_name
        FROM {schema}.users
        WHERE role = 'solo_maker'
    ''')
    solo_makers = cursor.fetchall()
    
    if solo_makers:
        solo_model_stats = []
        solo_emails = [sm['email'] for sm in solo_makers]
        
        for solo in solo_makers:
            stats = get_model_finance_stats(cursor, schema, solo['email'], period_start, period_end)
            stats['name'] = solo['full_name']
            stats['email'] = solo['email']
            solo_model_stats.append(stats)
        
        solo_adjustments = get_salary_adjustments(cursor, schema, solo_emails, period_start, period_end)
        
        solo_group = {
            'producer_name': 'Соло-мейкеры',
            'producer_email': 'solo_makers_group',
            'models': solo_model_stats,
            'operators': [],
            'adjustments': solo_adjustments
        }
        producer_stats.append(solo_group)
    
    director_adjustments = get_salary_adjustments(cursor, schema, all_producer_emails, period_start, period_end)
    
    for prod_stat in producer_stats:
        prod_email = prod_stat['producer_email']
        if prod_email == 'solo_makers_group':
            continue
        prod_current = [a for a in director_adjustments['current'] if a['email'] == prod_email]
        prod_previous = [a for a in director_adjustments['previous'] if a['email'] == prod_email]
        
        if prod_current:
            prod_stat['adjustments']['current'].extend(prod_current)
        if prod_previous:
            prod_stat['adjustments']['previous'].extend(prod_previous)
    
    return {'producers': producer_stats}

def get_model_finance_stats(cursor, schema: str, model_email: str, period_start: str, period_end: str) -> Dict[str, Any]:
    cursor.execute(f'SELECT id, role, solo_percentage FROM {schema}.users WHERE email = %s', (model_email,))
    user_row = cursor.fetchone()
    if not user_row:
        return {'current_income': 0, 'previous_income': 0, 'current_shifts': 0, 'previous_shifts': 0, 'is_solo_maker': False, 'solo_percentage': 0}
    
    model_id = user_row['id']
    is_solo_maker = user_row.get('role') == 'solo_maker'
    solo_percentage = int(user_row.get('solo_percentage') or 0)
    
    cursor.execute(f'''
        SELECT 
            COALESCE(SUM(((cb_income + sp_income + soda_income) * 0.05 + cam4_income + transfers) * 0.6), 0) as total_income,
            COALESCE(SUM((cb_income + sp_income + soda_income) * 0.05 + cam4_income + transfers), 0) as gross_revenue,
            COALESCE(SUM(cb_income * 0.05), 0) as cb_gross_revenue,
            COALESCE(SUM(sp_income * 0.05), 0) as sp_gross_revenue,
            COUNT(CASE WHEN has_shift = true THEN 1 END) as shift_count
        FROM {schema}.model_finances
        WHERE model_id = %s AND date >= %s AND date <= %s
    ''', (model_id, period_start, period_end))
    current = cursor.fetchone()
    
    prev_start, prev_end = get_previous_period_dates(period_start, period_end)
    cursor.execute(f'''
        SELECT 
            COALESCE(SUM(((cb_income + sp_income + soda_income) * 0.05 + cam4_income + transfers) * 0.6), 0) as total_income,
            COALESCE(SUM((cb_income + sp_income + soda_income) * 0.05 + cam4_income + transfers), 0) as gross_revenue,
            COALESCE(SUM(cb_income * 0.05), 0) as cb_gross_revenue,
            COALESCE(SUM(sp_income * 0.05), 0) as sp_gross_revenue,
            COUNT(CASE WHEN has_shift = true THEN 1 END) as shift_count
        FROM {schema}.model_finances
        WHERE model_id = %s AND date >= %s AND date <= %s
    ''', (model_id, prev_start, prev_end))
    previous = cursor.fetchone()
    
    return {
        'current_income': float(current['total_income']) if current else 0,
        'previous_income': float(previous['total_income']) if previous else 0,
        'current_gross_revenue': float(current['gross_revenue']) if current else 0,
        'previous_gross_revenue': float(previous['gross_revenue']) if previous else 0,
        'current_cb_gross_revenue': float(current['cb_gross_revenue']) if current else 0,
        'current_sp_gross_revenue': float(current['sp_gross_revenue']) if current else 0,
        'current_shifts': int(current['shift_count']) if current else 0,
        'previous_shifts': int(previous['shift_count']) if previous else 0,
        'is_solo_maker': is_solo_maker,
        'solo_percentage': solo_percentage
    }

def get_operator_stats(cursor, schema: str, operator_email: str, period_start: str, period_end: str) -> Dict[str, Any]:
    cursor.execute(f'''
        SELECT COUNT(DISTINCT date) as shift_count
        FROM {schema}.model_finances
        WHERE operator_name = %s AND has_shift = true AND date >= %s AND date <= %s
    ''', (operator_email, period_start, period_end))
    current = cursor.fetchone()
    
    prev_start, prev_end = get_previous_period_dates(period_start, period_end)
    cursor.execute(f'''
        SELECT COUNT(DISTINCT date) as shift_count
        FROM {schema}.model_finances
        WHERE operator_name = %s AND has_shift = true AND date >= %s AND date <= %s
    ''', (operator_email, prev_start, prev_end))
    previous = cursor.fetchone()
    
    return {
        'current_shifts': int(current['shift_count']) if current else 0,
        'previous_shifts': int(previous['shift_count']) if previous else 0
    }

def get_salary_adjustments(cursor, schema: str, emails: List[str], period_start: str, period_end: str) -> Dict[str, Any]:
    if not emails:
        return {'current': [], 'previous': []}
    
    placeholders = ','.join(['%s'] * len(emails))
    cursor.execute(f'''
        SELECT email, role, advance, penalty, expenses
        FROM {schema}.salary_adjustments
        WHERE email IN ({placeholders}) AND period_start = %s AND period_end = %s
    ''', (*emails, period_start, period_end))
    current = cursor.fetchall()
    
    prev_start, prev_end = get_previous_period_dates(period_start, period_end)
    cursor.execute(f'''
        SELECT email, role, advance, penalty, expenses
        FROM {schema}.salary_adjustments
        WHERE email IN ({placeholders}) AND period_start = %s AND period_end = %s
    ''', (*emails, prev_start, prev_end))
    previous = cursor.fetchall()
    
    return {
        'current': [dict(r) for r in current],
        'previous': [dict(r) for r in previous]
    }

def get_previous_period_dates(period_start: str, period_end: str) -> tuple:
    start_date = datetime.strptime(period_start, '%Y-%m-%d')
    end_date = datetime.strptime(period_end, '%Y-%m-%d')
    
    period_length = (end_date - start_date).days + 1
    
    if start_date.day == 1:
        prev_month = start_date.replace(day=1) - timedelta(days=1)
        prev_end = prev_month
        prev_start = prev_month.replace(day=16)
    else:
        prev_end = start_date - timedelta(days=1)
        prev_start = prev_end.replace(day=1)
    
    return prev_start.strftime('%Y-%m-%d'), prev_end.strftime('%Y-%m-%d')