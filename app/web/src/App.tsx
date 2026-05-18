import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag } from 'lucide-react';

import { MarqueeTicker }       from '@/components/MarqueeTicker';
import { Header }              from '@/components/Header';
import { Hero }                from '@/components/Hero';
import { MenuSection }         from '@/components/MenuSection';
import { PicksSection }        from '@/components/PicksSection';
import { ReservationSection }  from '@/components/ReservationSection';
import { StorySection }        from '@/components/StorySection';
import { Footer }              from '@/components/Footer';
import { CartDrawer }          from '@/components/CartDrawer';
import { Toaster }             from '@/components/ui/sonner';
import { useCart, cartCount, cartTotal } from '@/store/cart';
import { formatXAF }           from '@/lib/format';

export default function App() {
    const [cartOpen, setCartOpen] = useState(false);
    const items = useCart((s) => s.items);
    const count = cartCount(items);
    const total = cartTotal(items);

    // Body scroll lock when cart is open
    useEffect(() => {
        document.documentElement.style.overflow = cartOpen ? 'hidden' : '';
        return () => { document.documentElement.style.overflow = ''; };
    }, [cartOpen]);

    return (
        <>
            <a
                href="#main"
                className="sr-only focus:not-sr-only fixed left-2 top-2 z-[100] rounded-md bg-foreground px-3 py-2 text-sm text-background"
            >
                Skip to content
            </a>

            <MarqueeTicker />
            <Header onOpenCart={() => setCartOpen(true)} />

            <main id="main" className="pb-24 md:pb-0">
                <Hero />
                <MenuSection />
                <PicksSection />
                <ReservationSection />
                <StorySection />
            </main>

            <Footer />

            {/* Mobile sticky action bar */}
            <AnimatePresence>
                {count > 0 && (
                    <motion.div
                        initial={{ y: 80, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 80, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
                        className="fixed inset-x-0 bottom-0 z-30 md:hidden p-3 glass border-t border-border"
                        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
                    >
                        <button
                            onClick={() => setCartOpen(true)}
                            className="flex w-full items-center justify-between rounded-full bg-foreground px-5 py-3 text-background font-medium active:scale-[0.98] transition-transform"
                        >
                            <span className="flex items-center gap-2">
                                <ShoppingBag className="h-4 w-4" />
                                View basket
                            </span>
                            <span className="font-mono text-sm tabular-nums opacity-80">
                                {count} · {formatXAF(total)}
                            </span>
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <CartDrawer open={cartOpen} onOpenChange={setCartOpen} />
            <Toaster />
        </>
    );
}
