import json
import os
import glob

files = glob.glob('data/company_info/*.json')
stocks = []

for f in files:
    if '_summary' in f: continue
    
    with open(f, 'r') as file:
        try:
            data = json.load(file)
            info = data.get('info', {})
            identity = info.get('identity', {})
            price_info = info.get('price', {})
            
            symbol = identity.get('symbol', '')
            if not symbol: continue
            
            name = identity.get('shortName') or identity.get('longName') or symbol
            sector = identity.get('sector', 'Unknown')
            industry = identity.get('industry', 'Unknown')
            
            price = price_info.get('currentPrice', 0)
            prev = price_info.get('previousClose', 0)
            
            change = 0
            if price and prev:
                change = round(((price - prev) / prev) * 100, 2)
            
            region = 'Unknown'
            if symbol.endswith('.JK'): region = 'ID'
            elif symbol.endswith('.T'): region = 'JP'
            elif symbol.endswith('.L'): region = 'GB'
            else: region = 'US'
            
            stocks.append({
                'ticker': symbol,
                'name': name,
                'price': price,
                'change': change,
                'region': region,
                'sector': sector,
                'industry': industry
            })
        except Exception as e:
            print(f"Error reading {f}: {e}")

# Sort by region then ticker
stocks.sort(key=lambda x: (x['region'], x['ticker']))

print("export const stockScreenerData = [")
for s in stocks:
    print(f"  {{ ticker: '{s['ticker']}', name: \"{s['name'].replace('\"', '')}\", price: {s['price']}, change: {s['change']}, region: '{s['region']}', sector: '{s['sector']}', industry: '{s['industry']}' }},")
print("]")
