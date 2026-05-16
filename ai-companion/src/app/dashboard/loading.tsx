import { Loader2 } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-muted-foreground">
      <Loader2 className="size-7 animate-spin text-primary" />
      <p className="text-sm">Loading your dashboard…</p>
    </div>
  );
}
