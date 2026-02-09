"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function Navigation() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);

    const navItems = [
        { name: "Meine Körbewertungen", href: "/meine-koerboegen" },
        { name: "Hunde", href: "/hunde" },
        { name: "Veranstaltungen", href: "/veranstaltungen" },
    ];

    return (
        <>
            {/* Desktop Navigation */}
            <div className="hidden sm:flex sm:space-x-8">
                {navItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`inline-flex items-center border-b-2 px-1 pt-1 text-base font-medium ${pathname === item.href
                            ? "border-indigo-500 text-gray-900 dark:text-white"
                            : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white"
                            }`}
                    >
                        {item.name}
                    </Link>
                ))}
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
                    {/* Icon when menu is closed. */}
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
                    {/* Icon when menu is open. */}
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
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`block border-l-4 py-2 pl-3 pr-4 text-lg font-medium ${pathname === item.href
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
