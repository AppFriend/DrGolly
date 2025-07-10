import { useState, useEffect } from 'react';
import { X, Download, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Import all PDF assets
import sleepTipsPdf from '@assets/DrGolly-Sleep Tips-Dowload (2)_1752112715446.pdf';
import fussyEatersPdf from '@assets/ToddlerToolkit-Top Tips for Fussy Eaters (1)_1752112715444.pdf';
import bedtimeRoutinePdf from '@assets/DrG-TT-TOF-toddler bedtime routine-Long (1) (1)_1752112715446.pdf';
import startingSolidsPdf from '@assets/DrGolly-Starting Solids Checklist-A4-2024 (6)_1752112715445.pdf';
import breastmilkStoragePdf from '@assets/DrGolly-Breast milk storage guide_1752112715446.pdf';

// Asset mapping for PDF files
const PDF_ASSETS = {
  '@assets/DrGolly-Sleep Tips-Dowload (2)_1752112715446.pdf': sleepTipsPdf,
  '@assets/ToddlerToolkit-Top Tips for Fussy Eaters (1)_1752112715444.pdf': fussyEatersPdf,
  '@assets/DrG-TT-TOF-toddler bedtime routine-Long (1) (1)_1752112715446.pdf': bedtimeRoutinePdf,
  '@assets/DrGolly-Starting Solids Checklist-A4-2024 (6)_1752112715445.pdf': startingSolidsPdf,
  '@assets/DrGolly-Breast milk storage guide_1752112715446.pdf': breastmilkStoragePdf,
};

interface PdfViewerProps {
  pdfUrl: string;
  title: string;
  onClose: () => void;
}

export function PdfViewer({ pdfUrl, title, onClose }: PdfViewerProps) {
  const [pdfSrc, setPdfSrc] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get the actual PDF file URL from the asset mapping
    const assetSrc = PDF_ASSETS[pdfUrl as keyof typeof PDF_ASSETS];
    if (assetSrc) {
      setPdfSrc(assetSrc);
    } else {
      setPdfSrc(pdfUrl);
    }
    setIsLoading(false);
  }, [pdfUrl]);

  const handleDownload = () => {
    if (pdfSrc) {
      const link = document.createElement('a');
      link.href = pdfSrc;
      link.download = `${title}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="flex items-center justify-center">
            <div className="animate-spin w-8 h-8 border-4 border-brand-teal border-t-transparent rounded-full"></div>
          </div>
          <p className="text-center mt-4 text-gray-600">Loading PDF...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-brand-teal" />
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleDownload}
              className="bg-brand-teal hover:bg-brand-teal/90 text-white flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download PDF
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* PDF Viewer */}
        <div className="flex-1 overflow-hidden">
          {pdfSrc ? (
            <iframe
              src={pdfSrc}
              className="w-full h-full min-h-[500px]"
              title={title}
              style={{ border: 'none' }}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">PDF not available</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer with download button for mobile */}
        <div className="p-4 border-t bg-gray-50 md:hidden">
          <Button
            onClick={handleDownload}
            className="w-full bg-brand-teal hover:bg-brand-teal/90 text-white flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </Button>
        </div>
      </div>
    </div>
  );
}

// Export PDF asset mapping for admin panel
export { PDF_ASSETS };