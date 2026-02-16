'use client';

import Link from 'next/link';

export default function Development() {
    // Deterministic pseudo-random to avoid SSR/client hydration mismatch
    const stars = Array.from({ length: 30 }, (_, i) => {
        // Simple seeded hash
        const seed = (i + 1) * 2654435761;
        const r = (n: number) => {
            const x = Math.sin(seed * (n + 1)) * 10000;
            return x - Math.floor(x);
        };
        return {
            w: r(0) * 3 + 1,
            h: r(1) * 3 + 1,
            top: r(2) * 40,
            left: r(3) * 100,
            delay: r(4) * 3,
            dur: r(5) * 2 + 2,
            opacity: r(6) * 0.7 + 0.3,
        };
    });

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#0f172a] via-[#1e293b] to-[#0f172a] flex flex-col items-center justify-center px-4 overflow-hidden relative">
            {/* Stars background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {stars.map((s, i) => (
                    <div
                        key={i}
                        className="absolute rounded-full bg-white animate-pulse"
                        style={{
                            width: `${s.w}px`,
                            height: `${s.h}px`,
                            top: `${s.top}%`,
                            left: `${s.left}%`,
                            animationDelay: `${s.delay}s`,
                            animationDuration: `${s.dur}s`,
                            opacity: s.opacity,
                        }}
                    />
                ))}
            </div>

            {/* Moon */}
            <div className="absolute top-12 right-16 md:right-32 w-20 h-20 rounded-full bg-yellow-100 shadow-[0_0_40px_10px_rgba(253,224,71,0.15)] opacity-80">
                <div className="absolute top-3 left-4 w-4 h-4 rounded-full bg-yellow-200/50" />
                <div className="absolute top-8 left-8 w-3 h-3 rounded-full bg-yellow-200/40" />
                <div className="absolute top-4 left-11 w-2 h-2 rounded-full bg-yellow-200/30" />
            </div>

            {/* Construction Scene */}
            <div className="relative z-10 flex flex-col items-center">

                {/* Crane SVG */}
                <svg viewBox="0 0 400 300" className="w-80 md:w-[420px] mb-6" xmlns="http://www.w3.org/2000/svg">
                    {/* Crane tower */}
                    <rect x="185" y="80" width="12" height="200" fill="#f59e0b" rx="2" />
                    <rect x="180" y="80" width="22" height="8" fill="#f59e0b" rx="2" />

                    {/* Crane arm */}
                    <rect x="100" y="76" width="120" height="6" fill="#f59e0b" rx="2" />
                    <line x1="190" y1="80" x2="105" y2="78" stroke="#f59e0b" strokeWidth="2" />

                    {/* Crane cable + hook */}
                    <line x1="115" y1="82" x2="115" y2="140" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="4 2">
                        <animate attributeName="y2" values="140;148;140" dur="2s" repeatCount="indefinite" />
                    </line>
                    <path d="M110 140 L120 140 L117 150 L113 150 Z" fill="#94a3b8">
                        <animate attributeName="d" values="M110 140 L120 140 L117 150 L113 150 Z;M110 148 L120 148 L117 158 L113 158 Z;M110 140 L120 140 L117 150 L113 150 Z" dur="2s" repeatCount="indefinite" />
                    </path>

                    {/* Building under construction */}
                    <rect x="220" y="180" width="80" height="100" fill="#334155" stroke="#475569" strokeWidth="1" rx="2" />
                    {/* Windows */}
                    <rect x="230" y="190" width="12" height="14" fill="#fbbf24" opacity="0.7" rx="1" />
                    <rect x="250" y="190" width="12" height="14" fill="#38bdf8" opacity="0.5" rx="1" />
                    <rect x="270" y="190" width="12" height="14" fill="#fbbf24" opacity="0.6" rx="1" />
                    <rect x="230" y="212" width="12" height="14" fill="#38bdf8" opacity="0.4" rx="1" />
                    <rect x="250" y="212" width="12" height="14" fill="#fbbf24" opacity="0.8" rx="1" />
                    <rect x="270" y="212" width="12" height="14" fill="#38bdf8" opacity="0.6" rx="1" />
                    <rect x="230" y="234" width="12" height="14" fill="#fbbf24" opacity="0.5" rx="1" />
                    <rect x="250" y="234" width="12" height="14" fill="#475569" rx="1" />
                    <rect x="270" y="234" width="12" height="14" fill="#fbbf24" opacity="0.7" rx="1" />

                    {/* Scaffolding */}
                    <rect x="218" y="175" width="84" height="3" fill="#78716c" />
                    <line x1="220" y1="175" x2="220" y2="280" stroke="#78716c" strokeWidth="2" />
                    <line x1="300" y1="175" x2="300" y2="280" stroke="#78716c" strokeWidth="2" />
                    <line x1="220" y1="210" x2="300" y2="210" stroke="#78716c" strokeWidth="1" />
                    <line x1="220" y1="240" x2="300" y2="240" stroke="#78716c" strokeWidth="1" />

                    {/* Smaller building */}
                    <rect x="310" y="220" width="50" height="60" fill="#1e293b" stroke="#475569" strokeWidth="1" rx="2" />
                    <rect x="318" y="230" width="8" height="10" fill="#fbbf24" opacity="0.6" rx="1" />
                    <rect x="333" y="230" width="8" height="10" fill="#38bdf8" opacity="0.5" rx="1" />
                    <rect x="318" y="248" width="8" height="10" fill="#38bdf8" opacity="0.4" rx="1" />
                    <rect x="333" y="248" width="8" height="10" fill="#fbbf24" opacity="0.7" rx="1" />

                    {/* Ground */}
                    <rect x="0" y="277" width="400" height="23" fill="#1e293b" rx="4" />
                    <rect x="40" y="275" width="320" height="3" fill="#475569" rx="1" />

                    {/* Construction worker */}
                    <g>
                        <animateTransform attributeName="transform" type="translate" values="0,0;0,-3;0,0" dur="1.5s" repeatCount="indefinite" />
                        {/* Hard hat */}
                        <ellipse cx="155" cy="248" rx="10" ry="4" fill="#f59e0b" />
                        <rect x="147" y="244" width="16" height="5" fill="#f59e0b" rx="2" />
                        {/* Head */}
                        <circle cx="155" cy="253" r="6" fill="#fcd34d" />
                        {/* Body */}
                        <rect x="149" y="259" width="12" height="14" fill="#3b82f6" rx="2" />
                        {/* Arms */}
                        <line x1="149" y1="262" x2="140" y2="268" stroke="#fcd34d" strokeWidth="3" strokeLinecap="round">
                            <animate attributeName="x2" values="140;136;140" dur="1.5s" repeatCount="indefinite" />
                            <animate attributeName="y2" values="268;264;268" dur="1.5s" repeatCount="indefinite" />
                        </line>
                        <line x1="161" y1="262" x2="170" y2="268" stroke="#fcd34d" strokeWidth="3" strokeLinecap="round">
                            <animate attributeName="x2" values="170;174;170" dur="1.5s" repeatCount="indefinite" />
                            <animate attributeName="y2" values="268;264;268" dur="1.5s" repeatCount="indefinite" />
                        </line>
                        {/* Hammer in right hand */}
                        <rect x="168" y="260" width="3" height="12" fill="#78716c" rx="1">
                            <animate attributeName="x" values="168;172;168" dur="1.5s" repeatCount="indefinite" />
                            <animate attributeName="y" values="260;256;260" dur="1.5s" repeatCount="indefinite" />
                            <animateTransform attributeName="transform" type="rotate" values="0 170 266;-20 172 262;0 170 266" dur="1.5s" repeatCount="indefinite" />
                        </rect>
                        {/* Legs */}
                        <line x1="152" y1="273" x2="150" y2="278" stroke="#1e3a5f" strokeWidth="3" strokeLinecap="round" />
                        <line x1="158" y1="273" x2="160" y2="278" stroke="#1e3a5f" strokeWidth="3" strokeLinecap="round" />
                    </g>

                    {/* Bricks / Materials */}
                    <rect x="60" y="270" width="14" height="8" fill="#dc2626" rx="1" opacity="0.8" />
                    <rect x="76" y="270" width="14" height="8" fill="#dc2626" rx="1" opacity="0.7" />
                    <rect x="67" y="263" width="14" height="8" fill="#dc2626" rx="1" opacity="0.9" />

                    {/* Cone */}
                    <polygon points="90,278 97,258 104,278" fill="#f97316" />
                    <rect x="87" y="276" width="20" height="3" fill="#f97316" rx="1" />
                    <line x1="93" y1="268" x2="101" y2="268" stroke="white" strokeWidth="1.5" />
                </svg>

                {/* Text Content */}
                <div className="text-center space-y-4">
                    <div className="inline-flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded-full px-4 py-1.5 mb-2">
                        <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-yellow-500"></span>
                        </span>
                        <span className="text-yellow-400 text-xs font-semibold tracking-widest uppercase">Under Construction</span>
                    </div>

                    <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight">
                        We&apos;re Building
                        <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                            Something Amazing
                        </span>
                    </h1>

                    <p className="text-gray-400 text-sm md:text-base max-w-md mx-auto leading-relaxed">
                        Our team is working hard to bring you this feature.
                        Check back soon for updates!
                    </p>

                    {/* Progress bar */}
                    <div className="max-w-xs mx-auto mt-6">
                        <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                            <span>Progress</span>
                            <span className="text-blue-400">69%</span>
                        </div>
                        <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 rounded-full relative"
                                style={{ width: '69%' }}
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"
                                    style={{ animation: 'shimmer 2s infinite' }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Back button */}
                    <div className="pt-6">
                        <Link href="/">
                            <button className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all duration-200 text-sm font-medium group">
                                <span className="material-symbols-outlined text-lg group-hover:-translate-x-1 transition-transform">arrow_back</span>
                                Back to Home
                            </button>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Shimmer animation keyframes */}
            <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
        </div>
    );
}