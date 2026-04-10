# Run once before demo: python scripts/seed_demo_data.py
# Requires: pip install faker python-dotenv supabase
# Set TPC_ADMIN_ID to an existing tpc_admin user UUID from your Supabase Auth dashboard

from __future__ import annotations

import math
import os
import random
import uuid
from dataclasses import dataclass
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from faker import Faker
from supabase import Client, create_client


SEED_COUNT = 500
CLEAR_EXISTING = True
BATCH_SIZE = 50
DEFAULT_TPC_ADMIN_ID = "00000000-0000-0000-0000-000000000000"
TPC_ADMIN_ID = DEFAULT_TPC_ADMIN_ID


DEPARTMENT_COUNTS = {
    "Computer Science": 150,
    "Electronics": 100,
    "Mechanical": 80,
    "Civil": 80,
    "Information Technology": 90,
}

ARCHETYPE_COUNTS = {
    "A": int(SEED_COUNT * 0.35),  # Placement Ready
    "B": int(SEED_COUNT * 0.40),  # At Risk
    "C": SEED_COUNT - int(SEED_COUNT * 0.35) - int(SEED_COUNT * 0.40),  # Silent Dropout
}

SKILLS_BY_DEPARTMENT = {
    "Computer Science": [
        "Python",
        "Java",
        "React",
        "Node.js",
        "SQL",
        "Machine Learning",
        "Docker",
        "Git",
        "AWS",
        "DSA",
    ],
    "Information Technology": [
        "Python",
        "Java",
        "React",
        "Node.js",
        "SQL",
        "Machine Learning",
        "Docker",
        "Git",
        "AWS",
        "DSA",
    ],
    "Electronics": [
        "Embedded C",
        "MATLAB",
        "PCB Design",
        "VLSI",
        "Arduino",
        "Signal Processing",
    ],
    "Mechanical": [
        "AutoCAD",
        "SolidWorks",
        "ANSYS",
        "Thermodynamics",
        "CNC Programming",
    ],
    "Civil": [
        "AutoCAD",
        "STAAD Pro",
        "MS Project",
        "Structural Analysis",
    ],
}

ACTIVITY_TYPES = [
    "portal_login",
    "mock_test",
    "resume_update",
    "skill_added",
    "job_applied",
    "session_attended",
]


@dataclass
class StudentRecord:
    user_id: str
    full_name: str
    email: str
    department: str
    batch_year: int
    archetype: str
    cgpa: float


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def random_timestamp_days_ago(min_days: int, max_days: int) -> str:
    now = utc_now()
    days = random.randint(min_days, max_days)
    dt = now - timedelta(
        days=days,
        hours=random.randint(0, 23),
        minutes=random.randint(0, 59),
        seconds=random.randint(0, 59),
    )
    return dt.isoformat()


def random_timestamp_days_ahead(min_days: int, max_days: int) -> date:
    now = utc_now().date()
    days = random.randint(min_days, max_days)
    return now + timedelta(days=days)


def logistic_probability(score: float) -> float:
    return round(1.0 / (1.0 + math.exp(-0.1 * (score - 50.0))), 4)


def chunked(items: list[dict[str, Any]], batch_size: int) -> list[list[dict[str, Any]]]:
    return [items[i : i + batch_size] for i in range(0, len(items), batch_size)]


def insert_in_batches(supabase: Client, table_name: str, rows: list[dict[str, Any]], label: str) -> int:
    if not rows:
        print(f"Inserting {label}... done (0)")
        return 0

    success_count = 0
    for batch_index, batch in enumerate(chunked(rows, BATCH_SIZE), start=1):
        try:
            supabase.table(table_name).insert(batch).execute()
            success_count += len(batch)
        except Exception as exc:
            print(f"  [warn] {label} batch {batch_index} failed: {exc}")

    print(f"Inserting {label}... done ({success_count})")
    return success_count


def count_rows(supabase: Client, table_name: str) -> int:
    try:
        response = supabase.table(table_name).select("id", count="exact").limit(1).execute()
        count_value = getattr(response, "count", None)
        if count_value is not None:
            return int(count_value)

        data = response.data or []
        return len(data)
    except Exception:
        return -1


