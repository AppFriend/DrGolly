import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AffiliateTerms() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              Affiliate Terms and Conditions
            </CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg">Affiliate Terms and Conditions – To be updated</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}