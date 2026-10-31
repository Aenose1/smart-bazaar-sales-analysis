import io

def test_forecast_with_history(client):
    lines = ['Product,Price,Quantity,Date']
    for i in range(24):
        year = 2023 + i // 12
        month = i % 12 + 1
        lines.append(f'Tea,100,{10+i},{year}-{month:02d}-01')
    payload = ('\n'.join(lines)).encode()
    response = client.post('/api/analyze', data={'file': (io.BytesIO(payload), 'sales.csv')}, content_type='multipart/form-data')
    dataset_id = response.get_json()['dataset_id']
    result = client.post('/api/forecast', json={'dataset_id': dataset_id, 'horizon_years': 5})
    assert result.status_code == 200
    body = result.get_json()
    assert body['available'] is True
    assert len(body['forecast']) == 60

def test_invalid_horizon(client):
    response = client.post('/api/forecast', json={'horizon_years': 6})
    assert response.status_code == 400
