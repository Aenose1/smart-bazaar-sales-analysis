import io

def test_product_export(client):
    payload = b'Product,Price,Quantity\nRice,50,2\nTea,100,3\n'
    response = client.post('/api/analyze', data={'file': (io.BytesIO(payload), 'sales.csv')}, content_type='multipart/form-data')
    dataset_id = response.get_json()['dataset_id']
    exported = client.post('/api/export', json={'dataset_id': dataset_id, 'type': 'products'})
    assert exported.status_code == 200
    assert b'product_name' in exported.data
