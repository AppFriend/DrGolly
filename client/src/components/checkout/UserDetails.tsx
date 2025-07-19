import { Input } from '@/components/ui/input';
import { CustomerDetails } from '@/types/checkout';

interface UserDetailsProps {
  customerDetails: CustomerDetails;
  onUpdateDetails: (field: keyof CustomerDetails, value: string) => void;
}

export function UserDetails({ customerDetails, onUpdateDetails }: UserDetailsProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-6 uppercase tracking-wide">
        YOUR DETAILS
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Input
            type="email"
            placeholder="Email address"
            value={customerDetails.email}
            onChange={(e) => onUpdateDetails('email', e.target.value)}
            className="w-full"
            required
          />
        </div>
        <div>
          <Input
            type="date"
            placeholder="Due Date/Baby Birthday"
            value={customerDetails.dueDate}
            onChange={(e) => onUpdateDetails('dueDate', e.target.value)}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}