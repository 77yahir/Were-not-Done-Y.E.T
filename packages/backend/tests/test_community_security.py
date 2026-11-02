import os

import pytest
from postgrest.exceptions import APIError
from supabase import create_client

@pytest.fixture
def anonymous_client():
    url = os.getenv(
        "SUPABASE_TEST_URL",
        "http://127.0.0.1:54321"
    )
    key = os.getenv("SUPABASE_TEST_ANON_KEY")

    if not key:
        pytest.fail(
            "SUPABASE_TEST_ANON_KEY is not configured"
        )

    return create_client(url, key)

def test_anonymous_cannot_create_community(anonymous_client):
    with pytest.raises(APIError) as exc_info:
        anonymous_client.rpc(
            "create_community",
            {
                "p_name": "Unauthorized Community",
                "p_description": "Security test",
            },
        ).execute()

    error = exc_info.value

    assert error.code == "42501"

def test_owner_can_create_community(test_users):
    owner = test_users[0]

    response = owner.rpc(
        "create_community",
        {
            "p_name": "Test Community",
            "p_description": "Automated test",
        },
    ).execute()

    group_id = response.data

    assert group_id is not None

    membership = (
        owner.table("group_memberships")
        .select("role, status")
        .eq("group_id", group_id)
        .single()
        .execute()
    )

    assert membership.data["role"] == "owner"
    assert membership.data["status"] == "approved"   

def test_owner_can_appoint_admin(test_users):
    owner, member, _ = test_users

    # Owner creates a community
    group_id = owner.rpc(
        "create_community",
        {"p_name": "Admin Test Community"}
    ).execute().data

    # Member requests to join
    member.rpc(
        "request_to_join_community",
        {"p_group_id": group_id}
    ).execute()

    # Get member's pending request
    membership = (
        member.table("group_memberships")
        .select("membership_id")
        .eq("group_id", group_id)
        .single()
        .execute()
    )

    # Owner approves membership
    owner.rpc(
        "review_join_request",
        {
            "p_membership_id": membership.data["membership_id"],
            "p_decision": "approved",
        },
    ).execute()

    # Owner appoints member as admin
    member_id = member.auth.get_user().user.id

    owner.rpc(
        "appoint_community_admin",
        {
            "p_group_id": group_id,
            "p_user_id": str(member_id),
        },
    ).execute()

    result = (
        member.table("group_memberships")
        .select("role, status")
        .eq("group_id", group_id)
        .single()
        .execute()
    )

    assert result.data["role"] == "admin"
    assert result.data["status"] == "approved"

def test_regular_member_cannot_appoint_admin(test_users):
    owner, member, other = test_users

    group_id = owner.rpc(
        "create_community",
        {"p_name": "Permission Test Community"}
    ).execute().data

    # Both users request membership
    for client in (member, other):
        client.rpc(
            "request_to_join_community",
            {"p_group_id": group_id}
        ).execute()

        membership = (
            client.table("group_memberships")
            .select("membership_id")
            .eq("group_id", group_id)
            .single()
            .execute()
        )

        owner.rpc(
            "review_join_request",
            {
                "p_membership_id": membership.data["membership_id"],
                "p_decision": "approved",
            },
        ).execute()

    other_id = str(other.auth.get_user().user.id)

    # Regular member attempts to appoint another admin
    with pytest.raises(APIError):
        member.rpc(
            "appoint_community_admin",
            {
                "p_group_id": group_id,
                "p_user_id": other_id,
            },
        ).execute()

    # Verify the other user's role did not change
    result = (
        other.table("group_memberships")
        .select("role")
        .eq("group_id", group_id)
        .single()
        .execute()
    )

    assert result.data["role"] == "member"
    
