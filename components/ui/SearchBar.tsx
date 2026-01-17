"use client";

import { Search, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";

const SearchBar = ({
					   searchTerm,
					   onSearchChange,
					   resultsAmount,
				   }: {
	searchTerm: string;
	onSearchChange: (value: string) => void;
	resultsAmount?: number;
}) => {
	const [localValue, setLocalValue] = useState(searchTerm);
	const [isDebouncing, setIsDebouncing] = useState(false);

	useEffect(() => {
		setLocalValue(searchTerm);
	}, [searchTerm]);

	useEffect(() => {
		if (localValue !== searchTerm) {
			setIsDebouncing(true);
		}

		const timer = setTimeout(() => {
			onSearchChange(localValue);
			setIsDebouncing(false);
		}, 500);

		return () => {
			clearTimeout(timer);
		};
	}, [localValue, onSearchChange, searchTerm]);

	const showResultsCount = resultsAmount !== undefined && localValue.trim().length > 0;

	return (
		<div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col w-xl">
			<div className="flex items-center">
				<div className="flex p-1 items-center pl-3">
					{isDebouncing ? (
						<Loader2 className="icon-center text-yellow-500 w-5 h-5 animate-spin"/>
					) : (
						<Search className="icon-center text-gray-400 w-5 h-5"/>
					)}
				</div>
				<input
					type="text"
					placeholder="Search..."
					value={localValue}
					onChange={(e) => setLocalValue(e.target.value)}
					className="w-full flex h-min outline-none transition-all py-2 px-4"
				/>
			</div>

			{(showResultsCount && !isDebouncing) && (
				<div className="px-2 pb-1 pt-0.5 border-t border-gray-100">
                <span className="text-xs text-gray-500">
                   {resultsAmount === 0 ? (
					   "No results found"
				   ) : resultsAmount === 1 ? (
					   "1 result found"
				   ) : (
					   `${resultsAmount} results found`
				   )}
                </span>
				</div>
			)}
		</div>
	);
};

export default SearchBar;