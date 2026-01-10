import React from 'react';

interface MonthSummaryCardProps {
    currentMinutes: number;
    monthlyTargetMinutes: number;
}

const MonthSummaryCard: React.FC<MonthSummaryCardProps> = ({ currentMinutes, monthlyTargetMinutes }) => {
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const currentDay = now.getDate();

    // Default 11240 / daysInMonth ~ 362 mins/day
    // If monthlyTargetMinutes is 0/undefined, fallback to standard 11240 for safety
    const safeTarget = monthlyTargetMinutes || 11240;
    const dailyTarget = safeTarget / daysInMonth;

    // Expected minutes by end of today
    const targetToDateMinutes = Math.round(dailyTarget * currentDay);

    const surplusMinutes = currentMinutes - targetToDateMinutes;
    const isAhead = surplusMinutes >= 0;

    const formatDuration = (mins: number) => {
        const absMins = Math.abs(mins);
        const h = Math.floor(absMins / 60);
        const m = absMins % 60;
        return `${h}h ${m}m`;
    };

    const percentComplete = Math.min(100, (currentMinutes / safeTarget) * 100);
    const targetPercent = Math.min(100, (targetToDateMinutes / safeTarget) * 100);

    return (
        <div className="group relative overflow-hidden rounded-2xl border border-[#283039] bg-[#1c2632] p-6 shadow-sm transition-all hover:shadow-md">
            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-[#137fec]/10 text-[#137fec]">
                        <span className="material-symbols-outlined">
                            calendar_month
                        </span>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-400">
                            Monthly Progress
                        </p>
                        <p className="text-xs text-gray-500">
                            Day {currentDay} of {daysInMonth}
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Stats */}
            <div className="mb-6 flex flex-col gap-1">
                <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-white tracking-tight">
                        {currentMinutes.toLocaleString()}
                    </span>
                    <span className="text-sm font-medium text-gray-500">
                        / {safeTarget.toLocaleString()} mins
                    </span>
                </div>

                {/* Visual Status Box */}
                <div className={`mt-2 flex items-center gap-3 rounded-lg border px-3 py-2.5 ${isAhead
                        ? 'border-green-500/20 bg-green-500/5'
                        : 'border-red-500/20 bg-red-500/5'
                    }`}>
                    <div className={`flex items-center justify-center rounded-full p-1 ${isAhead ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                        <span className="material-symbols-outlined text-sm">
                            {isAhead ? 'trending_up' : 'trending_down'}
                        </span>
                    </div>
                    <div className="flex flex-col">
                        <span className={`text-xs font-bold uppercase tracking-wider ${isAhead ? 'text-green-400' : 'text-red-400'
                            }`}>
                            {isAhead ? 'Ahead of Schedule' : 'Behind Schedule'}
                        </span>
                        <span className="text-sm font-medium text-gray-300">
                            {formatDuration(surplusMinutes)} {isAhead ? '(Surplus)' : '(Deficit)'} based on today
                        </span>
                    </div>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="relative h-3 w-full overflow-hidden rounded-full bg-gray-800">
                {/* Actual Progress */}
                <div
                    className="absolute left-0 top-0 h-full rounded-full bg-[#137fec] transition-all duration-1000 ease-out"
                    style={{ width: `${percentComplete}%` }}
                ></div>

                {/* Target Marker */}
                <div
                    className="absolute top-0 h-full w-0.5 bg-white z-10 shadow-[0_0_8px_rgba(255,255,255,0.8)]"
                    style={{ left: `${targetPercent}%` }}
                ></div>
            </div>

            {/* Footer Labels */}
            <div className="mt-2 flex justify-between text-xs font-medium text-gray-500">
                <span>Actual: {Math.round(percentComplete)}%</span>
                <span className="text-gray-400">Target Line: {Math.round(targetPercent)}%</span>
            </div>
        </div>
    );
};

export default MonthSummaryCard;
