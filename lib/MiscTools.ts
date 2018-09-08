export function formatTimeSeconds(seconds: number, showSeconds: boolean = false): string {
    let h = Math.floor(seconds / 3600);
    let d = Math.floor(h / 24);
    h = h - d*24;
    let m = Math.floor(seconds % 3600 / 60);
    let s = Math.floor(seconds % 3600 % 60);
    let dDisplay = d > 0 ? (d + 'D ') : '';
    let hDisplay = h > 0 ? (h + 'H ') : '';
    let mDisplay = m > 0 ? (m + 'M ') : '';
    let sDisplay = s > 0 ? (s + 'S') : '';
    if (showSeconds || (seconds < 60)) {
        return dDisplay + hDisplay + mDisplay + sDisplay;
    } else {
        return dDisplay + hDisplay + mDisplay.trimRight();
    }
}