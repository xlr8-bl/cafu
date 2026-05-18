import { FormEvent, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowRight, Calendar, Clock, Users, Check, AlertCircle,
    Sparkles, Heart, Cake, Briefcase, Home,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

// ---------- date helpers ----------

function addDays(d: Date, n: number) {
    const x = new Date(d);
    x.setDate(x.getDate() + n);
    return x;
}
function startOfDay(d: Date) {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
}
function isSameDay(a: Date, b: Date) {
    return a.toDateString() === b.toDateString();
}
function formatChipDate(d: Date, today: Date) {
    const tomorrow = addDays(today, 1);
    if (isSameDay(d, today))    return { line1: 'Today',    line2: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) };
    if (isSameDay(d, tomorrow)) return { line1: 'Tomorrow', line2: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) };
    return {
        line1: d.toLocaleDateString('en-GB', { weekday: 'short' }),
        line2: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
    };
}
function combineDateTime(date: Date, time: string) {
    const [hh, mm] = time.split(':').map(Number);
    const d = new Date(date);
    d.setHours(hh, mm, 0, 0);
    return d;
}
function toLocalISO(d: Date) {
    // datetime-local format without timezone suffix — what the PHP parser expects.
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
}

const LUNCH_SLOTS  = ['11:30','12:00','12:30','13:00','13:30','14:00','14:30'];
const DINNER_SLOTS = ['18:00','18:30','19:00','19:30','20:00','20:30','21:00','21:30','22:00'];

// Deterministic pseudo-availability — same date+slot returns same result.
function slotAvailable(date: Date, slot: string): boolean {
    const key = `${date.toDateString()}-${slot}`;
    let hash = 0;
    for (let i = 0; i < key.length; i++) hash = ((hash << 5) - hash + key.charCodeAt(i)) | 0;
    return Math.abs(hash) % 5 !== 0; // ~20 % busy
}

const PARTY_SIZES = [1, 2, 3, 4, 5, 6] as const;

const OCCASIONS = [
    { id: '',            label: 'Just dinner',  icon: Sparkles },
    { id: 'anniversary', label: 'Anniversary',  icon: Heart },
    { id: 'birthday',    label: 'Birthday',     icon: Cake },
    { id: 'business',    label: 'Business',     icon: Briefcase },
    { id: 'family',      label: 'Family',       icon: Home },
] as const;

// ---------- component ----------

