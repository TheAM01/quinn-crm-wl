// import { SignUpForm } from "@/components/supabase/sign-up-form";
import {requireAdmin} from "@/lib/auth/require-admin";
import AddUserClient from "./AddTeamClient";


export default async function AddTeamPage() {
    await requireAdmin()

    return (
        <div className="flex flex-1 flex-col w-full items-center justify-center p-3 md:p-10">
            <div className="w-full max-w-lg">
                <AddUserClient />
            </div>
        </div>
    );
}
