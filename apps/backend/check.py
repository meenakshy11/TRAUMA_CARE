import pathlib, re

# Patch incidents list page
p = pathlib.Path('/app/app/api/v1/incidents.py')
src = p.read_text()
print("incidents GOVERNMENT count:", src.count("GOVERNMENT"))

p2 = pathlib.Path('/app/app/api/v1/hospitals.py')
src2 = p2.read_text()
print("hospitals auth:", "get_current_user" in src2)