def clear_existing_data(supabase: Client) -> None:
    print("Clearing existing seeded data...")

    delete_order = [
        "drive_applications",
        "interventions",
        "alerts",
        "activity_logs",
        "vigilo_scores",
        "student_skills",
        "student_profiles",
        "placement_drives",
    ]

    for table_name in delete_order:
        try:
            supabase.table(table_name).delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
            print(f"  cleared {table_name}")
        except Exception as exc:
            print(f"  [warn] could not clear {table_name}: {exc}")

    # Keep admins intact, remove only student profiles.
    try:
        supabase.table("profiles").delete().eq("role", "student").execute()
        print("  cleared profiles (role=student)")
    except Exception as exc:
        print(f"  [warn] could not clear profiles: {exc}")


def create_auth_user(supabase: Client, email: str) -> str | None:
    password = "Demo@12345"
    payload = {
        "email": email,
        "password": password,
        "email_confirm": True,
    }

    try:
        # supabase-py v2 admin API
        response = supabase.auth.admin.create_user(payload)

        user_obj = getattr(response, "user", None)
        if user_obj is None and isinstance(response, dict):
            user_obj = response.get("user") or response.get("data", {}).get("user")

        user_id = getattr(user_obj, "id", None)
        if user_id is None and isinstance(user_obj, dict):
            user_id = user_obj.get("id")

        if user_id:
            return str(user_id)

        print(f"  [warn] create_user returned no user id for email={email}")
        return None
    except Exception as exc:
        print(f"  [warn] failed to create auth user for {email}: {exc}")
        return None


def make_student_profile(archetype: str, batch_year: int, cgpa: float) -> dict[str, Any]:
    now = utc_now()

    if archetype == "A":
        active_backlogs = 0
        internship_count = random.randint(1, 3)
        mock_tests_attempted = random.randint(8, 20)
        mock_avg_score = round(random.uniform(65, 90), 2)
        certifications_count = random.randint(2, 5)
        last_portal_login = random_timestamp_days_ago(0, 7)
        resume_updated_at = random_timestamp_days_ago(0, 30)
    elif archetype == "B":
        active_backlogs = random.randint(0, 2)
        internship_count = random.randint(0, 1)
        mock_tests_attempted = random.randint(2, 7)
        mock_avg_score = round(random.uniform(35, 64), 2)
        certifications_count = random.randint(0, 2)
        last_portal_login = random_timestamp_days_ago(8, 25)
        resume_updated_at = random_timestamp_days_ago(30, 90)
    else:
        active_backlogs = random.randint(1, 4)
        internship_count = 0
        mock_tests_attempted = random.randint(0, 2)
        mock_avg_score = None if random.random() < 0.6 else round(random.uniform(20, 40), 2)
        certifications_count = random.randint(0, 1)
        last_portal_login = None if random.random() < 0.35 else random_timestamp_days_ago(31, 90)
        resume_updated_at = None if random.random() < 0.45 else random_timestamp_days_ago(91, 180)

    profile_row = {
        "cgpa": round(cgpa, 2),
        "active_backlogs": active_backlogs,
        "internship_count": internship_count,
        "github_url": None,
        "linkedin_url": None,
        "resume_updated_at": resume_updated_at,
        "last_portal_login": last_portal_login,
        "mock_tests_attempted": mock_tests_attempted,
        "mock_avg_score": mock_avg_score,
        "certifications_count": certifications_count,
        "placement_status": "unplaced",
        "company_placed": None,
        "created_at": now.isoformat(),
        "updated_at": now.isoformat(),
        "batch_year": batch_year,
    }
    return profile_row


def pick_proficiency(archetype: str) -> str:
    if archetype == "A":
        return random.choices(
            ["beginner", "intermediate", "advanced"],
            weights=[0.15, 0.45, 0.40],
            k=1,
        )[0]
    if archetype == "B":
        return random.choices(
            ["beginner", "intermediate", "advanced"],
            weights=[0.45, 0.45, 0.10],
            k=1,
        )[0]
    return random.choices(
        ["beginner", "intermediate", "advanced"],
        weights=[0.75, 0.22, 0.03],
        k=1,
    )[0]


def build_score_breakdown(score: float) -> dict[str, float]:
    keys = [
        "portal_activity_score",
        "mock_test_score",
        "skill_score",
        "resume_score",
        "cgpa_score",
        "application_score",
        "internship_score",
    ]

    weights = [random.random() + 0.2 for _ in keys]
    total_weight = sum(weights)
    values: dict[str, float] = {}

    running = 0.0
    for i, key in enumerate(keys):
        if i == len(keys) - 1:
            value = round(max(0.0, score - running), 2)
        else:
            value = round(score * (weights[i] / total_weight), 2)
            running += value
        values[key] = value

    values["total_score"] = round(score, 2)
    return values


