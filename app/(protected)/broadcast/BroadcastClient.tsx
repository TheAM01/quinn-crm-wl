"use client";

import React, {useEffect, useState} from "react";
import { ChevronRight, FileText, Search, Send, Users, X, Filter, ArrowUpDown, CheckCircle2} from "lucide-react";
import Toast from "@/components/ui/Toast";
import PageLoader from "@/components/ui/PageLoader";
import DynamicValueDropdown from "./_components/DynamicValueDropdown";
import Spinner from "@/components/ui/Spinner";
import JobStatusModal from "./_components/JobStatusModal";

interface DynamicValuesResponse {
	frontend_payload: {
		campaign_id?: string;
		to: string[];
		variables: Array<{
			name: string;
			value: string;
		}>;
	};
	dynamic_values: string[];
	route: string;
}

interface Customer {
	phone_number: string;
	is_active: boolean;
	escalation_status: boolean;
	customer_type: "D2C" | "B2B";
	total_spend: number;
	customer_name: string | null;
	email: string | null;
	address: string | null;
	cart_id: string | null;
	order_history: string;
	socials: string;
	customer_quickbook_id: string | null;
	tags: string[];
	interest_groups: string;
	company_name: string | null;
}

interface Template {
	id: string;
	name: string;
	language: string;
	status: string;
	category: string;
}

interface TemplateVariable {
	name: string;
	type: string;
	example: string;
}

interface TemplateComponent {
	type: string;
	format: string | null;
	text: string | null;
	variables: TemplateVariable[];
}

interface TemplateDetails {
	id: string;
	name: string;
	language: string;
	status: string;
	category: string;
	components: TemplateComponent[];
	total_variables: number;
}

interface ApiResponse {
	customers: Customer[];
	total: number;
	page: number;
	limit: number;
	total_pages: number;
	has_next: boolean;
	has_previous: boolean;
}

interface ResponseApiResponse {
	job_id: string;
	status: string;
	message: string;
	template_id: string;
	template_name: string;
	total_recipients: number;
	estimated_completion_time: string;
}

type CustomerTypeFilter = "All" | "B2B" | "D2C";

const PageHeading = ({ title, description }: { title: string; description: string }) => (
	<div className="mb-6">
		<h1 className="text-3xl font-bold text-gray-900">{title}</h1>
		<p className="text-gray-600 mt-2">{description}</p>
	</div>
);

