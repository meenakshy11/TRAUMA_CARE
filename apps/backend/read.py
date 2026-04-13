import pathlib

INCIDENTS = pathlib.Path('/app/app/api/v1/incidents.py')
src = INCIDENTS.read_text()
print(repr(src[src.find("async def list_all"):src.find("async def list_all")+300]))
