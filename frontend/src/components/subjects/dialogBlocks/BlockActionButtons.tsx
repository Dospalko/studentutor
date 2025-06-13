// frontend/src/components/subjects/dialogBlocks/BlockActionButtons.tsx
"use client";

import { StudyBlockStatus } from "@/types/study";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, Loader2, Zap, XCircle } from "lucide-react";

const getStatusConfig = (status: StudyBlockStatus) => {
  // ... (funkcia getStatusConfig zostáva rovnaká ako si mal v StudyBlockDetailDialog)
  switch (status) {
    case StudyBlockStatus.COMPLETED: return { variant: "default" as const, className: "bg-green-500 border-green-500 hover:bg-green-600 text-white", icon: CheckCircle2 };
    case StudyBlockStatus.IN_PROGRESS: return { variant: "secondary" as const, className: "bg-blue-500 border-blue-500 hover:bg-blue-600 text-white", icon: Zap };
    case StudyBlockStatus.SKIPPED: return { variant: "destructive" as const, className: "bg-red-500 border-red-500 hover:bg-red-600 text-white", icon: XCircle };
    default: return { variant: "outline" as const, className: "border-muted-foreground/20 text-muted-foreground", icon: Clock };
  }
};

interface BlockActionButtonsProps {
  currentStatus: StudyBlockStatus;
  blockId: number;
  onUpdateStatus: (blockId: number, newStatus: StudyBlockStatus) => Promise<void>;
  isUpdating: boolean;
  onDialogClose?: () => void; // Ak chceme po nejakej akcii zavrieť dialóg
}

export default function BlockActionButtons({ currentStatus, blockId, onUpdateStatus, isUpdating, onDialogClose }: BlockActionButtonsProps) {
  
  const renderButton = (targetStatus: StudyBlockStatus, text: string, Icon: React.ElementType) => {
    if (targetStatus === currentStatus && targetStatus !== StudyBlockStatus.PLANNED) return null;
    if (currentStatus === StudyBlockStatus.COMPLETED && targetStatus !== StudyBlockStatus.PLANNED) return null;
    if (currentStatus === StudyBlockStatus.SKIPPED && targetStatus === StudyBlockStatus.IN_PROGRESS) return null;

    const cfg = getStatusConfig(targetStatus);
    return (
      <Button
        className={`w-full ${cfg.className}`}
        variant={cfg.variant}
        size="sm"
        onClick={async () => {
          await onUpdateStatus(blockId, targetStatus);
          if (onDialogClose && targetStatus === StudyBlockStatus.COMPLETED) { // Zavri dialóg len po dokončení
            onDialogClose();
          }
        }}
        disabled={isUpdating}
      >
        {isUpdating && targetStatus === currentStatus && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        <Icon className="mr-2 h-4 w-4" />
        {text}
      </Button>
    );
  };

  return (
    <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex sm:gap-2">
      {renderButton(StudyBlockStatus.COMPLETED, "Dokončené", CheckCircle2)}
      {renderButton(StudyBlockStatus.IN_PROGRESS, "Začať", Zap)}
      {renderButton(StudyBlockStatus.PLANNED, "Naplánovať", Clock)} {/* "Naplánovať" namiesto "Znova plánovať" pre konzistenciu */}
      {renderButton(StudyBlockStatus.SKIPPED, "Preskočiť", XCircle)}
    </div>
  );
}