def test_regular_member_cannot_approve_request(test_users):
    owner, member, applicant = test_users
    
    group_id = owner.rpc(
        "create_community",
        {"p_name": "Unauthorized Approval Test"}
    ).execute().data
    
    member.rpc(
        "request_to_join_community",
        {"p_group_id": group_id}
    ).execute()
    
    member_membership = (
        member.table("group_memberships")
        .select("membership_id")
        .eq("group_id", group_id)
        .single()
        .execute()
    )
    
    owner.rpc(
        "review_join_request",
        {
            "p_membership_id": member_membership.data["membership_id"],
            "p_decision": "approved",
        }
    ).execute()
    
    applicant.rpc(
        "request_to_join_community",
        {"p_group_id": group_id}
    ).execute()

    applicant_membership = (
        applicant.table("group_memberships")
        .select("membership_id")
        .eq("group_id", group_id)
        .single()
        .execute()
    )
    
    with pytest.raises(APIError) as exc_info:
        member.rpc(
            "review_join_request",
            {
                "p_membership_id": applicant_membership.data["membership_id"],
                "p_decision": "approved",
            }
        ).execute()
        
    assert exc_info.value.message == "Not authorized to review requests"
    
    result = (
        applicant.table("group_memberships")
        .select("status")
        .eq("membership_id", applicant_membership.data["membership_id"])
        .single()
        .execute()
    )
    
    assert result.data["status"] == "pending"
   
def test_regular_member_cannot_reject_request(test_users):
    owner, regular_member, applicant = test_users

    # Create community
    group_id = owner.rpc(
        "create_community",
        {"p_name": "Admin Approval Test"}
    ).execute().data

    # Regular member requests to join
    regular_member.rpc(
        "request_to_join_community",
        {"p_group_id": group_id}
    ).execute()

    regular_member_membership = (
        regular_member.table("group_memberships")
        .select("membership_id")
        .eq("group_id", group_id)
        .single()
        .execute()
    )

    # Owner approves regular member
    owner.rpc(
        "review_join_request",
        {
            "p_membership_id": regular_member_membership.data["membership_id"],
            "p_decision": "approved",
        },
    ).execute()

    # Applicant requests to join
    applicant.rpc(
        "request_to_join_community",
        {"p_group_id": group_id}
    ).execute()

    applicant_membership = (
        applicant.table("group_memberships")
        .select("membership_id")
        .eq("group_id", group_id)
        .single()
        .execute()
    )

    # Verify that regular member rejecting a request fails
    with pytest.raises(APIError) as exc_info:
        regular_member.rpc(
            "review_join_request",
            {
                "p_membership_id": applicant_membership.data["membership_id"],
                "p_decision": "rejected",
            }
        ).execute()
        
    assert exc_info.value.message == "Not authorized to review requests"
    
    result = (
        applicant.table("group_memberships")
        .select("status")
        .eq("membership_id", applicant_membership.data["membership_id"])
        .single()
        .execute()
    )
    
    assert result.data["status"] == "pending"
      
def test_admin_can_approve_join_request(test_users):
    owner, admin_user, applicant = test_users

    # Create community
    group_id = owner.rpc(
        "create_community",
        {"p_name": "Admin Approval Test"}
    ).execute().data

    # Admin candidate requests to join
    admin_user.rpc(
        "request_to_join_community",
        {"p_group_id": group_id}
    ).execute()

    admin_membership = (
        admin_user.table("group_memberships")
        .select("membership_id")
        .eq("group_id", group_id)
        .single()
        .execute()
    )

    # Owner approves and appoints admin
    owner.rpc(
        "review_join_request",
        {
            "p_membership_id": admin_membership.data["membership_id"],
            "p_decision": "approved",
        },
    ).execute()

    owner.rpc(
        "appoint_community_admin",
        {
            "p_group_id": group_id,
            "p_user_id": str(admin_user.auth.get_user().user.id),
        },
    ).execute()

    # Third user requests to join
    applicant.rpc(
        "request_to_join_community",
        {"p_group_id": group_id}
    ).execute()

    applicant_membership = (
        applicant.table("group_memberships")
        .select("membership_id")
        .eq("group_id", group_id)
        .single()
        .execute()
    )

    # Appointed admin approves request
    admin_user.rpc(
        "review_join_request",
        {
            "p_membership_id": applicant_membership.data["membership_id"],
            "p_decision": "approved",
        },
    ).execute()

    # Verify approval
    result = (
        applicant.table("group_memberships")
        .select("role, status")
        .eq("group_id", group_id)
        .single()
        .execute()
    )

    assert result.data["role"] == "member"
    assert result.data["status"] == "approved"
    
