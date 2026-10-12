
import os
import uuid

import pytest
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

LOCAL_URL = "http://127.0.0.1:54321"


@pytest.fixture(scope="session")
def test_config():
    url = os.getenv("SUPABASE_TEST_URL")
    anon_key = os.getenv("SUPABASE_TEST_ANON_KEY")
    service_key = os.getenv("SUPABASE_TEST_SERVICE_ROLE_KEY")

    # Prevent tests from targeting the hosted database
    if url != LOCAL_URL:
        pytest.fail("Tests must use local Supabase")

    if not anon_key or not service_key:
        pytest.fail("Missing local Supabase test keys")

    return url, anon_key, service_key

@pytest.fixture
def anonymous_client(test_config):
    url, anon_key, _ = test_config
    return create_client(url, anon_key)

@pytest.fixture
def test_users(test_config):
    url, anon_key, service_key = test_config

    admin = create_client(url, service_key)

    users = []
    clients = []

    try:
        for i in range(3):
            email = f"test-{uuid.uuid4().hex}@example.com"
            password = f"Test-{uuid.uuid4().hex}!"

            response = admin.auth.admin.create_user({
                "email": email,
                "password": password,
                "email_confirm": True,
            })

            user_id = str(response.user.id)
            users.append(user_id)

            admin.table("users").insert({
                "user_id": user_id,
                "username": f"test_{uuid.uuid4().hex[:12]}",
                "email": email,
            }).execute()

            client = create_client(url, anon_key)

            client.auth.sign_in_with_password({
                "email": email,
                "password": password,
            })

            clients.append(client)

        yield clients


    finally:
        # Remove communities created by test users
        for user_id in users:
            admin.table("community_groups") \
                .delete() \
                .eq("created_by_user_id", user_id) \
                .execute()

        # Remove public profiles
        for user_id in reversed(users):
            admin.table("users") \
                .delete() \
                .eq("user_id", user_id) \
                .execute()

        # Remove Supabase Auth accounts
        for user_id in reversed(users):
            admin.auth.admin.delete_user(user_id)

