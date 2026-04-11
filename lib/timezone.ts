export const JAKARTA_TIME_ZONE = 'Asia/Jakarta';

const WIB_OFFSET_MINUTES = 7 * 60;
const WIB_OFFSET_MS = WIB_OFFSET_MINUTES * 60_000;

type WibDateParts = {
    year: number;
    month: number;
    day: number;
};

export const getWibDateParts = (date: Date): WibDateParts => {
    const shifted = new Date(date.getTime() + WIB_OFFSET_MS);
    return {
        year: shifted.getUTCFullYear(),
        month: shifted.getUTCMonth() + 1,
        day: shifted.getUTCDate(),
    };
};

export const toWibDateString = (date: Date): string => {
    const { year, month, day } = getWibDateParts(date);
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

export const getWibStartOfDay = (date: Date): Date => {
    const { year, month, day } = getWibDateParts(date);
    return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0) - WIB_OFFSET_MS);
};

export const getWibEndOfDay = (date: Date): Date => {
    return new Date(getWibStartOfDay(date).getTime() + (24 * 60 * 60 * 1000) - 1);
};

export const parseWibDateStart = (dateString: string): Date => {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0) - WIB_OFFSET_MS);
};

export const parseWibDateEnd = (dateString: string): Date => {
    return new Date(parseWibDateStart(dateString).getTime() + (24 * 60 * 60 * 1000) - 1);
};

export const getWibMonthRange = (year: number, monthIndex: number): { start: Date; end: Date } => {
    const start = new Date(Date.UTC(year, monthIndex, 1, 0, 0, 0, 0) - WIB_OFFSET_MS);
    const end = new Date(Date.UTC(year, monthIndex + 1, 1, 0, 0, 0, 0) - WIB_OFFSET_MS - 1);
    return { start, end };
};

export const getWibYearRange = (year: number): { start: Date; end: Date } => {
    const start = new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0) - WIB_OFFSET_MS);
    const end = new Date(Date.UTC(year + 1, 0, 1, 0, 0, 0, 0) - WIB_OFFSET_MS - 1);
    return { start, end };
};

export const getWibDayOfWeek = (year: number, monthIndex: number, day: number): number => {
    return new Date(Date.UTC(year, monthIndex, day)).getUTCDay();
};
