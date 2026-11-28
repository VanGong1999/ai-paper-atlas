"""Read the complete supplied PDF and record primary-source locations; needs pdfplumber."""
import hashlib
import json
import re
from pathlib import Path
import pdfplumber

root = Path(__file__).resolve().parents[1]
path = root / 'public/article/pagedattention/2309.06180v1.pdf'
with pdfplumber.open(path) as pdf:
    pages = [page.extract_text(x_tolerance=1.5) or '' for page in pdf.pages]
figures = {}
tables = {}
for number, text in enumerate(pages, 1):
    for figure in re.findall(r'Figure\s+(\d+)\.', text):
        figures.setdefault(int(figure), number)
    for table in re.findall(r'^Table\s+(\d+)\.', text, re.M):
        tables[int(table)] = number
expected = {1:1,2:2,3:4,4:5,5:5,6:6,7:6,8:7,9:7,10:8,11:9,12:10,13:10,14:11,15:11,16:12,17:12,18:12,19:13}
assert len(pages) == 16, len(pages)
assert figures == expected, figures
assert tables == {1:9}, tables
assert all(f'({n})' in pages[2] for n in [1,2,3]), 'Missing equations 1-3 on page3'
assert '(4)' in pages[4], 'Missing equation4 on page5'
reference_ids = sorted({int(n) for text in pages[13:] for n in re.findall(r'\[(\d+)\]',text)})
assert reference_ids == list(range(1,65)), reference_ids
result = {
    'source': str(path.relative_to(root)), 'sha256': hashlib.sha256(path.read_bytes()).hexdigest(),
    'version':'arXiv:2309.06180v1 (12 Sep 2023)', 'pages':len(pages),
    'figures':[{'number':n,'page':p} for n,p in sorted(figures.items())],
    'tables':[{'number':n,'page':p} for n,p in tables.items()],
    'equations':[{'number':n,'page':3 if n<4 else 5} for n in range(1,5)],
    'references':reference_ids,
    'review_scope':'Entire PDF text read; all 16 page images inspected in contact sheet, equation/figure/table/evaluation pages additionally inspected at full resolution. This inventory proves source locations, not full pedagogical or experiment reproduction coverage.',
}
output = root / 'output/pagedattention-source-inventory.json'
output.parent.mkdir(exist_ok=True)
output.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(result,ensure_ascii=False,indent=2))
