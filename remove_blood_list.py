import pathlib, re

p = pathlib.Path('apps/web/src/pages/Hospitals/HospitalListPage.tsx')
src = p.read_text(encoding='utf-8')

# Remove blood search UI block
src = re.sub(
    r'<div style=\{\{ marginBottom: 16.*?</div>\s*\n\s*<table className="data-table">',
    '<table className="data-table">',
    src,
    flags=re.DOTALL
)

# Remove blood group state and functions
src = re.sub(
    r'const BLOOD_GROUPS.*?searchByBloodGroup\s*\}',
    '',
    src,
    flags=re.DOTALL
)

# Remove bloodStockApi import
src = src.replace(
    'import { hospitalsApi, bloodStockApi } from "../../api/index"',
    'import { hospitalsApi } from "../../api/index"'
)

# Remove React import change
src = src.replace(
    'import React, { useEffect, useState } from "react"',
    'import { useEffect, useState } from "react"'
)

p.write_text(src, encoding='utf-8')
print('Removed from HospitalListPage')
print('has blood search:', 'bloodGroup' in src)
