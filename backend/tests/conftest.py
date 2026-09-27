import pytest
from datetime import datetime, timedelta, timezone
from uuid import uuid4
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.database import Base, get_db
from backend.main import app
from backend import auth, models_db

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


@pytest.fixture(autouse=True, scope="session")
def setup_test_db():
    """Create all tables once for the entire test session."""
    # Import all models so Base.metadata knows about them
    import backend.models_db  # noqa: F401

    Base.metadata.create_all(bind=engine)
    app.dependency_overrides[get_db] = override_get_db
    yield
    Base.metadata.drop_all(bind=engine)
    app.dependency_overrides.pop(get_db, None)


@pytest.fixture()
def db_session():
    """Provide a transactional DB session that rolls back after each test."""
    db = TestingSessionLocal()
    yield db
    # Clean all rows after each test to avoid cross-test pollution
    for table in reversed(Base.metadata.sorted_tables):
        db.execute(table.delete())
    db.commit()
    db.close()


@pytest.fixture()
def auth_headers_factory(db_session):
    def create_headers(
        *,
        membership_tier: str = "free",
        role: str = "user",
        active_days: int = 30,
    ) -> dict[str, str]:
        user = models_db.User(
            email=f"{uuid4()}@dublajlab.com",
            password_hash=auth.get_password_hash("testpassword"),
            display_name="Test User",
            role=role,
            membership_tier=membership_tier,
            membership_expires_at=(
                datetime.now(timezone.utc) + timedelta(days=active_days)
                if membership_tier == "vip"
                else None
            ),
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
        token = auth.create_access_token({"sub": user.id})
        return {"Authorization": f"Bearer {token}"}

    return create_headers
