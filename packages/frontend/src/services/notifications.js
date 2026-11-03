import { apiFetch } from "./api"

export function getNotifications() {
    return apiFetch("/notifications/");
}

export function markAsRead(notificationId) {
    return apiFetch(`/notifications/${notificationId}/read`, {
        method: "PATCH"
    });
}