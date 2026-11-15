"""Regression gates for additive, read-only execution instrumentation."""
import gzip
import hashlib
import json
from pathlib import Path
import pytest
from fastapi.testclient import TestClient
from backend.app import app
from backend.explain import baseline_context, instrument
from eval.reference import TICKET_EXPECTATIONS

client=TestClient(app)

@pytest.mark.parametrize('configuration',['q1','q2','baseline_q1','baseline_q2'])
@pytest.mark.parametrize('ticket_id',list(TICKET_EXPECTATIONS))
def test_real_configurations_match_reference(configuration,ticket_id):
    result=instrument(configuration,ticket_id)
    expected=TICKET_EXPECTATIONS[ticket_id]
    assert (result['action'],result['kb_article'])==(expected.action,expected.kb_article)
    assert result['correct']
    assert result['model_calls']==(4 if configuration=='baseline_q2' else 1)
    assert result['points']==sum(c['points'] for c in result['calls'])
    assert result['input_tokens']==sum(c['input_tokens'] for c in result['calls'])
    assert all(c['prompt'].startswith('SYSTEM:') and 'ORDER_SNAPSHOT:' in c['prompt'] for c in result['calls'])
    if configuration in ['q1','q2']:
        report=json.loads(Path('benchmarks/results.json').read_text())
        recorded=next(r for r in report['rows'] if r['mode']==configuration and r['ticket_id']==ticket_id)
        assert result['points']==recorded['optimized']['points']


def test_q2_trace_contains_real_input_output():
    result=instrument('q2','T-1004')
    assert [s['name'] for s in result['stages']]==['triage','retrieve','compose','audit']
    assert all('input' in s and 'output' in s for s in result['stages'])
    assert result['stages'][0]['input']['order']['damage_reported'] is True
    assert result['stages'][2]['input']['prompt']==result['calls'][0]['prompt']
    assert sum(s['model_calls'] for s in result['stages'])==1


def test_baseline_resource_integrity():
    manifest=json.loads(Path('backend/resources/baseline-manifest.json').read_text())
    assert hashlib.sha256(baseline_context().encode()).hexdigest()==manifest['sha256']
    assert len(baseline_context())==manifest['characters']


def test_experiment_api_validates_and_executes():
    result=client.post('/explain/experiments',json={'ticket_id':'T-1004','configurations':['baseline_q2','q1','q2']})
    assert result.status_code==200
    assert len(result.json()['executions'])==3
    assert all(e['correct'] for e in result.json()['executions'])
    assert client.post('/explain/experiments',json={'ticket_id':'T-1004','configurations':['fake_toggle']}).status_code==422
    assert client.post('/explain/experiments',json={'ticket_id':'T-9999','configurations':['q1']}).status_code==404
    assert client.post('/explain/experiments',json={'ticket_id':'T-1004','configurations':[]}).status_code==422


def test_transparency_is_honest():
    result=client.get('/explain/transparency').json()
    assert result['external_api_calls'] is False
    assert result['configured_model']=='gpt-4.1-mini'
