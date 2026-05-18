export type MenuItem = {
    id: number;
    name: string;
    description: string | null;
    price_cents: number;
    image_url: string | null;
    category_slug: string;
    category_name: string;
    tags: string[];
};

export type MenuResponse = { items: MenuItem[] };

export type RecommendItem = {
    id: number;
    name: string;
    price_cents: number;
    image_url: string | null;
};

export type RecommendResponse = { items: RecommendItem[] };

export type OrderRequest = {
    customer: { name: string; phone: string };
    items: { menu_item_id: number; quantity: number }[];
};

export type OrderResponse = {
    reference: string;
    total_cents: number;
};

export type ReservationRequest = {
    customer: { name: string; phone: string };
    party_size: number;
    reserved_for: string;
    notes: string | null;
};

export type ReservationResponse = {
    id: number;
    reserved_for: string;
};
