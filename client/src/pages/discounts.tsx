import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, Tag, Lock, ExternalLink, Star, ShoppingCart } from "lucide-react";
import { DiscountCard } from "@/components/ui/discount-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useUpgradeModal } from "@/hooks/useUpgradeModal";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import type { PartnerDiscount } from "@shared/schema";
import book1Image from "@assets/IMG_5430_1752370946458.jpeg";
import book2Image from "@assets/IMG_5431_1752370946459.jpeg";

const discountTabs = [
  { id: "partner", label: "Partner Deals", active: true },
  { id: "shopping", label: "Shopping", active: false },
];

// Product data for shopping section
const shoppingProducts = [
  {
    id: 1,
    title: "Your Baby Doesn't Come with a Book",
    author: "Dr. Daniel Golshevsky",
    price: "AU$24.99",
    rating: 4.8,
    reviewCount: 127,
    image: book1Image,
    description: "A comprehensive guide to navigating the first year with your baby, written by sleep expert Dr. Daniel Golshevsky.",
    amazonUrl: "https://www.amazon.com.au/Your-Baby-Doesnt-Come-Book/dp/1761212885/ref=asc_df_1761212885?mcid=3fad30ed30f63eaea899eb454e9764d0&tag=googleshopmob-22&linkCode=df0&hvadid=712358788289&hvpos=&hvnetw=g&hvrand=15313830547994388509&hvpone=&hvptwo=&hvqmt=&hvdev=m&hvdvcmdl=&hvlocint=&hvlocphy=9112781&hvtargid=pla-2201729947671&psc=1&gad_source=1&dplnkId=a7c77b94-6a4b-4378-8e30-979046fdf615&nodl=1",
    category: "Book",
    inStock: true,
    featured: true
  },
  {
    id: 2,
    title: "Dr Golly's Guide to Family Illness",
    author: "Dr. Daniel Golshevsky",
    price: "AU$29.99",
    rating: 4.7,
    reviewCount: 89,
    image: book2Image,
    description: "Essential guide for managing family health and illness, providing practical advice for parents and caregivers.",
    amazonUrl: "https://www.amazon.com.au/Dr-Gollys-Guide-Family-Illness/dp/1761215337/ref=asc_df_1761215337?mcid=5fa13d733a113d21bba7852ac1616b4e&tag=googleshopmob-22&linkCode=df0&hvadid=712379283545&hvpos=&hvnetw=g&hvrand=15313830547994388509&hvpone=&hvptwo=&hvqmt=&hvdev=m&hvdvcmdl=&hvlocint=&hvlocphy=9112781&hvtargid=pla-2422313977118&psc=1&gad_source=1&dplnkId=209a3a52-d644-40ef-a3d7-50f9fc92116d&nodl=1",
    category: "Book",
    inStock: true,
    featured: false
  }
];

