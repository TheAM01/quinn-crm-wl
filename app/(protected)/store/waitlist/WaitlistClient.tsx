"use client";

import React, { useState, useEffect } from 'react';
import { Users, Package, Clock } from 'lucide-react';
import { ProductsOverview } from './_components/ProductsOverview';
import { CustomersTab } from './_components/CustomersTab';
import { ProductWaitlistsTab } from './_components/ProductWaitlistsTab';
import { ProductModal } from './_components/ProductModal';
import { CustomerModal } from './_components/CustomerModal';
import {PageHeading} from "@/components/ui/Structure";

interface ByProductEntry {
    id: string;
    product_id: string;
    customer_phone: string;
    customer_name: string;
    created_at: string;
    notified: boolean;
}

interface ByProduct {
    entries: ByProductEntry[];
    total: number;
}

interface ByCustomerEntry {
    id: string;
    product_id: string;
    customer_phone: string;
    customer_name: string;
    created_at: string;
    notified: boolean;
}

interface ByCustomer {
    entries: ByCustomerEntry[];
    total: number;
}

interface WaitedProduct {
    product_id: string;
    variant_id: string;
    product_title: string;
    product_image: string;
    product_url: string;
    waitlist_count: number;
    is_available: boolean;
    inventory_quantity: number;
}

interface WaitedProducts {
    products: WaitedProduct[];
    total: number;
}

interface Customer {
    phone: string;
    name: string;
    productCount: number;
    notified: boolean;
}

