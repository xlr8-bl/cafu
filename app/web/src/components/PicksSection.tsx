import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import type { RecommendItem } from '@/lib/types';
import { formatXAF } from '@/lib/format';
import { useCart } from '@/store/cart';

export function PicksSection() {
    const items = useCart((s) => s.items);
    const add = useCart((s) => s.add);
    const [picks, setPicks] = useState<RecommendItem[]>([]);

    useEffect(() => {
        const basket = Object.keys(items).map(Number);
        let cancelled = false;
        api.recommend(basket)
            .then((res) => { if (!cancelled) setPicks(res.items); })
            .catch(() => { if (!cancelled) setPicks([]); });
        return () => { cancelled = true; };
    }, [items]);

    return (
        <section id="picks" className="relative py-20 md:py-28 border-y border-border bg-card/30">
            <div className="container">
                <div className="flex flex-col gap-3 mb-10">
                    <p className="font-mono text-[0.72rem] uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-3">
                        <span className="h-px w-8 bg-muted-foreground/50" />
                        No. 03 / Pairings
                    </p>
                    <h2 className="font-serif text-display-lg font-[400] tracking-tight" style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 50" }}>
                        What goes with your basket
                    </h2>
                    <p className="text-muted-foreground max-w-xl">
                        Pulled live from recent orders, ranked by <span className="font-mono text-[0.92em]">lift</span> — a measure of how much more often two plates are picked together than chance.
                    </p>
                </div>

                {picks.length === 0 ? (
                    <p className="font-serif italic text-muted-foreground">
                        Add a plate to the basket to see pairings.
                    </p>
                ) : (
                    <div className="flex gap-4 overflow-x-auto pb-4 -mx-5 px-5 snap-x snap-mandatory">
                        {picks.map((it, i) => (
                            <motion.div
                                key={it.id}
                                initial={{ opacity: 0, y: 12 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: '-10%' }}
                                transition={{ duration: 0.5, delay: i * 0.05 }}
                                whileHover={{ y: -4 }}
                                className="snap-start shrink-0 w-[300px] flex items-center gap-4 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
                            >
                                <div className="h-[72px] w-[72px] shrink-0 overflow-hidden rounded-xl bg-muted">
                                    <img
                                        src={it.image_url ?? ''}
                                        alt=""
                                        loading="lazy"
                                        width="72" height="72"
                                        className="h-full w-full object-cover"
                                    />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h4 className="font-serif text-[1rem] font-medium leading-snug truncate">{it.name}</h4>
                                    <p className="font-mono text-xs text-muted-foreground tabular-nums mt-1">
                                        {formatXAF(it.price_cents)}
                                    </p>
                                </div>
                                <button
                                    onClick={() => {
                                        add({
                                            id: it.id,
                                            name: it.name,
                                            price_cents: it.price_cents,
                                            image_url: it.image_url,
                                        });
                                        toast.success(`Added “${it.name}”`);
                                    }}
                                    aria-label={`Add ${it.name}`}
                                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border bg-white/[0.04] text-foreground transition-all hover:bg-primary hover:text-primary-foreground hover:border-primary active:scale-90"
                                >
                                    <Plus className="h-4 w-4" />
                                </button>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}