export default function Discounts() {
  const { user } = useAuth();
  const { openUpgradeModal } = useUpgradeModal();
  const { toast } = useToast();
  const { hasAccess } = useFeatureAccess();
  const [activeTab, setActiveTab] = useState("partner");
  
  const hasDiscountAccess = hasAccess("discounts");

  const { data: discounts, isLoading, error } = useQuery({
    queryKey: ["/api/discounts", user?.subscriptionTier],
    enabled: !!user && hasDiscountAccess,
  });

  useEffect(() => {
    if (error && isUnauthorizedError(error as Error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [error, toast]);

  const handleClaimDiscount = (discount: PartnerDiscount) => {
    if (user?.subscriptionTier === "free") {
      toast({
        title: "Subscription Required",
        description: "Partner discounts require a Gold or Platinum subscription.",
        variant: "destructive",
      });
      return;
    }

    // Copy discount code to clipboard
    navigator.clipboard.writeText(discount.discountCode);
    toast({
      title: "Discount Code Copied!",
      description: `${discount.discountCode} has been copied to your clipboard.`,
    });
  };

  const handlePurchaseProduct = (product: typeof shoppingProducts[0]) => {
    // Open Amazon link in new tab
    window.open(product.amazonUrl, '_blank');
    
    // Track purchase attempt
    toast({
      title: "Redirecting to Amazon",
      description: "Opening Amazon page in new tab...",
    });
  };

  const ShoppingSection = () => (
    <div className="space-y-6">
      {/* Featured Products */}
      <div className="grid grid-cols-2 gap-3">
        {shoppingProducts.map((product) => (
          <Card key={product.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <CardContent className="p-0">
              {/* Product Image */}
              <div className="aspect-[3/4] bg-gray-100 relative">
                <img 
                  src={product.image} 
                  alt={product.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback to book placeholder
                    e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='200' viewBox='0 0 150 200'%3E%3Crect width='150' height='200' fill='%23f3f4f6'/%3E%3Cpath d='M50 80h50v40H50z' fill='%2383CFCC'/%3E%3Ctext x='75' y='140' font-family='Arial' font-size='12' text-anchor='middle' fill='%23374151'%3EBook Cover%3C/text%3E%3C/svg%3E";
                  }}
                />
                {product.featured && (
                  <div className="absolute top-2 left-2 bg-[#83CFCC] text-white text-xs px-2 py-1 rounded-full">
                    Featured
                  </div>
                )}
              </div>
              
              {/* Product Details */}
              <div className="p-3">
                <h3 className="font-semibold text-gray-900 mb-1 text-sm line-clamp-2">{product.title}</h3>
                <p className="text-xs text-gray-600 mb-2">by {product.author}</p>
                
                {/* Rating */}
                <div className="flex items-center gap-1 mb-2">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i}
                        className={`h-2.5 w-2.5 ${i < Math.floor(product.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-gray-600">
                    {product.rating} ({product.reviewCount})
                  </span>
                </div>
                
                {/* Description */}
                <p className="text-xs text-gray-600 mb-3 line-clamp-2">{product.description}</p>
                
                {/* Price and Buy Button */}
                <div className="space-y-2">
                  <div className="text-center">
                    <span className="text-sm font-bold text-gray-900">{product.price}</span>
                  </div>
                  <Button
                    onClick={() => handlePurchaseProduct(product)}
                    className="w-full bg-[#83CFCC] hover:bg-[#095D66] text-white text-xs py-2 rounded-full flex items-center justify-center gap-1"
                  >
                    <ShoppingCart className="h-3 w-3" />
                    Buy on Amazon
                    <ExternalLink className="h-2.5 w-2.5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Coming Soon Section */}
      <div className="bg-gradient-to-r from-[#83CFCC]/10 to-[#095D66]/10 rounded-2xl p-6 text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">More Products Coming Soon</h3>
        <p className="text-gray-600 mb-4">
          We're working on bringing you more helpful products for your parenting journey.
        </p>
        <div className="flex items-center justify-center gap-2 text-sm text-[#095D66]">
          <Sparkles className="h-4 w-4" />
          Stay tuned for updates!
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dr-bg">
        <div className="animate-pulse p-4 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-semibold flex items-center">
            <Sparkles className="h-5 w-5 mr-2 text-[#83CFCC]" />
            Our Partners, Your Perks!
          </h1>
          <span className="text-sm text-dr-teal font-medium">Shopping</span>
        </div>
        <p className="text-sm text-gray-600">
          Enjoy exclusive year-long discounts with our most trusted brands
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-100 p-4">
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          {discountTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                activeTab === tab.id
                  ? "bg-dr-teal text-white shadow-sm"
                  : "text-gray-600 hover:text-dr-teal"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === "partner" ? (
          // Partner Deals Tab
          !hasDiscountAccess ? (
            <div className="space-y-6">
              {/* Upgrade Card */}
              <div className="bg-white border-2 border-dashed border-gray-300 rounded-2xl p-6 text-center">
                <div className="w-12 h-12 bg-dr-teal/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lock className="h-6 w-6 text-dr-teal" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Unlock Partner Discounts
                </h3>
                <p className="text-gray-600 mb-6">
                  Upgrade to Gold or Platinum to access exclusive partner discounts and save on trusted brands.
                </p>
                <Button
                  onClick={() => openUpgradeModal("discounts")}
                  className="bg-dr-teal hover:bg-dr-teal/90 text-white px-8 py-2 rounded-full"
                >
                  Upgrade Now
                </Button>
              </div>

              {/* Sample Discounts (Locked) */}
              <div className="space-y-4 opacity-50">
                <div className="bg-white rounded-2xl p-4 border border-gray-200 relative overflow-hidden">
                  <div className="absolute inset-0 bg-white/80 z-10"></div>
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-xl flex items-center justify-center">
                      <div className="w-8 h-8 bg-gray-300 rounded"></div>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">20% Off - Code: SYM-AXL</h4>
                      <p className="text-sm text-gray-600">20% Off with Your Code: SYM-AXL</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-dr-teal text-white border-dr-teal rounded-full px-4"
                      disabled
                    >
                      Claim Offer
                    </Button>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-4 border border-gray-200 relative overflow-hidden">
                  <div className="absolute inset-0 bg-white/80 z-10"></div>
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-xl flex items-center justify-center">
                      <div className="w-8 h-8 bg-gray-300 rounded"></div>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">$20.00 Off - Code: GOLLY-PLATINUM-NX7K</h4>
                      <p className="text-sm text-gray-600">$20 Off Your First Order. Your Code: GOLLY-PLATINUM-NX7K</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-dr-teal text-white border-dr-teal rounded-full px-4"
                      disabled
                    >
                      Claim Offer
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {discounts?.map((discount) => (
                <DiscountCard
                  key={discount.id}
                  discount={discount}
                  onClaim={() => handleClaimDiscount(discount)}
                />
              ))}

              {discounts?.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500">No discounts available at this time.</p>
                </div>
              )}
            </div>
          )
        ) : (
          // Shopping Tab
          <ShoppingSection />
        )}
      </div>
    </div>
  );
}
