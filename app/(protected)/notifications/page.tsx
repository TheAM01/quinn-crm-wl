import NotificationsClient from "./NotificationsClient"
import {requireAuth} from "@/lib/auth/require-auth";

export default async function Notifications() {
    await requireAuth();

    return <NotificationsClient/>
}