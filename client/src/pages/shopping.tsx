import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Star, ShoppingCart, ExternalLink } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { ShoppingProduct } from "@shared/schema";

interface RegionalPricing {
  region: string;
  currency: string;
  book1Price: number;
  book2Price: number;
}

export default function Shopping() {
  const [selectedProduct, setSelectedProduct] = useState<ShoppingProduct | null>(null);
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);
  const { toast } = useToast();

  // Fetch shopping products
  const { data: products, isLoading: productsLoading } = useQuery<ShoppingProduct[]>({
    queryKey: ['/api/shopping-products'],
  });

  // Fetch regional pricing
  const { data: regionalPricing, isLoading: pricingLoading } = useQuery<RegionalPricing>({
    queryKey: ['/api/regional-pricing'],
  });

  const getProductPrice = (product: ShoppingProduct) => {
    if (!regionalPricing) return 0;
    
    const priceField = product.priceField as keyof RegionalPricing;
    return regionalPricing[priceField] || 0;
  };

  const getCurrencySymbol = (currency: string) => {
    switch (currency) {
      case 'AUD':
      case 'USD':
        return '$';
      case 'EUR':
        return '€';
      default:
        return '$';
    }
  };

  const handlePurchase = async (product: ShoppingProduct) => {
    setIsPaymentLoading(true);
    setSelectedProduct(product);
    
    try {
      const response = await apiRequest('POST', '/api/create-book-payment', {
        productId: product.id,
        customerDetails: {
          email: 'customer@example.com', // This will be replaced with actual customer details
          firstName: 'Customer',
        },
      });

      const data = await response.json();
      
      // TODO: Implement Stripe payment flow here
      console.log('Payment intent created:', data.clientSecret);
      
      // For now, just show success message
      alert(`Payment created for ${product.title} - ${getCurrencySymbol(data.currency)}${data.amount}`);
    } catch (error) {
      console.error('Error creating payment:', error);
      alert('Failed to create payment. Please try again.');
    } finally {
      setIsPaymentLoading(false);
      setSelectedProduct(null);
    }
  };

  const openAmazonLink = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: async ({ itemType, itemId, quantity }: { itemType: string; itemId: number; quantity: number }) => {
      const response = await apiRequest('POST', '/api/cart', {
        itemType,
        itemId,
        quantity
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Added to Cart",
        description: "Book has been added to your cart successfully!",
      });
      // Invalidate cart queries to update the count
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
      queryClient.invalidateQueries({ queryKey: ['/api/cart/count'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add item to cart. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleAddToCart = (product: ShoppingProduct) => {
    addToCartMutation.mutate({
      itemType: 'book',
      itemId: product.id,
      quantity: 1
    });
  };

  if (productsLoading || pricingLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dr. Golly's Bookstore</h1>
        <p className="text-gray-600">
          Discover expert guidance from Dr. Daniel Golshevsky with our comprehensive parenting books
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {products?.map((product) => (
          <Card key={product.id} className="flex flex-col h-full">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-xl font-semibold text-gray-900 mb-2">
                    {product.title}
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    by {product.author}
                  </CardDescription>
                </div>
                {product.isFeatured && (
                  <Badge variant="secondary" className="ml-2">
                    Featured
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent className="flex-1 pb-4">
              <div className="space-y-4">
                <p className="text-sm text-gray-700 leading-relaxed">
                  {product.description}
                </p>

                {product.rating && (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < Math.floor(product.rating!)
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600">
                      {product.rating} ({product.reviewCount} reviews)
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-brand-teal">
                    {getCurrencySymbol(regionalPricing?.currency || 'USD')}
                    {getProductPrice(product)}
                  </div>
                  <Badge variant={product.inStock ? "default" : "secondary"}>
                    {product.inStock ? "In Stock" : "Out of Stock"}
                  </Badge>
                </div>
              </div>
            </CardContent>

            <CardFooter className="pt-4 border-t">
              <div className="flex gap-2 w-full">
                <Button
                  onClick={() => handlePurchase(product)}
                  disabled={!product.inStock || isPaymentLoading}
                  className="flex-1 bg-brand-teal hover:bg-brand-teal/90"
                >
                  {isPaymentLoading && selectedProduct?.id === product.id ? (
                    <LoadingSpinner />
                  ) : (
                    "Buy Now"
                  )}
                </Button>
                
                <Button
                  onClick={() => handleAddToCart(product)}
                  disabled={!product.inStock || addToCartMutation.isPending}
                  variant="outline"
                  className="flex-1"
                >
                  {addToCartMutation.isPending ? (
                    <LoadingSpinner />
                  ) : (
                    <>
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Add to Cart
                    </>
                  )}
                </Button>
                
                {product.amazonUrl && (
                  <Button
                    variant="outline"
                    onClick={() => openAmazonLink(product.amazonUrl!)}
                    className="flex-1"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View on Amazon
                  </Button>
                )}
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>

      {(!products || products.length === 0) && (
        <div className="text-center py-12">
          <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No products available</h3>
          <p className="text-gray-600">
            Check back soon for new books and products from Dr. Golly
          </p>
        </div>
      )}
    </div>
  );
}