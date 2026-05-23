import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

const STORAGE_KEY = 'cafu_cookie_consent';

export function CookieBanner() {
    const [visible, setVisible] = useState(false);

    // Defer the check to after mount — avoids the banner flashing on every
    // navigation in a SPA where we want to render based on persisted state.
    useEffect(() => {
        try {
            if (window.localStorage.getItem(STORAGE_KEY) !== '1') {
                setVisible(true);
            }
        } catch {
            // Private mode / blocked storage: don't show the banner at all
            // since we can't remember the dismissal.
        }
    }, []);

    function dismiss() {
        try {
            window.localStorage.setItem(STORAGE_KEY, '1');
        } catch {
            // ignore
        }
        setVisible(false);
    }

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ y: 60, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 60, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 320, damping: 32 }}
                    role="region"
                    aria-label="Cookie notice"
                    className="fixed inset-x-4 bottom-4 z-50 md:inset-auto md:right-6 md:bottom-6 md:max-w-md rounded-2xl border border-border bg-card/95 backdrop-blur p-5 shadow-2xl"
                >
                    <div className="flex items-start gap-4">
                        <div className="flex-1">
                            <h3 className="text-sm font-semibold mb-1">A small note on cookies</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                We use a session cookie for staff signing in to the kitchen view. We
                                don't run analytics or trackers.{' '}
                                <a
                                    href="/legal/cookies"
                                    className="text-primary underline-offset-2 hover:underline"
                                >
                                    Read more
                                </a>
                                .
                            </p>
                            <div className="mt-4 flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={dismiss}
                                    className="inline-flex items-center justify-center h-9 px-4 rounded-full bg-foreground text-background font-medium text-xs active:scale-[0.97] transition-transform"
                                >
                                    Got it
                                </button>
                                <a
                                    href="/legal/privacy"
                                    className="inline-flex items-center justify-center h-9 px-4 rounded-full border border-border text-foreground font-medium text-xs hover:bg-white/[0.04] transition-colors"
                                >
                                    Privacy policy
                                </a>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={dismiss}
                            aria-label="Dismiss"
                            className="shrink-0 grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:text-foreground hover:bg-white/[0.04] transition-colors"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
