import re, pathlib

#  incidents.py 
p = pathlib.Path('/app/app/api/v1/incidents.py')
src = p.read_text()
old = '    incidents = await list_incidents(db, status=status, district=district, page=page, limit=limit)'
new = '''    if current_user.role.value == "GOVERNMENT" and getattr(current_user, "district", None) and not district:
        district = current_user.district
    incidents = await list_incidents(db, status=status, district=district, page=page, limit=limit)'''
p.write_text(src.replace(old, new))
print('incidents.py patched:', old in src)

#  ambulances.py 
p = pathlib.Path('/app/app/api/v1/ambulances.py')
src = p.read_text()
old = '    ambulances = await list_ambulances(db, status=status, district=district)'
new = '''    if current_user.role.value == "GOVERNMENT" and getattr(current_user, "district", None) and not district:
        district = current_user.district
    ambulances = await list_ambulances(db, status=status, district=district)'''
p.write_text(src.replace(old, new))
print('ambulances.py patched:', old in src)

#  blackspots.py 
p = pathlib.Path('/app/app/api/v1/blackspots.py')
src = p.read_text()
old = '    spots = await list_blackspots(db, district=district)'
new = '''    if current_user.role.value == "GOVERNMENT" and getattr(current_user, "district", None) and not district:
        district = current_user.district
    spots = await list_blackspots(db, district=district)'''
p.write_text(src.replace(old, new))
print('blackspots.py patched:', old in src)
