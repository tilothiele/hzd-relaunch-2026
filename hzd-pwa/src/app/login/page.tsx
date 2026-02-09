"use client";

import Image from "next/image";
import { useActionState } from "react";
import { login } from "@/actions/auth";

const initialState = {
    error: "",
};

export default function LoginPage() {
    const [state, formAction, isPending] = useActionState(login, initialState);

    return (
        <div
            className="flex min-h-screen flex-col items-center justify-center p-4 bg-[var(--color-goldbeige)]"
        >
            <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-6 shadow-md dark:bg-gray-800 sm:p-8">
                <div className="flex flex-col items-center">
                    <Image
                        src="/android/android-launchericon-192-192.png"
                        alt="Logo"
                        width={96}
                        height={96}
                        className="h-24 w-24 rounded-xl"
                        priority
                    />
                    <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                        Anmelden
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
                        HZD-App
                    </p>
                </div>
                <form className="mt-8 space-y-6" action={formAction}>
                    <div className="space-y-4 shadow-sm">
                        <div>
                            <label htmlFor="identifier" className="sr-only">
                                E-Mail oder Benutzername
                            </label>
                            <input
                                id="identifier"
                                name="identifier"
                                type="text"
                                autoComplete="username"
                                required
                                className="relative block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 dark:bg-gray-700 dark:text-white dark:ring-gray-600 sm:text-sm sm:leading-6 pl-3"
                                placeholder="E-Mail oder Benutzername"
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="sr-only">
                                Passwort
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                className="relative block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 dark:bg-gray-700 dark:text-white dark:ring-gray-600 sm:text-sm sm:leading-6 pl-3"
                                placeholder="Passwort"
                            />
                        </div>
                    </div>

                    {state?.error && (
                        <div className="text-center text-sm text-red-600 dark:text-red-400">
                            {state.error}
                        </div>
                    )}

                    <div>
                        <button
                            type="submit"
                            disabled={isPending}
                            className="group relative flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-70"
                        >
                            {isPending ? "Anmelden..." : "Anmelden"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
