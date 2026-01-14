import React from 'react';

interface DailyStatsCardProps {
    todayMinutes: number;
    dailyTargetMinutes: number;
}

const DailyStatsCard: React.FC<DailyStatsCardProps> = ({ todayMinutes, dailyTargetMinutes }) => {
    const now = new Date();
    const percentComplete = Math.min(100, (todayMinutes / (dailyTargetMinutes || 1)) * 100);
    const remaining = Math.max(0, dailyTargetMinutes - todayMinutes);

    return (
        <div className="group relative overflow-hidden rounded-2xl border border-[#283039] bg-[#1c2632] p-6 shadow-sm transition-all hover:shadow-md">
            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-orange-500/10 text-orange-400">
                        <span className="material-symbols-outlined">
                            today
                        </span>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-400">
                            Daily Target
                        </p>
                        <p className="text-xs text-gray-500">
                            {now.toLocaleDateString('en-US', { day: 'numeric', month: 'long' })}
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Stats */}
            <div className="mb-6 flex flex-col gap-1">
                <div className="flex items-baseline gap-2">
                    <span className={`text-3xl font-bold tracking-tight ${todayMinutes >= dailyTargetMinutes ? 'text-green-400' : 'text-white'}`}>
                        {todayMinutes.toLocaleString()}
                    </span>
                    <span className="text-sm font-medium text-gray-500">
                        / {dailyTargetMinutes.toLocaleString()} mins
                    </span>
                </div>

                {/* Status Text */}
                <div className="mt-1">
                    {todayMinutes >= dailyTargetMinutes ? (
                        <div className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-2.5 py-1 text-xs font-medium text-green-400">
                            <span className="material-symbols-outlined text-[1rem]">check_circle</span>
                            Goal Achieved
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-xs font-medium text-gray-400">
                            <span>{remaining} mins to go</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Progress Bar */}
            <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-gray-800">
                <div
                    className={`absolute left-0 top-0 h-full rounded-full transition-all duration-1000 ease-out ${todayMinutes >= dailyTargetMinutes ? 'bg-green-500' : 'bg-orange-500'}`}
                    style={{ width: `${percentComplete}%` }}
                ></div>
            </div>

            <div className="mt-2 flex justify-between text-xs font-medium text-gray-500">
                <span>{Math.round(percentComplete)}% Done</span>
                <span>Target: {dailyTargetMinutes}</span>
            </div>
        </div>
    );
};

export default DailyStatsCard;
