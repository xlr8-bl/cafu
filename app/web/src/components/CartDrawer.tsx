import { FormEvent, useEffect, useRef, useState } from 'react';
import { ArrowRight, Minus, Plus, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import {
    Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCart, cartCount, cartTotal } from '@/store/cart';
import { formatXAF } from '@/lib/format';
import { api } from '@/lib/api';

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export function CartDrawer({ open, onOpenChange }: Props) {
    const items   = useCart((s) => s.items);
    const setQty  = useCart((s) => s.setQty);
    const clear   = useCart((s) => s.clear);

    const total = cartTotal(items);
    const count = cartCount(items);
    const list = Object.values(items);

    const [submitting, setSubmitting] = useState(false);
    const [status, setStatus] = useState<{ tone: 'success' | 'error' | null; text: string }>({ tone: null, text: '' });
    const displayedTotal = useAnimatedNumber(total);

    async function placeOrder(ev: FormEvent<HTMLFormElement>) {
        ev.preventDefault();
        if (list.length === 0) return;
        const fd = new FormData(ev.currentTarget);
        setSubmitting(true);
        setStatus({ tone: null, text: 'Placing order…' });
        try {
            const data = await api.placeOrder({
                customer: { name: String(fd.get('name')), phone: String(fd.get('phone')) },
                items: list.map((it) => ({ menu_item_id: it.id, quantity: it.quantity })),
            });
            setStatus({
                tone: 'success',
                text: `Order ${data.reference} placed. Total ${formatXAF(data.total_cents)}.`,
            });
            clear();
            toast.success(`Order ${data.reference} confirmed`);
        } catch (err) {
            setStatus({ tone: 'error', text: (err as Error).message || 'Could not place order.' });
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="flex flex-col p-0">
                <SheetHeader>
                    <p className="font-mono text-[0.66rem] uppercase tracking-[0.2em] text-muted-foreground">Order</p>
                    <SheetTitle className="font-serif text-2xl font-medium tracking-tight" style={{ fontVariationSettings: "'opsz' 60, 'SOFT' 40" }}>
                        Your basket
                    </SheetTitle>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto px-6">
                    {list.length === 0 ? (
                        <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-muted-foreground py-16">
                            <ShoppingBag className="h-14 w-14 stroke-[1.25] opacity-40" />
                            <p className="font-serif text-lg">The basket is empty.</p>
                            <p className="text-sm">Pick something from the menu to get started.</p>
                        </div>
                    ) : (
                        <ul className="divide-y divide-dashed divide-border">
                            {list.map((it) => (
                                <li key={it.id} className="grid grid-cols-[64px_1fr_auto] gap-4 items-center py-4">
                                    <div className="h-16 w-16 overflow-hidden rounded-xl bg-muted">
                                        <img src={it.image_url ?? ''} alt="" className="h-full w-full object-cover" width="64" height="64" loading="lazy" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="font-serif text-[1.02rem] font-medium leading-snug" style={{ fontVariationSettings: "'opsz' 36, 'SOFT' 40" }}>
                                            {it.name}
                                        </div>
                                        <div className="font-mono text-xs text-muted-foreground tabular-nums mt-1">
                                            {formatXAF(it.price_cents)} each
                                        </div>
                                    </div>
                                    <div className="inline-flex items-center gap-1 rounded-full border border-border p-1">
                                        <button
                                            type="button"
                                            onClick={() => setQty(it.id, it.quantity - 1)}
                                            className="grid h-7 w-7 place-items-center rounded-full text-muted-foreground transition-all hover:bg-white/[0.06] hover:text-foreground active:scale-90"
                                            aria-label="Decrease"
                                        ><Minus className="h-3.5 w-3.5" /></button>
                                        <span className="min-w-[20px] text-center font-mono text-sm tabular-nums">{it.quantity}</span>
                                        <button
                                            type="button"
                                            onClick={() => setQty(it.id, it.quantity + 1)}
                                            className="grid h-7 w-7 place-items-center rounded-full text-muted-foreground transition-all hover:bg-white/[0.06] hover:text-foreground active:scale-90"
                                            aria-label="Increase"
                                        ><Plus className="h-3.5 w-3.5" /></button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <SheetFooter>
                    <div className="flex items-baseline justify-between border-b border-dashed border-border pb-3">
                        <span className="font-mono text-[0.7rem] uppercase tracking-[0.14em] text-muted-foreground">
                            Total · {count} item{count === 1 ? '' : 's'}
                        </span>
                        <strong className="font-mono text-lg font-medium tabular-nums">
                            {formatXAF(displayedTotal)}
                        </strong>
                    </div>

                    <form onSubmit={placeOrder} className="grid gap-3">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="grid gap-2">
                                <Label htmlFor="o-name">Name</Label>
                                <Input id="o-name" name="name" required autoComplete="name" />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="o-phone">Phone</Label>
                                <Input id="o-phone" name="phone" inputMode="tel" required autoComplete="tel" />
                            </div>
                        </div>
                        <Button type="submit" size="lg" disabled={submitting || list.length === 0} className="w-full">
                            {submitting ? 'Placing order…' : 'Place order'}
                            {!submitting && <ArrowRight className="h-4 w-4" />}
                        </Button>
                        {status.text && (
                            <p
                                className={
                                    'text-sm transition-colors ' +
                                    (status.tone === 'success' ? 'text-primary' :
                                     status.tone === 'error'   ? 'text-destructive' :
                                                                  'text-muted-foreground')
                                }
                                role="status"
                                aria-live="polite"
                            >
                                {status.text}
                            </p>
                        )}
                    </form>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}

function useAnimatedNumber(target: number): number {
    const [value, setValue] = useState(target);
    const fromRef = useRef(target);
    const rafRef = useRef<number | null>(null);

    useEffect(() => {
        if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
            setValue(target);
            fromRef.current = target;
            return;
        }
        const from = fromRef.current;
        const delta = target - from;
        if (delta === 0) return;
        const start = performance.now();
        const duration = 360;
        const step = (now: number) => {
            const p = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - p, 3);
            setValue(from + delta * eased);
            if (p < 1) rafRef.current = requestAnimationFrame(step);
            else { fromRef.current = target; }
        };
        rafRef.current = requestAnimationFrame(step);
        return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    }, [target]);

    return value;
}
