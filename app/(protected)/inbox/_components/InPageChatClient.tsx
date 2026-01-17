"use client";

import React, {useCallback, useEffect, useState} from "react";

import ChatList from "@/app/(protected)/inbox/[phone]/ChatList";
import ToggleSwitch from "@/components/ui/ToggleSwitch";
import Spinner from "@/components/ui/Spinner";
import Toast from "@/components/ui/Toast";

import {ChatApiResponse} from "@/types/responses";
import {ChatMessage} from "@/types/chat";
import {CustomerData} from "@/types/user";

import { createClient } from "@/lib/supabase/client";
import PropertiesPanel from "@/app/(protected)/inbox/[phone]/PropertiesPanel";
import Link from "next/link";
import {Download, ExternalLink, X} from "lucide-react";
import ChatClientSkeleton from "@/app/(protected)/inbox/_components/ChatClientSkeleton";
import {useUserRole} from "@/hooks/useUserRole";


interface InPageChatClientProps {
    phone: string;
    setSelectedPhone: (phone: string | null) => void;
    onEscalationChange: (phone: string, newStatus: boolean) => void;
}

const supabase = createClient();

export default function InPageChatClient({ phone, setSelectedPhone, onEscalationChange }: InPageChatClientProps) {
    // Ignore these comments, the dev has dementia

    // The phone string will contain the phone number
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null); // Changed to string to store error message
    const [chatData, setChatData] = useState<ChatApiResponse>({
        phone_number: phone,
        page: 1,
        messages: [],
    });
    const [escalationLoading, setEscalationLoading] = useState(false);
    const [isEscalated, setIsEscalated] = useState<boolean | null>(null);
    const [customerName, setCustomerName] = useState("Unknown");
    const [repName, setRepName] = useState("Support Representative");
    const [repEmail, setRepEmail] = useState<string | null>(null);
    const [showToast, setShowToast] = useState(false);

    const { loading: userRoleLoading, isSuperAdmin, isDeveloper } = useUserRole();

    // Function to show error toast
    const showError = useCallback((message: string) => {
        setError(message);
        setShowToast(true);
        // In your showError function:

        console.log("Setting error:", message); // Debug log
        setError(message);
        setShowToast(true);
        console.log("Error state should be:", message, "Show toast:", true); // Debug log

    }, []);

    // Fetch current user's name from Supabase
    useEffect(() => {
        async function fetchRepDetails() {
            try {
                const { data: { user }, error } = await supabase.auth.getUser();
                if (error) {
                    console.error('Error fetching user:', error);
                } else if (user?.user_metadata?.name) {
                    setRepName(user.user_metadata.name ?? `${user.user_metadata.firstName?.trim()} ${user.user_metadata.lastName?.trim()}` ?? user?.email ?? "Boost Representative");
                    setRepEmail(user?.email ?? null);
                }
            } catch (error) {
                console.error('Error:', error);
            }
        }

        void fetchRepDetails();
    }, []);

    useEffect(() => {
        async function fetchChat() {
            try {
                const res = await fetch(`/api/chats/${phone}?page=1&messages_count=20`, {
                    method: 'GET',
                    headers: { Accept: 'application/json' },
                });

                if (!res.ok) {
                    const errorMessage = `Failed to load chat (${res.status}): ${res.statusText}`;
                    console.error(errorMessage);
                    showError(errorMessage);
                    return;
                }

                const data: ChatApiResponse = await res.json();
                setChatData(data);
            } catch (err) {
                console.error('Chat fetch error:', err);
                showError("Failed to load chat data. Please check your connection and try again.");
            } finally {
                setLoading(false);
            }
        }

        fetchChat();
    }, [phone, showError]);

    const getEscalationPermission = (messages: ChatMessage[]) => {
        if (!messages[0]) return false;
        for (let i = 0; i < messages.length; i++) {

            if (messages[i].sender !== "customer") continue;
            console.log(messages[i].content)
            const ts = new Date(messages[i].time_stamp).getTime();
            const now = Date.now();
            const tfh = 23 * 60 * 60 * 1000;

            if ((now - ts) > tfh) {
                return false;
            }
            return true;
        }
    }

    useEffect(() => {
        async function fetchEscalationStatus() {
            try {
                const res = await fetch(`/api/users/${phone}`, {
                    method: 'GET',
                    headers: { Accept: 'application/json' },
                });

                if (!res.ok) {
                    const errorMessage = `Failed to load user data (${res.status}): ${res.statusText}`;
                    console.error(errorMessage);
                    showError(errorMessage);
                    return;
                }

                const data: CustomerData = await res.json();
                setIsEscalated(data.escalation_status === true);
                setCustomerName(data?.customer_name ?? "Unknown");

            } catch (err) {
                console.error('Escalation status fetch error:', err);
                showError("Failed to load escalation status. Please try again.");
            }
        }

        fetchEscalationStatus();
    }, [phone, showError]);

    const handleToggle = async () => {
        const newState = !isEscalated;
        setEscalationLoading(true);

        try {
            if (newState) {

                const messages = chatData.messages;
                const permission = getEscalationPermission(messages);
                if (!permission) {
                    showError("Can not escalate chat due to last customer message being more than 23 hours ago. If you think this is an error, please refresh the page & try again.")
                    return setIsEscalated(false);
                }

                // Escalating
                const res = await fetch(`/api/users/${phone}/escalate`, {
                    method: "POST",
                    headers: { Accept: 'application/json' }
                });

                if (!res.ok) {
                    const errorMessage = `Failed to escalate chat (${res.status}): ${res.statusText}`;
                    showError(errorMessage);
                    return;
                }
                onEscalationChange(phone, true);
                setIsEscalated(true);
            } else {
                // De-escalating
                const res = await fetch(`/api/users/${phone}/de-escalate`, {
                    method: "POST",
                    headers: { Accept: 'application/json' }
                });

                if (!res.ok) {
                    const errorMessage = `Failed to de-escalate chat (${res.status}): ${res.statusText}`;
                    showError(errorMessage);
                    return;
                }

                setIsEscalated(false);
                onEscalationChange(phone, false);

            }
        } catch (err) {
            console.error('Toggle error:', err);
            showError("Network error occurred. Please check your connection and try again.");
        } finally {
            setEscalationLoading(false);
        }
    };

    if (loading) return <ChatClientSkeleton/>

    const initials = customerName
        ? customerName.split(" ").map(word => word[0]).join("").slice(0, 2)
        : "?";

    return (
        <div className={"flex flex-col w-full"}>
            <div className="flex justify-between items-center border-b border-neutral-200 bg-neutral-50">
                <div className="flex gap-3 p-2 items-center">
                    <button
                        onClick={() => setSelectedPhone(null)}
                        className="p-1 bg-stone-400 hover:shadow-sm rounded-full duration-200 items-center justify-center cursor-pointer flex text-black border border-neutral-400 duration-150"
                    >
                        <X className={"text-white font-bold icon-center"} size={14}/>
                    </button>
                    <div className="flex items-center justify-self-center justify-center bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-full text-stone-800 text-xs font-bold w-8 h-8 ">{initials}</div>
                    <div className="flex flex-col gap-1">
                        <div className="font-semibold text-base">{customerName}</div>
                        <div className="text-sm text-neutral-500">{chatData.phone_number}</div>
                        <Link className={"text-xs  flex gap-1 text-neutral-400 hover:text-neutral-700 hover:underline duration-200"} href={`/inbox/${chatData.phone_number}`}>
                            <span>Open chat in separate window</span><ExternalLink size={11}/>
                        </Link>
                    </div>

                </div>

                <div className="flex gap-2 items-center">
                    {(!userRoleLoading && isSuperAdmin && isDeveloper) &&
                        <div className="flex flex-col gap-2 items-center">
                            <Link
                                href={`/inbox/export?phone=${phone}`}
                                className={"p-1 h-6 w-full bg-yellow-400 hover:bg-yellow-500 rounded-md flex items-center justify-center text-black hover:text-white duration-200"}
                            >
                                <Download className={"icon-center"} size={16}/>
                            </Link>
                            <div className="text-xs text-neutral-400">Export Chat</div>
                        </div>
                    }
                    <div className="flex flex-col gap-2 items-center px-4 mx-2">
                        {escalationLoading ? <Spinner/> :
                            isEscalated !== null && (
                                <div className="">
                                    <ToggleSwitch
                                        size="md"
                                        checked={isEscalated}
                                        onChange={handleToggle}
                                        disabled={escalationLoading}
                                    />
                                </div>
                            )
                        }
                        <div className="text-neutral-400 text-xs">Escalation</div>
                    </div>
                </div>


            </div>

            <div className="flex flex-row h-full overflow-y-hidden">
                <ChatList
                    // key={phone}
                    chat={chatData}
                    escalationStatus={isEscalated === true}
                    repName={repName} // Pass the rep name to ChatList
                    repEmail={repEmail} // Pass the rep email to ChatList
                />
                <PropertiesPanel  phone={phone} escalationStatus={isEscalated}/>
            </div>

            {/* Show toast when there's an error */}
            <Toast
                type={"error"}
                message={error || "An error occurred"}
                show={showToast && error !== null}
                onClose={() => {
                    setShowToast(false);
                    setError(null);
                }}
            />
        </div>
    )
}
