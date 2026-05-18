import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type CartItem = {
    id: number;
    name: string;
    price_cents: number;
    image_url: string | null;
    quantity: number;
};

type CartState = {
    items: Record<number, CartItem>;
    add: (item: Omit<CartItem, 'quantity'>) => void;
    setQty: (id: number, qty: number) => void;
    remove: (id: number) => void;
    clear: () => void;
};

export const useCart = create<CartState>()(
    persist(
        (set) => ({
            items: {},
            add: (item) => set((state) => {
                const current = state.items[item.id];
                const quantity = (current?.quantity ?? 0) + 1;
                return { items: { ...state.items, [item.id]: { ...item, quantity } } };
            }),
            setQty: (id, qty) => set((state) => {
                if (qty <= 0) {
                    const next = { ...state.items };
                    delete next[id];
                    return { items: next };
                }
                const current = state.items[id];
                if (!current) return state;
                return { items: { ...state.items, [id]: { ...current, quantity: qty } } };
            }),
            remove: (id) => set((state) => {
                const next = { ...state.items };
                delete next[id];
                return { items: next };
            }),
            clear: () => set({ items: {} }),
        }),
        { name: 'cafu.cart.v1' }
    )
);

export function cartCount(items: Record<number, CartItem>): number {
    return Object.values(items).reduce((n, it) => n + it.quantity, 0);
}

export function cartTotal(items: Record<number, CartItem>): number {
    return Object.values(items).reduce((t, it) => t + it.price_cents * it.quantity, 0);
}
