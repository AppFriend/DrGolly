import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

export default function TemperatureChart() {
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = '/assets/temperature-chart.png';
    link.download = 'temperature-chart.png';
    link.click();
  };

  return (
    <div className="space-y-4">
      <div className="bg-gray-50 p-4 rounded-lg">
        <img 
          src="/assets/temperature-chart.png" 
          alt="Temperature and Dressing Chart" 
          className="w-full h-auto rounded-lg shadow-sm"
          style={{ maxHeight: '600px', objectFit: 'contain' }}
        />
      </div>
      
      <div className="flex justify-center">
        <Button 
          onClick={handleDownload}
          className="bg-green-700 hover:bg-green-800 text-white"
        >
          <Download className="w-4 h-4 mr-2" />
          Download Chart
        </Button>
      </div>
    </div>
  );
}