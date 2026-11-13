from app.db.supabase import get_supabase_client, get_user_supabase_client

def get_notifications(access_token: str):
    client = get_user_supabase_client(access_token)
    result = (
        client.table("notifications")
        .select("notification_id, type, message, is_read, created_at, sender_id, related_borrowing_id")
        .order("created_at", desc=True)
        .execute()
    )

    notifications = result.data

    sender_ids = {n["sender_id"] for n in notifications if n["sender_id"]}
    if sender_ids:
        admin = get_supabase_client()
        rows = (
            admin.table("users")
            .select("user_id, username")
            .in_("user_id", list(sender_ids))
            .execute()
            .data
        )
        names = {r["user_id"]: r["username"] for r in rows}
        for n in notifications:
            n["sender"] = {"username": names.get(n["sender_id"])}

    return notifications

def mark_as_read(notification_id: str, access_token: str):
    client = get_user_supabase_client(access_token)
    result = (
        client.table("notifications")
        .update({"is_read": True})
        .eq("notification_id", notification_id)
        .execute()
    )

    if not result.data:
        raise ValueError("Notification not found")

    return result.data[0]

def create_notification(
        recepient_id: str,
        type: str,
        message: str,
        sender_id: str | None = None,
        related_offer_id: str | None = None,
        related_borrowing_id: str | None = None
):
    admin = get_supabase_client()
    result = (
        admin.table("notifications")
        .insert({
            "user_id": recepient_id,
            "type": type,
            "message": message,
            "sender_id": sender_id,
            "related_offer_id": related_offer_id,
            "related_borrowing_id": related_borrowing_id
        })
        .execute()
    )

    return result.data[0]
