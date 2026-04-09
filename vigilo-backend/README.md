# Vigilo Backend

Vigilo is an AI-driven early warning backend for college Training and Placement Cells in India. It identifies students who are drifting away from placement readiness and helps TPC teams intervene early with data-backed actions. The service combines FastAPI, Supabase, scoring and clustering logic, and AI-generated nudges into one auditable workflow.

## Local Setup

1. Clone the repository and enter the backend folder.

```bash
git clone https://github.com/Arjun-Walia/hackathon.git
cd hackathon/vigilo-backend
```

2. Create and activate a Python virtual environment.

```bash
python -m venv .venv
.venv\Scripts\activate
```

3. Install dependencies.

```bash
pip install -r requirements.txt
```

4. Copy environment variables and fill actual values.

```bash
copy .env.example .env
```

### LLM Fallback Configuration

Nudge generation now supports multi-provider fallback. The service tries providers in `LLM_PROVIDER_ORDER` and automatically moves to the next provider if the current one fails or returns an empty response.

- Default order: `openai,groq,cerebras,nvidia`
- Configure any subset by setting their API keys in `.env`
- Leave a provider key empty to skip that provider

Common keys:

- `OPENAI_API_KEY`, `OPENAI_MODEL`
- `GROQ_API_KEY`, `GROQ_MODEL`, `GROQ_BASE_URL`
- `CEREBRAS_API_KEY`, `CEREBRAS_MODEL`, `CEREBRAS_BASE_URL`
- `NVIDIA_API_KEY`, `NVIDIA_MODEL`, `NVIDIA_BASE_URL`
- `LLM_PROVIDER_ORDER`, `LLM_MAX_TOKENS`, `LLM_TEMPERATURE`, `LLM_TIMEOUT_SECONDS`

5. Run database migration from the repository root.

```bash
cd ..
psql "<SUPABASE_POSTGRES_CONNECTION_URL>" -f supabase/migrations/001_init.sql
cd vigilo-backend
```

6. Start the API locally.

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | /health | Public | Service health check |
| GET | /api/v1/students/me | student | Get own student profile |
| GET | /api/v1/students | tpc_admin | List students (limit, offset) |
| GET | /api/v1/students/{student_id} | tpc_admin or own student | Get student profile by id |
| GET | /api/v1/scores/{student_id}/history | tpc_admin or own student | Full score history for a student |
| GET | /api/v1/scores/{student_id}/latest | tpc_admin or own student | Latest score and score_breakdown |
| POST | /api/v1/scores/recompute/{student_id} | tpc_admin | Recompute score for one student |
| POST | /api/v1/scores/recompute/batch | tpc_admin | Recompute scores for student_ids or batch filter |
| GET | /api/v1/scores/leaderboard | tpc_admin | Highest and lowest score leaderboard |
| GET | /api/v1/interventions | tpc_admin | Filtered, paginated intervention log |
| GET | /api/v1/interventions/{student_id} | tpc_admin or own student | Interventions for one student |
| POST | /api/v1/interventions | tpc_admin | Create pending intervention |
| PATCH | /api/v1/interventions/{intervention_id}/send | tpc_admin | Mark intervention as sent |
| PATCH | /api/v1/interventions/{intervention_id}/acknowledge | student (own only) | Acknowledge intervention |
| PATCH | /api/v1/interventions/{intervention_id}/complete | tpc_admin | Complete intervention with notes |
| DELETE | /api/v1/interventions/{intervention_id} | tpc_admin | Soft delete intervention |
| GET | /api/v1/alerts | tpc_admin | Filtered, paginated alerts |
| GET | /api/v1/alerts/unread/count | tpc_admin | Unread and unresolved counts by severity |
| PATCH | /api/v1/alerts/{alert_id}/read | tpc_admin | Mark alert as read |
| PATCH | /api/v1/alerts/{alert_id}/resolve | tpc_admin | Resolve alert with resolver metadata |
| POST | /api/v1/alerts/trigger | tpc_admin | Manually trigger an alert |
| GET | /api/v1/drives | tpc_admin or student | List drives (students see eligible drives only) |
| GET | /api/v1/drives/{drive_id} | Authenticated | Drive details and application context |
| POST | /api/v1/drives | tpc_admin | Create placement drive |
| PATCH | /api/v1/drives/{drive_id} | tpc_admin | Update drive details/status |
| POST | /api/v1/drives/{drive_id}/apply | student | Apply to drive and log job_applied activity |
| PATCH | /api/v1/drives/{drive_id}/applications/{student_id} | tpc_admin | Update application status and placement outcome |
| GET | /api/v1/analytics/overview | tpc_admin | Placement and risk overview metrics |
| GET | /api/v1/analytics/cluster-distribution | tpc_admin | Cluster counts and percentages |
| GET | /api/v1/analytics/department-breakdown | tpc_admin | Department-level placement and score stats |
| GET | /api/v1/analytics/score-trend | tpc_admin | 30-day score trend by student or department |
| GET | /api/v1/analytics/impact-simulation | tpc_admin | Simulated placement uplift by top_n interventions |
| POST | /api/v1/ai/nudge/{student_id} | tpc_admin | Generate AI nudge and create intervention |
| POST | /api/v1/ai/nudge/bulk | tpc_admin | Bulk AI nudges and intervention creation |
| POST | /api/v1/ai/score/recompute-all | tpc_admin | Recompute all unplaced students and rerun clustering |
| POST | /api/v1/ai/alerts/check | tpc_admin | Manually run alert engine checks |
| GET | /api/v1/ai/student/{student_id}/recommendation | tpc_admin or own student | Skill-gap recommendation card and weekly nudge |

