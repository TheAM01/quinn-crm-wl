import {CampaignData, Prize } from "@/types/campaigns2";
import { ProductsAPIResponse } from "@/types/responses/api/products";
import { Product } from "@/types/store/products";
import { AlertCircle, Check, ChevronRight, Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import Spinner from "@/components/ui/Spinner";

const Step2PrizeSelection = ({
	data,
	onChange,
	onSubmit
}: {
	data: CampaignData;
	onChange: (data: Partial<CampaignData>) => void;
	onSubmit: () => void;
}) => {
	const [products, setProducts] = useState<Product[]>([]);
	const [loading, setLoading] = useState(true);
	const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
	const [quantity, setQuantity] = useState<string>('');
	const [showConfirmModal, setShowConfirmModal] = useState(false);
	const [showDropdown, setShowDropdown] = useState(false);

	useEffect(() => {
		fetch('/api/store/products')
			.then(res => res.json())
			.then((data: ProductsAPIResponse) => {
				if (data.success) {
					setProducts(
						data.products.sort((a, b) => a.product_title.localeCompare(b.product_title))
					);
				}
				setLoading(false);
			})
			.catch(() => setLoading(false));
	}, []);

	const handleAddPrize = () => {
		if (selectedProduct && quantity && parseInt(quantity) > 0) {
			const newPrizes = [...data.prizes, {
				name: selectedProduct.product_title,
				quantity: parseInt(quantity)
			}];
			onChange({ prizes: newPrizes });
			setSelectedProduct(null);
			setQuantity('');
		}
	};

	const handleRemovePrize = (index: number) => {
		const newPrizes = data.prizes.filter((_: Prize, i: number) => i !== index);
		onChange({ prizes: newPrizes });
	};

	const handleSelectProduct = (product: Product) => {
		setSelectedProduct(product);
		setShowDropdown(false);
	};

	const canAddPrize = selectedProduct && quantity && parseInt(quantity) > 0;

	return (
		<div className="flex flex-1 flex-col gap-6">
			<div>
				<h2 className="text-2xl font-bold text-gray-900 mb-2">Select Prizes</h2>
				<p className="text-gray-600">Choose products and quantities for your campaign prizes</p>
			</div>

			{loading ? (
				<div className="text-center py-12">
					<Spinner/>
					<p className="mt-4 text-gray-600">Loading products...</p>
				</div>
			) : (
				<>
					<div className="space-y-4">
						<div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
							<div className="space-y-4">
								{/* Custom Dropdown */}
								<div className="relative">
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Select Product
									</label>
									<button
										type="button"
										onClick={() => setShowDropdown(!showDropdown)}
										className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none bg-white text-left flex items-center justify-between"
									>
										<span className={selectedProduct ? 'text-gray-900' : 'text-gray-500'}>
											{selectedProduct ? selectedProduct.product_title : 'Choose a product...'}
										</span>
										<ChevronRight
											size={20}
											className={`text-gray-400 transition-transform ${showDropdown ? 'rotate-90' : ''}`}
										/>
									</button>

									{/* Dropdown Menu */}
									{showDropdown && (
										<div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-150 overflow-y-auto">
											{products.map((product) => (
												<div
													key={product.variant_id}
													onClick={() => handleSelectProduct(product)}
													className="flex items-center gap-3 p-3 hover:bg-yellow-50 cursor-pointer border-b border-gray-100 last:border-b-0"
												>
													{product.image_url ? (
														<img
															src={product.image_url}
															alt={product.product_title}
															className="w-20 h-20 object-cover rounded-lg border border-gray-200 flex-shrink-0"
														/>
													) : (
														<div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
															<span className="text-gray-400 text-xs">No image</span>
														</div>
													)}
													<div className="flex-1">
														<p className="font-medium text-gray-900">{product.product_title}</p>
														<p className="text-xs text-gray-500">Available: {product.current_quantity}</p>
														<p className="text-xs text-gray-500">Variant ID: {product.variant_id}</p>
													</div>
												</div>
											))}
										</div>
									)}
								</div>

								{/* Selected Product Preview */}
								{selectedProduct && (
									<div className="border border-yellow-400 bg-yellow-50 rounded-lg p-3">
										<p className="text-xs font-medium text-gray-700 mb-2">Selected Product:</p>
										<div className="flex items-center gap-3">
											{selectedProduct.image_url ? (
												<img
													src={selectedProduct.image_url}
													alt={selectedProduct.product_title}
													className="w-20 h-20 object-cover rounded-lg border border-gray-200"
												/>
											) : (
												<div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
													<span className="text-gray-400 text-xs">No image</span>
												</div>
											)}
											<div>
												<p className="font-medium text-gray-900">{selectedProduct.product_title}</p>
												<p className="text-sm text-gray-600">Available: {selectedProduct.current_quantity}</p>
											</div>
										</div>
									</div>
								)}

								{/* Quantity and Add Button */}
								<div className="grid grid-cols-[1fr_auto] gap-4 items-end">
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">
											Quantity
										</label>
										<input
											type="number"
											min="1"
											value={quantity}
											onChange={(e) => setQuantity(e.target.value)}
											className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none"
											placeholder="Enter quantity"
										/>
									</div>

									<button
										onClick={handleAddPrize}
										disabled={!canAddPrize}
										className={`p-2 rounded-lg transition-colors ${
											canAddPrize
												? 'bg-yellow-500 hover:bg-yellow-600 text-white cursor-pointer'
												: 'bg-gray-200 text-gray-400 cursor-not-allowed'
										}`}
									>
										<Plus size={24} />
									</button>
								</div>
							</div>
						</div>

						{data.prizes.length > 0 && (
							<div className="space-y-2">
								<h3 className="text-sm font-medium text-gray-700">Selected Prizes</h3>
								{data.prizes.map((prize: Prize, index: number) => (
									<div key={index} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
										<div className="flex items-center gap-3">
											<Check size={20} className="text-green-500" />
											<div>
												<p className="font-medium text-gray-900">{prize.name}</p>
												<p className="text-sm text-gray-500">Quantity: {prize.quantity}</p>
											</div>
										</div>
										<button
											onClick={() => handleRemovePrize(index)}
											className="p-1 hover:bg-red-50 rounded-lg text-red-500 transition-colors"
										>
											<X size={20} />
										</button>
									</div>
								))}
							</div>
						)}
					</div>

					{data.prizes.length > 0 && (
						<div className="pt-4 border-t border-gray-200">
							<button
								onClick={() => setShowConfirmModal(true)}
								className="w-full px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-medium rounded-lg transition-colors"
							>
								Create and Continue
							</button>
							<p className="text-sm text-gray-600 text-center mt-3">
								By clicking the button, campaign will be created with the chosen prizes.
								Note that you can not edit campaign information after it has been created.
							</p>
						</div>
					)}
				</>
			)}

			{/* Confirmation Modal */}
			{showConfirmModal && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
						<div className="flex items-start gap-4 mb-4">
							<div className="p-2 bg-yellow-100 rounded-lg">
								<AlertCircle className="text-yellow-600" size={24} />
							</div>
							<div>
								<h3 className="text-lg font-bold text-gray-900">Confirm Campaign Creation</h3>
								<p className="text-gray-600 mt-1">
									Are you sure you want to create this campaign? You won&apos;t be able to edit the information later.
								</p>
							</div>
						</div>
						<div className="flex gap-3 justify-end">
							<button
								onClick={() => setShowConfirmModal(false)}
								className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
							>
								Cancel
							</button>
							<button
								onClick={() => {
									setShowConfirmModal(false);
									onSubmit();
								}}
								className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors font-medium"
							>
								Confirm & Create
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default Step2PrizeSelection;