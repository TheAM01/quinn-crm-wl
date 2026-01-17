import type {Campaign} from "@/types/campaigns";
import {Calendar, Gift, Trophy, Users} from "lucide-react";
import StatCard from "@/components/ui/StatCard";


const StatsGrid = ({ campaigns }: { campaigns: Campaign[] }) => {
	const activeCount = campaigns.filter(c => {
		const now = new Date();
		const start = new Date(c.start_date);
		const end = new Date(c.end_date);
		return now >= start && now <= end;
	}).length;

	const upcomingCount = campaigns.filter(c => {
		const now = new Date();
		const start = new Date(c.start_date);
		return now < start;
	}).length;

	const totalPrizes = campaigns.reduce((sum, c) => sum + c.prizes.length, 0);

	return (
		<div className="grid grid-cols-1 md:grid-cols-4 gap-6">
			<StatCard
				value={campaigns.length}
				label="Total Campaigns"
				icon={Gift}
				iconColor="text-yellow-600"
				iconBgColor="bg-yellow-100"
				valueColor="text-gray-900"
			/>

			<StatCard
				value={activeCount}
				label="Active"
				icon={Calendar}
				iconColor="text-green-600"
				iconBgColor="bg-green-100"
				valueColor="text-green-600"
			/>

			<StatCard
				value={upcomingCount}
				label="Upcoming"
				icon={Users}
				iconColor="text-blue-600"
				iconBgColor="bg-blue-100"
				valueColor="text-blue-600"
			/>

			<StatCard
				value={totalPrizes}
				label="Total Prizes"
				icon={Trophy}
				iconColor="text-yellow-600"
				iconBgColor="bg-yellow-100"
				valueColor="text-yellow-600"
			/>
		</div>
	);
};

export default StatsGrid;