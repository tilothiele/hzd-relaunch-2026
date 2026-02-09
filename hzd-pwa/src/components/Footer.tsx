export default function Footer() {
    const year = new Date().getFullYear();
    return (
        <footer className="w-full border-t border-gray-200 py-4 text-center text-sm bg-[var(--color-goldbeige)] text-[var(--color-kapitaensblau)]">
            &copy; Hovawart Zuchtgemeinschaft Deutschland e.V. {year}
        </footer>
    );
}
