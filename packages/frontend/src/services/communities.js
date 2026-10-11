import { apiFetch } from "./api";

export async function createCommunity(name, description) {
    return apiFetch("/communities/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            name: name,
            description: description,
        }),
    });
}