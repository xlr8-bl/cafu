import { motion } from 'framer-motion';

export function StorySection() {
    return (
        <section id="story" className="relative py-24 md:py-32 bg-foreground text-background">
            <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
                style={{ backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")" }}
            />
            <div className="container grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-12 lg:gap-20 items-end relative">
                <motion.blockquote
                    initial={{ opacity: 0, y: 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-10%' }}
                    transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
                    className="font-serif italic text-[clamp(1.6rem,4vw,3rem)] leading-[1.18] tracking-tight text-balance max-w-3xl"
                    style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 80, 'wght' 360" }}
                >
                    “A kitchen is memory simmering. The room — the light at six, the bikutsi
                    turned low — is just the staging.”
                </motion.blockquote>

                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-10%' }}
                    transition={{ duration: 0.7, delay: 0.15 }}
                    className="text-background/75 text-[0.95rem] leading-relaxed"
                >
                    <p className="font-mono text-[0.72rem] uppercase tracking-[0.2em] text-background/60 flex items-center gap-3 mb-4">
                        <span className="h-px w-8 bg-background/50" />
                        The house
                    </p>
                    <p>
                        Maison Cafu is a 32-seat room in Bonapriso, just off Rue Joffre. We cook the
                        Cameroon we grew up with — Sawa kitchens, the Bamileke Sunday plates, North-West
                        cocoyam-pounding, Bassa smoke. The menu is written the morning we open, with
                        whatever Sandaga market sent that day. The recommender on this site is a small
                        Apriori model — it learns which plates the dining room is choosing together and
                        quietly nudges the next guest.
                    </p>
                </motion.div>
            </div>
        </section>
    );
}
