import { motion } from 'framer-motion';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { formatDate } from '@/lib/format';

const COLLAGE = [
    { src: '/images/hero-1.jpg', rotate: -6, top: '0%',  left: '0%',  z: 1, size: 'h-[260px] w-[200px]' },
    { src: '/images/hero-2.jpg', rotate: 4,  top: '10%', left: '35%', z: 3, size: 'h-[300px] w-[230px]' },
    { src: '/images/hero-3.jpg', rotate: -3, top: '52%', left: '12%', z: 2, size: 'h-[220px] w-[180px]' },
];

export function Hero() {
    const [tables, setTables] = useState(7);
    useEffect(() => {
        const id = setInterval(() => {
            setTables((v) => {
                const delta = Math.random() < 0.5 ? -1 : 1;
                return Math.max(2, Math.min(14, v + delta));
            });
        }, 11_000);
        return () => clearInterval(id);
    }, []);

    return (
        <section aria-label="Welcome" className="relative pt-12 pb-20 md:pt-20 md:pb-32 overflow-hidden">
            <div className="absolute inset-0 -z-10 bg-grid-fade opacity-90" />
            <div className="container">
                <motion.p
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
                    className="font-mono text-[0.72rem] uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-3 mb-6"
                >
                    <span className="h-px w-8 bg-muted-foreground/50" />
                    No. 01 / The house · Bonapriso, Douala
                </motion.p>

                <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-10 lg:gap-16 items-start">
                    <div>
                        <motion.h1
                            initial={{ opacity: 0, y: 18 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1], delay: 0.05 }}
                            className="font-serif text-display-2xl font-[380] text-foreground text-balance"
                            style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 50" }}
                        >
                            A{' '}
                            <span
                                className="italic text-primary"
                                style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 100, 'wght' 380" }}
                            >
                                Cameroonian
                            </span>{' '}
                            kitchen for slow days &amp; unhurried evenings.
                        </motion.h1>

                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1], delay: 0.2 }}
                            className="mt-8 max-w-xl"
                        >
                            <p className="text-base md:text-lg text-muted-foreground leading-relaxed text-pretty">
                                Ndolé, Poulet DG, Eru, Mbongo Tchobi — cooked the long way and served on
                                miondo. The menu is built around what came in from the market <span className="font-serif italic text-foreground">this morning</span>.
                            </p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1], delay: 0.3 }}
                            className="mt-8 flex flex-wrap items-center gap-3"
                        >
                            <Button asChild size="lg">
                                <a href="#menu">
                                    See the menu
                                    <ArrowRight className="h-4 w-4" />
                                </a>
                            </Button>
                            <Button asChild variant="link" size="lg">
                                <a href="#reservations">
                                    Reserve a table
                                    <ArrowUpRight className="h-4 w-4" />
                                </a>
                            </Button>
                        </motion.div>

                        <motion.dl
                            initial="hidden"
                            animate="visible"
                            variants={{ visible: { transition: { staggerChildren: 0.08, delayChildren: 0.5 } } }}
                            className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-px bg-border rounded-2xl overflow-hidden border border-border"
                        >
                            {[
                                ['Service',     '11:00 — 23:00'],
                                ['Tables free', `${tables} of 24`],
                                ['Tonight',     'Bikutsi · 19:00'],
                                ['Chef’s pick', 'Ndolé · shrimp'],
                            ].map(([k, v]) => (
                                <motion.div
                                    key={k}
                                    variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}
                                    className="bg-card p-4"
                                >
                                    <dt className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-muted-foreground">{k}</dt>
                                    <dd className="mt-1 text-sm font-medium tabular-nums">{v}</dd>
                                </motion.div>
                            ))}
                        </motion.dl>
                    </div>

                    {/* Image collage */}
                    <div className="relative h-[460px] hidden lg:block">
                        {COLLAGE.map((c, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 30, rotate: 0 }}
                                animate={{ opacity: 1, y: 0, rotate: c.rotate }}
                                transition={{
                                    duration: 0.9,
                                    delay: 0.2 + i * 0.12,
                                    ease: [0.23, 1, 0.32, 1],
                                }}
                                whileHover={{ y: -6, scale: 1.02, rotate: c.rotate * 0.5 }}
                                className={`absolute ${c.size} rounded-2xl overflow-hidden border border-border shadow-[0_30px_60px_-30px_rgba(0,0,0,0.7)] ring-1 ring-white/10`}
                                style={{ top: c.top, left: c.left, zIndex: c.z }}
                            >
                                <img
                                    src={c.src}
                                    alt=""
                                    loading="eager"
                                    className="h-full w-full object-cover saturate-[0.95]"
                                    width="520"
                                    height="660"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                            </motion.div>
                        ))}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.7, duration: 0.5 }}
                            className="absolute right-0 bottom-0 z-10 rounded-full border border-border bg-card/80 backdrop-blur px-4 py-2 font-mono text-xs text-muted-foreground"
                        >
                            {formatDate()}
                        </motion.div>
                    </div>
                </div>
            </div>
        </section>
    );
}