def test_admin_can_reject_join_request(test_users):
    owner, admin_user, applicant = test_users

    # Create community
    group_id = owner.rpc(
        "create_community",
        {"p_name": "Admin Approval Test"}
    ).execute().data

    # Admin candidate requests to join
    admin_user.rpc(
        "request_to_join_community",
        {"p_group_id": group_id}
    ).execute()

    admin_membership = (
        admin_user.table("group_memberships")
        .select("membership_id")
        .eq("group_id", group_id)
        .single()
        .execute()
    )

    # Owner approves and appoints admin
    owner.rpc(
        "review_join_request",
        {
            "p_membership_id": admin_membership.data["membership_id"],
            "p_decision": "approved",
        },
    ).execute()

    owner.rpc(
        "appoint_community_admin",
        {
            "p_group_id": group_id,
            "p_user_id": str(admin_user.auth.get_user().user.id),
        },
    ).execute()

    # Third user requests to join
    applicant.rpc(
        "request_to_join_community",
        {"p_group_id": group_id}
    ).execute()

    applicant_membership = (
        applicant.table("group_memberships")
        .select("membership_id")
        .eq("group_id", group_id)
        .single()
        .execute()
    )

    # Appointed admin rejects request
    admin_user.rpc(
        "review_join_request",
        {
            "p_membership_id": applicant_membership.data["membership_id"],
            "p_decision": "rejected",
        },
    ).execute()

    # Verify rejection
    result = (
        applicant.table("group_memberships")
        .select("role, status")
        .eq("group_id", group_id)
        .single()
        .execute()
    )

    assert result.data["role"] == "member"
    assert result.data["status"] == "rejected"

def test_cannot_review_already_reviewed_request(test_users):
    owner, applicant, _ = test_users
    
    group_id = owner.rpc(
        "create_community",
        {"p_name": "Owner Cannot Review Resolved Request"}
    ).execute().data
    
    applicant.rpc(
        "request_to_join_community",
        {"p_group_id": group_id}
    ).execute()
    
    applicant_membership = (
        applicant.table("group_memberships")
        .select("membership_id")
        .eq("group_id", group_id)
        .single()
        .execute()
    )
    
    owner.rpc(
        "review_join_request",
        {
            "p_membership_id": applicant_membership.data["membership_id"],
            "p_decision": "rejected",
        },
    ).execute()
    
    result = (
        applicant.table("group_memberships")
        .select("role, status")
        .eq("group_id", group_id)
        .single()
        .execute()
    )
    
    assert result.data["role"] == "member"
    assert result.data["status"] == "rejected"
    
    with pytest.raises(APIError) as exc_info:
        owner.rpc(
            "review_join_request",
            {
                "p_membership_id": applicant_membership.data["membership_id"],
                "p_decision": "approved",
            },
        ).execute()
        
    assert exc_info.value.message == "Pending request not found"

def test_owner_can_reject_join_request(test_users):
    owner, applicant, _ = test_users
    
    group_id = owner.rpc(
        "create_community",
        {"p_name": "Owner Rejection Test"}
    ).execute().data
    
    applicant.rpc(
        "request_to_join_community",
        {"p_group_id": group_id}
    ).execute()
    
    applicant_membership = (
        applicant.table("group_memberships")
        .select("membership_id")
        .eq("group_id", group_id)
        .single()
        .execute()
    )
    
    owner.rpc(
        "review_join_request",
        {
            "p_membership_id": applicant_membership.data["membership_id"],
            "p_decision": "rejected",
        },
    ).execute()
    
    result = (
        applicant.table("group_memberships")
        .select("role, status")
        .eq("group_id", group_id)
        .single()
        .execute()
    )
    
    assert result.data["role"] == "member"
    assert result.data["status"] == "rejected"

