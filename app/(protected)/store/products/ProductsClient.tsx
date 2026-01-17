// app/products/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import {Search, Grid3x3, List, AlertCircle, Package, CheckCircle, XCircle, AlertTriangle} from 'lucide-react';
import ProductCard from '@/components/ui/ProductCard';
import PageLoader from "@/components/ui/PageLoader";
import StatCard from '@/components/ui/StatCard';

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

interface ProductsResponse {
    success: boolean;
    count: number;
    products: Product[];
}

export default function ProductsClient() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [layout, setLayout] = useState<'grid' | 'list'>('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [stockFilter, setStockFilter] = useState('all');
    const [sortBy, setSortBy] = useState('name-asc');

    useEffect(() => {
        async function fetchProducts() {
            try {
                setLoading(true);
                const response = await fetch('/api/store/products');

                if (!response.ok) {
                    throw new Error('Failed to fetch products');
                }

                const data: ProductsResponse = await response.json();

                if (data.success) {
                    setProducts(data.products);
                } else {
                    throw new Error('API returned unsuccessful response');
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An error occurred');
            } finally {
                setLoading(false);
            }
        }

        fetchProducts();
    }, []);

    const filteredAndSortedProducts = useMemo(() => {
        let filtered = products;

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(p =>
                p.product_title.toLowerCase().includes(query) ||
                p.variant_id.toString().includes(query) ||
                p.product_id.toString().includes(query)
            );
        }

        // Stock filter
        if (stockFilter !== 'all') {
            filtered = filtered.filter(p => {
                if (stockFilter === 'in-stock') return p.current_quantity > 0;
                if (stockFilter === 'out-of-stock') return p.current_quantity <= 0;
                if (stockFilter === 'low-stock') return p.current_quantity > 0 && p.current_quantity < 20;
                return true;
            });
        }

        // Sort
        filtered = [...filtered].sort((a, b) => {
            switch (sortBy) {
                case 'name-asc':
                    return a.product_title.localeCompare(b.product_title);
                case 'name-desc':
                    return b.product_title.localeCompare(a.product_title);
                case 'quantity-asc':
                    return a.current_quantity - b.current_quantity;
                case 'quantity-desc':
                    return b.current_quantity - a.current_quantity;
                case 'date-newest':
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                case 'date-oldest':
                    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                default:
                    return 0;
            }
        });

        return filtered;
    }, [products, searchQuery, stockFilter, sortBy]);

    const stats = useMemo(() => {
        const total = products.length;
        const inStock = products.filter(p => p.current_quantity > 0).length;
        const outOfStock = products.filter(p => p.current_quantity <= 0).length;
        const lowStock = products.filter(p => p.current_quantity > 0 && p.current_quantity < 20).length;

        return { total, inStock, outOfStock, lowStock };
    }, [products]);

    if (loading) {
        return <PageLoader text={"Loading products..."}/>
    }

    if (error) {
        return (
            <div className="bg-white flex flex-1 items-center justify-center">
                <div className="bg-white rounded-lg border border-red-200 p-8 max-w-md text-center">
                    <AlertCircle className="mx-auto mb-4 text-red-500" size={48} />
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Products</h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-2 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white rounded-lg hover:from-yellow-500 hover:to-yellow-700 transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white flex flex-1 flex-col">
            <div className="p-3 flex flex-col">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">Product Inventory</h1>
                    <p className="text-gray-600">Manage and monitor your product stock levels</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <StatCard
                        value={stats.total}
                        label="Total Products"
                        icon={Package}
                        iconColor="text-gray-600"
                        iconBgColor="bg-gray-100"
                        valueColor="text-gray-900"
                    />

                    <StatCard
                        value={stats.inStock}
                        label="In Stock"
                        icon={CheckCircle}
                        iconColor="text-green-600"
                        iconBgColor="bg-green-100"
                        valueColor="text-green-600"
                    />

                    <StatCard
                        value={stats.outOfStock}
                        label="Out of Stock"
                        icon={XCircle}
                        iconColor="text-red-600"
                        iconBgColor="bg-red-100"
                        valueColor="text-red-600"
                    />

                    <StatCard
                        value={stats.lowStock}
                        label="Low Stock"
                        icon={AlertTriangle}
                        iconColor="text-yellow-600"
                        iconBgColor="bg-yellow-100"
                        valueColor="text-yellow-600"
                    />
                </div>

                {/* Filters and Controls */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 mb-6">
                    <div className="flex flex-col lg:flex-row gap-4">
                        {/* Search */}
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="text"
                                    placeholder="Search by title, variant ID, or product ID..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none"
                                />
                            </div>
                        </div>

                        {/* Stock Filter */}
                        <select
                            value={stockFilter}
                            onChange={(e) => setStockFilter(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none bg-white"
                        >
                            <option value="all">All Stock Levels</option>
                            <option value="in-stock">In Stock</option>
                            <option value="low-stock">Low Stock</option>
                            <option value="out-of-stock">Out of Stock</option>
                        </select>

                        {/* Sort */}
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none bg-white"
                        >
                            <option value="name-asc">Name (A-Z)</option>
                            <option value="name-desc">Name (Z-A)</option>
                            <option value="quantity-asc">Quantity (Low to High)</option>
                            <option value="quantity-desc">Quantity (High to Low)</option>
                            <option value="date-newest">Newest First</option>
                            <option value="date-oldest">Oldest First</option>
                        </select>

                        {/* Layout Toggle */}
                        <div className="flex gap-2 border border-gray-300 rounded-lg p-1 bg-gray-50">
                            <button
                                onClick={() => setLayout('grid')}
                                className={`p-2 rounded transition-colors ${
                                    layout === 'grid'
                                        ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white'
                                        : 'text-gray-600 hover:bg-gray-200'
                                }`}
                                aria-label="Grid view"
                            >
                                <Grid3x3 size={20} />
                            </button>
                            <button
                                onClick={() => setLayout('list')}
                                className={`p-2 rounded transition-colors ${
                                    layout === 'list'
                                        ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white'
                                        : 'text-gray-600 hover:bg-gray-200'
                                }`}
                                aria-label="List view"
                            >
                                <List size={20} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Results Count */}
                <div className="mb-4 text-sm text-gray-600">
                    Showing {filteredAndSortedProducts.length} of {products.length} products
                </div>

                {/* Products Grid/List */}
                {filteredAndSortedProducts.length > 0 ? (
                    <div className={
                        layout === 'grid'
                            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                            : 'flex flex-col gap-4'
                    }>
                        {filteredAndSortedProducts.map(product => (
                            <ProductCard
                                key={`${product.product_id}-${product.variant_id}`}
                                product={product}
                                layout={layout}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                        <AlertCircle className="mx-auto mb-4 text-gray-400" size={48} />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
                        <p className="text-gray-600">Try adjusting your search or filters</p>
                    </div>
                )}
            </div>
        </div>
    );
}