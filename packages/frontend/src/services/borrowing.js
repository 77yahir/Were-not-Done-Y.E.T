import { apiFetch } from "./api"

export function getBorrowedGames() {
    return apiFetch("/borrowings/")
}