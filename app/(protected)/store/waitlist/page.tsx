import FaqsClient from "./WaitlistClient";
import {requireAuth} from "@/lib/auth/require-auth";

export default async function WaitlistPage() {
    await requireAuth();
    return <FaqsClient/>
}