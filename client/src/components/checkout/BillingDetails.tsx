import { Input } from '@/components/ui/input';
import { CustomerDetails } from '@/types/checkout';

interface BillingDetailsProps {
  customerDetails: CustomerDetails;
  onUpdateDetails: (field: keyof CustomerDetails, value: string) => void;
}

export function BillingDetails({ customerDetails, onUpdateDetails }: BillingDetailsProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-6 uppercase tracking-wide">
        BILLING DETAILS
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Input
            type="text"
            placeholder="First Name"
            value={customerDetails.firstName}
            onChange={(e) => onUpdateDetails('firstName', e.target.value)}
            required
          />
        </div>
        <div>
          <Input
            type="text"
            placeholder="Last Name"
            value={customerDetails.lastName}
            onChange={(e) => onUpdateDetails('lastName', e.target.value)}
          />
        </div>
        <div>
          <Input
            type="tel"
            placeholder="Phone"
            value={customerDetails.phone}
            onChange={(e) => onUpdateDetails('phone', e.target.value)}
          />
        </div>
        <div>
          <Input
            type="text"
            placeholder="Address"
            value={customerDetails.address}
            onChange={(e) => onUpdateDetails('address', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}