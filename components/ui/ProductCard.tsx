// components/ProductCard.tsx
import { Package } from 'lucide-react';

interface Product {
    product_id: string;
    created_at: string;
    current_quantity: number;
    inventory_item_id: number;
    variant_id: number;
    product_title: string;
    slug: string;
    image_url: string | null;
    updated_at: string;
}

interface ProductCardProps {
    product: Product;
    layout: 'grid' | 'list';
}

export default function ProductCard({ product, layout }: ProductCardProps) {
    const isOutOfStock = product.current_quantity <= 0;
    const isLowStock = product.current_quantity > 0 && product.current_quantity < 20;

    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
        e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300"%3E%3Crect fill="%23f3f4f6" width="300" height="300"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%239ca3af" font-family="sans-serif" font-size="20"%3ENo Image%3C/text%3E%3C/svg%3E';
    };

    if (layout === 'list') {
        return (
            <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow">
                <div className="flex gap-4">
                    <div className="w-24 h-24 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                        {product.image_url ? (
                            <img
                                src={product.image_url}
                                alt={product.product_title}
                                className="w-full h-full object-cover"
                                onError={handleImageError}
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <Package size={32} />
                            </div>
                        )}
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-gray-900 mb-1 truncate">{product.product_title}</h3>
                                <p className="text-sm text-gray-500 mb-2">Variant ID: {product.variant_id}</p>
                            </div>

                            <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                {isOutOfStock && (
                                    <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full whitespace-nowrap">
                    Out of Stock
                  </span>
                                )}
                                {isLowStock && (
                                    <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full whitespace-nowrap">
                    Low Stock
                  </span>
                                )}
                                <div className={`text-lg font-bold ${isOutOfStock ? 'text-red-600' : 'text-green-600'}`}>
                                    {product.current_quantity}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 text-sm">
                            <div className="flex flex-col sm:flex-row sm:items-center">
                                <span className="text-gray-500">Product ID:</span>
                                <span className="sm:ml-2 text-gray-900 break-all">{product.product_id}</span>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center">
                                <span className="text-gray-500">Inventory ID:</span>
                                <span className="sm:ml-2 text-gray-900">{product.inventory_item_id}</span>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center">
                                <span className="text-gray-500">Created:</span>
                                <span className="sm:ml-2 text-gray-900">{new Date(product.created_at).toLocaleDateString()}</span>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center">
                                <span className="text-gray-500">Updated:</span>
                                <span className="sm:ml-2 text-gray-900">{new Date(product.updated_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow group">
            <div className="relative aspect-square bg-gray-100">
                {product.image_url ? (
                    <img
                        src={product.image_url}
                        alt={product.product_title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={handleImageError}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <Package size={48} />
                    </div>
                )}

                {isOutOfStock && (
                    <div className="absolute top-2 right-2">
            <span className="px-3 py-1 bg-red-500 text-white text-xs font-semibold rounded-full shadow-lg">
              Out of Stock
            </span>
                    </div>
                )}
                {isLowStock && (
                    <div className="absolute top-2 right-2">
            <span className="px-3 py-1 bg-yellow-500 text-white text-xs font-semibold rounded-full shadow-lg">
              Low Stock
            </span>
                    </div>
                )}
            </div>

            <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 min-h-[3rem]">{product.product_title}</h3>

                <div className="space-y-2 text-sm text-gray-600 mb-3">
                    <div className="flex justify-between items-center">
                        <span>Variant ID:</span>
                        <span className="font-medium">{product.variant_id}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span>Product ID:</span>
                        <span className="font-medium truncate ml-2">{product.product_id}</span>
                    </div>
                </div>

                <div className="pt-3 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Quantity:</span>
                        <span className={`text-xl font-bold ${isOutOfStock ? 'text-red-600' : 'text-green-600'}`}>
              {product.current_quantity}
            </span>
                    </div>
                </div>
            </div>
        </div>
    );
}