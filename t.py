import pathlib

PAGES = [
    {
        "file": "/app/app/api/v1/../../../web/src/pages/Incidents/IncidentListPage.tsx",
    }
]

# Write directly to the bind-mounted frontend files
base = pathlib.Path("/app")

files = {
    "/mnt/host/apps/web/src/pages/Incidents/IncidentListPage.tsx": None,
}
print("test")
