"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const STRAPI_URL = process.env.STRAPI_BASE_URL || "http://localhost:1337";

export async function login(prevState: any, formData: FormData) {
    const identifier = formData.get("identifier");
    const password = formData.get("password");

    if (!identifier || !password) {
        return { error: "Bitte geben Sie Benutzername und Passwort ein." };
    }

    try {
        const res = await fetch(`${STRAPI_URL}/api/auth/local`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                identifier,
                password,
            }),
            cache: "no-store",
        });

        const data = await res.json();

        console.log(data);

        if (!res.ok) {
            return { error: "Ungültige Anmeldedaten." };
        }

        const cookieStore = await cookies();
        cookieStore.set("jwt", data.jwt, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 60 * 60 * 24 * 7, // 1 week
            path: "/",
        });

        cookieStore.set("user", JSON.stringify(data.user), {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 60 * 60 * 24 * 7, // 1 week
            path: "/",
        });

    } catch (error) {
        console.error("Login error:", error);
        return { error: "Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut." };
    }

    redirect("/");
}

export async function logout() {
    const cookieStore = await cookies();
    cookieStore.delete("jwt");
    cookieStore.delete("user");
    redirect("/login");
}
