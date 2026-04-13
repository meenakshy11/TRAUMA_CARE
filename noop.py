import pathlib, re

def inject_after_imports(filepath, import_line, usage_old, usage_new):
    p = pathlib.Path(filepath)
    if not p.exists():
        print(f"NOT FOUND: {filepath}")
        return
    src = p.read_text()
    if import_line not in src:
        src = src.replace('import {', import_line + '\nimport {', 1)
    if usage_old in src:
        src = src.replace(usage_old, usage_new)
        p.write_text(src)
        print(f"PATCHED: {filepath}")
    else:
        print(f"PATTERN NOT FOUND in {filepath}")
        print("Looking for:", repr(usage_old[:80]))

# Incidents page - filter by district
inject_after_imports(
    "/app/app/frontend_placeholder.txt",
    "", "", ""
)
print("Done")
