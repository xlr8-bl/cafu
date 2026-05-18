const xafFmt = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });

export function formatXAF(cents: number): string {
    return `${xafFmt.format(Math.round(cents))} XAF`;
}

export function formatDate(d: Date = new Date()): string {
    return d.toLocaleDateString('en-GB', {
        weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
    });
}
