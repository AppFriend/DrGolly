import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { FeatureGate, FeatureToggle } from '@/components/FeatureGate';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, Check, X, Crown, Star } from 'lucide-react';

export default function FeatureDemo() {
  const { user } = useAuth();
  const { featureAccess, isLoading } = useFeatureAccess();

  const handleBack = () => {
    window.location.href = '/';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="animate-pulse p-4 space-y-4">
          <div className="h-16 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const tierColors = {
    free: 'bg-gray-100 text-gray-800',
    gold: 'bg-yellow-100 text-yellow-800',
    platinum: 'bg-purple-100 text-purple-800'
  };

  const tierIcons = {
    free: <Star className="h-4 w-4" />,
    gold: <Crown className="h-4 w-4" />,
    platinum: <Crown className="h-4 w-4" />
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-[#095D66] text-white p-4 flex items-center">
        <button onClick={handleBack} className="mr-3">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Feature Access Demo</h1>
          <p className="text-sm opacity-90">View your plan permissions</p>
        </div>
        <Badge className={`${tierColors[user?.subscriptionTier || 'free']} flex items-center gap-1`}>
          {tierIcons[user?.subscriptionTier || 'free']}
          {(user?.subscriptionTier || 'free').toUpperCase()}
        </Badge>
      </header>

      <div className="p-4 space-y-6">
        {/* Current Plan Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Current Plan: {(user?.subscriptionTier || 'Free').charAt(0).toUpperCase() + (user?.subscriptionTier || 'free').slice(1)}
              {tierIcons[user?.subscriptionTier || 'free']}
            </CardTitle>
            <CardDescription>
              Your feature access based on your subscription tier
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Feature Access List */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Feature Permissions</h2>
          
          {Object.entries(featureAccess).map(([featureName, hasAccess]) => {
            const featureDescriptions = {
              'home_tab_access': 'Access to Home tab with blog posts',
              'courses_tab_access': 'Access to Courses tab',
              'unlimited_courses': 'Unlimited access to all courses (no $120 fee)',
              'growth_tracking_access': 'Access to Growth Tracking features',
              'growth_tracking_review': 'Access to Growth Tracking review subpage',
              'discounts_access': 'Access to partner discounts and special offers',
              'family_sharing_access': 'Access to Family Sharing features',
              'course_single_purchase': 'Ability to purchase individual courses for $120'
            };

            return (
              <Card key={featureName} className={hasAccess ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 mb-1">
                        {featureName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {featureDescriptions[featureName] || 'Feature description not available'}
                      </p>
                    </div>
                    <div className="ml-4">
                      {hasAccess ? (
                        <div className="flex items-center text-green-600">
                          <Check className="h-5 w-5 mr-1" />
                          <span className="text-sm font-medium">Enabled</span>
                        </div>
                      ) : (
                        <div className="flex items-center text-red-600">
                          <X className="h-5 w-5 mr-1" />
                          <span className="text-sm font-medium">Locked</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Demo Components */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Feature Gate Examples</h2>
          
          {/* Discounts Feature Gate */}
          <FeatureGate 
            featureName="discounts_access"
            showUpgrade={true}
            upgradeMessage="Upgrade to Gold plan to access exclusive partner discounts and special offers"
          >
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="p-4">
                <h3 className="font-semibold text-yellow-800 mb-2">🎯 Partner Discounts Available!</h3>
                <p className="text-yellow-700">You have access to exclusive discounts from our partners.</p>
                <Button className="mt-3 bg-yellow-600 hover:bg-yellow-700">
                  View Discounts
                </Button>
              </CardContent>
            </Card>
          </FeatureGate>

          {/* Growth Tracking Review */}
          <FeatureGate 
            featureName="growth_tracking_review"
            showUpgrade={true}
            upgradeMessage="Upgrade to Gold plan to unlock advanced growth tracking reviews and consultations"
          >
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <h3 className="font-semibold text-blue-800 mb-2">📊 Growth Review Available</h3>
                <p className="text-blue-700">Access detailed growth analysis and expert consultations.</p>
                <Button className="mt-3 bg-blue-600 hover:bg-blue-700">
                  Start Review
                </Button>
              </CardContent>
            </Card>
          </FeatureGate>

          {/* Course Purchase Toggle */}
          <FeatureToggle featureName="course_single_purchase">
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="p-4">
                <h3 className="font-semibold text-orange-800 mb-2">💳 Individual Course Purchase</h3>
                <p className="text-orange-700">Purchase any course individually for $120.</p>
                <Button className="mt-3 bg-orange-600 hover:bg-orange-700">
                  Buy Course ($120)
                </Button>
              </CardContent>
            </Card>
          </FeatureToggle>
        </div>

        {/* Upgrade CTA for Free Users */}
        {user?.subscriptionTier === 'free' && (
          <Card className="border-dr-teal bg-gradient-to-r from-[#83CFCC] to-[#CBEFE8]">
            <CardContent className="p-6 text-center">
              <h3 className="text-xl font-bold text-[#095D66] mb-2">Unlock Full Access</h3>
              <p className="text-[#095D66] mb-4">
                Upgrade to Gold plan for unlimited courses, partner discounts, and advanced features.
              </p>
              <Button 
                className="bg-[#095D66] hover:bg-[#095D66]/90 text-white"
                onClick={() => window.location.href = '/subscription'}
              >
                Upgrade to Gold Plan
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}