"""Extract the original v5 numbered formulas and tables without OCR.

Usage: python3 scripts/deepseek-v2-source-inventory.py /path/to/2405.04434v5.html
The source HTML is the arXiv HTML page, not a generated paraphrase.
"""
from html.parser import HTMLParser
from pathlib import Path
import hashlib
import json
import re
import sys

class Node:
    def __init__(self, tag='', attrs=()):
        self.tag, self.attrs, self.children = tag, dict(attrs), []

    def walk(self, tag=None):
        for child in self.children:
            if isinstance(child, Node):
                if tag is None or child.tag == tag:
                    yield child
                yield from child.walk(tag)

    def text(self):
        if self.tag == 'math':
            return self.attrs.get('alttext', '')
        return ' '.join(''.join(c.text() if isinstance(c, Node) else c for c in self.children).split())

class Parser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.root = Node()
        self.stack = [self.root]

    def handle_starttag(self, tag, attrs):
        node = Node(tag, attrs)
        self.stack[-1].children.append(node)
        if tag not in {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'}:
            self.stack.append(node)

    def handle_startendtag(self, tag, attrs):
        self.stack[-1].children.append(Node(tag, attrs))

    def handle_endtag(self, tag):
        for i in range(len(self.stack)-1, 0, -1):
            if self.stack[i].tag == tag:
                self.stack = self.stack[:i]
                return

    def handle_data(self, data):
        self.stack[-1].children.append(data)

raw = Path(sys.argv[1]).read_bytes()
p = Parser()
p.feed(raw.decode())
formulas, tables, figures = [], [], []
for n in p.root.walk():
    anchor = n.attrs.get('id', '')
    match = re.fullmatch(r'(S\d+|A\d+)\.E(\d+)', anchor)
    if match:
        formulas.append({'number': int(match[2]), 'anchor': anchor,
                         'latex': ''.join(m.attrs.get('alttext', '') for m in n.walk('math'))})
    if n.tag == 'figure' and 'ltx_table' in n.attrs.get('class', ''):
        rows = []
        for tr in n.walk('tr'):
            row = []
            for td in tr.children:
                if isinstance(td, Node) and td.tag in {'td', 'th'}:
                    row.append({'text': td.text(), 'colSpan': int(td.attrs.get('colspan', 1)),
                                'rowSpan': int(td.attrs.get('rowspan', 1)), 'header': td.tag == 'th'})
            if row:
                rows.append(row)
        tables.append({'number': int(re.search(r'T(\d+)$', anchor)[1]), 'anchor': anchor,
                       'caption': next((c.text() for c in n.walk('figcaption')), ''), 'rows': rows})
    elif n.tag == 'figure' and 'ltx_figure' in n.attrs.get('class', ''):
        figures.append({'anchor': anchor, 'caption': next((c.text() for c in n.walk('figcaption')), ''),
                        'images': [m.attrs.get('src', '') for m in n.walk('img')]})

assert len(formulas) == 47, f'Expected 47 formulas, got {len(formulas)}'
assert len(tables) == 37, f'Expected 37 tables, got {len(tables)}'
result = {'source': 'https://arxiv.org/html/2405.04434v5', 'sha256': hashlib.sha256(raw).hexdigest(),
          'formulas': sorted(formulas, key=lambda f: f['number']),
          'tables': sorted(tables, key=lambda t: t['number']), 'figures': figures}
destination = Path('src/data/papers/deepseek-v2/source-inventory.json')
destination.write_text(json.dumps(result, ensure_ascii=False, indent=2)+'\n')
print(f'{len(formulas)} original equations, {len(tables)} original tables, {len(figures)} figures → {destination}')
