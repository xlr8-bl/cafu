const ITEMS = [
    { label: 'Kitchen open',       value: '11:00 — 23:00 today' },
    { label: 'Now cooking',        value: 'Ndolé with shrimp · Poulet DG' },
    { label: 'Just ordered',       value: 'table 4 · Mbongo Tchobi with fufu' },
    { label: 'Pairing of the day', value: 'Eru + miondo + iced bissap' },
    { label: 'From the grill',     value: 'Whole fish · folong leaves · 13:00' },
    { label: 'Tonight',            value: 'Bikutsi & Makossa from 19:00' },
    { label: 'Special',            value: 'Beef soya — mild pepper on the side' },
    { label: 'Matango',            value: 'fresh tap from the village this morning' },
];

export function MarqueeTicker() {
    const row = (
        <div className="flex items-center gap-12 px-6 shrink-0" aria-hidden="true">
            {ITEMS.map((it, i) => (
                <div key={i} className="flex items-center gap-3 whitespace-nowrap font-mono text-[0.74rem] tracking-wider uppercase text-foreground/70">
                    <span className="text-primary font-serif italic normal-case tracking-normal text-[0.92rem]">{it.label}</span>
                    <span className="text-foreground/30">·</span>
                    <span>{it.value}</span>
                </div>
            ))}
        </div>
    );

    return (
        <div className="relative overflow-hidden border-b border-border bg-black/40 py-2.5 gradient-mask-x motion-reduce:hidden">
            <div className="flex w-max animate-marquee">
                {row}
                {row}
            </div>
        </div>
    );
}