// Step indicator component
const StepIndicator = ({ currentStep }: { currentStep: number }) => {
	const steps = [
		{ number: 1, title: "Select Template", icon: FileText },
		{ number: 2, title: "Fill Variables", icon: FileText },
		{ number: 3, title: "Choose Recipients", icon: Users }
	];

	return (
		<div className="flex items-center justify-between mb-8 px-4">
			{steps.map((step, index) => {
				const Icon = step.icon;
				const isActive = currentStep === step.number;
				const isCompleted = currentStep > step.number;

				return (
					<React.Fragment key={step.number}>
						<div className="flex flex-col items-center flex-1">
							<div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
								isCompleted
									? 'bg-yellow-500 border-yellow-500 text-white'
									: isActive
										? 'bg-yellow-50 border-yellow-500 text-yellow-600'
										: 'bg-gray-100 border-gray-300 text-gray-400'
							}`}>
								{isCompleted ? <CheckCircle2 size={24} /> : <Icon size={20} />}
							</div>
							<span className={`text-xs mt-2 font-medium ${
								isActive ? 'text-yellow-600' : isCompleted ? 'text-yellow-500' : 'text-gray-400'
							}`}>
								{step.title}
							</span>
						</div>
						{index < steps.length - 1 && (
							<div className={`flex-1 h-0.5 mx-2 transition-colors duration-300 ${
								currentStep > step.number ? 'bg-yellow-500' : 'bg-gray-300'
							}`} />
						)}
					</React.Fragment>
				);
			})}
		</div>
	);
};

export default function BroadcastClient() {
	const [loading] = useState(false);
	const [templatesLoading, setTemplatesLoading] = useState(false);
	const [dynamicValuesLoading, setDynamicValuesLoading] = useState(false);
	const [templateDetailsLoading, setTemplateDetailsLoading] = useState(false);
	const [customersLoading, setCustomersLoading] = useState(false);

	const [customers, setCustomers] = useState<Customer[]>([]);
	const [templates, setTemplates] = useState<Template[]>([]);
	const [dynamicValues, setDynamicValues] = useState<string[]>([]);
	const [templateDetails, setTemplateDetails] = useState<TemplateDetails | null>(null);
	const [responseData, setResponseData] = useState<null | ResponseApiResponse>(null);

	const [searchQuery, setSearchQuery] = useState("");
	const [selectedTemplate, setSelectedTemplate] = useState<string>("");
	const [templateVariables, setTemplateVariables] = useState<Record<string, string>>({});
	const [customerTypeFilter, setCustomerTypeFilter] = useState<CustomerTypeFilter>("All");
	const [selectedPhoneNumbers, setSelectedPhoneNumbers] = useState<string[]>([]);

	// Pagination states
	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage, setItemsPerPage] = useState(25);
	const [totalCustomers, setTotalCustomers] = useState(0);
	const [totalPages, setTotalPages] = useState(0);
	const [hasNext, setHasNext] = useState(false);
	const [hasPrevious, setHasPrevious] = useState(false);

	// Tag states
	const [allTags, setAllTags] = useState<string[]>([]);
	const [selectedTags, setSelectedTags] = useState<string[]>([]);
	const [tagSearchQuery, setTagSearchQuery] = useState("");

	// Sort states
	const [sortBy, setSortBy] = useState("customer_name");
	const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

	const [error, setError] = useState<boolean | null>(null);
	const [success, setSuccess] = useState<string | null>(null);
	const [sending, setSending] = useState(false);
	const [showToast, setShowToast] = useState(false);

	// Determine current step
	const getCurrentStep = () => {
		if (!selectedTemplate) return 1;
		if (!templateDetails || Object.values(templateVariables).some(v => v.trim().length === 0)) return 2;
		return 3;
	};

	// Fetch customers with pagination
	const fetchCustomers = async () => {
		setCustomersLoading(true);
		try {
			const params = new URLSearchParams({
				limit: itemsPerPage.toString(),
				page: currentPage.toString(),
				sort_by: sortBy,
				sort_order: sortOrder,
			});

			if (searchQuery) params.set('search', searchQuery);
			if (customerTypeFilter !== "All") params.set('customer_type', customerTypeFilter);
			if (selectedTags.length > 0) params.set('tags', selectedTags.join(','));

			const response = await fetch(`/api/customers?${params.toString()}`);
			const data: ApiResponse = await response.json();
			setCustomers(data.customers);
			setTotalCustomers(data.total);
			setTotalPages(data.total_pages);
			setHasNext(data.has_next);
			setHasPrevious(data.has_previous);
		} catch (error) {
			console.error('Error fetching customers:', error);
		} finally {
			setCustomersLoading(false);
		}
	};

	// Fetch tags
	const fetchTags = async () => {
		try {
			const response = await fetch('/api/customers/tags');
			if (!response.ok) throw new Error('Failed to fetch tags');
			const data = await response.json();
			setAllTags(data.tags || []);
		} catch (error) {
			console.error('Error fetching tags:', error);
		}
	};

	// Fetch templates from API
	const fetchTemplates = async () => {
		setTemplatesLoading(true);
		try {
			const response = await fetch('/api/templates/list');
			if (!response.ok) throw new Error('Failed to fetch templates');
			const templatesData: Template[] = await response.json();
			setTemplates(templatesData);
		} catch (error) {
			console.error('Error fetching templates:', error);
		} finally {
			setTemplatesLoading(false);
		}
	};

	// Fetch template details
	const fetchTemplateDetails = async (templateName: string) => {
		setTemplateDetailsLoading(true);
		try {
			const response = await fetch(`/api/templates/${templateName}`);
			if (!response.ok) throw new Error('Failed to fetch template details');
			const details: TemplateDetails = await response.json();
			setTemplateDetails(details);

			const variables: Record<string, string> = {};
			details.components.forEach((component, compIndex) => {
				component.variables.forEach((variable, varIndex) => {
					const uniqueKey = `${component.type}-${variable.name}-${compIndex}-${varIndex}`;
					variables[uniqueKey] = '';
				});
			});
			setTemplateVariables(variables);
		} catch (error) {
			console.error('Error fetching template details:', error);
		} finally {
			setTemplateDetailsLoading(false);
		}
	};

	const fetchDynamicValues = async () => {
		setDynamicValuesLoading(true);
		try {
			const response = await fetch('/api/templates/structure');
			if (!response.ok) throw new Error('Failed to fetch dynamic values');
			const data: DynamicValuesResponse = await response.json();
			setDynamicValues(data.dynamic_values);
		} catch (error) {
			console.error('Error fetching dynamic values:', error);
		} finally {
			setDynamicValuesLoading(false);
		}
	};

	useEffect(() => {
		fetchTemplates();
		fetchDynamicValues();
		fetchTags();
	}, []);

	// Debounced fetch customers
	useEffect(() => {
		const timer = setTimeout(() => {
			if (getCurrentStep() === 3) {
				void fetchCustomers();
			}
		}, 300);

		return () => clearTimeout(timer);
	}, [searchQuery, customerTypeFilter, selectedTags, sortBy, sortOrder, currentPage, itemsPerPage, selectedTemplate, templateVariables]);

	// Handle template selection
	useEffect(() => {
		if (selectedTemplate) {
			fetchTemplateDetails(selectedTemplate);
		} else {
			setTemplateDetails(null);
			setTemplateVariables({});
		}
	}, [selectedTemplate]);

	// Get available customers (not already selected)
	const availableCustomers = customers.filter(
		customer => !selectedPhoneNumbers.includes(customer.phone_number)
	);

	const addPhoneNumber = (phoneNumber: string) => {
		if (!selectedPhoneNumbers.includes(phoneNumber)) {
			setSelectedPhoneNumbers([...selectedPhoneNumbers, phoneNumber]);
		}
	};

	const selectAllAvailable = () => {
		const phoneNumbersToAdd = availableCustomers.map(customer => customer.phone_number);
		setSelectedPhoneNumbers([...selectedPhoneNumbers, ...phoneNumbersToAdd]);
	};

	const removePhoneNumber = (phoneToRemove: string) => {
		setSelectedPhoneNumbers(selectedPhoneNumbers.filter(phone => phone !== phoneToRemove));
	};

	const handleTemplateVariableChange = (uniqueKey: string, value: string) => {
		setTemplateVariables(prev => ({
			...prev,
			[uniqueKey]: value
		}));
	};

	const addTag = (tag: string) => {
		if (!selectedTags.includes(tag)) {
			setSelectedTags([...selectedTags, tag]);
			setCurrentPage(1);
		}
		setTagSearchQuery("");
	};

	const removeTag = (tag: string) => {
		setSelectedTags(selectedTags.filter(t => t !== tag));
		setCurrentPage(1);
	};

	const handleSortChange = (field: string) => {
		if (sortBy === field) {
			setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
		} else {
			setSortBy(field);
			setSortOrder('asc');
		}
		setCurrentPage(1);
	};

	const renderTemplateWithValues = (text: string, variables: TemplateVariable[], componentType: string, compIndex: number) => {
		if (!text) return null;

		const parts = text.split(/(\*\{\{[^}]+\}\}\*|\{\{[^}]+\}\})/);
		let variableIndex = 0;

		return (
			<div className="space-y-2">
				{parts.map((part, index) => {
					const variableMatch = part.match(/\*?\{\{([^}]+)\}\}\*?/);

					if (variableMatch) {
						const variableName = variableMatch[1];
						const variable = variables.find(v => v.name === variableName);

						if (variable) {
							const uniqueKey = `${componentType}-${variable.name}-${compIndex}-${variableIndex}`;
							const value = templateVariables[uniqueKey] || '';
							variableIndex++;

							return (
								<span key={index} className={`inline-block bg-yellow-100 border-b-2 border-yellow-400 px-2 py-0.5 mx-1 rounded ${value ? "text-gray-900 font-medium" : "text-gray-400"}`}>
									{value || `{${variableName}}`}
								</span>
							);
						}
					}
					return (
						<span key={index} className="whitespace-pre-line">
							{part}
						</span>
					);
				})}
			</div>
		);
	};

	const sendBulkMessage = async () => {
		if (selectedPhoneNumbers.length === 0 || !selectedTemplate || !templateDetails) return;

		const allVariablesFilled = Object.values(templateVariables).every(value => value.trim().length > 0);
		if (!allVariablesFilled) return;

		setSending(true);

		try {
			const targets = selectedPhoneNumbers.map(phoneNumber => {
				const customer = customers.find(c => c.phone_number === phoneNumber);
				return {
					phone_number: phoneNumber,
					customer_name: customer?.customer_name || null
				};
			});

			const variablesToSend: Record<string, string> = {};
			Object.entries(templateVariables).forEach(([uniqueKey, value]) => {
				const parts = uniqueKey.split('-');
				const variableName = parts[1];
				variablesToSend[variableName] = value;
			});

			const response = await fetch(`/api/templates/send/${templateDetails.id}`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					templateName: selectedTemplate,
					variables: variablesToSend,
					to: targets
				})
			});

			if (response.ok) {
				const originalCount = selectedPhoneNumbers.length;
				setSelectedPhoneNumbers([]);
				setSelectedTemplate("");
				setTemplateDetails(null);
				setTemplateVariables({});
				setSuccess(`Message sent to ${originalCount} recipients!`);
				setShowToast(true);

				setResponseData(await response.json());
			} else {
				throw new Error('Failed to send message');
			}
		} catch (error) {
			console.error('Error sending message:', error);
			setError(true);
			setShowToast(true);
		} finally {
			setSending(false);
		}
	};

	const getCustomerDisplayName = (customer: Customer) => {
		return customer.customer_name || customer.company_name || `${customer.customer_type} Customer`;
	};

	const getSelectedCustomerInfo = (phoneNumber: string) => {
		const customer = customers.find(c => c.phone_number === phoneNumber);
		if (!customer) return { name: 'Unknown', phone: phoneNumber };

		return {
			name: getCustomerDisplayName(customer),
			phone: phoneNumber
		};
	};

	const isFormValid = () => {
		if (selectedPhoneNumbers.length === 0 || !selectedTemplate || !templateDetails) return false;
		return Object.values(templateVariables).every(value => value.trim().length > 0);
	};

	const filteredTagOptions = tagSearchQuery.trim()
		? allTags.filter(tag => tag.toLowerCase().includes(tagSearchQuery.toLowerCase()))
		: allTags;

	if (loading) {
		return <PageLoader text={"Loading Broadcast..."}/>;
	}

	if (responseData) {
		const closeModal = () => setResponseData(null);
		return <JobStatusModal jobData={responseData} onClose={closeModal}/>;
	}

	const currentStep = getCurrentStep();

	return (
		<div className="p-6 flex flex-1 flex-col gap-6 max-w-7xl mx-auto">
			<PageHeading
				title="Broadcast Messages"
				description="Send personalized WhatsApp messages to multiple customers"
			/>

			<StepIndicator currentStep={currentStep} />

			{/* STEP 1: Template Selection */}
			<div className={`transition-all duration-300 ${currentStep >= 1 ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
				<div className="bg-white rounded-xl border-2 border-gray-200 shadow-sm p-6">
					<div className="flex items-center gap-3 mb-4">
						<div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
							<FileText className="text-yellow-600" size={20} />
						</div>
						<div>
							<h2 className="text-xl font-bold text-gray-900">Choose Your Template</h2>
							<p className="text-sm text-gray-600">Select a pre-approved message template</p>
						</div>
					</div>

					<select
						value={selectedTemplate}
						onChange={(e) => setSelectedTemplate(e.target.value)}
						className="w-full px-4 py-3 bg-gray-50 rounded-lg border-2 border-gray-300 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 outline-none transition-all text-gray-900"
						disabled={templatesLoading}
					>
						<option value="">
							{templatesLoading ? 'Loading templates...' : 'Select a template...'}
						</option>
						{templates.map((template) => (
							<option key={template.id} value={template.name}>
								{template.name} • {template.category}
							</option>
						))}
					</select>
				</div>
			</div>

			{/* STEP 2: Template Variables */}
			{selectedTemplate && templateDetails && (
				<div className={`transition-all duration-300 ${currentStep >= 2 ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
					<div className="bg-white rounded-xl border-2 border-gray-200 shadow-sm p-6">
						<div className="flex items-center gap-3 mb-6">
							<div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
								<FileText className="text-yellow-600" size={20} />
							</div>
							<div>
								<h2 className="text-xl font-bold text-gray-900">Customize Your Message</h2>
								<p className="text-sm text-gray-600">Fill in the template variables</p>
							</div>
						</div>

						{templateDetailsLoading ? (
							<div className="flex items-center justify-center py-12">
								<Spinner />
							</div>
						) : (
							<div className="grid lg:grid-cols-2 gap-6">
								{/* Preview */}
								<div className="order-2 lg:order-1">
									<div className="sticky top-6">
										<h3 className="text-sm font-semibold text-gray-700 mb-3">Live Preview</h3>
										<div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border-2 border-gray-200">
											<div className="bg-white rounded-lg shadow-md p-6 space-y-4 max-w-md">
												{templateDetails.components.map((component, index) => (
													<div key={index}>
														{component.type === 'header' && component.text && (
															<div className="border-b-2 border-yellow-400 pb-3">
																<div className="font-bold text-lg text-gray-900">
																	{renderTemplateWithValues(component.text, component.variables, component.type, index)}
																</div>
															</div>
														)}

														{component.type === 'body' && component.text && (
															<div className="py-2">
																<div className="text-gray-800 leading-relaxed">
																	{renderTemplateWithValues(component.text, component.variables, component.type, index)}
																</div>
															</div>
														)}

														{component.type === 'footer' && component.text && (
															<div className="border-t border-gray-200 pt-3">
																<div className="text-sm text-gray-500">
																	{renderTemplateWithValues(component.text, component.variables, component.type, index)}
																</div>
															</div>
														)}
													</div>
												))}
											</div>
										</div>
									</div>
								</div>

								{/* Variables Input */}
								<div className="order-1 lg:order-2 space-y-4">
									<div className="flex items-center justify-between mb-4">
										<h3 className="text-sm font-semibold text-gray-700">Template Variables</h3>
										<div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
											{Object.values(templateVariables).filter(v => v.trim().length > 0).length} / {templateDetails.total_variables}
										</div>
									</div>

									<div className="space-y-3">
										{templateDetails.components.flatMap((component, compIndex) =>
											component.variables.map((variable, varIndex) => {
												const uniqueKey = `${component.type}-${variable.name}-${compIndex}-${varIndex}`;

												if (dynamicValuesLoading) return <Spinner key={uniqueKey+"sign"}/>;
												return (
													<DynamicValueDropdown
														key={uniqueKey}
														uniqueKey={uniqueKey}
														value={templateVariables[uniqueKey] || ''}
														variable={variable}
														dynamicValues={dynamicValues}
														onChange={handleTemplateVariableChange}
													/>
												);
											})
										)}
									</div>

									{/* Progress Bar */}
									<div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
										<div className="flex justify-between items-center mb-2">
											<span className="text-sm font-medium text-gray-700">Completion Progress</span>
											<span className="text-sm text-gray-600">
												{Math.round((Object.values(templateVariables).filter(v => v.trim().length > 0).length / templateDetails.total_variables) * 100)}%
											</span>
										</div>
										<div className="w-full bg-gray-200 rounded-full h-3">
											<div
												className="bg-gradient-to-r from-yellow-400 to-yellow-500 h-3 rounded-full transition-all duration-300"
												style={{
													width: `${(Object.values(templateVariables).filter(v => v.trim().length > 0).length / templateDetails.total_variables) * 100}%`
												}}
											></div>
										</div>
									</div>
								</div>
							</div>
						)}
					</div>
				</div>
			)}

			{/* STEP 3: Customer Selection */}
			{currentStep === 3 && (
				<div className="bg-white rounded-xl border-2 border-gray-200 shadow-sm p-6">
					<div className="flex items-center gap-3 mb-6">
						<div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
							<Users className="text-yellow-600" size={20} />
						</div>
						<div className="flex-1">
							<h2 className="text-xl font-bold text-gray-900">Select Recipients</h2>
							<p className="text-sm text-gray-600">Choose who will receive this message</p>
						</div>
						<div className="text-right">
							<div className="text-2xl font-bold text-yellow-600">{selectedPhoneNumbers.length}</div>
							<div className="text-xs text-gray-600">Selected</div>
						</div>
					</div>

					{/* Search and Filters */}
					<div className="space-y-4 mb-6">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="relative">
								<Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
								<input
									type="text"
									placeholder="Search by name or phone..."
									value={searchQuery}
									onChange={(e) => {
										setSearchQuery(e.target.value);
										setCurrentPage(1);
									}}
									className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 outline-none"
								/>
							</div>
							<div className="relative">
								<Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
								<input
									type="text"
									placeholder="Filter by tags..."
									value={tagSearchQuery}
									onChange={(e) => setTagSearchQuery(e.target.value)}
									className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 outline-none"
								/>
								{tagSearchQuery && filteredTagOptions.length > 0 && (
									<div className="absolute z-10 w-full bg-white border-2 border-gray-200 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
										{filteredTagOptions.map(tag => (
											<div
												key={tag}
												className="px-4 py-2 cursor-pointer hover:bg-yellow-50 transition-colors"
												onClick={() => addTag(tag)}
											>
												{tag}
											</div>
										))}
									</div>
								)}
							</div>
						</div>

						{/* Filter Controls */}
						<div className="flex flex-wrap items-center gap-3">
							<div className="flex items-center gap-2">
								<span className="text-sm text-gray-600">Type:</span>
								{(["All", "B2B", "D2C"] as CustomerTypeFilter[]).map((type) => (
									<button
										key={type}
										onClick={() => {
											setCustomerTypeFilter(type);
											setCurrentPage(1);
										}}
										className={`px-3 py-1.5 text-sm rounded-full font-medium transition-all ${
											customerTypeFilter === type
												? 'bg-yellow-500 text-white shadow-md'
												: 'bg-gray-100 text-gray-600 hover:bg-gray-200'
										}`}
									>
										{type}
									</button>
								))}
							</div>

							<div className="h-6 w-px bg-gray-300" />

							<div className="flex items-center gap-2">
								<span className="text-sm text-gray-600">Show:</span>
								<select
									value={itemsPerPage}
									onChange={e => {
										setItemsPerPage(Number(e.target.value));
										setCurrentPage(1);
									}}
									className="px-3 py-1.5 border-2 border-gray-300 rounded-lg bg-white focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 outline-none text-sm"
								>
									<option value={25}>25</option>
									<option value={50}>50</option>
									<option value={100}>100</option>
								</select>
							</div>

							<div className="h-6 w-px bg-gray-300" />

							<div className="flex items-center gap-2">
								<ArrowUpDown className="text-gray-400" size={16} />
								<select
									value={sortBy}
									onChange={(e) => {
										setSortBy(e.target.value);
										setCurrentPage(1);
									}}
									className="px-3 py-1.5 border-2 border-gray-300 rounded-lg bg-white focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 outline-none text-sm"
								>
									<option value="customer_name">Name</option>
									<option value="total_spend">Spend</option>
									<option value="updated_at">Updated</option>
								</select>
								<button
									onClick={() => handleSortChange(sortBy)}
									className="p-1.5 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
								>
									<ArrowUpDown className={`w-4 h-4 text-gray-600 ${sortOrder === 'desc' ? 'rotate-180' : ''} transition-transform`} />
								</button>
							</div>
						</div>

						{/* Selected Tags */}
						{selectedTags.length > 0 && (
							<div className="flex flex-wrap gap-2">
								{selectedTags.map(tag => (
									<span
										key={tag}
										className="flex items-center gap-1 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium"
									>
										{tag}
										<X className="h-3 w-3 cursor-pointer hover:text-yellow-900" onClick={() => removeTag(tag)} />
									</span>
								))}
								<button
									onClick={() => {
										setSelectedTags([]);
										setCurrentPage(1);
									}}
									className="text-yellow-600 hover:text-yellow-800 text-sm font-medium"
								>
									Clear All
								</button>
							</div>
						)}
					</div>

					{/* Select All Available */}
					{availableCustomers.length > 0 && (
						<button
							onClick={selectAllAvailable}
							className="w-full flex items-center justify-center gap-2 p-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-all font-medium mb-4 shadow-md hover:shadow-lg"
						>
							<Users size={18} />
							<span>Select All {availableCustomers.length} Available Customer{availableCustomers.length !== 1 ? 's' : ''}</span>
						</button>
					)}

					{/* Customer List */}
					<div className="border-2 border-gray-200 rounded-lg overflow-hidden">
						{customersLoading ? (
							<div className="flex items-center justify-center py-12">
								<Spinner />
							</div>
						) : availableCustomers.length > 0 ? (
							<div className="divide-y divide-gray-200">
								{availableCustomers.map((customer) => (
									<button
										key={customer.phone_number}
										onClick={() => addPhoneNumber(customer.phone_number)}
										className="w-full text-left p-4 hover:bg-yellow-50 transition-colors flex items-center justify-between group"
									>
										<div className="flex-1">
											<div className="flex items-center gap-3 mb-1">
												<div className="font-semibold text-gray-900">
													{getCustomerDisplayName(customer)}
												</div>
												<span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
													customer.customer_type === 'B2B'
														? 'bg-blue-100 text-blue-700'
														: 'bg-green-100 text-green-700'
												}`}>
													{customer.customer_type}
												</span>
												{customer.is_active && (
													<span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
														Active
													</span>
												)}
											</div>
											<div className="text-sm text-gray-500">
												{customer.phone_number}
											</div>
											{customer.tags && customer.tags.length > 0 && (
												<div className="flex flex-wrap gap-1 mt-2">
													{customer.tags.slice(0, 3).map(tag => (
														<span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
															{tag}
														</span>
													))}
													{customer.tags.length > 3 && (
														<span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
															+{customer.tags.length - 3} more
														</span>
													)}
												</div>
											)}
										</div>
										<ChevronRight className="text-gray-400 group-hover:text-yellow-600 transition-colors" size={20} />
									</button>
								))}
							</div>
						) : (
							<div className="text-center py-12 text-gray-500">
								<Users className="mx-auto mb-3 text-gray-300" size={48} />
								<p className="font-medium">No customers found</p>
								<p className="text-sm">Try adjusting your filters</p>
							</div>
						)}
					</div>

					{/* Pagination */}
					{!customersLoading && availableCustomers.length > 0 && (
						<div className="flex flex-col sm:flex-row gap-4 justify-between items-center mt-4 text-sm">
							<div className="text-gray-600">
								Page {currentPage} of {totalPages} • {totalCustomers} total customers
							</div>
							<div className="flex items-center gap-2">
								<button
									onClick={() => setCurrentPage(prev => prev - 1)}
									disabled={!hasPrevious}
									className="px-4 py-2 border-2 border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors font-medium"
								>
									Previous
								</button>
								<span className="px-3 text-gray-600">
									{currentPage} / {totalPages}
								</span>
								<button
									onClick={() => setCurrentPage(prev => prev + 1)}
									disabled={!hasNext}
									className="px-4 py-2 border-2 border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors font-medium"
								>
									Next
								</button>
							</div>
						</div>
					)}

					{/* Selected Recipients Display */}
					{selectedPhoneNumbers.length > 0 && (
						<div className="mt-6 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
							<div className="flex items-center justify-between mb-3">
								<h3 className="text-sm font-semibold text-gray-900">
									Selected Recipients ({selectedPhoneNumbers.length})
								</h3>
								<button
									onClick={() => setSelectedPhoneNumbers([])}
									className="text-sm text-red-600 hover:text-red-800 font-medium transition-colors"
								>
									Clear All
								</button>
							</div>
							<div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
								{selectedPhoneNumbers.map((phoneNumber) => {
									const customerInfo = getSelectedCustomerInfo(phoneNumber);
									return (
										<div
											key={phoneNumber}
											className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-yellow-300 shadow-sm"
										>
											<div className="flex flex-col">
												<span className="font-medium text-sm text-gray-900">{customerInfo.name}</span>
												<span className="text-xs text-gray-500">{customerInfo.phone}</span>
											</div>
											<button
												onClick={() => removePhoneNumber(phoneNumber)}
												className="text-red-500 hover:text-red-700 transition-colors ml-1"
											>
												<X size={16} />
											</button>
										</div>
									);
								})}
							</div>
						</div>
					)}
				</div>
			)}

			{/* Send Button - Sticky at bottom */}
			{currentStep === 3 && (
				<div className="sticky bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-transparent pt-6 pb-4 -mx-6 px-6">
					<div className="max-w-7xl mx-auto">
						<button
							onClick={sendBulkMessage}
							disabled={sending || !isFormValid()}
							className={`w-full flex items-center justify-center gap-3 px-8 py-5 rounded-xl font-bold text-lg transition-all duration-300 ${
								sending || !isFormValid()
									? "bg-gray-300 text-gray-500 cursor-not-allowed"
									: "bg-gradient-to-r from-yellow-400 to-yellow-500 text-white hover:from-yellow-500 hover:to-yellow-600 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
							}`}
						>
							{sending ? (
								<>
									<div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
									<span>Sending Messages...</span>
								</>
							) : (
								<>
									<Send size={24} />
									<span>Send to {selectedPhoneNumbers.length} Recipient{selectedPhoneNumbers.length !== 1 ? 's' : ''}</span>
									<div className="ml-auto bg-white/20 px-3 py-1 rounded-full text-sm">
										Ready
									</div>
								</>
							)}
						</button>

						{/* Form validation hint */}
						{!isFormValid() && selectedPhoneNumbers.length > 0 && (
							<p className="text-center text-sm text-gray-500 mt-2">
								Complete all template variables to send
							</p>
						)}
					</div>
				</div>
			)}

			{/* Toasts */}
			{(error && showToast) && (
				<Toast
					type={"error"}
					message="Oops, we ran into a problem. Refresh page & if the issue persists, contact the developer."
					onClose={() => setShowToast(false)}
				/>
			)}
			{(!!success && showToast) && (
				<Toast
					type={"success"}
					message={success}
					onClose={() => setShowToast(false)}
				/>
			)}
		</div>
	);
}