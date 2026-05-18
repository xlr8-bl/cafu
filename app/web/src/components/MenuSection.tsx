import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import type { MenuItem } from '@/lib/types';
import { formatXAF } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useCart } from '@/store/cart';

export function MenuSection() {
    const [items, setItems] = useState<MenuItem[] | null>(null);
    const [category, setCategory] = useState<string>('');
    const add = useCart((s) => s.add);

    useEffect(() => {
        let cancelled = false;
        api.menu(category)
            .then((res) => { if (!cancelled) setItems(res.items); })
            .catch(() => { if (!cancelled) { setItems([]); toast.error('Could not load the menu.'); } });
        return () => { cancelled = true; };
    }, [category]);

    const categories = useMemo(() => {
        if (!items) return [];
        const seen = new Map<string, string>();
        items.forEach((i) => seen.set(i.category_slug, i.category_name));
        return Array.from(seen.entries());
    }, [items]);

    return (
        <section id="menu" className="relative py-20 md:py-28">
            <div className="container">
                <Header />

                <Tabs value={category} onValueChange={setCategory} className="mt-2">
                    <TabsList>
                        <TabsTrigger value="">everything</TabsTrigger>
                        {categories.map(([slug, label]) => (
                            <TabsTrigger key={slug} value={slug}>{label.toLowerCase()}</TabsTrigger>
                        ))}
                    </TabsList>
                </Tabs>

                {items === null ? (
                    <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="rounded-2xl border border-border bg-card/40 p-5">
                                <Skeleton className="aspect-[4/3] w-full rounded-xl" />
                                <Skeleton className="mt-4 h-5 w-2/3" />
                                <Skeleton className="mt-2 h-4 w-full" />
                                <Skeleton className="mt-2 h-4 w-1/2" />
                            </div>
                        ))}
                    </div>
                ) : items.length === 0 ? (
                    <p className="mt-16 text-center font-serif italic text-muted-foreground">
                        Nothing here yet. The kitchen will be back online shortly.
                    </p>
                ) : (
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
                        className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
                    >
                        {items.map((item) => (
                            <motion.article
                                key={item.id}
                                variants={{
                                    hidden: { opacity: 0, y: 16 },
                                    visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.23, 1, 0.32, 1] } },
                                }}
                                whileHover={{ y: -4 }}
                                className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card/50 backdrop-blur transition-colors hover:border-primary/40 hover:bg-card/70"
                            >
                                <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                                    <img
                                        src={item.image_url ?? ''}
                                        alt=""
                                        loading="lazy"
                                        decoding="async"
                                        width="800" height="600"
                                        className="h-full w-full object-cover saturate-90 transition-transform duration-[700ms] group-hover:scale-105 group-hover:saturate-100"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
                                    {item.tags?.[0] && (
                                        <span className="absolute left-3 top-3 inline-flex items-center rounded-full border border-white/15 bg-black/40 backdrop-blur px-2.5 py-1 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-white/90">
                                            {item.tags[0]}
                                        </span>
                                    )}
                                </div>
                                <div className="flex flex-1 flex-col gap-2 p-5">
                                    <h3 className="font-serif text-[1.2rem] font-medium tracking-tight leading-tight">
                                        {item.name}
                                    </h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                                        {item.description}
                                    </p>
                                    <div className="mt-3 flex items-center justify-between">
                                        <span className="font-mono text-sm font-medium tabular-nums">
                                            {formatXAF(item.price_cents)}
                                        </span>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => {
                                                add({
                                                    id: item.id,
                                                    name: item.name,
                                                    price_cents: item.price_cents,
                                                    image_url: item.image_url,
                                                });
                                                toast.success(`Added “${item.name}”`);
                                            }}
                                            className="h-9 px-3.5"
                                        >
                                            <Plus className="h-3.5 w-3.5" />
                                            Add
                                        </Button>
                                    </div>
                                </div>
                            </motion.article>
                        ))}
                    </motion.div>
                )}
            </div>
        </section>
    );
}

function Header() {
    return (
        <div className="flex flex-col gap-3 mb-10">
            <p className="font-mono text-[0.72rem] uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-3">
                <span className="h-px w-8 bg-muted-foreground/50" />
                No. 02 / The Menu
            </p>
            <h2 className="font-serif text-display-lg font-[400] tracking-tight" style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 50" }}>
                What we’re cooking today
            </h2>
            <p className="text-muted-foreground max-w-xl">
                Prices in <abbr title="CFA franc" className="border-b border-dotted border-muted-foreground/40">XAF</abbr>.
                The list rotates with the market — the printed menu at the door is the source of truth.
            </p>
        </div>
    );
}
