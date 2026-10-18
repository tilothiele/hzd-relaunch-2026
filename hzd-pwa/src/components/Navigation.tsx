"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/use-auth";

const publicItems = [
    { name: "Mitgliedsantrag", href: "/mitgliedsantrag" },
];

const stammItems = [
    { name: "HZD-Hunde", href: "/hunde" },
    { name: "HZD-Züchter", href: "/zuechter" },
];

export default function Navigation() {
    const pathname = usePathname();
    const { isAuthenticated, isInitialized } = useAuth();
    const showMemberItems = isInitialized && isAuthenticated;
    const [isOpen, setIsOpen] = useState(false);
    const [isStammOpen, setIsStammOpen] = useState(false);
    const stammRef = useRef<HTMLDivElement>(null);

    const navItems = [
        { name: "Körung", href: "/koerungen" },
        { name: "Zucht", href: "/wurfabnahmen" },
    ];

    const isActive = (href: string) => {
        if (href === "/wurfabnahmen") {
            return pathname.startsWith("/wurfabnahmen");
        }

        if (href === "/koerungen") {
            return pathname.startsWith("/koerungen");
        }

        return pathname === href || pathname.startsWith(`${href}/`);
    };

    const isStammActive = stammItems.some((item) => isActive(item.href));

    useEffect(() => {
        setIsStammOpen(false);
        setIsOpen(false);
    }, [pathname]);

    useEffect(() => {
        if (!isStammOpen) {
            return;
        }

        const handlePointerDown = (event: MouseEvent) => {
            if (!stammRef.current?.contains(event.target as Node)) {
                setIsStammOpen(false);
            }
        };

        window.addEventListener("mousedown", handlePointerDown);
        return () => window.removeEventListener("mousedown", handlePointerDown);
    }, [isStammOpen]);

    return (
        <>
            {/* Desktop Navigation */}
            <div className="hidden sm:flex sm:items-center sm:gap-2">
                <div className="flex sm:space-x-6">
                    {showMemberItems && navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`inline-flex items-center border-b-2 px-1 pt-1 text-base font-medium ${isActive(item.href)
                                ? "border-indigo-500 text-gray-900 dark:text-white"
                                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white"
                                }`}
                        >
                            {item.name}
                        </Link>
                    ))}
                    {showMemberItems && (
                    <div className="relative" ref={stammRef}>
                        <button
                            type="button"
                            aria-expanded={isStammOpen}
                            aria-haspopup="menu"
                            onClick={() => setIsStammOpen((open) => !open)}
                            className={`inline-flex items-center gap-1 border-b-2 px-1 pt-1 text-base font-medium ${isStammActive
                                ? "border-indigo-500 text-gray-900 dark:text-white"
                                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white"
                                }`}
                        >
                            Stammdaten
                            <span aria-hidden="true">{isStammOpen ? "▴" : "▾"}</span>
                        </button>
                        {isStammOpen && (
                            <div
                                role="menu"
                                className="absolute left-0 top-full z-30 mt-1 min-w-44 rounded-md bg-white py-1 shadow-lg dark:bg-gray-800"
                            >
                                {stammItems.map((item) => (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        role="menuitem"
                                        className={`block px-4 py-2 text-sm ${isActive(item.href)
                                            ? "bg-indigo-50 text-indigo-700 dark:bg-gray-700 dark:text-white"
                                            : "text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700"
                                            }`}
                                        onClick={() => setIsStammOpen(false)}
                                    >
                                        {item.name}
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                    )}
                    {publicItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`inline-flex items-center border-b-2 px-1 pt-1 text-base font-medium ${isActive(item.href)
                                ? "border-indigo-500 text-gray-900 dark:text-white"
                                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white"
                                }`}
                        >
                            {item.name}
                        </Link>
                    ))}
                </div>
            </div>

            {/* Mobile Menu Button */}
            <div className="flex items-center sm:hidden">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    type="button"
                    className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 dark:hover:bg-gray-700 dark:hover:text-white"
                    aria-controls="mobile-menu"
                    aria-expanded={isOpen}
                >
                    <span className="sr-only">Menü öffnen</span>
                    <svg
                        className={`${isOpen ? "hidden" : "block"} h-6 w-6`}
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="1.5"
                        stroke="currentColor"
                        aria-hidden="true"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                        />
                    </svg>
                    <svg
                        className={`${isOpen ? "block" : "hidden"} h-6 w-6`}
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="1.5"
                        stroke="currentColor"
                        aria-hidden="true"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6 18L18 6M6 6l12 12"
                        />
                    </svg>
                </button>
            </div>

            {/* Mobile Menu Dropdown */}
            {isOpen && (
                <div className="absolute top-16 left-0 w-full bg-white shadow-lg dark:bg-gray-800 sm:hidden z-20" id="mobile-menu">
                    <div className="space-y-1 pb-3 pt-2 px-4 shadow-sm border-t dark:border-gray-700">
                        {showMemberItems && navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`block border-l-4 py-2 pl-3 pr-4 text-lg font-medium ${isActive(item.href)
                                    ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-gray-700 dark:text-white"
                                    : "border-transparent text-gray-500 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
                                    }`}
                                onClick={() => setIsOpen(false)}
                            >
                                {item.name}
                            </Link>
                        ))}
                        {showMemberItems && (
                            <p className="px-3 pt-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
                                Stammdaten
                            </p>
                        )}
                        {showMemberItems && stammItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`block border-l-4 py-2 pl-3 pr-4 text-lg font-medium ${isActive(item.href)
                                    ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-gray-700 dark:text-white"
                                    : "border-transparent text-gray-500 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
                                    }`}
                                onClick={() => setIsOpen(false)}
                            >
                                {item.name}
                            </Link>
                        ))}
                        {publicItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`block border-l-4 py-2 pl-3 pr-4 text-lg font-medium ${isActive(item.href)
                                    ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-gray-700 dark:text-white"
                                    : "border-transparent text-gray-500 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
                                    }`}
                                onClick={() => setIsOpen(false)}
                            >
                                {item.name}
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </>
    );
}
