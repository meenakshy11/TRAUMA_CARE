import pathlib

p = pathlib.Path('apps/web/src/pages/Hospitals/HospitalListPage.tsx')
src = p.read_text(encoding='utf-8')

# Fix import - add React back
src = src.replace(
    'import { useEffect, useState } from "react"',
    'import React, { useEffect, useState } from "react"'
)

p.write_text(src, encoding='utf-8')
print('Fixed')
