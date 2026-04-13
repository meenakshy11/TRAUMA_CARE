import pathlib, re

def clean_and_patch(filepath, old_call, new_block):
    p = pathlib.Path(filepath)
    src = p.read_text()
    # Remove all previously injected GOVERNMENT lines
    src = re.sub(r'[ \t]*#\s*Auto-scope GOVERNMENT.*\n', '', src)
    src = re.sub(r'[ \t]*if current_user\.role\.value == "GOVERNMENT".*\n', '', src)
    src = re.sub(r'[ \t]*district = current_user\.district\n', '', src)
    # Now insert the single clean block
    src = src.replace(old_call, new_block)
    p.write_text(src)
    print(f"Cleaned and patched: {filepath}")

clean_and_patch(
    '/app/app/api/v1/incidents.py',
    '    incidents = await list_incidents(db, status=status, district=district, page=page, limit=limit)',
    '    if current_user.role.value == "GOVERNMENT" and getattr(current_user, "district", None) and not district:\n        district = current_user.district\n    incidents = await list_incidents(db, status=status, district=district, page=page, limit=limit)'
)

clean_and_patch(
    '/app/app/api/v1/ambulances.py',
    '    ambulances = await list_ambulances(db, status=status, district=district)',
    '    if current_user.role.value == "GOVERNMENT" and getattr(current_user, "district", None) and not district:\n        district = current_user.district\n    ambulances = await list_ambulances(db, status=status, district=district)'
)

clean_and_patch(
    '/app/app/api/v1/blackspots.py',
    '    spots = await list_blackspots(db, district=district)',
    '    if current_user.role.value == "GOVERNMENT" and getattr(current_user, "district", None) and not district:\n        district = current_user.district\n    spots = await list_blackspots(db, district=district)'
)
