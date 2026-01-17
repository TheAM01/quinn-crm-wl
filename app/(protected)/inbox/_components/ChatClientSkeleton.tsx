import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function ChatClientSkeleton() {
    return (
        <div className="flex flex-col w-full h-screen">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-gray-200">
                <div className="flex gap-4 p-4 items-center">
                    <button className="p-2 rounded-full border border-neutral-400 animate-pulse">
                        <ChevronLeft size={14} className="text-gray-300" />
                    </button>
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-400 animate-pulse"></div>
                    <div className="flex flex-col gap-2">
                        <div className="h-5 w-32 bg-gray-300 rounded animate-pulse"></div>
                        <div className="h-3 w-40 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-2 w-36 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                </div>

                <div className="flex flex-col gap-2 items-center px-4 mx-2">
                    <div className="h-3 w-16 bg-gray-300 rounded animate-pulse"></div>
                    <div className="w-12 h-6 bg-gray-300 rounded-full animate-pulse"></div>
                </div>
            </div>

            <div className="flex flex-row h-full overflow-hidden">
                {/* Chat Area */}
                <div className="flex flex-col h-full overflow-y-hidden flex-1">
                    {/* Status bar */}
                    <div className="bg-neutral-50 px-4 py-1 text-xs flex justify-between items-center border-b border-gray-200">
						<span className="flex items-center gap-2">
							<span className="w-2 h-2 rounded-full bg-gray-300 animate-pulse" />
							<span className="h-2 w-20 bg-gray-300 rounded animate-pulse"></span>
						</span>
                    </div>

                    {/* Messages container */}
                    <div className="p-5 gap-5 bg-neutral-100 overflow-y-scroll overflow-x-hidden h-full flex flex-col relative texture-mosaic">
                        {/* Customer message */}
                        <div className="flex justify-start animate-pulse">
                            <div className="max-w-[70%]">
                                <div className="h-2 w-24 bg-gray-300 rounded mb-1"></div>
                                <div className="bg-white rounded-2xl  p-4 shadow-sm">
                                    <div className="space-y-2">
                                        <div className="h-3 bg-gray-300 rounded w-68"></div>
                                        <div className="h-3 bg-gray-300 rounded w-60"></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Agent message - long */}
                        <div className="flex justify-end animate-pulse">
                            <div className="max-w-[70%]">
                                <div className="h-2 w-32 bg-gray-300 rounded mb-1 ml-auto"></div>
                                <div className="bg-emerald-200 rounded-2xl  p-4 shadow-sm">
                                    <div className="space-y-2 w-90">
                                        <div className="h-3 bg-emerald-300 rounded w-full"></div>
                                        <div className="h-3 bg-emerald-300 rounded w-full"></div>
                                        <div className="h-3 bg-emerald-300 rounded w-4/5"></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Customer message */}
                        <div className="flex justify-start animate-pulse">
                            <div className="max-w-[70%]">
                                <div className="h-2 w-24 bg-gray-300 rounded mb-1"></div>
                                <div className="bg-white rounded-2xl  p-4 shadow-sm">
                                    <div className="h-3 bg-gray-300 rounded w-32"></div>
                                </div>
                            </div>
                        </div>

                        {/* Agent message */}
                        <div className="flex justify-end animate-pulse">
                            <div className="max-w-[70%]">
                                <div className="h-2 w-32 bg-gray-300 rounded mb-1 ml-auto"></div>
                                <div className="bg-emerald-200 rounded-2xl  p-4 shadow-sm">
                                    <div className="space-y-2 w-90">
                                        <div className="h-3 bg-emerald-300 rounded w-56"></div>
                                        <div className="h-3 bg-emerald-300 rounded w-48"></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Customer message */}
                        <div className="flex justify-start animate-pulse">
                            <div className="max-w-[70%]">
                                <div className="h-2 w-24 bg-gray-300 rounded mb-1"></div>
                                <div className="bg-white rounded-2xl  p-4 shadow-sm">
                                    <div className="h-3 bg-gray-300 rounded w-24"></div>
                                </div>
                            </div>
                        </div>

                        {/* Agent message - short */}
                        <div className="flex justify-end animate-pulse">
                            <div className="max-w-[70%]">
                                <div className="h-2 w-32 bg-gray-300 rounded mb-1 ml-auto"></div>
                                <div className="bg-emerald-200 rounded-2xl w-90 p-4 shadow-sm">
                                    <div className="h-3 bg-emerald-300 rounded w-64"></div>
                                </div>
                            </div>
                        </div>

                        {/* Customer message */}
                        <div className="flex justify-start animate-pulse">
                            <div className="max-w-[70%]">
                                <div className="h-2 w-24 bg-gray-300 rounded mb-1"></div>
                                <div className="bg-white rounded-2xl  p-4 shadow-sm">
                                    <div className="space-y-2">
                                        <div className="h-3 bg-gray-300 rounded w-52"></div>
                                        <div className="h-3 bg-gray-300 rounded w-44"></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Agent message - very long */}
                        <div className="flex justify-end animate-pulse">
                            <div className="max-w-[70%]">
                                <div className="h-2 w-32 bg-gray-300 rounded mb-1 ml-auto"></div>
                                <div className="bg-emerald-200 rounded-2xl  p-4 shadow-sm">
                                    <div className="space-y-2 w-90">
                                        <div className="h-3 bg-emerald-300 rounded w-full"></div>
                                        <div className="h-3 bg-emerald-300 rounded w-full"></div>
                                        <div className="h-3 bg-emerald-300 rounded w-full"></div>
                                        <div className="h-3 bg-emerald-300 rounded w-full"></div>
                                        <div className="h-3 bg-emerald-300 rounded w-4/5"></div>
                                        <div className="h-3 bg-emerald-300 rounded w-full mt-3"></div>
                                        <div className="h-3 bg-emerald-300 rounded w-full"></div>
                                        <div className="h-3 bg-emerald-300 rounded w-3/4"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Input area */}
                    <div className="border-t border-gray-200 p-2 bg-white">
                        <div className="h-3 w-full max-w-md bg-gray-200 rounded animate-pulse mb-2"></div>
                    </div>
                </div>

                {/* Properties Panel */}
                <div className="w-80 border-l border-gray-200 bg-white flex flex-col">
                    {/* Panel Header */}
                    <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                        <div>
                            <div className="h-5 w-32 bg-gray-300 rounded animate-pulse mb-2"></div>
                            <div className="h-3 w-28 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                        <button className="p-2 animate-pulse">
                            <ChevronRight size={20} className="text-gray-300" />
                        </button>
                    </div>

                    {/* Collapsible Section 1 */}
                    <div className="border-b border-gray-200">
                        <div className="p-4 flex items-center justify-between animate-pulse">
                            <div className="h-4 w-36 bg-gray-300 rounded"></div>
                            <ChevronRight size={16} className="text-gray-300" />
                        </div>
                    </div>

                    {/* Read-only Information Section */}
                    <div className="p-4 space-y-4">
                        <div className="h-4 w-40 bg-gray-300 rounded animate-pulse mb-4"></div>

                        {/* Info items */}
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
                            <div key={item} className="flex items-start gap-3 animate-pulse">
                                <div className="w-5 h-5 bg-gray-200 rounded"></div>
                                <div className="flex-1">
                                    <div className="h-3 w-24 bg-gray-200 rounded mb-2"></div>
                                    <div className="h-4 w-32 bg-gray-300 rounded"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}