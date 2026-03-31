from fastapi import APIRouter
from app.api.v1 import auth, incidents, ambulances, hospitals, patients, dispatch, blackspots, analytics, simulation, notifications, users, public

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(incidents.router)
api_router.include_router(ambulances.router)
api_router.include_router(hospitals.router)
api_router.include_router(patients.router)
api_router.include_router(dispatch.router)
api_router.include_router(blackspots.router)
api_router.include_router(analytics.router)
api_router.include_router(simulation.router)
api_router.include_router(notifications.router)
api_router.include_router(users.router)
api_router.include_router(public.router)