def test_owner_can_accept_join_request(test_users):
    owner, applicant, _ = test_users
    
    group_id = owner.rpc(
        "create_community",
        {"p_name": "Owner Rejection Test"}
    ).execute().data
    
    applicant.rpc(
        "request_to_join_community",
        {"p_group_id": group_id}
    ).execute()
    
    applicant_membership = (
        applicant.table("group_memberships")
        .select("membership_id")
        .eq("group_id", group_id)
        .single()
        .execute()
    )
    
    owner.rpc(
        "review_join_request",
        {
            "p_membership_id": applicant_membership.data["membership_id"],
            "p_decision": "approved",
        },
    ).execute()
    
    result = (
        applicant.table("group_memberships")
        .select("role, status")
        .eq("group_id", group_id)
        .single()
        .execute()
    )
    
    assert result.data["role"] == "member"
    assert result.data["status"] == "approved"

def test_invalid_join_request_decision(test_users):
    owner, applicant, _ = test_users
    
    group_id = owner.rpc(
        "create_community",
        {"p_name": "Invalid Decision Test"}
    ).execute().data
    
    applicant.rpc(
        "request_to_join_community",
        {"p_group_id": group_id}
    ).execute()
    
    applicant_membership = (
        applicant.table("group_memberships")
        .select("membership_id")
        .eq("group_id", group_id)
        .single()
        .execute()
    )
    
    with pytest.raises(APIError) as exc_info:
        owner.rpc(
            "review_join_request",
            {
                "p_membership_id": applicant_membership.data["membership_id"],
                "p_decision": "maybe",
            },
        ).execute()
        
    assert exc_info.value.message == "Invalid decision"
    
    result = (
        applicant.table("group_memberships")
        .select("role, status")
        .eq("group_id", group_id)
        .single()
        .execute()
    )
    assert result.data["role"] == "member"
    assert result.data["status"] == "pending"

def test_admin_removes_member_and_member_rejoins(test_users):
    owner, admin_user, member = test_users

    group_id = owner.rpc(
        "create_community",
        {"p_name": "Member Removal Test"}
    ).execute().data

    # Approve both users
    for client in (admin_user, member):
        client.rpc(
            "request_to_join_community",
            {"p_group_id": group_id}
        ).execute()

        membership = (
            client.table("group_memberships")
            .select("membership_id")
            .eq("group_id", group_id)
            .single()
            .execute()
        )

        owner.rpc(
            "review_join_request",
            {
                "p_membership_id": membership.data["membership_id"],
                "p_decision": "approved",
            },
        ).execute()

    # Appoint admin
    owner.rpc(
        "appoint_community_admin",
        {
            "p_group_id": group_id,
            "p_user_id": str(admin_user.auth.get_user().user.id),
        },
    ).execute()

    # Admin removes regular member
    admin_user.rpc(
        "remove_community_member",
        {
            "p_group_id": group_id,
            "p_user_id": str(member.auth.get_user().user.id),
        },
    ).execute()

    removed = (
        member.table("group_memberships")
        .select("role, status")
        .eq("group_id", group_id)
        .single()
        .execute()
    )

    assert removed.data["role"] == "member"
    assert removed.data["status"] == "removed"

    # Removed member requests to rejoin
    member.rpc(
        "request_to_join_community",
        {"p_group_id": group_id}
    ).execute()

    rejoined = (
        member.table("group_memberships")
        .select("role, status")
        .eq("group_id", group_id)
        .single()
        .execute()
    )

    assert rejoined.data["role"] == "member"
    assert rejoined.data["status"] == "pending"

