export interface CustomerChat {
    phone_number: string;
    is_active: boolean;
    escalation_status: boolean;
    customer_type: string;
    total_spend: number;
    "customer_name": string | null;
    "email": string | null;
    "address": string | null;
    "cart_id": string | null;
    "order_history": string | null;
    "socials": string[] | null;
    "interest_groups": string[] | null;
    "customer_quickbook_id": string | null;
    "tags": string[] | null;
    "company_name": string | null;
    last_message: string | null;
    last_message_time: string | null;
    last_message_sender: "agent" | "representative" | "customer";
    last_message_type: "text" | "image" | "audio" | string;
}

export interface CustomerChats {
    customers: CustomerChat[],
    total: number;
    page: number;
    limit: number;
    total_pages: number;
    has_next: boolean;
    has_previous: boolean;
    total_escalated: number;
}

export interface Message {
    time_stamp: string;
    content: string;
    message_type: "text" | "audio" | "voice" | "video" | "image" | string;
    sender: "agent" | "representative" | "customer" | string;
}

export interface ChatMessages {
    phone_number: string;
    messages: Message[],
    "pagination": {
        current_page: number;
        total_pages: number;
        messages_per_page: number;
        has_next: boolean;
        has_previous: boolean;
    },
    total_messages: number;
}