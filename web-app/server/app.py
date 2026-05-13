from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import pandas as pd
from pathlib import Path

app = FastAPI(
    title="Alzheimer's Risk Prediction API",
    description="Gradient Boosting Classifier for Alzheimer's disease risk screening.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # restrict to your client origin in production
    allow_methods=["POST"],
    allow_headers=["Content-Type"],
)

# ── Load model (same folder as app.py) ──────────────────────────────────────
MODEL_PATH = Path(__file__).parent / "gb_alzheimers_model.joblib"

try:
    model = joblib.load(MODEL_PATH)
    print(f"[OK] Model loaded from {MODEL_PATH}")
    print(f"[OK] Model type: {type(model).__name__}")
except Exception as e:
    raise RuntimeError(f"Failed to load model: {e}")

# ── Feature order must match training exactly ────────────────────────────────
FEATURE_ORDER = [
    "Age", "Gender", "Ethnicity", "EducationLevel", "BMI", "Smoking",
    "AlcoholConsumption", "PhysicalActivity", "DietQuality", "SleepQuality",
    "FamilyHistoryAlzheimers", "CardiovascularDisease", "Diabetes",
    "Depression", "HeadInjury", "Hypertension", "SystolicBP", "DiastolicBP",
    "CholesterolTotal", "CholesterolLDL", "CholesterolHDL",
    "CholesterolTriglycerides", "MMSE", "FunctionalAssessment",
    "MemoryComplaints", "BehavioralProblems", "ADL", "Confusion",
    "Disorientation", "PersonalityChanges", "DifficultyCompletingTasks",
    "Forgetfulness"
]

# ── Request schema ───────────────────────────────────────────────────────────
class PatientData(BaseModel):
    # Demographics
    Age:                       int
    Gender:                    int     # 0 = Male, 1 = Female
    Ethnicity:                 int     # 0 = Caucasian, 1 = African American, 2 = Asian, 3 = Other
    EducationLevel:            int     # 0 = None, 1 = High School, 2 = Bachelor's, 3 = Higher

    # Lifestyle
    BMI:                       float
    Smoking:                   int     # 0 = No, 1 = Yes
    AlcoholConsumption:        float
    PhysicalActivity:          float
    DietQuality:               float
    SleepQuality:              float

    # Medical history
    FamilyHistoryAlzheimers:   int
    CardiovascularDisease:     int
    Diabetes:                  int
    Depression:                int
    HeadInjury:                int
    Hypertension:              int

    # Vitals & labs
    SystolicBP:                int
    DiastolicBP:               int
    CholesterolTotal:          float
    CholesterolLDL:            float
    CholesterolHDL:            float
    CholesterolTriglycerides:  float

    # Cognitive assessments
    MMSE:                      float
    FunctionalAssessment:      float

    # Symptoms
    MemoryComplaints:          int
    BehavioralProblems:        int
    ADL:                       float
    Confusion:                 int
    Disorientation:            int
    PersonalityChanges:        int
    DifficultyCompletingTasks: int
    Forgetfulness:             int

# ── Prediction endpoint ──────────────────────────────────────────────────────
@app.post("/api/predict")
def predict(patient: PatientData):
    try:
        # Build a single-row DataFrame with named columns — avoids sklearn feature name warning
        df = pd.DataFrame([[getattr(patient, f) for f in FEATURE_ORDER]], columns=FEATURE_ORDER)

        prediction  = int(model.predict(df)[0])
        probability = float(model.predict_proba(df)[0][1])

        return {
            "prediction":  prediction,    # 0 = Low Risk, 1 = At Risk
            "probability": round(probability, 4)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {e}")

# ── Health check ─────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {
        "status": "ok",
        "model":  MODEL_PATH.name,
        "type":   type(model).__name__
    }