import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Dict, Any, List
from datetime import datetime

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Calculate salaries for operators, models, and producers based on financial data
    Args: event - dict with httpMethod, queryStringParameters (period_start, period_end)
          context - object with attributes: request_id, function_name
    Returns: HTTP response with salary calculations
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
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    params = event.get('queryStringParameters') or {}
    period_start = params.get('period_start')
    period_end = params.get('period_end')
    
    if not period_start or not period_end:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'period_start and period_end are required'})
        }
    
    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Database connection not configured'})
        }
    
    conn = psycopg2.connect(dsn)
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        cur.execute("""
            SELECT 
                u.id as user_id,
                u.email,
                u.full_name,
                u.role,
                u.solo_percentage
            FROM users u
            WHERE u.role IN ('operator', 'content_maker', 'producer', 'solo_maker')
        """)
        users = cur.fetchall()
        
        cur.execute("""
            SELECT 
                oma.operator_email,
                oma.model_email,
                oma.model_id,
                oma.operator_percentage,
                u.id as model_user_id
            FROM operator_model_assignments oma
            JOIN users u ON u.email = oma.model_email
        """)
        assignments = cur.fetchall()
        
        cur.execute("""
            SELECT 
                pma.producer_email,
                pma.model_email
            FROM producer_assignments pma
            WHERE pma.assignment_type = 'model' AND pma.model_email IS NOT NULL
        """)
        producer_assignments = cur.fetchall()
        
        cur.execute(f"""
            SELECT 
                mf.model_id,
                mf.date,
                mf.cb_tokens,
                mf.stripchat_tokens,
                mf.soda_tokens,
                mf.cb_income,
                mf.sp_income,
                mf.soda_income,
                mf.cam4_income,
                mf.transfers,
                mf.operator_name
            FROM model_finances mf
            WHERE mf.date BETWEEN '{period_start}' AND '{period_end}'
        """)
        all_finances = cur.fetchall()
        
        finances = [f for f in all_finances if (
            (float(f['cb_tokens'] or 0) > 0) or
            (float(f['stripchat_tokens'] or 0) > 0) or
            (float(f['soda_tokens'] or 0) > 0) or
            (float(f['cb_income'] or 0) > 0) or
            (float(f['sp_income'] or 0) > 0) or
            (float(f['soda_income'] or 0) > 0) or
            (float(f['cam4_income'] or 0) > 0) or
            (float(f['transfers'] or 0) > 0)
        )]
        
        print(f"DEBUG: period={period_start} to {period_end}, finances_count={len(finances)}")
        
        operator_salaries = {}
        model_salaries = {}
        producer_salaries = {}
        
        for finance in finances:
            model_id = finance['model_id']
            operator_name = finance.get('operator_name', '').strip()
            
            print(f"DEBUG: Processing finance for model_id={model_id}, operator_name='{operator_name}'")
            
            cb_tokens = float(finance['cb_tokens'] or 0)
            sp_tokens = float(finance['stripchat_tokens'] or 0)
            soda_tokens = float(finance['soda_tokens'] or 0)
            cb_income_tokens = float(finance['cb_income'] or 0)
            sp_income_tokens = float(finance['sp_income'] or 0)
            soda_income_tokens = float(finance['soda_income'] or 0)
            cam4_income_dollars = float(finance['cam4_income'] or 0)
            transfers_dollars = float(finance['transfers'] or 0)
            
            print(f"DEBUG RAW: model_id={model_id}, date={finance['date']}, cb_tokens={cb_tokens}, sp_tokens={sp_tokens}, cb_income={cb_income_tokens}, sp_income={sp_income_tokens}, transfers={transfers_dollars}")
            
            cb_dollars = cb_income_tokens * 0.05 if cb_income_tokens > 0 else cb_tokens * 0.05
            sp_dollars = sp_income_tokens * 0.05 if sp_income_tokens > 0 else sp_tokens * 0.05
            soda_dollars = soda_income_tokens * 0.05 if soda_income_tokens > 0 else soda_tokens * 0.05
            
            total_check = cb_dollars + sp_dollars + soda_dollars + cam4_income_dollars + transfers_dollars
            
            print(f"DEBUG CALC: model_id={model_id}, cb_dollars={cb_dollars}, sp_dollars={sp_dollars}, soda_dollars={soda_dollars}, cam4={cam4_income_dollars}, transfers={transfers_dollars}, total_check={total_check}")
            
            model_assignment = next((a for a in assignments if a['model_id'] == model_id), None)
            operator_percentage = float(model_assignment.get('operator_percentage', 20)) if model_assignment else 20
            model_email = model_assignment['model_email'] if model_assignment else None
            if not model_email:
                model_email = next((u['email'] for u in users if u['user_id'] == model_id), None)
            
            # Check if this model is a solo_maker
            model_user = next((u for u in users if u['user_id'] == model_id), None)
            if model_user and model_user.get('role') == 'solo_maker':
                # For solo makers, use their percentage from profile
                solo_percentage = int(model_user.get('solo_percentage', '50'))
                model_salary = total_check * (solo_percentage / 100)
                print(f"DEBUG: Solo maker {model_email} gets {solo_percentage}% = ${model_salary}")
            else:
                # For regular content makers, use 30%
                model_salary = total_check * 0.3
            
            operator_email = None
            producer_operator_email = None
            assigned_operator_email = None
            operator_user = None
            
            if operator_name:
                print(f"DEBUG: operator_name '{operator_name}' found in finance row for model_id={model_id}")
                operator_user = next((u for u in users if u['full_name'] == operator_name), None)
                if operator_user:
                    assigned_operator_email = operator_user['email']
                    print(f"DEBUG: Found operator user {assigned_operator_email} with role {operator_user['role']}")
                    
                    if operator_user['role'] == 'operator':
                        operator_email = assigned_operator_email
                    elif operator_user['role'] == 'producer':
                        producer_operator_email = assigned_operator_email
                    else:
                        print(f"DEBUG: operator {assigned_operator_email} has wrong role {operator_user['role']}")
                else:
                    print(f"DEBUG: operator_name '{operator_name}' not found in users")
            else:
                print(f"DEBUG: No operator_name for model_id={model_id}, no operator salary will be calculated")
            
            print(f"DEBUG: model_id={model_id}, assigned_operator={assigned_operator_email}, operator_email={operator_email}, producer_operator_email={producer_operator_email}, model_email={model_email}")
            
            if producer_operator_email:
                operator_salary = total_check * (operator_percentage / 100)
                producer_percentage = 30 - operator_percentage
                producer_salary = total_check * (producer_percentage / 100)
                combined_salary = operator_salary + producer_salary
                if producer_operator_email not in producer_salaries:
                    producer_salaries[producer_operator_email] = {
                        'email': producer_operator_email,
                        'total': 0,
                        'details': []
                    }
                producer_salaries[producer_operator_email]['total'] += combined_salary
                producer_salaries[producer_operator_email]['details'].append({
                    'date': finance['date'].isoformat(),
                    'model_id': model_id,
                    'model_email': model_email,
                    'amount': combined_salary,
                    'check': total_check,
                    'note': f'operator_{operator_percentage}%_+_producer_{producer_percentage}%'
                })
            elif operator_email:
                operator_salary = total_check * (operator_percentage / 100)
                if operator_email not in operator_salaries:
                    operator_salaries[operator_email] = {
                        'email': operator_email,
                        'total': 0,
                        'details': []
                    }
                operator_salaries[operator_email]['total'] += operator_salary
                operator_salaries[operator_email]['details'].append({
                    'date': finance['date'].isoformat(),
                    'model_id': model_id,
                    'amount': operator_salary,
                    'check': total_check
                })
            else:
                print(f"DEBUG: No operator assigned for model_id={model_id}, producer gets 10%")
            
            if model_email:
                if model_email not in model_salaries:
                    model_salaries[model_email] = {
                        'email': model_email,
                        'total': 0,
                        'details': []
                    }
                model_salaries[model_email]['total'] += model_salary
                model_salaries[model_email]['details'].append({
                    'date': finance['date'].isoformat(),
                    'amount': model_salary,
                    'check': total_check
                })
                
                if total_check > 0:
                    producer_assignment = next((pa for pa in producer_assignments if pa['model_email'] == model_email), None)
                    print(f"DEBUG: Looking for producer with model_email={model_email}, found={producer_assignment is not None}")
                    if producer_assignment:
                        producer_email = producer_assignment['producer_email']
                        
                        if operator_email or producer_operator_email:
                            producer_percentage = 30 - operator_percentage
                        else:
                            producer_percentage = 10
                            print(f"DEBUG: No operator for model_id={model_id}, producer gets 10%")
                        
                        producer_salary_amount = total_check * (producer_percentage / 100)
                        
                        if producer_email not in producer_salaries:
                            producer_salaries[producer_email] = {
                                'email': producer_email,
                                'total': 0,
                                'details': []
                            }
                        
                        if producer_email == producer_operator_email:
                            print(f"DEBUG: Producer {producer_email} already paid as operator, adding to details with 0 amount")
                            producer_salaries[producer_email]['details'].append({
                                'date': finance['date'].isoformat(),
                                'model_id': model_id,
                                'model_email': model_email,
                                'amount': 0,
                                'check': total_check,
                                'note': 'already_paid_as_operator'
                            })
                        else:
                            print(f"DEBUG: Adding salary for producer {producer_email}, amount={producer_salary_amount}, percentage={producer_percentage}%")
                            producer_salaries[producer_email]['total'] += producer_salary_amount
                            producer_salaries[producer_email]['details'].append({
                                'date': finance['date'].isoformat(),
                                'model_id': model_id,
                                'model_email': model_email,
                                'amount': producer_salary_amount,
                                'check': total_check
                            })
        
        result = {
            'operators': operator_salaries,
            'models': model_salaries,
            'producers': producer_salaries
        }
        
        print(f"DEBUG FINAL: operators={len(operator_salaries)}, models={len(model_salaries)}, producers={len(producer_salaries)}")
        print(f"DEBUG FINAL: producer_emails={list(producer_salaries.keys())}")
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'isBase64Encoded': False,
            'body': json.dumps(result, default=str)
        }
        
    except Exception as e:
        import traceback
        error_details = {
            'error': str(e),
            'traceback': traceback.format_exc()
        }
        print(f"ERROR: {error_details}")
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps(error_details)
        }
    finally:
        cur.close()
        conn.close()