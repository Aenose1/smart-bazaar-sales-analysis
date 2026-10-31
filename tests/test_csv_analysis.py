def upload(client, payload, filename='sales.csv'):
    return client.post('/api/analyze', data={'file': ( __import__('io').BytesIO(payload), filename)}, content_type='multipart/form-data')

def test_analysis_calculates_revenue_from_price_quantity(client):
    response = upload(client, b'Product,Price,Quantity\nRice,50,2\nTea,100,3\n')
    assert response.status_code == 200
    data = response.get_json()
    assert data['metrics']['total_revenue_inr'] == 400
    assert data['metrics']['total_units_sold'] == 5
    assert data['metadata']['revenue_source'] == 'unit_price_times_quantity'

def test_existing_revenue_is_not_multiplied_again(client):
    response = upload(client, b'Product,Price,Quantity,Sales\nRice,50,2,90\n')
    assert response.status_code == 200
    data = response.get_json()
    assert data['metrics']['total_revenue_inr'] == 90

def test_empty_csv_rejected(client):
    response = upload(client, b'')
    assert response.status_code == 400

def test_wrong_file_extension_rejected(client):
    response = upload(client, b'a,b\n1,2', 'sales.xlsx')
    assert response.status_code == 400
