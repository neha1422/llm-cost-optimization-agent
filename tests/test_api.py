from fastapi.testclient import TestClient
from backend.app import app
client=TestClient(app)

def test_health_and_catalog():
    assert client.get('/health').json()['status']=='ok'
    assert len(client.get('/tickets').json())==5
    assert len(client.get('/kb/articles').json())==5
    assert len(client.get('/kb/articles?q=digital').json())==1

def test_ticket_and_policy():
    assert client.get('/tickets/T-1001').json()['order']['title']=='Wireless headphones'
    assert client.get('/tickets/T-9999').status_code==404
    assert client.get('/kb/articles/missing').status_code==404

def test_execution_and_validation():
    for mode in ['q1','q2']:
        got=client.post('/agent/'+mode+'/run',json={'ticket_id':'T-1001'})
        assert got.status_code==200
        assert got.json()['action']=='REFUND'
        assert got.json()['points']<=2500
        assert len(got.json()['calls'])==1
    assert client.post('/agent/q1/run',json={'ticket_id':'../README'}).status_code==422
    assert client.post('/agent/q1/run',json={'ticket_id':'T-9999'}).status_code==404
    assert client.post('/agent/q1/run',json={'ticket_id':'T-1001','extra':1}).status_code==422

def test_benchmarks_are_executed():
    stored=client.get('/benchmarks/results').json()
    live=client.post('/benchmarks/run').json()
    assert len(live['rows'])==10
    assert live['generated_at']!=stored['generated_at']
    assert all(r['target_met'] and r['optimized']['correct'] for r in live['rows'])
    assert [r['optimized']['points'] for r in live['rows']]==[r['optimized']['points'] for r in stored['rows']]
