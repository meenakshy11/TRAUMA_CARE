"""
blackspot.py — Pydantic schemas for Black Spot endpoints
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel


# ── Request bodies ─────────────────────────────────────────────────────────────

class BlackSpotCreate(BaseModel):
    latitude: float
    longitude: float
    district: str
    police_station: Optional[str] = None
    location: Optional[str] = None
    priority: Optional[str] = None
    road_name: Optional[str] = None
    road_number: Optional[str] = None
    road_type: Optional[str] = None
    road_length: Optional[str] = None
    start_latitude: Optional[float] = None
    start_longitude: Optional[float] = None
    end_latitude: Optional[float] = None
    end_longitude: Optional[float] = None
    incident_count: int = 0
    fatality_rate: Optional[float] = None
    accidents_per_year: int = 0
    description: Optional[str] = None
    severity: Optional[str] = None


class BlackSpotUpdate(BaseModel):
    incident_count: Optional[int] = None
    fatality_rate: Optional[float] = None
    accidents_per_year: Optional[int] = None
    risk_score: Optional[float] = None
    description: Optional[str] = None
    severity: Optional[str] = None


# ── Response bodies ────────────────────────────────────────────────────────────

class BlackSpotResponse(BaseModel):
    id: str
    district: str
    police_station: Optional[str]
    location: Optional[str]
    priority: Optional[str]
    road_name: Optional[str]
    road_number: Optional[str]
    road_type: Optional[str]
    road_length: Optional[str]
    latitude: float
    longitude: float
    start_latitude: Optional[float]
    start_longitude: Optional[float]
    end_latitude: Optional[float]
    end_longitude: Optional[float]
    name: Optional[str]
    incident_count: int
    fatality_rate: Optional[float]
    accidents_per_year: int
    risk_score: float
    severity: Optional[str]
    description: Optional[str]
    created_at: Optional[datetime]

    class Config:
        from_attributes = True


class HeatmapPoint(BaseModel):
    lat: float
    lon: float
    weight: float
    district: str
