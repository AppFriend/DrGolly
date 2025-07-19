// User details component for checkout-new
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

interface UserDetailsProps {
  customerDetails: CustomerDetails;
  onChange: (details: CustomerDetails) => void;
  disabled?: boolean;
}

export function UserDetails({ customerDetails, onChange, disabled }: UserDetailsProps) {
  const updateDetail = (field: keyof CustomerDetails, value: string) => {
    onChange({
      ...customerDetails,
      [field]: value
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="md:col-span-2">
        <Label htmlFor="email">Email Address *</Label>
        <Input
          id="email"
          type="email"
          value={customerDetails.email}
          onChange={(e) => updateDetail('email', e.target.value)}
          placeholder="Enter your email"
          required
          disabled={disabled}
        />
      </div>
      
      <div>
        <Label htmlFor="dueDate">Due Date/Baby Birthday</Label>
        <Input
          id="dueDate"
          type="date"
          value={customerDetails.dueDate}
          onChange={(e) => updateDetail('dueDate', e.target.value)}
          disabled={disabled}
        />
      </div>
      
      <div>
        <Label htmlFor="firstName">First Name *</Label>
        <Input
          id="firstName"
          type="text"
          value={customerDetails.firstName}
          onChange={(e) => updateDetail('firstName', e.target.value)}
          placeholder="Enter your first name"
          required
          disabled={disabled}
        />
      </div>
      
      <div>
        <Label htmlFor="lastName">Last Name</Label>
        <Input
          id="lastName"
          type="text"
          value={customerDetails.lastName}
          onChange={(e) => updateDetail('lastName', e.target.value)}
          placeholder="Enter your last name"
          disabled={disabled}
        />
      </div>
    </div>
  );
}