def approve_member(owner, client, group_id):
    client.rpc(
        "request_to_join_community",
        {"p_group_id": group_id},
    ).execute()

    membership = (
        client.table("group_memberships")
        .select("membership_id")
        .eq("group_id", group_id)
        .single()
        .execute()
    )

    owner.rpc(
        "review_join_request",
        {
            "p_membership_id": membership.data["membership_id"],
            "p_decision": "approved",
        },
    ).execute()

def test_admin_cannot_remove_another_admin(test_users):
    owner, admin1, admin2 = test_users

    group_id = owner.rpc(
        "create_community",
        {"p_name": "Admin Protection Test"},
    ).execute().data

    for client in (admin1, admin2):
        approve_member(owner, client, group_id)

        owner.rpc(
            "appoint_community_admin",
            {
                "p_group_id": group_id,
                "p_user_id": str(client.auth.get_user().user.id),
            },
        ).execute()

    with pytest.raises(APIError):
        admin1.rpc(
            "remove_community_member",
            {
                "p_group_id": group_id,
                "p_user_id": str(admin2.auth.get_user().user.id),
            },
        ).execute()

    result = (
        admin2.table("group_memberships")
        .select("role, status")
        .eq("group_id", group_id)
        .single()
        .execute()
    )

    assert result.data["role"] == "admin"
    assert result.data["status"] == "approved"

def test_owner_cannot_be_removed(test_users):
    owner, admin_user, _ = test_users

    group_id = owner.rpc(
        "create_community",
        {"p_name": "Owner Protection Test"},
    ).execute().data

    approve_member(owner, admin_user, group_id)

    owner.rpc(
        "appoint_community_admin",
        {
            "p_group_id": group_id,
            "p_user_id": str(admin_user.auth.get_user().user.id),
        },
    ).execute()

    owner_id = str(owner.auth.get_user().user.id)

    # Admin attempts to remove owner
    with pytest.raises(APIError):
        admin_user.rpc(
            "remove_community_member",
            {
                "p_group_id": group_id,
                "p_user_id": owner_id,
            },
        ).execute()

    # Owner attempts to remove themselves
    with pytest.raises(APIError):
        owner.rpc(
            "remove_community_member",
            {
                "p_group_id": group_id,
                "p_user_id": owner_id,
            },
        ).execute()

    result = (
        owner.table("group_memberships")
        .select("role, status")
        .eq("group_id", group_id)
        .single()
        .execute()
    )

    assert result.data["role"] == "owner"
    assert result.data["status"] == "approved"

def test_owner_can_view_pending_requests(test_users):
    owner, applicant, _ = test_users

    group_id = owner.rpc(
        "create_community",
        {"p_name": "Owner Request Test"}
    ).execute().data

    applicant.rpc(
        "request_to_join_community",
        {"p_group_id": group_id}
    ).execute()

    result = owner.rpc(
        "get_pending_join_requests",
        {"p_group_id": group_id}
    ).execute()

    assert len(result.data) == 1
    assert result.data[0]["user_id"] == str(
        applicant.auth.get_user().user.id
    )

def test_admin_can_view_pending_requests(test_users):
    owner, admin_user, applicant = test_users

    group_id = owner.rpc(
        "create_community",
        {"p_name": "Admin Request Test"}
    ).execute().data

    # Approve and appoint admin
    approve_member(owner, admin_user, group_id)

    owner.rpc(
        "appoint_community_admin",
        {
            "p_group_id": group_id,
            "p_user_id": str(
                admin_user.auth.get_user().user.id
            ),
        },
    ).execute()

    # Applicant requests to join
    applicant.rpc(
        "request_to_join_community",
        {"p_group_id": group_id}
    ).execute()

    result = admin_user.rpc(
        "get_pending_join_requests",
        {"p_group_id": group_id}
    ).execute()

    assert len(result.data) == 1
    assert result.data[0]["user_id"] == str(
        applicant.auth.get_user().user.id
    )

