import { Button } from "@/components/ui/button";
import { useUpgradeModal } from "@/hooks/useUpgradeModal";

export function TestUpgradeButton() {
  const { openUpgradeModal } = useUpgradeModal();

  return (
    <Button 
      onClick={() => openUpgradeModal("unlimited_courses")}
      className="bg-[#6B9CA3] hover:bg-[#6B9CA3]/90 text-white"
    >
      Test Upgrade Modal
    </Button>
  );
}