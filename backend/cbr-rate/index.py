import json
import urllib.request
import xml.etree.ElementTree as ET
from typing import Dict, Any


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Get current USD/RUB exchange rate from Central Bank of Russia
    Args: event - dict with httpMethod
          context - object with request_id
    Returns: HTTP response with exchange rate
    '''
    method: str = event.get('httpMethod', 'GET')
    
    headers = event.get('headers', {})
    origin = headers.get('origin') or headers.get('Origin') or 'https://preview--model-agency-website-auth.poehali.dev'
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': origin,
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
                'Access-Control-Allow-Credentials': 'true',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    if method != 'GET':
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': origin,
                'Access-Control-Allow-Credentials': 'true'
            },
            'isBase64Encoded': False,
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    try:
        url = 'http://www.cbr.ru/scripts/XML_daily.asp'
        
        with urllib.request.urlopen(url, timeout=10) as response:
            xml_data = response.read().decode('windows-1251')
        
        root = ET.fromstring(xml_data)
        
        usd_valute = root.find(".//Valute[CharCode='USD']")
        
        if usd_valute is None:
            return {
                'statusCode': 404,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': origin,
                'Access-Control-Allow-Credentials': 'true'
                },
                'isBase64Encoded': False,
                'body': json.dumps({'error': 'USD rate not found'})
            }
        
        value_element = usd_valute.find('Value')
        nominal_element = usd_valute.find('Nominal')
        
        if value_element is None or value_element.text is None:
            return {
                'statusCode': 500,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': origin,
                'Access-Control-Allow-Credentials': 'true'
                },
                'isBase64Encoded': False,
                'body': json.dumps({'error': 'Invalid XML structure'})
            }
        
        rate_str = value_element.text.replace(',', '.')
        rate = float(rate_str)
        
        nominal = 1
        if nominal_element is not None and nominal_element.text:
            nominal = int(nominal_element.text)
        
        if nominal > 1:
            rate = rate / nominal
        
        rounded_rate = round(rate, 2)
        print(f'CBR rate fetched: {rounded_rate} (raw: {rate})')
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': origin,
                'Access-Control-Allow-Credentials': 'true',
                'Cache-Control': 'public, max-age=3600'
            },
            'isBase64Encoded': False,
            'body': json.dumps({
                'rate': rounded_rate,
                'source': 'CBR',
                'currency': 'USD'
            })
        }
        
    except urllib.error.URLError:
        return {
            'statusCode': 503,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': origin,
                'Access-Control-Allow-Credentials': 'true'
            },
            'isBase64Encoded': False,
            'body': json.dumps({'error': 'CBR service unavailable'})
        }
    except (ET.ParseError, ValueError) as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': origin,
                'Access-Control-Allow-Credentials': 'true'
            },
            'isBase64Encoded': False,
            'body': json.dumps({'error': f'Parse error: {str(e)}'})
        }