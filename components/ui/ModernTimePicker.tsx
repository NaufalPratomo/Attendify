import React, { useState, useEffect, useRef } from 'react';
import { Clock, ChevronDown, Check, X } from 'lucide-react';

interface TimePickerProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    required?: boolean;
}

const ModernTimePicker: React.FC<TimePickerProps> = ({ label, value, onChange, required }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Parse State
    const [hour, setHour] = useState('09');
    const [minute, setMinute] = useState('00');

    useEffect(() => {
        if (value) {
            const [h, m] = value.split(':');
            setHour(h || '09');
            setMinute(m || '00');
        }
    }, [value]);

    // Handle clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleHourSelect = (h: string) => {
        setHour(h);
        onChange(`${h}:${minute}`);
    };

    const handleMinuteSelect = (m: string) => {
        setMinute(m);
        onChange(`${hour}:${m}`);
        // Optional: Close on minute select if you want super speed, 
        // but often users might want to confirm visually.
        // setIsOpen(false); 
    };

    // Generate Arrays
    const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
    const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

    // Quick Presets
    const setNow = () => {
        const now = new Date();
        const h = String(now.getHours()).padStart(2, '0');
        const m = String(now.getMinutes()).padStart(2, '0');
        setHour(h);
        setMinute(m);
        onChange(`${h}:${m}`);
    };

    return (
        <div className="flex flex-col gap-1.5 relative" ref={containerRef}>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">
                {label} {required && <span className="text-red-500">*</span>}
            </label>

            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`
          group w-full flex items-center justify-between text-white rounded-xl px-4 py-3 
          bg-[#111418] border transition-all outline-none select-none
          ${isOpen
                        ? 'border-[#137fec] ring-1 ring-[#137fec] shadow-[0_0_20px_rgba(19,127,236,0.15)] bg-[#161b22]'
                        : 'border-[#3b4754] hover:border-[#137fec]/50 hover:bg-[#161b22]'
                    }
        `}
            >
                <div className="flex items-center gap-3">
                    <div className={`
            p-1.5 rounded-md transition-colors
            ${isOpen ? 'text-[#137fec] bg-[#137fec]/10' : 'text-gray-500 group-hover:text-[#137fec]'}
          `}>
                        <Clock size={18} />
                    </div>
                    <span className="font-mono text-xl tracking-widest font-bold">
                        {hour}<span className="text-gray-500 mx-0.5">:</span>{minute}
                    </span>
                </div>
                <ChevronDown size={18} className={`text-gray-500 transition-transform duration-300 ${isOpen ? 'rotate-180 text-[#137fec]' : ''}`} />
            </button>

            {/* Popover Panel */}
            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[#1c2127] border border-[#3b4754] rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                    {/* Header / Tabs */}
                    <div className="flex text-center border-b border-[#2d3748]">
                        <div className="flex-1 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider bg-[#1a1f24]">Hour</div>
                        <div className="flex-1 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider bg-[#1a1f24] border-l border-[#2d3748]">Minute</div>
                    </div>

                    {/* Scroll Columns */}
                    <div className="flex h-56">
                        {/* Hours */}
                        <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] snap-y snap-mandatory bg-[#16191d]">
                            <div className="py-2 px-1 space-y-1">
                                {hours.map((h) => (
                                    <button
                                        key={h}
                                        type="button"
                                        onClick={() => handleHourSelect(h)}
                                        className={`
                                w-full py-2 rounded-lg text-sm font-bold font-mono transition-all snap-start
                                ${hour === h
                                                ? 'bg-[#137fec] text-white shadow-md shadow-blue-900/40 scale-100'
                                                : 'text-gray-400 hover:text-white hover:bg-white/5 scale-95'
                                            }
                            `}
                                    >
                                        {h}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Minutes */}
                        <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] snap-y snap-mandatory bg-[#16191d] border-l border-[#2d3748]">
                            <div className="py-2 px-1 space-y-1">
                                {minutes.map((m) => (
                                    <button
                                        key={m}
                                        type="button"
                                        onClick={() => handleMinuteSelect(m)}
                                        className={`
                                w-full py-2 rounded-lg text-sm font-bold font-mono transition-all snap-start
                                ${minute === m
                                                ? 'bg-[#137fec] text-white shadow-md shadow-blue-900/40 scale-100'
                                                : 'text-gray-400 hover:text-white hover:bg-white/5 scale-95'
                                            }
                            `}
                                    >
                                        {m}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Footer Action */}
                    <div className="p-2 border-t border-[#2d3748] bg-[#1a1f24] flex gap-2">
                        <button
                            type="button"
                            onClick={setNow}
                            className="flex-1 py-1.5 text-xs font-semibold text-[#137fec] bg-[#137fec]/10 hover:bg-[#137fec]/20 rounded-md transition-colors"
                        >
                            Set Current Time
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="flex-1 py-1.5 text-xs font-semibold text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-md transition-colors"
                        >
                            Done
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ModernTimePicker;
