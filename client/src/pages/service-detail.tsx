import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Clock, DollarSign, Calendar, Baby, Heart, ArrowLeft, CheckCircle } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Service } from "@shared/schema";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function ServiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isBooking, setIsBooking] = useState(false);
  const [bookingData, setBookingData] = useState({
    preferredDate: '',
    notes: ''
  });

  const { data: service, isLoading } = useQuery<Service>({
    queryKey: ["/api/services", id],
    queryFn: async () => {
      const response = await fetch(`/api/services/${id}`);
      if (!response.ok) throw new Error('Service not found');
      return response.json();
    },
  });

  const { data: activatedServices } = useQuery<string[]>({
    queryKey: ["/api/user/activated-services"],
  });

  const { data: bookings } = useQuery({
    queryKey: ["/api/service-bookings"],
  });

  const bookingMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/service-bookings", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Booking Created",
        description: "Your service booking has been created successfully. We'll contact you soon.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/service-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/activated-services"] });
      setIsBooking(false);
      setBookingData({ preferredDate: '', notes: '' });
    },
    onError: (error: any) => {
      toast({
        title: "Booking Failed",
        description: error.message || "Failed to create booking. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleBooking = () => {
    if (!bookingData.preferredDate) {
      toast({
        title: "Date Required",
        description: "Please select a preferred date for your appointment.",
        variant: "destructive",
      });
      return;
    }

    bookingMutation.mutate({
      serviceId: parseInt(id!),
      preferredDate: bookingData.preferredDate,
      notes: bookingData.notes
    });
  };

  const getServiceIcon = (serviceType: string) => {
    switch (serviceType) {
      case 'sleep_review':
        return <Baby className="h-12 w-12 text-brand-teal" />;
      case 'lactation':
        return <Heart className="h-12 w-12 text-brand-teal" />;
      default:
        return <Calendar className="h-12 w-12 text-brand-teal" />;
    }
  };

  const getServiceDetails = (serviceType: string) => {
    switch (serviceType) {
      case 'sleep_review':
        return {
          features: [
            'Comprehensive sleep assessment',
            'Personalized sleep plan',
            'Follow-up support',
            'Written recommendations'
          ],
          benefits: [
            'Improved sleep quality for your baby',
            'Better rest for the whole family',
            'Evidence-based strategies',
            'Professional guidance'
          ]
        };
      case 'lactation':
        return {
          features: [
            'Breastfeeding assessment',
            'Latch technique guidance',
            'Pumping support',
            'Troubleshooting sessions'
          ],
          benefits: [
            'Successful breastfeeding journey',
            'Reduced feeding stress',
            'Improved milk supply',
            'Confident feeding practices'
          ]
        };
      default:
        return {
          features: ['Professional consultation', 'Expert guidance', 'Personalized support'],
          benefits: ['Better outcomes', 'Expert advice', 'Peace of mind']
        };
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Not Found</h1>
          <Link href="/services">
            <Button className="bg-brand-teal hover:bg-brand-teal/90 text-white">
              Back to Services
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const isActivated = activatedServices?.includes(service.id.toString());
  const serviceDetails = getServiceDetails(service.serviceType);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/services">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Services
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Service Details */}
          <Card>
            <CardHeader>
              <div className="flex items-start gap-4">
                {getServiceIcon(service.serviceType)}
                <div>
                  <CardTitle className="text-2xl">{service.title}</CardTitle>
                  <CardDescription className="mt-2 text-base">{service.description}</CardDescription>
                </div>
              </div>
              {isActivated && (
                <Badge variant="secondary" className="bg-green-100 text-green-800 w-fit">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Activated
                </Badge>
              )}
            </CardHeader>
            
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center gap-6 text-lg">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-brand-teal" />
                    <span className="font-semibold">${service.price}</span>
                  </div>
                  {service.durationMinutes && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-brand-teal" />
                      <span>{service.durationMinutes} minutes</span>
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">What's Included</h3>
                  <ul className="space-y-2">
                    {serviceDetails.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">Benefits</h3>
                  <ul className="space-y-2">
                    {serviceDetails.benefits.map((benefit, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-blue-500" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Booking Form */}
          <Card>
            <CardHeader>
              <CardTitle>Book Your Appointment</CardTitle>
              <CardDescription>
                {isActivated 
                  ? "Schedule your consultation with our expert team."
                  : "Purchase and schedule your consultation in one step."
                }
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              {!isBooking ? (
                <Button 
                  onClick={() => setIsBooking(true)}
                  className="w-full bg-brand-teal hover:bg-brand-teal/90 text-white"
                  size="lg"
                >
                  {isActivated ? 'Schedule Appointment' : 'Book Service'}
                </Button>
              ) : (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="preferredDate">Preferred Date & Time</Label>
                    <Input
                      id="preferredDate"
                      type="datetime-local"
                      value={bookingData.preferredDate}
                      onChange={(e) => setBookingData({...bookingData, preferredDate: e.target.value})}
                      min={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="notes">Additional Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      value={bookingData.notes}
                      onChange={(e) => setBookingData({...bookingData, notes: e.target.value})}
                      placeholder="Any specific concerns or preferences..."
                      rows={3}
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleBooking}
                      disabled={bookingMutation.isPending}
                      className="flex-1 bg-brand-teal hover:bg-brand-teal/90 text-white"
                    >
                      {bookingMutation.isPending ? 'Booking...' : 'Confirm Booking'}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsBooking(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}