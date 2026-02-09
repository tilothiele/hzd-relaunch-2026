import Link from "next/link";
import Image from "next/image";
import { logout } from "@/actions/auth";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

export default function AuthenticatedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen flex-col font-[family-name:var(--font-geist-sans)] text-[var(--color-kapitaensblau)]">
            <header className="flex w-full items-center justify-between p-4 shadow-sm z-10 relative bg-[var(--color-goldbeige)] text-[var(--color-kapitaensblau)]">
                <Link href="/" className="flex items-center gap-4 hover:opacity-80 transition-opacity">
                    <Image
                        src="/android/android-launchericon-192-192.png"
                        alt="Logo"
                        width={48}
                        height={48}
                        className="h-12 w-12 rounded-lg"
                        priority
                    />
                    <span className="text-xl font-bold hidden sm:block">HZD-App</span>
                </Link>

                <Navigation />

                <form action={logout}>
                    <button type="submit" className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-red-600 text-white gap-2 hover:bg-red-700 text-sm h-10 px-4">
                        Abmelden
                    </button>
                </form>
            </header>

            <main className="flex flex-1 flex-col p-4 sm:p-8">
                {children}
            </main>

            <Footer />
        </div>
    );
}
