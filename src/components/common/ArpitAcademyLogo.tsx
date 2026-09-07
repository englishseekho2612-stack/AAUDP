import React from 'react';

interface ArpitAcademyLogoProps {
  className?: string;
  size?: number | string;
  showBorder?: boolean;
}

/**
 * Arpit Academy Udaipura Official Logo Component
 * Exactly matches the reference branding with dark green circular ring,
 * "A" open-book pages emblem with graduation mortarboard, "With Arpit Sir",
 * "Arpit Academy Udaipura", "Learn • Teach • Understand", and "Created by Arpit Digital Hub".
 */
export const ArpitAcademyLogo: React.FC<ArpitAcademyLogoProps> = ({
  className = 'w-10 h-10',
  size,
  showBorder = true,
}) => {
  return (
    <svg
      viewBox="0 0 500 500"
      className={`shrink-0 select-none ${className}`}
      style={size ? { width: size, height: size } : undefined}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Arpit Academy Udaipura Logo"
    >
      <defs>
        <filter id="arpitGlow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.12" />
        </filter>
      </defs>

      {/* Background White Disc */}
      <circle cx="250" cy="250" r="242" fill="#FFFFFF" />

      {/* Outer Dark Green Circular Ring */}
      {showBorder && (
        <circle cx="250" cy="250" r="236" fill="none" stroke="#0E4B3E" strokeWidth="12" />
      )}

      {/* ================= LOGO ICON: "A" + OPEN BOOK + GRADUATION CAP ================= */}
      <g id="central-emblem">
        {/* Mortarboard Cap Diamond Top */}
        <polygon points="250,52 316,78 250,104 184,78" fill="#182420" />
        {/* Mortarboard Cap Skull / Underband */}
        <path d="M216,92 Q250,118 284,92 L284,102 Q250,126 216,102 Z" fill="#111B17" />
        {/* Mortarboard Center Button */}
        <circle cx="250" cy="78" r="4.5" fill="#E65100" />
        {/* Tassel String */}
        <path
          d="M250,78 Q288,88 306,104 T308,136"
          fill="none"
          stroke="#E65100"
          strokeWidth="3"
          strokeLinecap="round"
        />
        {/* Tassel Brush */}
        <path d="M304,136 L312,136 L314,152 Q308,154 302,152 Z" fill="#E65100" />
        <circle cx="308" cy="136" r="3" fill="#BF360C" />

        {/* Left Leg of "A" (Solid Upper Stem) */}
        <path d="M246,108 L220,175 L240,175 L252,142 Z" fill="#0E4B3E" />
        {/* Right Leg of "A" (Solid Upper Stem) */}
        <path d="M254,108 L280,175 L260,175 L248,142 Z" fill="#0E4B3E" />
        {/* Horizontal Crossbar inside letter A */}
        <path d="M228,154 L272,154 L267,166 L233,166 Z" fill="#FFFFFF" />

        {/* ===== LEFT OPEN BOOK PAGES (GREEN) ===== */}
        <path d="M246,170 Q196,182 142,216 Q188,198 244,188 Z" fill="#0E4B3E" />
        <path d="M244,192 Q192,204 148,234 Q192,218 243,208 Z" fill="#166B53" />
        <path d="M242,212 Q194,222 156,250 Q196,236 242,226 Z" fill="#28966E" />

        {/* ===== RIGHT OPEN BOOK PAGES (ORANGE) ===== */}
        <path d="M254,170 Q304,182 358,216 Q312,198 256,188 Z" fill="#E65100" />
        <path d="M256,192 Q308,204 352,234 Q308,218 257,208 Z" fill="#F57C00" />
        <path d="M258,212 Q306,222 344,250 Q304,236 258,226 Z" fill="#FFA726" />

        {/* Center Book Spine Notch */}
        <path d="M247,170 L250,226 L253,170 Z" fill="#0A332A" />
      </g>

      {/* ================= WITH ARPIT SIR (Upper Right) ================= */}
      <g id="with-arpit-sir" transform="rotate(-6, 385, 160)">
        <text
          x="375"
          y="152"
          fontFamily="'Brush Script MT', 'Dancing Script', 'Caveat', cursive, sans-serif"
          fontSize="20"
          fontWeight="600"
          fill="#0E4B3E"
          fontStyle="italic"
        >
          With
        </text>
        <text
          x="370"
          y="178"
          fontFamily="'Brush Script MT', 'Dancing Script', 'Caveat', cursive, sans-serif"
          fontSize="30"
          fontWeight="bold"
          fill="#0E4B3E"
          fontStyle="italic"
        >
          Arpit Sir
        </text>
        {/* Orange Underline Swoosh */}
        <path
          d="M382,185 Q422,183 454,174"
          fill="none"
          stroke="#E65100"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </g>

      {/* ================= MAIN TITLE: ARPIT ACADEMY ================= */}
      <text
        x="250"
        y="306"
        fontFamily="'Poppins', 'Montserrat', 'Segoe UI', system-ui, -apple-system, sans-serif"
        fontSize="44"
        fontWeight="900"
        fill="#0E4B3E"
        textAnchor="middle"
        letterSpacing="-0.5"
      >
        Arpit Academy
      </text>

      {/* ================= SUBTITLE: UDAIPURA WITH FLANKING ACCENT LINES ================= */}
      <line x1="68" y1="337" x2="148" y2="337" stroke="#E65100" strokeWidth="2.5" strokeLinecap="round" />
      <text
        x="250"
        y="347"
        fontFamily="'Poppins', 'Montserrat', 'Segoe UI', system-ui, -apple-system, sans-serif"
        fontSize="38"
        fontWeight="800"
        fill="#E65100"
        textAnchor="middle"
        letterSpacing="0.5"
      >
        Udaipura
      </text>
      <line x1="352" y1="337" x2="432" y2="337" stroke="#E65100" strokeWidth="2.5" strokeLinecap="round" />

      {/* ================= TAGLINE: LEARN • TEACH • UNDERSTAND ================= */}
      <g
        id="tagline"
        fontFamily="'Poppins', 'Montserrat', system-ui, sans-serif"
        fontSize="14.5"
        fontWeight="600"
        fill="#0E4B3E"
      >
        <text x="250" y="380" textAnchor="middle" letterSpacing="2">
          Learn  <tspan fill="#166B53" fontSize="18">•</tspan>  Teach  <tspan fill="#166B53" fontSize="18">•</tspan>  Understand
        </text>
      </g>

      {/* ================= FOOTER: CREATED BY ARPIT DIGITAL HUB ================= */}
      <g id="credit" textAnchor="middle">
        <text
          x="250"
          y="420"
          fontFamily="'Poppins', system-ui, sans-serif"
          fontSize="13"
          fontWeight="500"
          fill="#4B5563"
        >
          Created by
        </text>
        <text
          x="250"
          y="440"
          fontFamily="'Poppins', 'Montserrat', system-ui, sans-serif"
          fontSize="17"
          fontWeight="800"
          fill="#0E4B3E"
        >
          Arpit Digital Hub
        </text>
        <line x1="232" y1="452" x2="268" y2="452" stroke="#166B53" strokeWidth="2.5" strokeLinecap="round" />
      </g>
    </svg>
  );
};
