import csv
import os
import re
import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

SCENARIO_ID_RE = re.compile(r"scn-[a-z]+")

QUERY_NAMES = (
    "scenario_window",
    "routes",
    "stops",
    "stop_sequence",
    "positions",
    "demand",
    "reports",
    "road_events",
    "cameras",
    "weather",
    "vehicles",
)


def load_queries(path: Path | None = None) -> dict[str, str]:
    text = (path or ROOT / "sql" / "queries.sql").read_text(encoding="utf-8")
    parts = re.split(r"(?m)^-- name: (\S+)\s*$", text)
    queries: dict[str, str] = {}
    items = iter(parts[1:])
    for name, body in zip(items, items):
        queries[name] = body.strip().rstrip(";")
    missing = [name for name in QUERY_NAMES if name not in queries]
    if missing:
        raise RuntimeError(f"Missing queries in sql/queries.sql: {', '.join(missing)}")
    return queries


def bind_params(sql: str, scenario_id: str) -> str:
    if not SCENARIO_ID_RE.fullmatch(scenario_id):
        raise ValueError(f"Invalid scenario_id: {scenario_id}")
    bound = sql
    if ":scenario_id" in bound:
        bound = bound.replace(":scenario_id", f"'{scenario_id}'")
    return bound


def _load_sample_db(sample_dir: Path) -> sqlite3.Connection:
    connection = sqlite3.connect(":memory:")
    connection.row_factory = sqlite3.Row
    connection.execute("ATTACH DATABASE ':memory:' AS REDTOWER")
    for csv_path in sorted(sample_dir.glob("*.csv")):
        with csv_path.open(encoding="utf-8", newline="") as handle:
            reader = csv.DictReader(handle)
            columns = list(reader.fieldnames or [])
            rows = list(reader)
        column_sql = ", ".join(f'"{column}" TEXT' for column in columns)
        connection.execute(
            f'CREATE TABLE REDTOWER."{csv_path.stem}" ({column_sql})'
        )
        if not rows:
            continue
        placeholders = ", ".join("?" for _ in columns)
        connection.executemany(
            f'INSERT INTO REDTOWER."{csv_path.stem}" VALUES ({placeholders})',
            [tuple(row[column] for column in columns) for row in rows],
        )
    return connection


def _as_dicts(rows: list[sqlite3.Row]) -> list[dict]:
    return [dict(row) for row in rows]


class SampleSource:
    """Named queries from sql/queries.sql, executed on CSV sample tables."""

    def __init__(self, root: Path | None = None):
        root = root or ROOT
        self.queries = load_queries(root / "sql" / "queries.sql")
        self.connection = _load_sample_db(root / "data" / "sample")

    def run(self, name: str, scenario_id: str) -> list[dict]:
        if name not in self.queries:
            raise KeyError(f"Unknown query: {name}")
        sql = bind_params(self.queries[name], scenario_id)
        return _as_dicts(self.connection.execute(sql).fetchall())


def sample_mode() -> bool:
    return os.environ.get("SAMPLE_MODE", "true").strip().lower() in {"1", "true", "yes"}


def build_source(root: Path | None = None):
    if sample_mode():
        return SampleSource(root)
    from app.adapters.zetaris import ZetarisSource

    return ZetarisSource(root)
