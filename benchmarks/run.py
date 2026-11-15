"""Run from repository root: python -m benchmarks.run. Fresh sessions = cold costs."""
from __future__ import annotations
import json
from pathlib import Path
from datetime import datetime, timezone
from dataclasses import asdict
from benchmarks.baseline_q1 import SupportCopilot as BaselineQ1
from benchmarks.baseline_q2 import SupportPipeline as BaselineQ2
from question1.agent import SupportCopilot
from question2.agent import SupportPipeline
from eval.reference import TICKET_EXPECTATIONS

ROOT = Path(__file__).resolve().parents[1]

def call_metrics(call):
    return dict(label=call.label, input_tokens=call.input_tokens, cached_input_tokens=call.cached_prefix_tokens,
                uncached_input_tokens=call.input_tokens-call.cached_prefix_tokens, output_tokens=call.output_tokens, points=call.points())

def measure(cls, ticket_id):
    agent = cls()
    resolution = agent.handle_ticket(ticket_id)
    expected = TICKET_EXPECTATIONS[ticket_id]
    return dict(action=resolution.action, kb_article=resolution.kb_article,
        correct=(resolution.action, resolution.kb_article)==(expected.action, expected.kb_article),
        points=agent.session.total_points(), calls=[call_metrics(c) for c in agent.session.calls],
        stages=getattr(agent, 'stages', []))

def run_suite(include_baseline=True):
    rows=[]
    for mode, base, optimized, target in [('q1',BaselineQ1,SupportCopilot,3000),('q2',BaselineQ2,SupportPipeline,2500)]:
        for tid in TICKET_EXPECTATIONS:
            row=dict(mode=mode,ticket_id=tid,target=target,optimized=measure(optimized,tid))
            if include_baseline:
                row['baseline']=measure(base,tid)
                row['savings_percent']=round((1-row['optimized']['points']/row['baseline']['points'])*100,2)
            row['target_met']=row['optimized']['points']<=target
            rows.append(row)
    return dict(generated_at=datetime.now(timezone.utc).isoformat(),engine='Provided local LLM simulator',
        cost_method='Fresh session per ticket; no claimed cache discount',rows=rows)

if __name__=='__main__':
    result=run_suite()
    path=ROOT/'benchmarks/results.json'
    path.write_text(json.dumps(result,indent=2)+'\n')
    for row in result['rows']:
        print(row['mode'],row['ticket_id'],row['baseline']['points'],'→',row['optimized']['points'],row['savings_percent'],row['optimized']['correct'])
