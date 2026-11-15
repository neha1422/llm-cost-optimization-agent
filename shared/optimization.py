"""Policy retrieval and output validation. No evaluation answers are used here."""
from __future__ import annotations
import json
import re
from shared.kb import article_ids, load_article

ACTIONS = {'REFUND', 'REPLACE', 'SEND_ARTICLE', 'ESCALATE_TIER2'}

def compact(value: dict) -> str:
    return json.dumps(value, separators=(',', ':'), ensure_ascii=False)

def retrieve(order: dict, thread: str) -> list[str]:
    """Fact-aware lexical search; include the general returns fallback.

    Candidate selection never selects the final action. All policy exceptions
    applicable to this order are retained for the composer.
    """
    terms = set(re.findall(r'[a-z]+', thread.lower()))
    kind = str(order.get('product_type', ''))
    if kind == 'subscription':
        terms.update(['subscription', 'annual', 'cancelled'])
    if kind == 'digital' or order.get('license_revealed'):
        terms.update(['digital', 'license'])
    if order.get('customized'):
        terms.update(['custom', 'personalized'])
    if order.get('damage_reported'):
        terms.update(['damaged', 'replacement'])
    if kind == 'physical':
        terms.update(['physical', 'delivery'])
    ranked = []
    for aid in article_ids():
        words = set(re.findall(r'[a-z]+', aid + ' ' + load_article(aid).lower()))
        score = len(terms & words)
        if score:
            ranked.append((score, aid))
    candidates = [aid for _, aid in sorted(ranked, key=lambda x: (-x[0], x[1]))]
    # The base policy defines the manual-review fallback for unsupported cases.
    if 'returns-within-30-days' not in candidates:
        candidates.append('returns-within-30-days')
    return candidates

def policy_blob(ids: list[str]) -> str:
    return '\n'.join(load_article(aid).strip() for aid in ids)

def validate(action: str, article: str, candidates: list[str] | None = None) -> None:
    if action not in ACTIONS:
        raise ValueError('Unsupported action in model response')
    if article not in article_ids() or (candidates is not None and article not in candidates):
        raise ValueError('Model cited a policy outside retrieved evidence')
