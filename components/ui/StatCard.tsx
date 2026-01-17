import {LucideIcon} from "lucide-react";

interface StatCardProps {
	value: number;
	label: string;
	icon: LucideIcon;
	iconColor: string;
	iconBgColor: string;
	valueColor: string;
}

const StatCard = ({ value, label, icon: Icon, iconColor, iconBgColor, valueColor }: StatCardProps) => {
	return (
		<div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2">
			<div className="flex items-center justify-between">
				<div className="flex flex-row items-center gap-4">
					<p className={`text-4xl font-bold ${valueColor} ml-2`}>{value}</p>
					<p className="text-gray-600 text-sm font-medium">{label}</p>
				</div>
				<div className={`w-12 h-12 ${iconBgColor} rounded-lg flex items-center justify-center`}>
					<Icon className={`w-6 h-6 ${iconColor}`} />
				</div>
			</div>
		</div>
	);
};

export default StatCard;