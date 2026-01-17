"use client";

import { Settings } from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';
import QuickMessagesPreferences from './_components/QuickMessagesPreferences';
import PageLoader from "@/components/ui/PageLoader";

export default function PreferencesClient() {
    const { user, loading: roleLoading, isSuperAdmin } = useUserRole();

    if (roleLoading) {
        return <PageLoader text={"Loading preferences..."}/>
    }

    if (!user) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-red-500">Please log in to access preferences</p>
            </div>
        );
    }

    return (
        <div className="p-3 flex flex-1 flex-col">
            <div className="space-y-3 flex flex-1 flex-col">
                {/*<div className="bg-white rounded-xl border border-gray-200 p-3">*/}
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                            <Settings className="w-5 h-5 text-yellow-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">Preferences</h2>
                            <p className="text-sm text-gray-600">Customize your workspace settings and preferences</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <QuickMessagesPreferences isSuperAdmin={isSuperAdmin} />

                        {/* Add more preference sections here as needed */}
                    </div>
                {/*</div>*/}
            </div>
        </div>
    );
}