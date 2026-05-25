# updated
import json
import time
import urllib.request
import xml.etree.ElementTree as ET
from typing import Dict, Any, Optional, Tuple

CACHE_TTL_SECONDS = 3600
_rate_cache: Dict[str, Tuple[float, float]] = {}


def _get_cached_rate() -> Optional[float]:
    entry = _rate_cache.get('usd')
    if entry is None:
        return None
    cached_at, value = entry
    if time.time() - cached_at > CACHE_TTL_SECONDS:
        return None
    return value


def _set_cached_rate(value: float) -> None:
    _rate_cache['usd'] = (time.time(), value)


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Get current USD/RUB exchange rate from Central Bank of Russia (cached for 1 hour)
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
    
    cached = _get_cached_rate()
    if cached is not None:
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': origin,
                'Access-Control-Allow-Credentials': 'true',
                'Cache-Control': 'public, max-age=3600',
                'X-Cache': 'HIT'
            },
            'isBase64Encoded': False,
            'body': json.dumps({
                'rate': cached,
                'source': 'CBR',
                'currency': 'USD',
                'cached': True
            })
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
        _set_cached_rate(rounded_rate)
        print(f'CBR rate fetched: {rounded_rate} (raw: {rate})')
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': origin,
                'Access-Control-Allow-Credentials': 'true',
                'Cache-Control': 'public, max-age=3600',
                'X-Cache': 'MISS'
            },
            'isBase64Encoded': False,
            'body': json.dumps({
                'rate': rounded_rate,
                'source': 'CBR',
                'currency': 'USD',
                'cached': False
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