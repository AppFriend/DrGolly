// Billing details component for checkout-new
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface CustomerDetails {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  dueDate: string;
  address: string;
}

interface BillingDetailsProps {
  customerDetails: CustomerDetails;
  onChange: (details: CustomerDetails) => void;
  disabled?: boolean;
}

export function BillingDetails({ customerDetails, onChange, disabled }: BillingDetailsProps) {
  const updateDetail = (field: keyof CustomerDetails, value: string) => {
    onChange({
      ...customerDetails,
      [field]: value
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <Label htmlFor="billingFirstName">First Name *</Label>
        <Input
          id="billingFirstName"
          type="text"
          value={customerDetails.firstName}
          onChange={(e) => updateDetail('firstName', e.target.value)}
          placeholder="Enter your first name"
          required
          disabled={disabled}
        />
      </div>
      
      <div>
        <Label htmlFor="billingLastName">Last Name</Label>
        <Input
          id="billingLastName"
          type="text"
          value={customerDetails.lastName}
          onChange={(e) => updateDetail('lastName', e.target.value)}
          placeholder="Enter your last name"
          disabled={disabled}
        />
      </div>
      
      <div className="md:col-span-2">
        <Label htmlFor="billingPhone">Phone</Label>
        <Input
          id="billingPhone"
          type="tel"
          value={customerDetails.phone}
          onChange={(e) => updateDetail('phone', e.target.value)}
          placeholder="Enter your phone number"
          disabled={disabled}
        />
      </div>
      
      <div className="md:col-span-2">
        <Label htmlFor="billingAddress">Address</Label>
        <Input
          id="billingAddress"
          type="text"
          value={customerDetails.address || ''}
          onChange={(e) => updateDetail('address', e.target.value)}
          placeholder="Enter your address manually"
          disabled={disabled}
        />
      </div>
    </div>
  );
}