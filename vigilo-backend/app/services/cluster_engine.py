from datetime import datetime, timezone
from typing import Literal

import numpy as np
from sklearn.cluster import KMeans

from app.db.supabase import get_supabase_client


ClusterName = Literal["placement_ready", "at_risk", "silent_dropout"]


def assign_cluster(score: float, probability: float) -> ClusterName:
    if score >= 65.0 and probability >= 0.6:
        return "placement_ready"
    if score < 35.0 or probability < 0.3:
        return "silent_dropout"
    if 35.0 <= score < 65.0:
        return "at_risk"
    return "at_risk"


def _empty_result() -> dict[str, int | str]:
    return {
        "placement_ready": 0,
        "at_risk": 0,
        "silent_dropout": 0,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }


def run_batch_clustering(student_ids: list[str] | None = None) -> dict[str, int | str]:
    try:
        client = get_supabase_client()
        query = (
            client.table("vigilo_scores")
            .select("id, student_id, score, placement_probability")
            .eq("is_latest", True)
        )

        if student_ids:
            query = query.in_("student_id", student_ids)

        score_rows = query.execute().data or []
        if not score_rows:
            return _empty_result()

        assignments: list[tuple[str, str]] = []

        if len(score_rows) < 3:
            for row in score_rows:
                score_value = float(row.get("score") or 0.0)
                probability = float(row.get("placement_probability") or 0.0)
                cluster_name = assign_cluster(score=score_value, probability=probability)
                assignments.append((str(row["id"]), cluster_name))
        else:
            features = np.array(
                [
                    [float(row.get("score") or 0.0), float(row.get("placement_probability") or 0.0)]
                    for row in score_rows
                ],
                dtype=float,
            )

            model = KMeans(n_clusters=3, random_state=42, n_init=20)
            labels = model.fit_predict(features)
            centroids = model.cluster_centers_

            centroid_strength = centroids[:, 0] + (centroids[:, 1] * 100.0)
            ordered_labels = np.argsort(centroid_strength)

            label_to_cluster: dict[int, ClusterName] = {
                int(ordered_labels[0]): "silent_dropout",
                int(ordered_labels[1]): "at_risk",
                int(ordered_labels[2]): "placement_ready",
            }

            for idx, row in enumerate(score_rows):
                cluster_name = label_to_cluster.get(int(labels[idx]), "at_risk")
                assignments.append((str(row["id"]), cluster_name))

        counters: dict[str, int] = {
            "placement_ready": 0,
            "at_risk": 0,
            "silent_dropout": 0,
        }

        for score_row_id, cluster_name in assignments:
            client.table("vigilo_scores").update({"cluster": cluster_name}).eq("id", score_row_id).execute()
            counters[cluster_name] += 1

        return {
            "placement_ready": counters["placement_ready"],
            "at_risk": counters["at_risk"],
            "silent_dropout": counters["silent_dropout"],
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
    except Exception as exc:
        print(f"[cluster_engine] run_batch_clustering failed: {exc}")
        return _empty_result()
