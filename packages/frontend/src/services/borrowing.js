import { apiFetch } from "./api"

export function getBorrowedGames() {
    return apiFetch("/borrowings/")
}

export function getMyLending() {
    return apiFetch("/borrowings/lending");
}

export function requestBorrow(libraryItemId, dueAt) {
    return apiFetch("/borrowings/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ library_item_id: libraryItemId, due_at: dueAt})
    });
}

export function respondToBorrowRequest(borrowingId, decision) {
    return apiFetch(`/borrowings/${borrowingId}/decision`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ decision })
    })
}

export function markReturned(borrowingId) {
    return apiFetch(`/borrowings/${borrowingId}/return`, { method: "PATCH" });
}

