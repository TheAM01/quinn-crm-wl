import React from "react";

export default function ChatListSkeleton() {
    return (
        <div className="flex flex-col h-full overflow-y-hidden flex-1">
            {/* Status bar skeleton */}
            <div className="bg-neutral-50 px-4 py-1 text-xs flex justify-between items-center">
				<span className="flex items-center gap-1">
					<span className="w-2 h-2 rounded-full bg-gray-300 animate-pulse" />
					<span className="h-3 w-20 bg-gray-300 rounded animate-pulse"></span>
				</span>
            </div>

            {/* Messages container skeleton */}
            <div className="p-5 gap-5 bg-neutral-100 overflow-y-scroll overflow-x-hidden h-full flex flex-col texture-mosaic">
                {/* Customer message bubble */}
                <div className="flex justify-start animate-pulse">
                    <div className="max-w-[70%] bg-white rounded-2xl rounded-tl-none p-4 shadow-sm">
                        <div className="space-y-2">
                            <div className="h-3 bg-gray-300 rounded w-48"></div>
                            <div className="h-3 bg-gray-300 rounded w-36"></div>
                        </div>
                        <div className="h-2 bg-gray-200 rounded w-16 mt-2"></div>
                    </div>
                </div>

                {/* Agent message bubble */}
                <div className="flex justify-end animate-pulse">
                    <div className="max-w-[70%] bg-yellow-400 rounded-2xl rounded-tr-none p-4 shadow-sm">
                        <div className="space-y-2">
                            <div className="h-3 bg-yellow-500 rounded w-40"></div>
                            <div className="h-3 bg-yellow-500 rounded w-32"></div>
                        </div>
                        <div className="h-2 bg-yellow-500 rounded w-16 mt-2"></div>
                    </div>
                </div>

                {/* Customer message bubble */}
                <div className="flex justify-start animate-pulse">
                    <div className="max-w-[70%] bg-white rounded-2xl rounded-tl-none p-4 shadow-sm">
                        <div className="space-y-2">
                            <div className="h-3 bg-gray-300 rounded w-56"></div>
                        </div>
                        <div className="h-2 bg-gray-200 rounded w-16 mt-2"></div>
                    </div>
                </div>

                {/* Representative message bubble */}
                <div className="flex justify-end animate-pulse">
                    <div className="max-w-[70%] bg-green-400 rounded-2xl rounded-tr-none p-4 shadow-sm">
                        <div className="space-y-2">
                            <div className="h-3 bg-green-500 rounded w-44"></div>
                            <div className="h-3 bg-green-500 rounded w-52"></div>
                            <div className="h-3 bg-green-500 rounded w-36"></div>
                        </div>
                        <div className="h-2 bg-green-500 rounded w-16 mt-2"></div>
                    </div>
                </div>

                {/* Customer message bubble */}
                <div className="flex justify-start animate-pulse">
                    <div className="max-w-[70%] bg-white rounded-2xl rounded-tl-none p-4 shadow-sm">
                        <div className="space-y-2">
                            <div className="h-3 bg-gray-300 rounded w-32"></div>
                        </div>
                        <div className="h-2 bg-gray-200 rounded w-16 mt-2"></div>
                    </div>
                </div>

                {/* Agent message bubble */}
                <div className="flex justify-end animate-pulse">
                    <div className="max-w-[70%] bg-yellow-400 rounded-2xl rounded-tr-none p-4 shadow-sm">
                        <div className="space-y-2">
                            <div className="h-3 bg-yellow-500 rounded w-48"></div>
                            <div className="h-3 bg-yellow-500 rounded w-40"></div>
                        </div>
                        <div className="h-2 bg-yellow-500 rounded w-16 mt-2"></div>
                    </div>
                </div>

                {/* Image message skeleton */}
                <div className="flex justify-start animate-pulse">
                    <div className="max-w-[70%] bg-white rounded-2xl rounded-tl-none p-2 shadow-sm">
                        <div className="w-64 h-48 bg-gray-300 rounded-lg"></div>
                        <div className="h-2 bg-gray-200 rounded w-16 mt-2 mx-2"></div>
                    </div>
                </div>

                {/* Agent message bubble */}
                <div className="flex justify-end animate-pulse">
                    <div className="max-w-[70%] bg-yellow-400 rounded-2xl rounded-tr-none p-4 shadow-sm">
                        <div className="space-y-2">
                            <div className="h-3 bg-yellow-500 rounded w-52"></div>
                        </div>
                        <div className="h-2 bg-yellow-500 rounded w-16 mt-2"></div>
                    </div>
                </div>
            </div>

            {/* Input area skeleton */}
            <div className="sticky bottom-0 p-4 bg-white">
                <div className="mb-2 animate-pulse">
                    <div className="h-9 w-40 bg-gray-200 rounded-lg"></div>
                </div>

                <div className="flex gap-2 items-center">
                    {/* File upload button skeleton */}
                    <div className="animate-pulse">
                        <div className="w-12 h-12 rounded-full bg-gray-200"></div>
                    </div>

                    {/* Document upload button skeleton */}
                    <div className="animate-pulse">
                        <div className="w-12 h-12 rounded-full bg-gray-200"></div>
                    </div>

                    {/* Input field skeleton */}
                    <div className="w-full animate-pulse">
                        <div className="h-12 bg-gray-200 rounded-full"></div>
                    </div>

                    {/* Send button skeleton */}
                    <div className="animate-pulse">
                        <div className="w-14 h-14 rounded-full bg-gray-200"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}