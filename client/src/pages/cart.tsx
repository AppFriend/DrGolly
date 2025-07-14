import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ShoppingCart, Plus, Minus, Trash2, ArrowLeft, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { CartItem, ShoppingProduct, Course } from "@shared/schema";
import book1Image from "@assets/IMG_5430_1752370946458.jpeg";
import book2Image from "@assets/IMG_5431_1752370946459.jpeg";
import drGollyLogo from "@assets/Dr Golly-Sleep-Logo-FA (1)_1751955671236.png";

// Product images mapping
const productImages: Record<number, string> = {
  1: book1Image,
  2: book2Image,
};

interface RegionalPricing {
  region: string;
  currency: string;
  amount: number;
  book1Price: number;
  book2Price: number;
}

export default function Cart() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [processingId, setProcessingId] = useState<number | null>(null);

  // Fetch cart items
  const { data: cartItems = [], isLoading } = useQuery<CartItem[]>({
    queryKey: ['/api/cart'],
    enabled: !!user,
  });

  // Fetch shopping products
  const { data: shoppingProducts = [] } = useQuery<ShoppingProduct[]>({
    queryKey: ['/api/shopping-products'],
  });

  // Fetch courses
  const { data: courses = [] } = useQuery<Course[]>({
    queryKey: ['/api/courses'],
  });

  // Fetch regional pricing
  const { data: regionalPricing } = useQuery<RegionalPricing>({
    queryKey: ['/api/regional-pricing'],
  });

  // Update cart item quantity
  const updateQuantityMutation = useMutation({
    mutationFn: async ({ id, quantity }: { id: number; quantity: number }) => {
      const response = await apiRequest('PUT', `/api/cart/${id}`, { quantity });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
      queryClient.invalidateQueries({ queryKey: ['/api/cart/count'] });
    },
    onError: (error) => {
      console.error('Error updating cart item:', error);
      toast({
        title: "Error",
        description: "Failed to update item quantity. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Remove cart item
  const removeItemMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/cart/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
      queryClient.invalidateQueries({ queryKey: ['/api/cart/count'] });
      toast({
        title: "Item Removed",
        description: "Item has been removed from your cart.",
      });
    },
    onError: (error) => {
      console.error('Error removing cart item:', error);
      toast({
        title: "Error",
        description: "Failed to remove item. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Clear cart
  const clearCartMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('DELETE', '/api/cart');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
      queryClient.invalidateQueries({ queryKey: ['/api/cart/count'] });
      toast({
        title: "Cart Cleared",
        description: "All items have been removed from your cart.",
      });
    },
    onError: (error) => {
      console.error('Error clearing cart:', error);
      toast({
        title: "Error",
        description: "Failed to clear cart. Please try again.",
        variant: "destructive",
      });
    },
  });

  const getItemDetails = (item: CartItem) => {
    const itemType = item.itemType || (item as any).item_type;
    const itemId = item.itemId || (item as any).item_id;
    
    if (itemType === 'book') {
      const product = shoppingProducts.find(p => p.id === parseInt(itemId));
      return product ? {
        title: product.title,
        image: productImages[product.id],
        price: getProductPrice(product),
        author: product.author,
      } : null;
    } else if (itemType === 'course') {
      const course = courses.find(c => c.id === parseInt(itemId));
      return course ? {
        title: course.title,
        image: course.thumbnailUrl ? course.thumbnailUrl.replace('/assets/', '/attached_assets/') : null,
        price: regionalPricing?.amount || 120,
        author: 'Dr. Golly',
      } : null;
    }
    return null;
  };

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

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      const details = getItemDetails(item);
      return total + (details?.price || 0) * item.quantity;
    }, 0);
  };

  const handleUpdateQuantity = (id: number, quantity: number) => {
    if (quantity <= 0) {
      setProcessingId(id);
      removeItemMutation.mutate(id);
    } else {
      setProcessingId(id);
      updateQuantityMutation.mutate({ id, quantity });
    }
  };

  const handleRemoveItem = (id: number) => {
    setProcessingId(id);
    removeItemMutation.mutate(id);
  };

  const handleCheckout = () => {
    // Redirect to checkout page
    setLocation('/checkout');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please Login</h1>
          <p className="text-gray-600 mb-6">You need to be logged in to view your cart.</p>
          <Button onClick={() => window.location.href = "/api/login"}>
            Login
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="animate-pulse p-4 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-[#095D66] text-white px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setLocation("/home")}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <img 
              src={drGollyLogo} 
              alt="Dr. Golly" 
              className="h-8 w-auto object-contain"
              style={{ filter: 'brightness(0) invert(1)' }}
            />
          </div>
          <div className="flex items-center space-x-2">
            <ShoppingCart className="h-5 w-5" />
            <span className="text-lg font-semibold">Shopping Cart</span>
          </div>
        </div>
      </header>

      {/* Cart Content */}
      <div className="p-4">
        {cartItems.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Cart is Empty</h2>
            <p className="text-gray-600 mb-6">
              Add some books or courses to get started!
            </p>
            <Button
              onClick={() => setLocation("/discounts")}
              className="bg-[#095D66] hover:bg-[#095D66]/90 text-white"
            >
              Continue Shopping
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Cart Items */}
            {cartItems.map((item) => {
              const details = getItemDetails(item);
              if (!details) return null;

              return (
                <Card key={item.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-4">
                      {/* Product Image */}
                      <div className="w-16 h-20 bg-gray-100 rounded-lg flex-shrink-0">
                        {details.image ? (
                          <img 
                            src={details.image} 
                            alt={details.title}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-full h-full bg-[#83CFCC] rounded-lg flex items-center justify-center">
                            <span className="text-white text-xs font-bold">COURSE</span>
                          </div>
                        )}
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
                          {details.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          by {details.author}
                        </p>
                        <p className="text-sm font-bold text-gray-900">
                          {getCurrencySymbol(regionalPricing?.currency || 'USD')}
                          {details.price.toFixed(2)}
                        </p>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                          disabled={processingId === item.id}
                          className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-8 text-center font-semibold">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                          disabled={processingId === item.id}
                          className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        disabled={processingId === item.id}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {/* Cart Summary */}
            <Card className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Cart Summary</h3>
                  <button
                    onClick={() => clearCartMutation.mutate()}
                    disabled={clearCartMutation.isPending}
                    className="text-red-500 hover:text-red-700 transition-colors text-sm"
                  >
                    Clear Cart
                  </button>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span>Subtotal ({cartItems.length} item{cartItems.length !== 1 ? 's' : ''})</span>
                    <span className="font-semibold">
                      {getCurrencySymbol(regionalPricing?.currency || 'USD')}
                      {calculateTotal().toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span className="text-green-600 font-semibold">Free</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span>
                        {getCurrencySymbol(regionalPricing?.currency || 'USD')}
                        {calculateTotal().toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleCheckout}
                  className="w-full bg-[#095D66] hover:bg-[#095D66]/90 text-white py-3 rounded-xl flex items-center justify-center space-x-2"
                >
                  <CreditCard className="h-5 w-5" />
                  <span>Proceed to Checkout</span>
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}