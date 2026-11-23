"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { isSonderleiter } from "@/lib/user-groups";

type NavLink = {
    name: string;
    href: string;
};

const formularItems: NavLink[] = [
    { name: "Mitgliedsantrag", href: "/mitgliedsantrag" },
    { name: "SEPA-Lastschriftmandat", href: "/sepa-lastschriftmandat" },
];

const sonderleiterItems: NavLink[] = [
    {
        name: "Ausschreibung HZD-Körung",
        href: "/ausschreibung-hzd-koerung",
    },
];

const memberItems: NavLink[] = [
    { name: "Körung", href: "/koerungen" },
    { name: "Zucht", href: "/wurfabnahmen" },
];

const stammItems: NavLink[] = [
    { name: "HZD-Hunde", href: "/hunde" },
    { name: "HZD-Züchter", href: "/zuechter" },
];

const desktopTriggerClass = (active: boolean) =>
    `inline-flex items-center gap-1 border-b-2 px-1 pt-1 text-base font-medium ${
        active
            ? "border-indigo-500 text-gray-900 dark:text-white"
            : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white"
    }`;

const desktopLinkClass = (active: boolean) =>
    `inline-flex items-center border-b-2 px-1 pt-1 text-base font-medium ${
        active
            ? "border-indigo-500 text-gray-900 dark:text-white"
            : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white"
    }`;

const menuLinkClass = (active: boolean) =>
    `block px-4 py-2 text-sm ${
        active
            ? "bg-indigo-50 text-indigo-700 dark:bg-gray-700 dark:text-white"
            : "text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700"
    }`;

const mobileLinkClass = (active: boolean) =>
    `block border-l-4 py-2 pl-3 pr-4 text-lg font-medium ${
        active
            ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-gray-700 dark:text-white"
            : "border-transparent text-gray-500 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
    }`;

const sectionLabelClass =
    "px-3 pt-3 text-xs font-semibold uppercase tracking-wide text-gray-400";

