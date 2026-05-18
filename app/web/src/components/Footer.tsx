import { useState, FormEvent } from 'react';
import {
    Instagram, Facebook, MapPin, Phone, Mail, Clock,
    Gift, Users, Newspaper, ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';
import {
    Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const VISIT = [
    { icon: MapPin, label: 'Rue Joffre, Bonapriso', sub: 'Douala, Cameroon' },
    { icon: Clock,  label: 'Every day',             sub: '11:00 — 23:00 · last order 22:00' },
    { icon: Phone,  label: '+237 699 44 76 00',     sub: 'Reservations & groups', href: 'tel:+237699447600' },
    { icon: Mail,   label: 'bonjour@maisoncafu.cm', sub: 'Press & events',        href: 'mailto:bonjour@maisoncafu.cm' },
];

const MENU_LINKS = [
    { label: 'Mains',            href: '#menu' },
    { label: 'From the grill',   href: '#menu' },
    { label: 'Sides',            href: '#menu' },
    { label: 'Drinks',           href: '#menu' },
    { label: 'Desserts',         href: '#menu' },
    { label: 'Today’s pairings', href: '#picks' },
];

type InfoTopic = 'gift' | 'work' | 'press';

const INFO: Record<InfoTopic, {
    icon: any;
    title: string;
    eyebrow: string;
    body: string;
    cta: { label: string; href: string };
}> = {
    gift: {
        icon: Gift,
        eyebrow: 'Coming soon',
        title: 'Gift cards · paper and digital',
        body:
            'We’re printing the first run of Maison Cafu gift cards — denominations from 10,000 XAF, redeemable in the room or against a held table. ' +
            'Leave us a note and we’ll write to you when they’re on the shelf.',
        cta: { label: 'Email the house', href: 'mailto:bonjour@maisoncafu.cm?subject=Gift%20card%20inquiry' },
    },
    work: {
        icon: Users,
        eyebrow: 'We’re hiring',
        title: 'Work in the kitchen, on the floor, or behind the pass',
        body:
            'We hire on attitude first. Currently open: commis chef (kitchen), runner (floor), weekend host. ' +
            'Send a short note and a photo of the last thing you cooked — we read everything.',
        cta: { label: 'Apply by email', href: 'mailto:careers@maisoncafu.cm?subject=Joining%20the%20team' },
    },
    press: {
        icon: Newspaper,
        eyebrow: 'Press',
        title: 'Press, partnerships & shoots',
        body:
            'For features, location shoots, and chef bookings — we keep a small press kit with portraits, plate shots, ' +
            'and a one-pager on the house. Reach out and we’ll send it across the same afternoon.',
        cta: { label: 'Contact press desk', href: 'mailto:press@maisoncafu.cm?subject=Press%20inquiry' },
    },
};

const HOUSE_LINKS: { label: string; topic?: InfoTopic; href?: string }[] = [
    { label: 'The house',      href: '#story' },
    { label: 'Reserve',        href: '#reservations' },
    { label: 'Private events', href: '#reservations' },
    { label: 'Gift cards',     topic: 'gift' },
    { label: 'Work with us',   topic: 'work' },
    { label: 'Press',          topic: 'press' },
];

const SOCIAL = [
    { icon: Instagram, label: 'Instagram', href: 'https://instagram.com/' },
    { icon: Facebook,  label: 'Facebook',  href: 'https://facebook.com/' },
    {
        icon: (props: React.SVGProps<SVGSVGElement>) => (
            <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.198-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.572-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.71.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 22.075c-1.748 0-3.464-.473-4.97-1.367l-.357-.214-3.700.971.99-3.604-.232-.367C2.477 16.014 1.95 14.04 1.95 12 1.95 6.477 6.477 1.95 12 1.95s10.05 4.527 10.05 10.05c0 5.523-4.527 10.075-10.05 10.075zm0-22.025C5.385.05 0 5.435 0 12.05c0 2.121.557 4.198 1.615 6.025L.05 24l5.928-1.555c1.764.961 3.747 1.467 5.772 1.467 6.615 0 12-5.385 12-12.025S18.615.05 12 .05z"/>
            </svg>
        ),
        label: 'WhatsApp',
        href: 'https://wa.me/237699447600',
    },
];

export function Footer() {
    const [topic, setTopic] = useState<InfoTopic | null>(null);

    function onSubscribe(ev: FormEvent<HTMLFormElement>) {
        ev.preventDefault();
        const fd  = new FormData(ev.currentTarget);
        const raw = String(fd.get('email') ?? '').trim();
        if (!raw || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw)) {
            toast.error('That email doesn’t look right.');
            return;
        }
        toast.success('You’re on the list — first letter goes out Friday.');
        (ev.currentTarget as HTMLFormElement).reset();
    }

    const active = topic ? INFO[topic] : null;
    const ActiveIcon = active?.icon;

    return (
        <footer className="relative border-t border-border mt-12">
            <div className="container py-16 md:py-24">
                <div className="flex items-end justify-between gap-8 flex-wrap pb-16 mb-16 border-b border-border">
                    <h2
                        className="font-serif text-display-xl font-[380] tracking-tight text-balance max-w-2xl"
                        style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 60" }}
                    >
                        See you <span className="italic text-primary" style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 100, 'wght' 400" }}>soon</span> at the house.
                    </h2>
                    <a
                        href="#reservations"
                        className="group inline-flex items-center gap-3 rounded-full border border-border bg-white/[0.03] px-5 py-3 font-mono text-[0.72rem] uppercase tracking-[0.18em] text-foreground transition-all hover:bg-primary hover:text-primary-foreground hover:border-primary"
                    >
                        Reserve
                        <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>
                    </a>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8">
                    {/* Brand */}
                    <div className="lg:col-span-4">
                        <a href="/" className="inline-flex items-center gap-3">
                            <span className="grid h-10 w-10 place-items-center rounded-full bg-foreground text-background font-serif text-xl font-medium">M</span>
                            <span className="flex flex-col leading-none gap-1">
                                <span className="font-serif text-xl font-medium tracking-tight">Maison Cafu</span>
                                <span className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-muted-foreground">est. ’26 · Douala</span>
                            </span>
                        </a>
                        <p className="mt-6 text-muted-foreground text-[0.95rem] leading-relaxed max-w-sm">
                            A neighbourhood kitchen. Ndolé, achu, mbongo tchobi — cooked slowly,
                            served hot, with miondo and a glass of cold bissap on the side.
                        </p>

                        <div className="mt-6 flex items-center gap-2">
                            {SOCIAL.map((s) => {
                                const Icon = s.icon as any;
                                return (
                                    <a
                                        key={s.label}
                                        href={s.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        aria-label={s.label}
                                        className="grid h-10 w-10 place-items-center rounded-full border border-border text-muted-foreground transition-all hover:bg-primary hover:text-primary-foreground hover:border-primary"
                                    >
                                        <Icon className="h-4 w-4" />
                                    </a>
                                );
                            })}
                        </div>
                    </div>

                    {/* Visit */}
                    <div className="lg:col-span-4">
                        <h3 className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-muted-foreground mb-5 flex items-center gap-3">
                            <span className="h-px w-6 bg-muted-foreground/50" />
                            Visit
                        </h3>
                        <ul className="space-y-4">
                            {VISIT.map((v) => {
                                const Icon = v.icon;
                                const Inner = (
                                    <div className="flex items-start gap-3">
                                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border bg-white/[0.02] text-muted-foreground">
                                            <Icon className="h-4 w-4" />
                                        </span>
                                        <div>
                                            <div className="text-foreground text-[0.95rem] leading-tight">{v.label}</div>
                                            <div className="text-muted-foreground text-sm mt-0.5">{v.sub}</div>
                                        </div>
                                    </div>
                                );
                                return v.href ? (
                                    <li key={v.label}><a href={v.href} className="block hover:text-primary transition-colors">{Inner}</a></li>
                                ) : (
                                    <li key={v.label}>{Inner}</li>
                                );
                            })}
                        </ul>
                    </div>

                    {/* Menu links */}
                    <div className="lg:col-span-2">
                        <h3 className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-muted-foreground mb-5 flex items-center gap-3">
                            <span className="h-px w-6 bg-muted-foreground/50" />
                            Menu
                        </h3>
                        <ul className="space-y-3">
                            {MENU_LINKS.map((l) => (
                                <li key={l.label}>
                                    <a href={l.href} className="text-foreground/85 text-[0.92rem] hover:text-primary transition-colors">
                                        {l.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* House links — some open the InfoDialog */}
                    <div className="lg:col-span-2">
                        <h3 className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-muted-foreground mb-5 flex items-center gap-3">
                            <span className="h-px w-6 bg-muted-foreground/50" />
                            The house
                        </h3>
                        <ul className="space-y-3">
                            {HOUSE_LINKS.map((l) => (
                                <li key={l.label}>
                                    {l.href ? (
                                        <a href={l.href} className="text-foreground/85 text-[0.92rem] hover:text-primary transition-colors">
                                            {l.label}
                                        </a>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => l.topic && setTopic(l.topic)}
                                            className="text-foreground/85 text-[0.92rem] hover:text-primary transition-colors text-left"
                                        >
                                            {l.label}
                                        </button>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Newsletter */}
                <div className="mt-16 grid lg:grid-cols-[1.5fr_1fr] gap-6 items-center rounded-3xl border border-border bg-card/40 p-6 md:p-8">
                    <div>
                        <h3 className="font-serif text-2xl md:text-3xl font-medium tracking-tight" style={{ fontVariationSettings: "'opsz' 60, 'SOFT' 50" }}>
                            Notes from the market
                        </h3>
                        <p className="mt-2 text-muted-foreground text-[0.95rem] max-w-md">
                            Once a week — what came in from Sandaga market, news from the spice rack,
                            and the nights worth pulling up a chair for.
                        </p>
                    </div>
                    <form className="flex items-center gap-2" onSubmit={onSubscribe}>
                        <Label htmlFor="footer-email" className="sr-only">Email</Label>
                        <input
                            id="footer-email"
                            name="email"
                            type="email"
                            required
                            placeholder="you@email.cm"
                            className="flex h-12 w-full rounded-full border border-border bg-white/[0.03] px-5 py-2 text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:border-primary focus:bg-white/[0.06]"
                        />
                        <button
                            type="submit"
                            className="shrink-0 inline-flex items-center justify-center h-12 px-5 rounded-full bg-primary text-primary-foreground font-medium text-sm active:scale-[0.97] transition-transform hover:opacity-90"
                        >
                            Subscribe
                        </button>
                    </form>
                </div>

                {/* Legal */}
                <div className="mt-14 pt-8 border-t border-border flex flex-col-reverse md:flex-row items-start md:items-center justify-between gap-4 text-sm text-muted-foreground">
                    <p>
                        © {new Date().getFullYear()} Maison Cafu · Bonapriso, Douala.
                        All rights reserved. <span className="hidden sm:inline">CEC418 · Software Construction.</span>
                    </p>
                    <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-mono text-[0.7rem] uppercase tracking-[0.16em]">Payments</span>
                        <div className="flex items-center gap-2">
                            {['Cash', 'MTN MoMo', 'Orange Money', 'Visa'].map((p) => (
                                <span key={p} className="inline-flex items-center rounded-md border border-border bg-white/[0.03] px-2.5 py-1 font-mono text-[0.66rem] uppercase tracking-[0.1em]">
                                    {p}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Info dialog — Gift cards / Work with us / Press */}
            <Dialog open={topic !== null} onOpenChange={(open) => { if (!open) setTopic(null); }}>
                {active && ActiveIcon && (
                    <DialogContent>
                        <div className="flex items-center gap-3">
                            <span className="grid h-10 w-10 place-items-center rounded-full bg-primary/15 text-primary">
                                <ActiveIcon className="h-5 w-5" />
                            </span>
                            <span className="font-mono text-[0.66rem] uppercase tracking-[0.2em] text-muted-foreground">{active.eyebrow}</span>
                        </div>
                        <DialogHeader>
                            <DialogTitle>{active.title}</DialogTitle>
                            <DialogDescription>{active.body}</DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="!flex-row !justify-between">
                            <Button variant="ghost" onClick={() => setTopic(null)}>Close</Button>
                            <Button asChild>
                                <a href={active.cta.href}>
                                    {active.cta.label}
                                    <ArrowRight className="h-4 w-4" />
                                </a>
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                )}
            </Dialog>
        </footer>
    );
}