## Background Job Schedule

| Schedule (IST) | Job | What It Does |
|---|---|---|
| Daily 02:00 | Alert check | Runs alert_engine.run_alert_check() |
| Daily 03:00 | Score recompute + clustering | Recomputes scores for active unplaced students, then run_batch_clustering() |
| Sunday 06:00 | Weekly silent_dropout nudges | Generates weekly_check_in nudges for latest silent_dropout students and creates pending interventions |

## Supabase Setup

1. Create a new Supabase project from the Supabase dashboard.
2. Copy project values into .env: SUPABASE_URL, SUPABASE_KEY, SUPABASE_JWT_SECRET.
3. Run the migration script at supabase/migrations/001_init.sql.
4. Confirm Row Level Security is enabled for all Vigilo tables.
5. Create the first Auth user in Supabase Authentication.
6. Insert or update a corresponding row in profiles with role set to tpc_admin.

## Curl Cheatsheet

```bash
# Set local values once
set BASE_URL=http://localhost:8000
set TOKEN=<SUPABASE_JWT>
set STUDENT_ID=<STUDENT_UUID>

# 1) Health check
curl -X GET %BASE_URL%/health

# 2) Get all students (pagination filters)
curl -X GET "%BASE_URL%/api/v1/students?limit=20&offset=0" \
	-H "Authorization: Bearer %TOKEN%"

# 3) Get student by ID
curl -X GET %BASE_URL%/api/v1/students/%STUDENT_ID% \
	-H "Authorization: Bearer %TOKEN%"

# 4) Recompute score for one student
curl -X POST %BASE_URL%/api/v1/scores/recompute/%STUDENT_ID% \
	-H "Authorization: Bearer %TOKEN%"

# 5) Generate AI nudge for one student
curl -X POST %BASE_URL%/api/v1/ai/nudge/%STUDENT_ID% \
	-H "Authorization: Bearer %TOKEN%" \
	-H "Content-Type: application/json" \
	-d "{\"intervention_type\":\"weekly_check_in\"}"

# 6) Get analytics overview
curl -X GET %BASE_URL%/api/v1/analytics/overview \
	-H "Authorization: Bearer %TOKEN%"

# 7) Trigger alert check manually
curl -X POST %BASE_URL%/api/v1/ai/alerts/check \
	-H "Authorization: Bearer %TOKEN%"
```