const WaitlistDashboard = () => {
    const [activeTab, setActiveTab] = useState<string>('products');
    const [products, setProducts] = useState<WaitedProduct[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<WaitedProduct | null>(null);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [productWaitlist, setProductWaitlist] = useState<ByProductEntry[]>([]);
    const [customerWaitlist, setCustomerWaitlist] = useState<ByCustomerEntry[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loadingProducts, setLoadingProducts] = useState<boolean>(false);
    const [loadingCustomers, setLoadingCustomers] = useState<boolean>(false);
    const [loadingModal, setLoadingModal] = useState<boolean>(false);
    const [showProductModal, setShowProductModal] = useState<boolean>(false);
    const [showCustomerModal, setShowCustomerModal] = useState<boolean>(false);

    useEffect(() => {
        if (activeTab === 'products' || activeTab === 'product-details') {
            if (products.length === 0) {
                void fetchProducts();
            }
        }
    }, [activeTab]);

    useEffect(() => {
        if (activeTab === 'customers' && customers.length === 0) {
            void fetchAllCustomers();
        }
    }, [activeTab]);

    const fetchProducts = async (): Promise<void> => {
        setLoadingProducts(true);
        try {
            const response = await fetch('/api/waitlist/products');
            const data: WaitedProducts = await response.json();
            setProducts(data.products || []);
        } catch (error) {
            console.error('Error fetching products:', error);
        }
        setLoadingProducts(false);
    };

    const fetchAllCustomers = async (): Promise<void> => {
        setLoadingCustomers(true);
        try {
            const response = await fetch('/api/waitlist/products');
            const data: WaitedProducts = await response.json();

            // Parallel fetch all waitlists instead of sequential
            const waitlistPromises = (data.products || []).map(product =>
                fetch(`/api/waitlist/by/variant/${product.variant_id}`)
                    .then(res => res.json())
                    .catch(err => {
                        console.error(`Error fetching waitlist for ${product.variant_id}:`, err);
                        return { entries: [] };
                    })
            );

            const allWaitlists = await Promise.all(waitlistPromises);

            // Build customer map from all waitlists
            const customerMap = new Map<string, Customer>();

            allWaitlists.forEach((waitlistData: ByProduct) => {
                waitlistData.entries?.forEach((entry: ByProductEntry) => {
                    const existing = customerMap.get(entry.customer_phone);
                    if (!existing) {
                        customerMap.set(entry.customer_phone, {
                            phone: entry.customer_phone,
                            name: entry.customer_name,
                            productCount: 1,
                            notified: entry.notified
                        });
                    } else {
                        existing.productCount += 1;
                    }
                });
            });

            setCustomers(Array.from(customerMap.values()));
        } catch (error) {
            console.error('Error fetching customers:', error);
        }
        setLoadingCustomers(false);
    };

    const fetchProductWaitlist = async (variantId: string): Promise<void> => {
        setLoadingModal(true);
        try {
            const response = await fetch(`/api/waitlist/by/variant/${variantId}`);
            const data: ByProduct = await response.json();
            setProductWaitlist(data.entries || []);
        } catch (error) {
            console.error('Error fetching product waitlist:', error);
        }
        setLoadingModal(false);
    };

    const fetchCustomerWaitlist = async (phone: string): Promise<void> => {
        setLoadingModal(true);
        try {
            const response = await fetch(`/api/waitlist/by/customer/${phone}`);
            const data: ByCustomer = await response.json();
            setCustomerWaitlist(data.entries || []);
        } catch (error) {
            console.error('Error fetching customer waitlist:', error);
        }
        setLoadingModal(false);
    };

    const openProductModal = async (product: WaitedProduct): Promise<void> => {
        setSelectedProduct(product);
        setShowProductModal(true);
        await fetchProductWaitlist(product.variant_id);
    };

    const openCustomerModal = async (customer: Customer): Promise<void> => {
        setSelectedCustomer(customer);
        setShowCustomerModal(true);
        await fetchCustomerWaitlist(customer.phone);
    };

    return (
        <div className="flex flex-1 w-full p-3 ">
            <div className="flex flex-col w-full flex-1">
                <PageHeading title={"Waitlist Management"} description={"Monitor and manage product waitlists and customer notifications"}/>

                <div className="flex space-x-1 mb-6 border border-neutral-300 p-1 rounded-lg text-sm">
                    <button
                        onClick={() => setActiveTab('products')}
                        className={`cursor-pointer flex-1 p-2 rounded-md font-medium transition-all ${
                            activeTab === 'products'
                                ? 'bg-yellow-500 text-white shadow-md'
                                : 'hover:bg-yellow-300'
                        }`}
                    >
                        <Package className="inline-block w-5 h-5 mr-2" />
                        Products Overview
                    </button>
                    <button
                        onClick={() => setActiveTab('customers')}
                        className={`cursor-pointer flex-1 p-2 rounded-md font-medium transition-all ${
                            activeTab === 'customers'
                                ? 'bg-yellow-500 text-white shadow-md'
                                : 'hover:bg-yellow-300'
                        }`}
                    >
                        <Users className="inline-block w-5 h-5 mr-2" />
                        Customers
                    </button>
                    <button
                        onClick={() => setActiveTab('product-details')}
                        className={`cursor-pointer flex-1 p-2 rounded-md font-medium transition-all ${
                            activeTab === 'product-details'
                                ? 'bg-yellow-500 text-white shadow-md'
                                : 'hover:bg-yellow-300'
                        }`}
                    >
                        <Clock className="inline-block w-5 h-5 mr-2" />
                        Product Waitlists
                    </button>
                </div>

                <div className="bg-white rounded-lg shadow-lg p-6 flex-1">
                    {activeTab === 'products' && (
                        <ProductsOverview products={products} loading={loadingProducts} />
                    )}

                    {activeTab === 'customers' && (
                        <CustomersTab
                            customers={customers}
                            loading={loadingCustomers}
                            onViewDetails={openCustomerModal}
                        />
                    )}

                    {activeTab === 'product-details' && (
                        <ProductWaitlistsTab
                            products={products}
                            loading={loadingProducts}
                            onViewWaitlist={openProductModal}
                        />
                    )}
                </div>

                {showProductModal && selectedProduct && (
                    <ProductModal
                        product={selectedProduct}
                        entries={productWaitlist}
                        loading={loadingModal}
                        onClose={() => setShowProductModal(false)}
                    />
                )}

                {showCustomerModal && selectedCustomer && (
                    <CustomerModal
                        customer={selectedCustomer}
                        entries={customerWaitlist}
                        products={products}
                        loading={loadingModal}
                        onClose={() => setShowCustomerModal(false)}
                    />
                )}
            </div>
        </div>
    );
};

export default WaitlistDashboard;