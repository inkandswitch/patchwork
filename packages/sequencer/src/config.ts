export const ROW_COUNT: number = 15;
export const COL_COUNT: number = 32;
export const STEPS_PER_BAR: number = 8;

export function barCountToStepCount(bars: number): number {
    return bars * STEPS_PER_BAR
}