export default function Navigation() {
    const pathname = usePathname();
    const { user, isAuthenticated, isInitialized } = useAuth();
    const showMemberItems = isInitialized && isAuthenticated;
    const canUseSonderleiter = showMemberItems && isSonderleiter(user);
    const [mobile, setMobile] = useState({ open: false, path: pathname });
    const [menuState, setMenuState] = useState({
        id: null as string | null,
        path: pathname,
    });
    const desktopRef = useRef<HTMLDivElement>(null);
    const isOpen = mobile.open && mobile.path === pathname;
    const openMenu = menuState.path === pathname ? menuState.id : null;

    const isActive = (href: string) => {
        if (href === "/wurfabnahmen") {
            return pathname.startsWith("/wurfabnahmen");
        }

        if (href === "/koerungen") {
            return pathname.startsWith("/koerungen");
        }

        return pathname === href || pathname.startsWith(`${href}/`);
    };

    const isAnyActive = (items: NavLink[]) =>
        items.some((item) => isActive(item.href));

    useEffect(() => {
        if (!openMenu) {
            return;
        }

        const handlePointerDown = (event: MouseEvent) => {
            if (!desktopRef.current?.contains(event.target as Node)) {
                setMenuState({ id: null, path: pathname });
            }
        };

        window.addEventListener("mousedown", handlePointerDown);
        return () => window.removeEventListener("mousedown", handlePointerDown);
    }, [openMenu, pathname]);

    const toggleMenu = (id: string) => {
        setMenuState((current) => {
            const currentId = current.path === pathname ? current.id : null;
            return {
                id: currentId === id ? null : id,
                path: pathname,
            };
        });
    };

    const closeMenus = () => {
        setMenuState({ id: null, path: pathname });
        setMobile({ open: false, path: pathname });
    };

    return (
        <>
            <div className="hidden sm:flex sm:items-center sm:gap-2" ref={desktopRef}>
                <div className="flex sm:space-x-6">
                    <div className="relative">
                        <button
                            type="button"
                            aria-expanded={openMenu === "formulare"}
                            aria-haspopup="menu"
                            onClick={() => toggleMenu("formulare")}
                            className={desktopTriggerClass(isAnyActive(formularItems))}
                        >
                            Formulare
                            <span aria-hidden="true">
                                {openMenu === "formulare" ? "▴" : "▾"}
                            </span>
                        </button>
                        {openMenu === "formulare" && (
                            <div
                                role="menu"
                                className="absolute left-0 top-full z-30 mt-1 min-w-56 rounded-md bg-white py-1 shadow-lg dark:bg-gray-800"
                            >
                                {formularItems.map((item) => (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        role="menuitem"
                                        className={menuLinkClass(isActive(item.href))}
                                        onClick={closeMenus}
                                    >
                                        {item.name}
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    {showMemberItems && (
                        <div className="relative">
                            <button
                                type="button"
                                aria-expanded={openMenu === "intern"}
                                aria-haspopup="menu"
                                onClick={() => toggleMenu("intern")}
                                className={desktopTriggerClass(
                                    isAnyActive(sonderleiterItems),
                                )}
                            >
                                Interne Formulare
                                <span aria-hidden="true">
                                    {openMenu === "intern" ? "▴" : "▾"}
                                </span>
                            </button>
                            {openMenu === "intern" && (
                                <div
                                    role="menu"
                                    className="absolute left-0 top-full z-30 mt-1 min-w-64 rounded-md bg-white py-1 shadow-lg dark:bg-gray-800"
                                >
                                    {canUseSonderleiter ? (
                                        <div role="group" aria-label="Sonderleiter">
                                            <p className="px-4 pb-1 pt-2 text-sm font-medium text-gray-900 dark:text-white">
                                                Sonderleiter
                                            </p>
                                            {sonderleiterItems.map((item) => (
                                                <Link
                                                    key={item.href}
                                                    href={item.href}
                                                    role="menuitem"
                                                    className={`${menuLinkClass(isActive(item.href))} pl-8`}
                                                    onClick={closeMenus}
                                                >
                                                    {item.name}
                                                </Link>
                                            ))}
                                        </div>
                                    ) : (
                                        <span
                                            role="menuitem"
                                            aria-disabled="true"
                                            className="block cursor-not-allowed px-4 py-2 text-sm text-gray-400"
                                        >
                                            Sonderleiter
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {showMemberItems && memberItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={desktopLinkClass(isActive(item.href))}
                        >
                            {item.name}
                        </Link>
                    ))}

                    {showMemberItems && (
                        <div className="relative">
                            <button
                                type="button"
                                aria-expanded={openMenu === "stamm"}
                                aria-haspopup="menu"
                                onClick={() => toggleMenu("stamm")}
                                className={desktopTriggerClass(isAnyActive(stammItems))}
                            >
                                Stammdaten
                                <span aria-hidden="true">
                                    {openMenu === "stamm" ? "▴" : "▾"}
                                </span>
                            </button>
                            {openMenu === "stamm" && (
                                <div
                                    role="menu"
                                    className="absolute left-0 top-full z-30 mt-1 min-w-44 rounded-md bg-white py-1 shadow-lg dark:bg-gray-800"
                                >
                                    {stammItems.map((item) => (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            role="menuitem"
                                            className={menuLinkClass(isActive(item.href))}
                                            onClick={closeMenus}
                                        >
                                            {item.name}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="flex items-center sm:hidden">
                <button
                    onClick={() => setMobile({
                        open: !isOpen,
                        path: pathname,
                    })}
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

            {isOpen && (
                <div
                    className="absolute top-16 left-0 z-20 w-full bg-white shadow-lg dark:bg-gray-800 sm:hidden"
                    id="mobile-menu"
                >
                    <div className="space-y-1 border-t px-4 pb-3 pt-2 shadow-sm dark:border-gray-700">
                        <p className={sectionLabelClass}>Öffentliche Formulare</p>
                        {formularItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={mobileLinkClass(isActive(item.href))}
                                onClick={closeMenus}
                            >
                                {item.name}
                            </Link>
                        ))}

                        {showMemberItems && (
                            <p className={sectionLabelClass}>Interne Formulare</p>
                        )}
                        {showMemberItems && (
                            canUseSonderleiter ? (
                                <>
                                    <p className="px-3 pt-2 text-sm font-medium text-gray-900 dark:text-white">
                                        Sonderleiter
                                    </p>
                                    {sonderleiterItems.map((item) => (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className={`${mobileLinkClass(isActive(item.href))} ml-3`}
                                            onClick={closeMenus}
                                        >
                                            {item.name}
                                        </Link>
                                    ))}
                                </>
                            ) : (
                                <span
                                    aria-disabled="true"
                                    className="block cursor-not-allowed border-l-4 border-transparent py-2 pl-3 pr-4 text-lg font-medium text-gray-400"
                                >
                                    Sonderleiter
                                </span>
                            )
                        )}

                        {showMemberItems && memberItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={mobileLinkClass(isActive(item.href))}
                                onClick={closeMenus}
                            >
                                {item.name}
                            </Link>
                        ))}

                        {showMemberItems && (
                            <p className={sectionLabelClass}>Stammdaten</p>
                        )}
                        {showMemberItems && stammItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={mobileLinkClass(isActive(item.href))}
                                onClick={closeMenus}
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