def is_eligible(student: StudentRecord, drive: dict[str, Any]) -> bool:
    criteria = drive.get("eligibility_criteria", {})
    min_cgpa = float(criteria.get("min_cgpa", 0.0))
    allowed_branches = criteria.get("allowed_branches", [])

    if student.cgpa < min_cgpa:
        return False

    if allowed_branches and student.department not in allowed_branches:
        return False

    return True


def main() -> None:
    root_dir = Path(__file__).resolve().parents[1]

    # Load .env from repository root first, then fallback to vigilo-backend/.env
    load_dotenv(root_dir / ".env")
    if not os.getenv("SUPABASE_URL") or not os.getenv("SUPABASE_KEY"):
        load_dotenv(root_dir / "vigilo-backend" / ".env")

    supabase_url = (os.getenv("SUPABASE_URL") or "").strip()
    supabase_key = (os.getenv("SUPABASE_KEY") or "").strip()

    if not supabase_url or not supabase_key:
        raise RuntimeError("SUPABASE_URL and SUPABASE_KEY are required in .env")

    if TPC_ADMIN_ID == DEFAULT_TPC_ADMIN_ID:
        raise RuntimeError("Set TPC_ADMIN_ID to an existing tpc_admin UUID before running this script")

    supabase = create_client(supabase_url, supabase_key)

    admin_rows = (
        supabase.table("profiles")
        .select("id")
        .eq("id", TPC_ADMIN_ID)
        .eq("role", "tpc_admin")
        .limit(1)
        .execute()
        .data
        or []
    )
    if not admin_rows:
        raise RuntimeError("TPC_ADMIN_ID does not exist in profiles with role=tpc_admin")

    random.seed(42)
    fake = Faker("en_IN")
    Faker.seed(42)

    if CLEAR_EXISTING:
        clear_existing_data(supabase)

    print("Generating students and auth users...")

    departments = [
        department
        for department, count in DEPARTMENT_COUNTS.items()
        for _ in range(count)
    ]
    random.shuffle(departments)

    batch_years = [2025] * int(SEED_COUNT * 0.60) + [2026] * (SEED_COUNT - int(SEED_COUNT * 0.60))
    random.shuffle(batch_years)

    archetypes = [
        "A" for _ in range(ARCHETYPE_COUNTS["A"])
    ] + [
        "B" for _ in range(ARCHETYPE_COUNTS["B"])
    ] + [
        "C" for _ in range(ARCHETYPE_COUNTS["C"])
    ]
    random.shuffle(archetypes)

    seed_tag = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")

    profiles_rows: list[dict[str, Any]] = []
    student_profiles_rows: list[dict[str, Any]] = []
    student_skill_rows: list[dict[str, Any]] = []
    vigilo_score_rows: list[dict[str, Any]] = []
    activity_log_rows: list[dict[str, Any]] = []
    students: list[StudentRecord] = []

    archetype_students: dict[str, list[StudentRecord]] = {"A": [], "B": [], "C": []}

    idx = 0
    attempts = 0
    max_attempts = SEED_COUNT * 3
    while idx < SEED_COUNT and attempts < max_attempts:
        attempts += 1
        department = departments[idx]
        batch_year = batch_years[idx]
        archetype = archetypes[idx]

        if archetype == "A":
            cgpa = round(random.uniform(7.5, 9.5), 2)
        elif archetype == "B":
            cgpa = round(random.uniform(5.5, 7.4), 2)
        else:
            cgpa = round(random.uniform(4.0, 6.5), 2)

        full_name = fake.name()
        email = f"student.{idx+1:03d}.{seed_tag}.{attempts}@vigilo.demo"

        user_id = create_auth_user(supabase, email)
        if user_id is None:
            continue

        student = StudentRecord(
            user_id=user_id,
            full_name=full_name,
            email=email,
            department=department,
            batch_year=batch_year,
            archetype=archetype,
            cgpa=cgpa,
        )
        students.append(student)
        archetype_students[archetype].append(student)
        idx += 1

        profiles_rows.append(
            {
                "id": user_id,
                "full_name": full_name,
                "email": email,
                "role": "student",
                "department": department,
                "batch_year": batch_year,
                "avatar_url": None,
                "created_at": utc_now().isoformat(),
                "updated_at": utc_now().isoformat(),
            }
        )

        student_profile = make_student_profile(archetype, batch_year, cgpa)
        student_profiles_rows.append(
            {
                "id": user_id,
                "cgpa": student_profile["cgpa"],
                "active_backlogs": student_profile["active_backlogs"],
                "internship_count": student_profile["internship_count"],
                "github_url": student_profile["github_url"],
                "linkedin_url": student_profile["linkedin_url"],
                "resume_updated_at": student_profile["resume_updated_at"],
                "last_portal_login": student_profile["last_portal_login"],
                "mock_tests_attempted": student_profile["mock_tests_attempted"],
                "mock_avg_score": student_profile["mock_avg_score"],
                "certifications_count": student_profile["certifications_count"],
                "placement_status": "unplaced",
                "company_placed": None,
                "created_at": utc_now().isoformat(),
                "updated_at": utc_now().isoformat(),
            }
        )

        # Skills
        pool = SKILLS_BY_DEPARTMENT[department]
        if archetype == "A":
            skill_count = random.randint(4, 6)
            verified_probability = 0.80
        elif archetype == "B":
            skill_count = random.randint(3, 5)
            verified_probability = 0.35
        else:
            skill_count = random.randint(2, 4)
            verified_probability = 0.15

        selected_skills = random.sample(pool, min(skill_count, len(pool)))
        for skill in selected_skills:
            verified = random.random() < verified_probability
            student_skill_rows.append(
                {
                    "id": str(uuid.uuid4()),
                    "student_id": user_id,
                    "skill_name": skill,
                    "proficiency": pick_proficiency(archetype),
                    "verified": verified,
                    "created_at": utc_now().isoformat(),
                }
            )

        # Scores
        if archetype == "A":
            score = round(random.uniform(65, 92), 2)
            cluster = "placement_ready"
        elif archetype == "B":
            score = round(random.uniform(35, 64), 2)
            cluster = "at_risk"
        else:
            score = round(random.uniform(8, 34), 2)
            cluster = "silent_dropout"

        vigilo_score_rows.append(
            {
                "id": str(uuid.uuid4()),
                "student_id": user_id,
                "score": score,
                "cluster": cluster,
                "placement_probability": logistic_probability(score),
                "score_breakdown": build_score_breakdown(score),
                "computed_at": random_timestamp_days_ago(0, 7),
                "is_latest": True,
            }
        )

        # Activity logs
        if archetype == "A":
            log_count = random.randint(15, 30)
            min_days, max_days = 0, 60
        elif archetype == "B":
            log_count = random.randint(3, 14)
            min_days, max_days = 0, 60
        else:
            log_count = random.randint(0, 3)
            min_days, max_days = 31, 120

        for _ in range(log_count):
            activity_type = random.choice(ACTIVITY_TYPES)
            activity_log_rows.append(
                {
                    "id": str(uuid.uuid4()),
                    "student_id": user_id,
                    "activity_type": activity_type,
                    "metadata": {"source": "seed", "note": f"demo_{activity_type}"},
                    "logged_at": random_timestamp_days_ago(min_days, max_days),
                }
            )

    if len(students) != SEED_COUNT:
        raise RuntimeError(
            f"Could not create {SEED_COUNT} students after {attempts} auth creation attempts"
        )

    # Placement drives
    print("Generating placement drives...")
    companies = ["TCS", "Infosys", "Wipro", "Accenture", "Capgemini", "L&T", "Mahindra", "HCL"]
    roles = [
        "Software Engineer",
        "Graduate Engineer Trainee",
        "Analyst",
        "Data Engineer",
        "Cloud Associate",
        "Full Stack Developer",
        "QA Engineer",
        "DevOps Engineer",
    ]

    drive_rows: list[dict[str, Any]] = []
    statuses = ["completed", "completed", "completed", "ongoing", "ongoing", "upcoming", "upcoming", "upcoming"]

    all_departments = list(DEPARTMENT_COUNTS.keys())
    for i in range(8):
        status = statuses[i]
        if status == "completed":
            drive_date = (utc_now().date() - timedelta(days=random.randint(60, 120))).isoformat()
        elif status == "ongoing":
            drive_date = (utc_now().date() + timedelta(days=random.randint(-7, 7))).isoformat()
        else:
            drive_date = random_timestamp_days_ahead(14, 45).isoformat()

        allowed_branches = random.sample(all_departments, random.randint(2, 4))
        min_cgpa = round(random.uniform(6.0, 7.5), 1)

        drive_rows.append(
            {
                "id": str(uuid.uuid4()),
                "company_name": companies[i],
                "role": roles[i],
                "package_lpa": round(random.uniform(3.5, 18.0), 2),
                "drive_date": drive_date,
                "eligibility_criteria": {
                    "min_cgpa": min_cgpa,
                    "allowed_branches": allowed_branches,
                },
                "status": status,
                "created_at": utc_now().isoformat(),
            }
        )

    drives_by_id = {row["id"]: row for row in drive_rows}

    # Drive applications
    print("Generating drive applications...")
    drive_application_rows: list[dict[str, Any]] = []
    seen_pairs: set[tuple[str, str]] = set()

    for student in students:
        eligible_drive_ids = [
            drive["id"]
            for drive in drive_rows
            if is_eligible(student, drive)
        ]

        if not eligible_drive_ids:
            continue

        if student.archetype == "A":
            selected_drive_ids = eligible_drive_ids
        elif student.archetype == "B":
            choose_count = min(len(eligible_drive_ids), random.randint(1, 3))
            selected_drive_ids = random.sample(eligible_drive_ids, choose_count)
        else:
            choose_count = min(len(eligible_drive_ids), random.randint(0, 1))
            selected_drive_ids = random.sample(eligible_drive_ids, choose_count) if choose_count > 0 else []

        for drive_id in selected_drive_ids:
            pair = (drive_id, student.user_id)
            if pair in seen_pairs:
                continue
            seen_pairs.add(pair)

            drive = drives_by_id[drive_id]
            status = "applied"

            if drive["status"] == "completed":
                if student.archetype == "A":
                    status = random.choices(
                        ["selected", "shortlisted", "rejected"],
                        weights=[0.30, 0.20, 0.50],
                        k=1,
                    )[0]
                elif student.archetype == "B":
                    status = random.choices(
                        ["selected", "shortlisted", "rejected"],
                        weights=[0.08, 0.22, 0.70],
                        k=1,
                    )[0]
                else:
                    status = random.choices(
                        ["selected", "shortlisted", "rejected"],
                        weights=[0.01, 0.09, 0.90],
                        k=1,
                    )[0]

            drive_application_rows.append(
                {
                    "id": str(uuid.uuid4()),
                    "drive_id": drive_id,
                    "student_id": student.user_id,
                    "status": status,
                    "applied_at": random_timestamp_days_ago(0, 120),
                }
            )

    # Force 60 archetype A students to placed status.
    placed_company_by_student: dict[str, str] = {}
    archetype_a_students = archetype_students["A"]
    target_placed = min(60, len(archetype_a_students))
    forced_placed_students = random.sample(archetype_a_students, target_placed)

    apps_by_student: dict[str, list[dict[str, Any]]] = {}
    for app in drive_application_rows:
        apps_by_student.setdefault(app["student_id"], []).append(app)

    for student in forced_placed_students:
        student_apps = apps_by_student.get(student.user_id, [])
        completed_apps = [
            app
            for app in student_apps
            if drives_by_id.get(app["drive_id"], {}).get("status") == "completed"
        ]
        if not completed_apps:
            continue

        picked = random.choice(completed_apps)
        picked["status"] = "selected"
        placed_company_by_student[student.user_id] = drives_by_id[picked["drive_id"]]["company_name"]

    # Alerts
    print("Generating alerts...")
    alert_rows: list[dict[str, Any]] = []

    for student in archetype_students["C"]:
        alert_rows.append(
            {
                "id": str(uuid.uuid4()),
                "student_id": student.user_id,
                "alert_type": "silent_30",
                "severity": "high",
                "message": f"{student.full_name} has no placement-related activity in the last 30 days.",
                "is_read": False,
                "is_resolved": False,
                "triggered_at": random_timestamp_days_ago(0, 30),
            }
        )

    for student in random.sample(archetype_students["B"], min(20, len(archetype_students["B"]))):
        alert_rows.append(
            {
                "id": str(uuid.uuid4()),
                "student_id": student.user_id,
                "alert_type": "no_resume",
                "severity": "medium",
                "message": f"{student.full_name}'s resume is outdated or missing.",
                "is_read": False,
                "is_resolved": False,
                "triggered_at": random_timestamp_days_ago(0, 30),
            }
        )

    for student in random.sample(archetype_students["C"], min(15, len(archetype_students["C"]))):
        alert_rows.append(
            {
                "id": str(uuid.uuid4()),
                "student_id": student.user_id,
                "alert_type": "cluster_change",
                "severity": "critical",
                "message": f"{student.full_name} shifted to silent_dropout cluster.",
                "is_read": False,
                "is_resolved": False,
                "triggered_at": random_timestamp_days_ago(0, 20),
            }
        )

    for student in random.sample(archetype_students["B"], min(30, len(archetype_students["B"]))):
        alert_rows.append(
            {
                "id": str(uuid.uuid4()),
                "student_id": student.user_id,
                "alert_type": "zero_mocks",
                "severity": "low",
                "message": f"{student.full_name} has low or no mock test activity.",
                "is_read": False,
                "is_resolved": False,
                "triggered_at": random_timestamp_days_ago(0, 30),
            }
        )

    # Interventions
    print("Generating interventions...")
    intervention_rows: list[dict[str, Any]] = []
    intervention_targets = random.sample(archetype_students["C"], min(40, len(archetype_students["C"])))

    intervention_types = ["nudge_sent", "mock_assigned", "counselling"]

    for student in intervention_targets:
        status = random.choices(
            ["sent", "pending", "completed"],
            weights=[0.60, 0.30, 0.10],
            k=1,
        )[0]

        intervention_type = random.choice(intervention_types)
        created_at = random_timestamp_days_ago(0, 45)
        sent_at = random_timestamp_days_ago(0, 30) if status in {"sent", "completed"} else None
        acknowledged_at = random_timestamp_days_ago(0, 15) if status == "completed" else None

        ai_msg = (
            f"Hi {student.full_name}, this week focus on one mock test, update your resume, "
            "and complete at least two job applications aligned to your branch. "
            "Small consistent actions now can significantly improve your placement outcomes."
        )

        intervention_rows.append(
            {
                "id": str(uuid.uuid4()),
                "student_id": student.user_id,
                "created_by": TPC_ADMIN_ID,
                "intervention_type": intervention_type,
                "ai_generated_message": ai_msg,
                "custom_message": None,
                "status": status,
                "sent_at": sent_at,
                "acknowledged_at": acknowledged_at,
                "notes": "Generated by demo seed script",
                "created_at": created_at,
                "updated_at": utc_now().isoformat(),
            }
        )

    # Insert in dependency order.
    insert_in_batches(supabase, "profiles", profiles_rows, "profiles")
    insert_in_batches(supabase, "student_profiles", student_profiles_rows, "student_profiles")
    insert_in_batches(supabase, "student_skills", student_skill_rows, "student_skills")
    insert_in_batches(supabase, "vigilo_scores", vigilo_score_rows, "vigilo_scores")
    insert_in_batches(supabase, "activity_logs", activity_log_rows, "activity_logs")
    insert_in_batches(supabase, "placement_drives", drive_rows, "placement_drives")
    insert_in_batches(supabase, "drive_applications", drive_application_rows, "drive_applications")
    insert_in_batches(supabase, "alerts", alert_rows, "alerts")
    insert_in_batches(supabase, "interventions", intervention_rows, "interventions")

    # Mark selected students as placed.
    print("Updating placement outcomes for selected students...")
    placed_updates = 0
    for student_id, company_name in placed_company_by_student.items():
        try:
            supabase.table("student_profiles").update(
                {
                    "placement_status": "placed",
                    "company_placed": company_name,
                    "updated_at": utc_now().isoformat(),
                }
            ).eq("id", student_id).execute()
            placed_updates += 1
        except Exception as exc:
            print(f"  [warn] failed placement update for student_id={student_id}: {exc}")
    print(f"Updating placement outcomes... done ({placed_updates})")

    print("\nFinal summary:")
    for table_name in [
        "profiles",
        "student_profiles",
        "student_skills",
        "vigilo_scores",
        "activity_logs",
        "placement_drives",
        "drive_applications",
        "alerts",
        "interventions",
    ]:
        total = count_rows(supabase, table_name)
        print(f"  {table_name}: {total}")


if __name__ == "__main__":
    main()
