"use client";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faShareNodes } from '@fortawesome/free-solid-svg-icons'
import { theme } from '@/themes'

export default function FacebookShare({ url }: { url: string }) {
    const handleClick = () => {
        const confirmed = confirm(
            "Mit dem Klick werden Daten an Facebook übertragen. Fortfahren?"
        );

        if (confirmed) {
            window.open(
                `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
                "_blank",
                "noopener,noreferrer"
            );
        }
    };

    return (
        <button onClick={handleClick}>
            <FontAwesomeIcon icon={faShareNodes} size='xl' style={{ color: theme.socialIcon }} />
        </button>
    );
}