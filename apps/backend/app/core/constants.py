import enum


class UserRole(str, enum.Enum):
    PARAMEDIC = "PARAMEDIC"
    DRIVER = "DRIVER"
    DISPATCHER = "DISPATCHER"
    HOSPITAL_STAFF = "HOSPITAL_STAFF"
    ADMIN = "ADMIN"
    GOVERNMENT = "GOVERNMENT"
    PUBLIC = "PUBLIC"


class IncidentStatus(str, enum.Enum):
    REPORTED = "REPORTED"
    DISPATCH_PENDING = "DISPATCH_PENDING"
    DISPATCHED = "DISPATCHED"
    EN_ROUTE = "EN_ROUTE"
    ON_SCENE = "ON_SCENE"
    PATIENT_LOADED = "PATIENT_LOADED"
    TRANSPORTING = "TRANSPORTING"
    HOSPITAL_ARRIVED = "HOSPITAL_ARRIVED"
    CLOSED = "CLOSED"
    CANCELLED = "CANCELLED"


class IncidentSeverity(str, enum.Enum):
    MINOR = "MINOR"
    MODERATE = "MODERATE"
    SEVERE = "SEVERE"
    CRITICAL = "CRITICAL"
    MCI = "MCI"


class AccidentType(str, enum.Enum):
    ROAD_ACCIDENT = "ROAD_ACCIDENT"
    FALL = "FALL"
    ASSAULT = "ASSAULT"
    CARDIAC = "CARDIAC"
    BURNS = "BURNS"
    DROWNING = "DROWNING"
    INDUSTRIAL = "INDUSTRIAL"
    OTHER = "OTHER"


class AmbulanceStatus(str, enum.Enum):
    AVAILABLE = "AVAILABLE"
    DISPATCHED = "DISPATCHED"
    ON_TRIP = "ON_TRIP"
    ON_SCENE = "ON_SCENE"
    TRANSPORTING = "TRANSPORTING"
    AT_HOSPITAL = "AT_HOSPITAL"
    OFF_DUTY = "OFF_DUTY"
    MAINTENANCE = "MAINTENANCE"


class AmbulanceType(str, enum.Enum):
    BLS = "BLS"
    ALS = "ALS"
    NICU = "NICU"
    MFR = "MFR"


class TraumaLevel(str, enum.Enum):
    LEVEL_1 = "LEVEL_1"
    LEVEL_2 = "LEVEL_2"
    LEVEL_3 = "LEVEL_3"
    COMMUNITY = "COMMUNITY"


class TriageColor(str, enum.Enum):
    BLACK = "BLACK"
    RED = "RED"
    YELLOW = "YELLOW"
    GREEN = "GREEN"


class Gender(str, enum.Enum):
    MALE = "MALE"
    FEMALE = "FEMALE"
    UNKNOWN = "UNKNOWN"


class BlackSpotSeverity(str, enum.Enum):
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"
