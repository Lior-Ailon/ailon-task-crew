import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Video, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  startTeamsConnect,
  saveTeamsConnection,
  getTeamsStatus,
  disconnectTeams,
} from "@/lib/teams.functions";
import { connectAppUser } from "@/integrations/lovable/appUserConnectorClient";

const GATEWAY_BASE_URL = "https://connector-gateway.lovable.dev";

export function TeamsConnectCard() {
  const qc = useQueryClient();
  const start = useServerFn(startTeamsConnect);
  const save = useServerFn(saveTeamsConnection);
  const status = useServerFn(getTeamsStatus);
  const disconnect = useServerFn(disconnectTeams);

  const { data, isLoading } = useQuery({
    queryKey: ["teams-status"],
    queryFn: () => status(),
  });

  const connectMut = useMutation({
    mutationFn: async () => {
      const result = await connectAppUser({
        connectorId: "microsoft_teams",
        gatewayBaseUrl: GATEWAY_BASE_URL,
        start: async (targetOrigin) => start({ data: targetOrigin }),
      });
      if (!result.success) throw new Error(result.error ?? "ההתחברות נכשלה");
      if (!result.connectionAPIKey) throw new Error("לא התקבל מפתח חיבור");
      await save({ data: { connectionAPIKey: result.connectionAPIKey } });
    },
    onSuccess: () => {
      toast.success("Teams חובר בהצלחה");
      qc.invalidateQueries({ queryKey: ["teams-status"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "ההתחברות נכשלה"),
  });

  const disconnectMut = useMutation({
    mutationFn: async () => {
      await disconnect();
    },
    onSuccess: () => {
      toast.success("Teams נותק");
      qc.invalidateQueries({ queryKey: ["teams-status"] });
    },
  });

  const connected = data?.connected;

  return (
    <div className="glass-strong rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-xl bg-primary/15 flex items-center justify-center">
          <Video className="size-5 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold">Microsoft Teams</h3>
          <p className="text-xs text-muted-foreground">
            חבר את חשבון Microsoft שלך כדי לייצר קישורי פגישה אוטומטית
          </p>
        </div>
        {connected && (
          <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
            <Check className="size-4" /> מחובר
          </span>
        )}
      </div>
      <div className="flex gap-2">
        {connected ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => disconnectMut.mutate()}
            disabled={disconnectMut.isPending}
          >
            {disconnectMut.isPending && <Loader2 className="size-3 animate-spin" />}
            נתק
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={() => connectMut.mutate()}
            disabled={connectMut.isPending || isLoading}
          >
            {connectMut.isPending && <Loader2 className="size-3 animate-spin ml-1" />}
            התחבר ל-Teams
          </Button>
        )}
      </div>
    </div>
  );
}