export function ReservationSection() {
    const today = useMemo(() => startOfDay(new Date()), []);
    const dates = useMemo(() => Array.from({ length: 14 }, (_, i) => addDays(today, i)), [today]);

    const [date, setDate]         = useState<Date | null>(today);
    const [time, setTime]         = useState<string | null>(null);
    const [party, setParty]       = useState<number>(2);
    const [occasion, setOccasion] = useState<string>('');
    const [name, setName]         = useState('');
    const [phone, setPhone]       = useState('');
    const [notes, setNotes]       = useState('');

    const [submitting, setSubmitting] = useState(false);
    const [confirmed, setConfirmed]   = useState<{ ref: string; reservedFor: string } | null>(null);
    const [errors, setErrors]         = useState<{ name?: string; phone?: string }>({});

    // Reset time when date changes — slot availability is per-day.
    useEffect(() => { setTime(null); }, [date]);

    const isValid =
        !!date &&
        !!time &&
        name.trim().length >= 2 &&
        phone.trim().length >= 6 &&
        Object.keys(errors).length === 0;

    function validate() {
        const next: typeof errors = {};
        if (name.trim().length < 2) next.name = 'Please enter your name.';
        if (phone.trim().length < 6) next.phone = 'Please enter a valid phone.';
        setErrors(next);
        return Object.keys(next).length === 0;
    }

    async function submit(ev: FormEvent<HTMLFormElement>) {
        ev.preventDefault();
        if (!date || !time) {
            toast.error('Pick a date and a time first.');
            return;
        }
        if (!validate()) return;

        const reservedFor = combineDateTime(date, time);
        const occasionLabel = OCCASIONS.find((o) => o.id === occasion)?.label ?? '';
        const composedNotes = [
            occasionLabel && occasionLabel !== 'Just dinner' ? `Occasion: ${occasionLabel}` : null,
            notes.trim() || null,
        ].filter(Boolean).join('\n');

        setSubmitting(true);
        try {
            const data = await api.reserve({
                customer:     { name: name.trim(), phone: phone.trim() },
                party_size:   party,
                reserved_for: toLocalISO(reservedFor),
                notes:        composedNotes || null,
            });
            setConfirmed({
                ref: String(data.id),
                reservedFor: new Date(data.reserved_for).toLocaleString('en-GB', {
                    weekday: 'long', day: '2-digit', month: 'long',
                    hour: '2-digit', minute: '2-digit',
                }),
            });
            toast.success('Table held');
        } catch (err) {
            toast.error((err as Error).message || 'Could not hold the table.');
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <section id="reservations" className="relative py-20 md:py-28">
            <div className="container grid grid-cols-1 lg:grid-cols-[5fr_7fr] gap-12 lg:gap-16 items-start">
                {/* LEFT — editorial copy */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-10%' }}
                    transition={{ duration: 0.7 }}
                    className="lg:sticky lg:top-24"
                >
                    <p className="font-mono text-[0.72rem] uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-3 mb-3">
                        <span className="h-px w-8 bg-muted-foreground/50" />
                        No. 04 / Reservations
                    </p>
                    <h2 className="font-serif text-display-lg font-[400] tracking-tight" style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 50" }}>
                        Hold a table
                    </h2>
                    <p className="mt-4 text-muted-foreground leading-relaxed max-w-md">
                        Tables hold for fifteen minutes after your reservation time. We’ll text
                        you a confirmation. Walk-ins always welcome at the bar.
                    </p>
                    <ul className="mt-10 space-y-4">
                        {[
                            ['01', 'Service runs 11:00 — 22:30. Last orders at 22:00.'],
                            ['02', <>Parties of 7+ — call the house: <a href="tel:+237699447600" className="text-primary underline-offset-4 hover:underline">+237&nbsp;699&nbsp;44&nbsp;76&nbsp;00</a>.</>],
                            ['03', 'Allergies, occasion, spice level — note it in the comments.'],
                        ].map(([num, text], i) => (
                            <li key={i} className="grid grid-cols-[auto_1fr] gap-4 pb-4 border-b border-border last:border-b-0 last:pb-0">
                                <span className="font-mono text-[0.7rem] uppercase tracking-[0.1em] text-muted-foreground">{num}</span>
                                <span className="text-foreground/85 text-[0.95rem]">{text}</span>
                            </li>
                        ))}
                    </ul>
                </motion.div>

                {/* RIGHT — the form */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-10%' }}
                    transition={{ duration: 0.7, delay: 0.1 }}
                    className="relative"
                >
                    <AnimatePresence mode="wait">
                        {confirmed ? (
                            <Confirmation
                                key="confirmed"
                                reservedFor={confirmed.reservedFor}
                                party={party}
                                name={name}
                                onReset={() => {
                                    setConfirmed(null);
                                    setTime(null);
                                    setName('');
                                    setPhone('');
                                    setNotes('');
                                    setOccasion('');
                                }}
                            />
                        ) : (
                            <motion.form
                                key="form"
                                onSubmit={submit}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="relative rounded-3xl border border-border bg-card/60 backdrop-blur shadow-[0_30px_60px_-30px_rgba(0,0,0,0.6)] overflow-hidden"
                            >
                                <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/[0.04] to-transparent" />

                                <div className="flex items-baseline justify-between px-7 md:px-9 pt-7 md:pt-8 pb-4 border-b border-dashed border-border">
                                    <span className="font-mono text-[0.7rem] uppercase tracking-[0.14em] text-muted-foreground">Guestbook</span>
                                    <span className="font-mono text-[0.72rem] uppercase tracking-[0.1em] text-muted-foreground">
                                        {today.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
                                    </span>
                                </div>

                                <div className="px-7 md:px-9 py-7 space-y-9">
                                    {/* Date */}
                                    <Field icon={Calendar} title="Date" subtitle="Next two weeks">
                                        <div
                                            className="-mx-7 md:-mx-9 px-7 md:px-9 overflow-x-auto pb-2 [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded-full"
                                        >
                                            <div className="flex items-stretch gap-2 w-max">
                                                {dates.map((d) => {
                                                    const chip = formatChipDate(d, today);
                                                    const active = date && isSameDay(d, date);
                                                    return (
                                                        <button
                                                            key={d.toISOString()}
                                                            type="button"
                                                            onClick={() => setDate(d)}
                                                            className={cn(
                                                                'group min-w-[78px] rounded-2xl border px-3 py-2.5 text-center transition-all duration-200 ease-out active:scale-[0.97]',
                                                                active
                                                                    ? 'border-primary bg-primary text-primary-foreground shadow-[0_8px_24px_-8px_hsl(var(--primary)/0.6)]'
                                                                    : 'border-border bg-white/[0.02] text-foreground hover:border-primary/50 hover:bg-white/[0.05]'
                                                            )}
                                                        >
                                                            <div className={cn(
                                                                'font-mono text-[0.6rem] uppercase tracking-[0.16em]',
                                                                active ? 'text-primary-foreground/80' : 'text-muted-foreground'
                                                            )}>
                                                                {chip.line1}
                                                            </div>
                                                            <div className="text-[0.95rem] font-medium mt-0.5">{chip.line2}</div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </Field>

                                    {/* Time */}
                                    <Field icon={Clock} title="Time" subtitle={date ? 'Lunch & dinner service' : 'Pick a date first'}>
                                        <AnimatePresence mode="wait">
                                            <motion.div
                                                key={date?.toISOString() ?? 'none'}
                                                initial={{ opacity: 0, y: 6 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -6 }}
                                                transition={{ duration: 0.25 }}
                                                className="space-y-4"
                                            >
                                                <SlotRow label="Lunch"  slots={LUNCH_SLOTS}  date={date} value={time} onChange={setTime} />
                                                <SlotRow label="Dinner" slots={DINNER_SLOTS} date={date} value={time} onChange={setTime} />
                                            </motion.div>
                                        </AnimatePresence>
                                    </Field>

                                    {/* Party size */}
                                    <Field icon={Users} title="Party" subtitle="Tap a number">
                                        <div className="flex flex-wrap gap-2">
                                            {PARTY_SIZES.map((n) => (
                                                <Chip key={n} active={party === n} onClick={() => setParty(n)} className="min-w-[44px]">
                                                    {n}
                                                </Chip>
                                            ))}
                                            <a
                                                href="tel:+237699447600"
                                                className="inline-flex items-center rounded-full border border-dashed border-border bg-white/[0.02] px-3.5 py-2 text-sm text-muted-foreground hover:text-primary hover:border-primary transition-colors"
                                            >
                                                7+ · call us
                                            </a>
                                        </div>
                                    </Field>

                                    {/* Occasion */}
                                    <Field title="Occasion" subtitle="Optional — helps us prepare">
                                        <div className="flex flex-wrap gap-2">
                                            {OCCASIONS.map((o) => {
                                                const Icon = o.icon;
                                                return (
                                                    <Chip key={o.id} active={occasion === o.id} onClick={() => setOccasion(o.id)}>
                                                        <Icon className="h-3.5 w-3.5" />
                                                        {o.label}
                                                    </Chip>
                                                );
                                            })}
                                        </div>
                                    </Field>

                                    {/* Your details */}
                                    <Field title="Your details">
                                        <div className="grid gap-3">
                                            <div className="grid gap-2">
                                                <Label htmlFor="r-name">Name</Label>
                                                <Input
                                                    id="r-name"
                                                    value={name}
                                                    onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: undefined })); }}
                                                    onBlur={() => name.trim().length < 2 && setErrors((p) => ({ ...p, name: 'Please enter your name.' }))}
                                                    placeholder="Anjali Mwangi"
                                                    autoComplete="name"
                                                    className={cn(errors.name && 'border-destructive focus-visible:border-destructive focus-visible:ring-destructive/30')}
                                                />
                                                {errors.name && <FieldError>{errors.name}</FieldError>}
                                            </div>

                                            <div className="grid gap-2">
                                                <Label htmlFor="r-phone">Phone</Label>
                                                <div className="relative">
                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-sm text-muted-foreground pointer-events-none">+237</span>
                                                    <Input
                                                        id="r-phone"
                                                        value={phone}
                                                        onChange={(e) => { setPhone(e.target.value); setErrors((p) => ({ ...p, phone: undefined })); }}
                                                        onBlur={() => phone.trim().length < 6 && setErrors((p) => ({ ...p, phone: 'Please enter a valid phone.' }))}
                                                        inputMode="tel"
                                                        autoComplete="tel"
                                                        placeholder="699 44 76 00"
                                                        className={cn('pl-[3.5rem]', errors.phone && 'border-destructive focus-visible:border-destructive focus-visible:ring-destructive/30')}
                                                    />
                                                </div>
                                                {errors.phone && <FieldError>{errors.phone}</FieldError>}
                                            </div>

                                            <div className="grid gap-2">
                                                <Label htmlFor="r-notes">
                                                    Notes <span className="normal-case tracking-normal text-muted-foreground/60 ml-1">— allergies, table preference, spice level</span>
                                                </Label>
                                                <Textarea
                                                    id="r-notes"
                                                    value={notes}
                                                    onChange={(e) => setNotes(e.target.value)}
                                                    rows={2}
                                                    placeholder="Window seat if possible, mild on the pepper for one of us."
                                                />
                                            </div>
                                        </div>
                                    </Field>
                                </div>

                                {/* Summary + submit */}
                                <Summary
                                    date={date}
                                    time={time}
                                    party={party}
                                    occasion={OCCASIONS.find((o) => o.id === occasion)?.label ?? ''}
                                    submitting={submitting}
                                    canSubmit={isValid && !submitting}
                                />
                            </motion.form>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>
        </section>
    );
}

// ---------- subcomponents ----------

function Field({
    icon: Icon, title, subtitle, children,
}: {
    icon?: any; title: string; subtitle?: string; children: React.ReactNode;
}) {
    return (
        <div>
            <div className="mb-3 flex items-end justify-between gap-3">
                <div className="flex items-center gap-2">
                    {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
                    <span className="font-mono text-[0.72rem] uppercase tracking-[0.14em] text-muted-foreground">{title}</span>
                </div>
                {subtitle && <span className="text-xs text-muted-foreground/70">{subtitle}</span>}
            </div>
            {children}
        </div>
    );
}

function Chip({
    active, onClick, children, className,
}: {
    active: boolean; onClick: () => void; children: React.ReactNode; className?: string;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm transition-all duration-200 ease-out active:scale-[0.97]',
                active
                    ? 'border-primary bg-primary text-primary-foreground shadow-[0_6px_20px_-8px_hsl(var(--primary)/0.6)]'
                    : 'border-border bg-white/[0.02] text-foreground hover:border-primary/50 hover:bg-white/[0.05]',
                className
            )}
        >
            {children}
        </button>
    );
}

function SlotRow({
    label, slots, date, value, onChange,
}: {
    label: string; slots: string[]; date: Date | null; value: string | null;
    onChange: (s: string) => void;
}) {
    return (
        <div>
            <p className="font-serif italic text-sm text-muted-foreground mb-2">{label}</p>
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
                {slots.map((s) => {
                    const ok = date ? slotAvailable(date, s) : true;
                    const active = value === s;
                    return (
                        <button
                            key={s}
                            type="button"
                            disabled={!ok || !date}
                            onClick={() => ok && onChange(s)}
                            className={cn(
                                'rounded-xl border px-2 py-2 text-sm font-mono tabular-nums transition-all duration-200 ease-out',
                                'disabled:cursor-not-allowed disabled:opacity-30 disabled:line-through',
                                active
                                    ? 'border-primary bg-primary text-primary-foreground shadow-[0_6px_20px_-8px_hsl(var(--primary)/0.6)]'
                                    : 'border-border bg-white/[0.02] text-foreground hover:border-primary/50 hover:bg-white/[0.05] active:scale-[0.97]'
                            )}
                        >
                            {s}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

function FieldError({ children }: { children: React.ReactNode }) {
    return (
        <p className="flex items-center gap-1.5 text-xs text-destructive">
            <AlertCircle className="h-3 w-3" />
            {children}
        </p>
    );
}

function Summary({
    date, time, party, occasion, submitting, canSubmit,
}: {
    date: Date | null; time: string | null; party: number; occasion: string;
    submitting: boolean; canSubmit: boolean;
}) {
    const dateLine = date
        ? date.toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long' })
        : 'Pick a date';
    const timeLine = time ?? '—';
    const partyLine = `${party} ${party === 1 ? 'guest' : 'guests'}`;

    return (
        <div className="border-t border-border bg-black/30 px-7 md:px-9 py-6 flex flex-col gap-5">
            <div className="grid grid-cols-3 gap-4">
                <SummaryCell label="Date"  value={dateLine}  />
                <SummaryCell label="Time"  value={timeLine}  />
                <SummaryCell label="Party" value={partyLine} extra={occasion && occasion !== 'Just dinner' ? occasion : undefined} />
            </div>

            <Button type="submit" size="lg" disabled={!canSubmit} className="w-full">
                {submitting ? 'Holding your table…' : 'Confirm reservation'}
                {!submitting && <ArrowRight className="h-4 w-4" />}
            </Button>
        </div>
    );
}

function SummaryCell({ label, value, extra }: { label: string; value: string; extra?: string }) {
    return (
        <div>
            <div className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
            <div className="mt-1 font-serif text-[1.05rem] leading-tight" style={{ fontVariationSettings: "'opsz' 36, 'SOFT' 40" }}>
                {value}
            </div>
            {extra && <div className="mt-1 text-xs text-primary">{extra}</div>}
        </div>
    );
}

function Confirmation({
    reservedFor, party, name, onReset,
}: {
    reservedFor: string; party: number; name: string; onReset: () => void;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1,    y: 0 }}
            transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
            className="relative rounded-3xl border border-primary/40 bg-card/60 backdrop-blur shadow-[0_30px_60px_-30px_rgba(0,0,0,0.6)] overflow-hidden"
        >
            <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/[0.12] via-primary/[0.04] to-transparent" />
            <div className="px-7 md:px-9 py-10 md:py-14 text-center">
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-[0_8px_30px_-8px_hsl(var(--primary)/0.6)]">
                    <Check className="h-7 w-7" />
                </div>
                <p className="mt-6 font-mono text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground">
                    Table held
                </p>
                <h3
                    className="mt-2 font-serif text-3xl md:text-4xl font-medium tracking-tight text-balance"
                    style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 50" }}
                >
                    See you {name ? <em className="text-primary not-italic">{name.split(' ')[0]}</em> : 'soon'}.
                </h3>
                <p className="mt-4 text-muted-foreground leading-relaxed">
                    Your table for <strong className="text-foreground tabular-nums">{party}</strong> is held for{' '}
                    <strong className="text-foreground">{reservedFor}</strong>. We’ll send a text to confirm shortly.
                </p>
                <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                    <Button variant="outline" onClick={onReset}>Make another</Button>
                    <Button asChild>
                        <a href="#menu">
                            Pre-order from the menu
                            <ArrowRight className="h-4 w-4" />
                        </a>
                    </Button>
                </div>
            </div>
        </motion.div>
    );
}
