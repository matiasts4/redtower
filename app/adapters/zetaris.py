import os
from pathlib import Path

from app.store import ROOT, bind_params, load_queries


class ZetarisSource:
    """Runs the same named SQL against the Zetaris REST API."""

    def __init__(self, root: Path | None = None):
        root = root or ROOT
        self.queries = load_queries(root / "sql" / "queries.sql")
        self.base = os.environ.get("ZETARIS_API_URL", "http://localhost:8888").rstrip("/")
        self.login_path = os.environ.get("ZETARIS_LOGIN_PATH", "/api/auth/login")
        self.sql_path = os.environ.get("ZETARIS_SQL_PATH", "/api/proxy/query/sql/start")
        self.user = os.environ.get("ZETARIS_USER", "")
        self.password = os.environ.get("ZETARIS_PASSWORD", "")
        self.token = None
        self.org_id = None

    def sql(self, name: str, scenario_id: str) -> str:
        if name not in self.queries:
            raise KeyError(f"Unknown query: {name}")
        return bind_params(self.queries[name], scenario_id)

    def run(self, name: str, scenario_id: str) -> list[dict]:
        import requests

        self._login()
        response = requests.post(
            f"{self.base}{self.sql_path}",
            headers={
                "Authorization": f"Bearer {self.token}",
                "X-Org-ID": str(self.org_id or ""),
                "Content-Type": "application/json",
            },
            json={"select": self.sql(name, scenario_id), "pageLimit": 200},
            timeout=60,
        )
        response.raise_for_status()
        return _rows(response.json())

    def _login(self) -> None:
        if self.token:
            return
        if not self.user or not self.password:
            raise RuntimeError(
                "ZETARIS_USER and ZETARIS_PASSWORD are required outside SAMPLE_MODE."
            )
        import requests

        response = requests.post(
            f"{self.base}{self.login_path}",
            json={"username": self.user, "password": self.password},
            timeout=30,
        )
        response.raise_for_status()
        body = response.json()
        self.token = _find(body, ("idToken", "token", "accessToken", "access_token", "jwt"))
        self.org_id = _find(body, ("orgId", "org_id"))
        if not self.token:
            raise RuntimeError("Zetaris login response did not include a token.")


def _find(body, keys):
    if not isinstance(body, dict):
        return None
    for key in keys:
        if body.get(key) not in (None, ""):
            return body[key]
    for value in body.values():
        if isinstance(value, dict):
            found = _find(value, keys)
            if found not in (None, ""):
                return found
    return None


def _rows(body) -> list[dict]:
    raw = None
    if isinstance(body, list):
        raw = body
    elif isinstance(body, dict):
        for key in ("records", "data", "rows", "result", "resultSet"):
            if isinstance(body.get(key), list):
                raw = body[key]
                break
    if raw is None:
        snippet = str(body)[:180]
        raise RuntimeError(f"Zetaris response did not contain recognizable rows: {snippet}")
    rows = []
    for item in raw:
        if not isinstance(item, dict):
            raise RuntimeError("Zetaris returned a row that is not an object.")
        rows.append({str(key): "" if value is None else str(value) for key, value in item.items()})
    return rows
