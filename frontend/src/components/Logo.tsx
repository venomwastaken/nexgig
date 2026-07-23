import React from "react";

export default function Logo() {
    return (
        <div
            className="text-2xl tracking-tight"
            style={{
                fontFamily: "'Syne', ui-sans-serif, system-ui",
                fontWeight: 700,
            }}
        >
            <span className="text-[#ffffff]">Nex</span>
            <span className="text-[#1b976f]">Gig</span>
        </div>
    );
}
