from __future__ import annotations
import asyncio
import json
import logging
import os
import time
import uuid
from dataclasses import asdict
from pathlib import Path
from typing import Literal
from fastapi import FastAPI, HTTPException, Request, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from starlette.concurrency import run_in_threadpool
from shared.tools import get_ticket, get_order
from shared.kb import article_ids, load_article
from question1.agent import SupportCopilot
from question2.agent import SupportPipeline
from benchmarks.run import measure, call_metrics

ROOT=Path(__file__).resolve().parents[1]
TICKETS=sorted(p.stem for p in (ROOT/'data/tickets').glob('*.json'))
app=FastAPI(title='ShopAssist AI',version='1.0.0',description='Real Python agents using the assignment local LLM simulator. No external model calls.')
app.add_middleware(CORSMiddleware,allow_origins=os.getenv('CORS_ORIGINS','http://localhost:3000').split(','),allow_methods=['GET','POST'],allow_headers=['Content-Type'])
logger=logging.getLogger('shopassist')
logging.basicConfig(level=logging.INFO)
slots=asyncio.Semaphore(4)

class RunRequest(BaseModel):
    ticket_id: str = Field(pattern=r'^T-[0-9]{4}$',max_length=6)
    model_config={'extra':'forbid'}

class RunResponse(BaseModel):
    ticket_id: str
    mode: Literal['q1','q2']
    action: str
    kb_article: str
    customer_reply: str
    points: int
    calls: list[dict]
    stages: list[dict]
    duration_ms: float
    engine: str

@app.middleware('http')
async def limits(request: Request,call_next):
    request_id=uuid.uuid4().hex
    if int(request.headers.get('content-length','0'))>4096:
        from fastapi.responses import JSONResponse
        return JSONResponse({'detail':'Request body too large'},status_code=413)
    try:
        async with slots:
            response=await asyncio.wait_for(call_next(request),timeout=30)
        response.headers['X-Request-ID']=request_id
        response.headers['X-Content-Type-Options']='nosniff'
        logger.info(json.dumps({'request_id':request_id,'method':request.method,'path':request.url.path,'status':response.status_code}))
        return response
    except asyncio.TimeoutError:
        from fastapi.responses import JSONResponse
        return JSONResponse({'detail':'Request timed out'},status_code=504)
    except Exception:
        logger.exception('request failed: %s',request_id)
        from fastapi.responses import JSONResponse
        return JSONResponse({'detail':'Unable to process request','request_id':request_id},status_code=500)

def known_ticket(tid):
    if tid not in TICKETS: raise HTTPException(404,'Unknown sample ticket')
    return get_ticket(tid)

@app.get('/health')
def health(): return {'status':'ok','engine':'provided-local-simulator','version':'1.0.0'}

@app.get('/tickets')
def tickets():
    return [{'ticket_id':tid,'title':get_order(get_ticket(tid)['order_id'])['title']} for tid in TICKETS]

@app.get('/tickets/{ticket_id}')
def ticket(ticket_id: str):
    t=known_ticket(ticket_id)
    return {'ticket':t,'order':get_order(t['order_id'])}

def execute(mode,tid):
    known_ticket(tid)
    start=time.perf_counter()
    agent=(SupportCopilot if mode=='q1' else SupportPipeline)()
    got=agent.handle_ticket(tid)
    return RunResponse(ticket_id=tid,mode=mode,action=got.action,kb_article=got.kb_article,
        customer_reply=got.customer_reply,points=agent.session.total_points(),
        calls=[call_metrics(c) for c in agent.session.calls],stages=getattr(agent,'stages',[]),
        duration_ms=round((time.perf_counter()-start)*1000,3),engine='Provided local LLM simulator')

@app.post('/agent/q1/run',response_model=RunResponse)
def q1(body:RunRequest): return execute('q1',body.ticket_id)

@app.post('/agent/q2/run',response_model=RunResponse)
def q2(body:RunRequest): return execute('q2',body.ticket_id)

@app.get('/benchmarks/results')
def results():
    path=ROOT/'benchmarks/results.json'
    if not path.exists(): raise HTTPException(503,'Generate benchmarks first: python -m benchmarks.run')
    return json.loads(path.read_text())

@app.post('/benchmarks/run')
def benchmark():
    """Reexecute optimized agents; immutable baseline is the recorded measured run.

    This avoids running the deliberately quadratic baseline KB builder on public
    requests. Local CLI regenerates both baseline and optimized measurements.
    """
    report=results()
    from datetime import datetime, timezone
    for row in report['rows']:
        row['optimized']=measure(SupportCopilot if row['mode']=='q1' else SupportPipeline,row['ticket_id'])
        row['target_met']=row['optimized']['points']<=row['target']
        row['savings_percent']=round((1-row['optimized']['points']/row['baseline']['points'])*100,2)
    report['baseline_generated_at']=report['generated_at']
    report['generated_at']=datetime.now(timezone.utc).isoformat()
    report['execution']='Optimized agents rerun now; baseline from recorded reproducible CLI run'
    return report

@app.get('/kb/articles')
def articles(q:str=Query(default='',max_length=200)):
    return [{'id':aid,'content':load_article(aid)} for aid in article_ids() if q.lower() in (aid+' '+load_article(aid)).lower()]

@app.get('/kb/articles/{article_id}')
def article(article_id:str):
    if article_id not in article_ids(): raise HTTPException(404,'Unknown policy')
    return {'id':article_id,'content':load_article(article_id)}

# Additive read-only execution traces; existing endpoints remain unchanged.
from backend.explain import router as explain_router
app.include_router(explain_router)
