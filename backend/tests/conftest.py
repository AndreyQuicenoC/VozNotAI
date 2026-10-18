import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.core.security import get_password_hash
from backend.db.base import Base
from backend.db.session import get_db
from backend.main import app
from backend.models import Conversation, Note, SystemSettings, User

from sqlalchemy.pool import StaticPool

TEST_DATABASE_URL = "sqlite:///:memory:"

test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="function")
def db_session():
    Base.metadata.create_all(bind=test_engine)
    session = TestingSessionLocal()

    # Seed default system settings
    sys_settings = SystemSettings(
        execution_mode="local",
        local_model_name="base",
        local_model_available=True,
        remote_provider_enabled=False,
        remote_provider_name="OpenAI Whisper",
        remote_endpoint="https://api.openai.com/v1",
        remote_model_name="whisper-1",
        remote_api_key_masked="",
        usage_rate_per_audio_minute=0.0060,
        maximum_audio_duration_seconds=120,
        maximum_upload_size_bytes=26214400,
    )
    session.add(sys_settings)
    session.commit()

    yield session

    session.close()
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture(scope="function")
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def admin_user(db_session) -> User:
    user = User(
        first_name="Admin",
        last_name="Quiceno",
        email="admin@clustlayer.com",
        password_hash=get_password_hash("AdminPass123!"),
        role="admin",
        role_title="Super Admin",
        organization="ClustLayer Core",
        is_active=True,
        is_verified=True,
        max_minutes_quota=0,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def customer_user_a(db_session) -> User:
    user = User(
        first_name="Cliente",
        last_name="Alfa",
        email="cliente.a@eureka.ai",
        password_hash=get_password_hash("Password123!"),
        role="customer",
        role_title="Cliente Pro",
        organization="Clinica Alfa",
        is_active=True,
        is_verified=True,
        max_minutes_quota=120,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def customer_user_b(db_session) -> User:
    user = User(
        first_name="Cliente",
        last_name="Beta",
        email="cliente.b@eureka.ai",
        password_hash=get_password_hash("Password123!"),
        role="customer",
        role_title="Cliente Pro",
        organization="Bufete Beta",
        is_active=True,
        is_verified=True,
        max_minutes_quota=120,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user
