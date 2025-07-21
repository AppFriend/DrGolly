import { useState, useEffect } from 'react';
import { useParams } from 'wouter';
import { Elements } from '@stripe/react-stripe-js';
import { stripePromise } from '@/utils/stripeHelpers';
import { MobileCheckout } from '@/components/checkout/MobileCheckout';
import { Product } from '@/types/product';

export default function CheckoutNew() {
  const { productId } = useParams<{ productId?: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        if (!productId) {
          setError('No product ID provided');
          return;
        }
        
        const response = await fetch(`/api/checkout-new/products/${productId}`);
        if (!response.ok) {
          throw new Error('Product not found');
        }
        
        const productData = await response.json();
        setProduct(productData);
      } catch (err) {
        console.error('Error fetching product:', err);
        setError('Failed to load product');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dr-teal"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h1>
          <p className="text-gray-600">{error || 'The requested product could not be found.'}</p>
        </div>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <MobileCheckout product={product} />
    </Elements>
  );
}