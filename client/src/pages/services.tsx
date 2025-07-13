import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, DollarSign, Calendar, Heart, Baby } from "lucide-react";
import { Link } from "wouter";
import { Service } from "@shared/schema";

export default function ServicesPage() {
  const { data: services, isLoading } = useQuery<Service[]>({
    queryKey: ["/api/services"],
  });

  const { data: activatedServices } = useQuery<string[]>({
    queryKey: ["/api/user/activated-services"],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2].map((i) => (
                <div key={i} className="h-64 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getServiceIcon = (serviceType: string) => {
    switch (serviceType) {
      case 'sleep_review':
        return <Baby className="h-8 w-8 text-brand-teal" />;
      case 'lactation':
        return <Heart className="h-8 w-8 text-brand-teal" />;
      default:
        return <Calendar className="h-8 w-8 text-brand-teal" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Professional Services</h1>
          <p className="text-gray-600">Expert support for your family's health and wellness journey</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {services?.map((service) => (
            <Card key={service.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {getServiceIcon(service.serviceType)}
                    <div>
                      <CardTitle className="text-xl">{service.title}</CardTitle>
                      <CardDescription className="mt-1">{service.description}</CardDescription>
                    </div>
                  </div>
                  {activatedServices?.includes(service.id.toString()) && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Activated
                    </Badge>
                  )}
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      <span>${service.price}</span>
                    </div>
                    {service.durationMinutes && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{service.durationMinutes} min</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="pt-4">
                    <Link href={`/services/${service.id}`}>
                      <Button 
                        className="w-full bg-brand-teal hover:bg-brand-teal/90 text-white"
                        disabled={!activatedServices?.includes(service.id.toString())}
                      >
                        {activatedServices?.includes(service.id.toString()) 
                          ? 'Book Appointment' 
                          : 'Learn More & Book'
                        }
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {services?.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Services Available</h3>
            <p className="text-gray-600">Check back soon for new professional services.</p>
          </div>
        )}
      </div>
    </div>
  );
}