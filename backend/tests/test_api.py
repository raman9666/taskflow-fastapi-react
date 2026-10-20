import os

os.environ["TASKFLOW_DATABASE_URL"] = "sqlite:///./test_taskflow.db"

import pytest
from fastapi.testclient import TestClient

from app.database import Base, engine
from app.main import app


@pytest.fixture(autouse=True)
def fresh_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


def auth_headers(client: TestClient, email: str = "dev@example.com") -> dict[str, str]:
    client.post("/api/auth/register", json={"email": email, "full_name": "Dev", "password": "strongpass1"})
    res = client.post("/api/auth/login", data={"username": email, "password": "strongpass1"})
    return {"Authorization": f"Bearer {res.json()['access_token']}"}


def test_register_and_login(client):
    res = client.post("/api/auth/register", json={"email": "a@b.com", "full_name": "A", "password": "strongpass1"})
    assert res.status_code == 201
    assert client.post("/api/auth/register", json={"email": "a@b.com", "full_name": "A", "password": "strongpass1"}).status_code == 409
    assert client.post("/api/auth/login", data={"username": "a@b.com", "password": "wrong-pass"}).status_code == 401


def test_task_crud_and_stats(client):
    h = auth_headers(client)
    created = client.post("/api/tasks", json={"title": "Write API docs", "priority": "high"}, headers=h)
    assert created.status_code == 201
    task_id = created.json()["id"]

    assert client.patch(f"/api/tasks/{task_id}", json={"status": "done"}, headers=h).json()["status"] == "done"
    assert len(client.get("/api/tasks?status=done", headers=h).json()) == 1

    stats = client.get("/api/tasks/stats", headers=h).json()
    assert stats["total"] == 1 and stats["done"] == 1

    assert client.delete(f"/api/tasks/{task_id}", headers=h).status_code == 204
    assert client.get(f"/api/tasks/{task_id}", headers=h).status_code == 404


def test_users_cannot_see_each_others_tasks(client):
    h1 = auth_headers(client, "one@example.com")
    h2 = auth_headers(client, "two@example.com")
    task_id = client.post("/api/tasks", json={"title": "Private"}, headers=h1).json()["id"]
    assert client.get(f"/api/tasks/{task_id}", headers=h2).status_code == 404
    assert client.get("/api/tasks", headers=h2).json() == []


def test_requires_auth(client):
    assert client.get("/api/tasks").status_code == 401
