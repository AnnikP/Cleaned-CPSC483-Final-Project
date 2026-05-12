# NeuroAssess — Alzheimer's Risk Screening Web App

An AI-assisted clinical screening tool that predicts a patient's risk of Alzheimer's disease using a trained XGBoost model. A clinician fills in patient data through a form-based frontend, which sends the data to a FastAPI backend that runs the prediction and returns the result.

---

## Project Structure

```
web-app/
├── server/
│   ├── app.py                  # FastAPI backend
│   └── xgb_alzheimer.json      # Trained XGBoost model
├── client/
│   └── pages/
│       └── index.html          # Frontend assessment form
└── README.md
```

---

## Prerequisites

- Python 3.8 or higher
- pip (invoke as `python -m pip` on Windows if `pip` is not recognised)

---

## Installation

Open a terminal, navigate to the project root, and install all required packages:

```powershell
python -m pip install fastapi uvicorn xgboost numpy
```

---

## Running the App

You need two terminals open at the same time — one for the backend API, one for the frontend.

**Terminal 1 — Start the FastAPI backend**

```powershell
cd server
python3 -m uvicorn app:app --reload
```

The API will be available at `http://127.0.0.1:8000`. You can verify it is running by visiting `http://127.0.0.1:8000/health` in your browser, which should return:

```json
{ "status": "ok", "model": "xgb_alzheimer.json" }
```

**Terminal 2 — Serve the frontend**

```powershell
cd client
python3 -m http.server 8080
```

Then open your browser and go to:

```
http://localhost:8080/pages/index.html
```

> **Note:** You must use `python -m http.server` rather than opening `index.html` directly as a file. Browsers block `fetch` requests to `localhost` when the page is loaded from a `file://` URL.

---

## How It Works

1. The clinician fills in all six sections of the patient form (demographics, lifestyle, medical history, vitals, cognitive assessment, and symptoms).
2. On clicking **Run Assessment**, the frontend collects the form values into a JSON object and sends a `POST` request to `http://127.0.0.1:8000/api/predict`.
3. The FastAPI backend receives the request, validates the fields via a Pydantic schema, builds an `xgb.DMatrix`, and runs inference with the loaded Booster model.
4. The model returns a probability score (0–1). Any score at or above `0.5` is classified as **At Risk**.
5. The backend responds with `{ "prediction": 0 or 1, "probability": float }` and the frontend renders the result card with the risk level, probability percentage, and contributing clinical flags.

---

## API Reference

### `POST /api/predict`

Accepts a JSON body containing all 32 patient features and returns a prediction.

**Request body** — all fields required:

| Field | Type | Description |
|---|---|---|
| `Age` | int | Patient age in years |
| `Gender` | int | 0 = Male, 1 = Female |
| `Ethnicity` | int | 0 = Caucasian, 1 = African American, 2 = Asian, 3 = Other |
| `EducationLevel` | int | 0 = None, 1 = High School, 2 = Bachelor's, 3 = Higher |
| `BMI` | float | Body mass index (kg/m²) |
| `Smoking` | int | 0 = No, 1 = Yes |
| `AlcoholConsumption` | float | Units per week |
| `PhysicalActivity` | float | Hours per week |
| `DietQuality` | float | Score 0–10 |
| `SleepQuality` | float | Score 4–10 |
| `FamilyHistoryAlzheimers` | int | 0 = No, 1 = Yes |
| `CardiovascularDisease` | int | 0 = No, 1 = Yes |
| `Diabetes` | int | 0 = No, 1 = Yes |
| `Depression` | int | 0 = No, 1 = Yes |
| `HeadInjury` | int | 0 = No, 1 = Yes |
| `Hypertension` | int | 0 = No, 1 = Yes |
| `SystolicBP` | int | mmHg |
| `DiastolicBP` | int | mmHg |
| `CholesterolTotal` | float | mg/dL |
| `CholesterolLDL` | float | mg/dL |
| `CholesterolHDL` | float | mg/dL |
| `CholesterolTriglycerides` | float | mg/dL |
| `MMSE` | float | Mini-Mental State Exam score (0–30) |
| `FunctionalAssessment` | float | Score 0–10 |
| `MemoryComplaints` | int | 0 = No, 1 = Yes |
| `BehavioralProblems` | int | 0 = No, 1 = Yes |
| `ADL` | float | Activities of Daily Living score (0–10) |
| `Confusion` | int | 0 = No, 1 = Yes |
| `Disorientation` | int | 0 = No, 1 = Yes |
| `PersonalityChanges` | int | 0 = No, 1 = Yes |
| `DifficultyCompletingTasks` | int | 0 = No, 1 = Yes |
| `Forgetfulness` | int | 0 = No, 1 = Yes |

**Response:**

```json
{
  "prediction": 1,
  "probability": 0.8342
}
```

| Field | Description |
|---|---|
| `prediction` | `0` = Low Risk, `1` = Elevated Risk |
| `probability` | Model confidence score between 0 and 1 |

### `GET /health`

Returns the server and model status. Useful for confirming the backend is running before using the frontend.

```json
{ "status": "ok", "model": "xgb_alzheimer.json" }
```

---

## Interactive API Docs

FastAPI automatically generates documentation from the Pydantic schema. Once the backend is running, visit either of these in your browser:

| URL | Description |
|---|---|
| `http://127.0.0.1:8000/docs` | Swagger UI — test the endpoint interactively |
| `http://127.0.0.1:8000/redoc` | ReDoc — clean, readable API reference |

---

## Troubleshooting

**`pip` is not recognised in PowerShell**
Use `python -m pip install ...` instead. See Step 2 of the setup above.

**`uvicorn` is not recognised in PowerShell**
Use `python -m uvicorn app:app --reload` instead.

**Frontend shows "Cannot reach the server"**
Make sure Terminal 1 is running and shows `Uvicorn running on http://127.0.0.1:8000`. Also confirm you are serving the frontend with `python -m http.server` and not opening the HTML file directly.

**Prediction always returns the same value**
Ensure the feature order in `FEATURE_ORDER` inside `app.py` matches the column order the model was trained on exactly.

---

## Disclaimer

This tool is intended for clinical decision support only. It does not constitute a medical diagnosis. All predictions should be reviewed by a qualified neurologist before any clinical action is taken.
