import { ShoppingBag } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useCart, cartCount } from '@/store/cart';
import { useEffect, useState } from 'react';

const NAV = [
    { id: 'menu',         label: 'Menu' },
    { id: 'picks',        label: 'Pairings' },
    { id: 'reservations', label: 'Reserve' },
    { id: 'story',        label: 'House' },
];

type Props = { onOpenCart: () => void };

export function Header({ onOpenCart }: Props) {
    const items = useCart((s) => s.items);
    const count = cartCount(items);
    const [active, setActive] = useState<string>('');

    useEffect(() => {
        const sections = NAV.map((n) => document.getElementById(n.id)).filter((x): x is HTMLElement => !!x);
        if (sections.length === 0) return;
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((e) => {
                    if (e.isIntersecting) setActive(e.target.id);
                });
            },
            { rootMargin: '-35% 0px -55% 0px' }
        );
        sections.forEach((s) => observer.observe(s));
        return () => observer.disconnect();
    }, []);

    return (
        <header className="sticky top-0 z-40 glass border-b border-border">
            <div className="container flex h-[72px] items-center gap-4">
                <a href="/" className="flex items-center gap-3 group">
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-foreground text-background font-serif text-lg font-medium leading-none transition-transform duration-300 group-hover:-rotate-12">
                        M
                    </span>
                    <span className="flex flex-col leading-none gap-[3px]">
                        <span className="font-serif text-[1.05rem] font-medium tracking-tight">Maison&nbsp;Cafu</span>
                        <span className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">est. ’26</span>
                    </span>
                </a>

                <nav className="mx-auto hidden md:flex items-center rounded-full border border-border bg-white/[0.03] p-1">
                    {NAV.map((n) => (
                        <a
                            key={n.id}
                            href={`#${n.id}`}
                            className="relative rounded-full px-3.5 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                        >
                            {active === n.id && (
                                <motion.span
                                    layoutId="nav-pill"
                                    className="absolute inset-0 rounded-full bg-white/[0.08] border border-border"
                                    transition={{ type: 'spring', stiffness: 360, damping: 30 }}
                                />
                            )}
                            <span className={`relative ${active === n.id ? 'text-foreground' : ''}`}>{n.label}</span>
                        </a>
                    ))}
                </nav>

                <div className="ml-auto flex items-center gap-3">
                    <Button variant="outline" size="sm" onClick={onOpenCart} className="relative h-10 px-4">
                        <ShoppingBag className="h-4 w-4" />
                        <span className="hidden sm:inline">Basket</span>
                        <span className="ml-1 grid h-5 min-w-[20px] place-items-center rounded-full bg-primary px-1.5 text-[0.68rem] font-mono font-medium text-primary-foreground tabular-nums">
                            {count}
                        </span>
                    </Button>
                </div>
            </div>
        </header>
    );
}
