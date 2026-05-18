import type {
    MenuResponse,
    RecommendResponse,
    OrderRequest,
    OrderResponse,
    ReservationRequest,
    ReservationResponse,
} from './types';

class ApiError extends Error {
    constructor(public status: number, message: string, public data?: unknown) {
        super(message);
    }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(path, {
        ...init,
        headers: {
            Accept: 'application/json',
            ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
            ...init?.headers,
        },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        const message = (data as { error?: string })?.error
            ?? `${init?.method ?? 'GET'} ${path} → ${res.status}`;
        throw new ApiError(res.status, message, data);
    }
    return data as T;
}

export const api = {
    menu(category?: string) {
        const qs = category ? `?category=${encodeURIComponent(category)}` : '';
        return request<MenuResponse>(`/api/menu${qs}`);
    },
    recommend(basket: number[]) {
        return basket.length
            ? request<RecommendResponse>('/api/recommend', {
                method: 'POST',
                body: JSON.stringify({ basket }),
            })
            : request<RecommendResponse>('/api/recommend');
    },
    placeOrder(body: OrderRequest) {
        return request<OrderResponse>('/api/orders', {
            method: 'POST',
            body: JSON.stringify(body),
        });
    },
    reserve(body: ReservationRequest) {
        return request<ReservationResponse>('/api/reservations', {
            method: 'POST',
            body: JSON.stringify(body),
        });
    },
};

export { ApiError };