def test_regular_member_cannot_view_pending_requests(test_users):
    owner, member, applicant = test_users

    group_id = owner.rpc(
        "create_community",
        {"p_name": "Private Request Test"}
    ).execute().data

    approve_member(owner, member, group_id)

    applicant.rpc(
        "request_to_join_community",
        {"p_group_id": group_id}
    ).execute()

    with pytest.raises(APIError):
        member.rpc(
            "get_pending_join_requests",
            {"p_group_id": group_id}
        ).execute()

def test_anonymous_cannot_view_pending_requests(
    anonymous_client,
):
    with pytest.raises(APIError) as exc_info:
        anonymous_client.rpc(
            "get_pending_join_requests",
            {
                "p_group_id": "00000000-0000-0000-0000-000000000000"
            },
        ).execute()

    assert exc_info.value.code == "42501"

def test_owner_can_review_requests_permission(test_users):
    owner, _, _ = test_users

    group_id = owner.rpc(
        "create_community",
        {"p_name": "Owner Permission Test"}
    ).execute().data

    result = owner.rpc(
        "get_my_community_permissions",
        {"p_group_id": group_id}
    ).execute()

    permissions = result.data[0]

    assert permissions["role"] == "owner"
    assert permissions["status"] == "approved"
    assert permissions["can_review_requests"] is True
    

def test_admin_can_review_requests_permission(test_users):
    owner, admin_user, _ = test_users

    # 1. Create a community
    group_id = owner.rpc(
        "create_community",
        {"p_name": "Admin Permission Test"}
    ).execute().data

    # 2. Approve admin_user as a regular member
    approve_member(owner, admin_user, group_id)

    # 3. Appoint the approved member as admin
    owner.rpc(
        "appoint_community_admin",
        {
            "p_group_id": group_id,
            "p_user_id": str(admin_user.auth.get_user().user.id),
        }
    ).execute()

    # 4. Retrieve permissions as the admin
    result = admin_user.rpc(
        "get_my_community_permissions",
        {"p_group_id": group_id}
    ).execute()

    permissions = result.data[0]

    # 5. Verify admin permissions
    assert permissions["role"] == "admin"
    assert permissions["status"] == "approved"
    assert permissions["can_review_requests"] is True


def test_regular_member_cannot_review_requests_permission(test_users):
    owner, regular_member, _ = test_users

    group_id = owner.rpc(
        "create_community",
        {"p_name": "Regular Member Permission Test"}
    ).execute().data

    # Approve the user without appointing them admin
    approve_member(owner, regular_member, group_id)

    result = regular_member.rpc(
        "get_my_community_permissions",
        {"p_group_id": group_id}
    ).execute()

    permissions = result.data[0]

    assert permissions["role"] == "member"
    assert permissions["status"] == "approved"
    assert permissions["can_review_requests"] is False


def test_pending_applicant_cannot_review_requests_permission(test_users):
    owner, applicant, _ = test_users

    group_id = owner.rpc(
        "create_community",
        {"p_name": "Pending Applicant Permission Test"}
    ).execute().data

    applicant.rpc(
        "request_to_join_community",
        {"p_group_id": group_id}
    ).execute()

    result = applicant.rpc(
        "get_my_community_permissions",
        {"p_group_id": group_id}
    ).execute()

    permissions = result.data[0]

    assert permissions["role"] == "member"
    assert permissions["status"] == "pending"
    assert permissions["can_review_requests"] is False


def test_nonmember_cannot_review_requests_permission(test_users):
    owner, nonmember, _ = test_users

    group_id = owner.rpc(
        "create_community",
        {"p_name": "Nonmember Permission Test"}
    ).execute().data

    result = nonmember.rpc(
        "get_my_community_permissions",
        {"p_group_id": group_id}
    ).execute()

    permissions = result.data[0]

    assert permissions["role"] is None
    assert permissions["status"] is None
    assert permissions["can_review_requests"] is False
