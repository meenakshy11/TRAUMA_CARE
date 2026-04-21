import pathlib

p = pathlib.Path('apps/backend/app/api/v1/router.py')
src = p.read_text(encoding='utf-8')

src = src.replace(
    'from app.api.v1 import auth, incidents, ambulances, hospitals, patients, dispatch, blackspots, analytics, simulation, notifications, users, public',
    'from app.api.v1 import auth, incidents, ambulances, hospitals, patients, dispatch, blackspots, analytics, simulation, notifications, users, public, blood_stock'
)
src = src.replace(
    'api_router.include_router(public.router)',
    'api_router.include_router(public.router)\napi_router.include_router(blood_stock.router)'
)

p.write_text(src, encoding='utf-8')
print('router.py updated:', 'blood_stock' in src)
