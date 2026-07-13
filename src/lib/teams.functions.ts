import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  authorizeAppUserOAuth,
  callAsAppUser,
  disconnectAppUser,
} from "@/integrations/lovable/appUserConnector";

const GATEWAY_BASE_URL = "https://connector-gateway.lovable.dev";
const CONNECTOR_ID = "microsoft_teams";
const SCOPES = [
  "openid",
  "profile",
  "email",
  "offline_access",
  "OnlineMeetings.ReadWrite",
];

async function getStoredKey(userId: string): Promise<string | null> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { decryptConnectionKey } = await import("@/lib/connectionKeyCrypto.server");
  const { data, error } = await supabaseAdmin
    .from("app_user_connections")
    .select("connection_key_ciphertext")
    .eq("user_id", userId)
    .eq("connector_id", CONNECTOR_ID)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return decryptConnectionKey(data.connection_key_ciphertext);
}

export const startTeamsConnect = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((targetOrigin: string) => targetOrigin)
  .handler(async ({ data: targetOrigin, context }) => {
    const clientKey = process.env.MICROSOFT_TEAMS_APP_USER_CONNECTOR_CLIENT_API_KEY;
    if (!clientKey) throw new Error("Teams connector client not configured");
    const { authorizationUrl } = await authorizeAppUserOAuth({
      gatewayBaseUrl: GATEWAY_BASE_URL,
      connectorId: CONNECTOR_ID,
      appUserId: context.userId,
      clientAPIKey: clientKey,
      returnUrl: targetOrigin,
      responseMode: "web_message",
      webMessageTargetOrigin: targetOrigin,
      credentialsConfiguration: { scopes: SCOPES },
    });
    return { authorizationUrl };
  });

export const saveTeamsConnection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { connectionAPIKey: string }) => input)
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { encryptConnectionKey } = await import("@/lib/connectionKeyCrypto.server");
    const { error } = await supabaseAdmin.from("app_user_connections").upsert(
      {
        user_id: context.userId,
        connector_id: CONNECTOR_ID,
        connection_key_ciphertext: encryptConnectionKey(data.connectionAPIKey),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,connector_id" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getTeamsStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const key = await getStoredKey(context.userId);
    return { connected: !!key };
  });

export const disconnectTeams = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const key = await getStoredKey(context.userId);
    if (key) {
      try {
        await disconnectAppUser({
          gatewayBaseUrl: GATEWAY_BASE_URL,
          connectionAPIKey: key,
          connectorId: CONNECTOR_ID,
        });
      } catch (e) {
        console.warn("Teams gateway disconnect failed:", e);
      }
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("app_user_connections")
      .delete()
      .eq("user_id", context.userId)
      .eq("connector_id", CONNECTOR_ID);
    return { ok: true };
  });

export const createTeamsMeetingLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: { subject: string; startTime: string; endTime?: string }) => {
      if (!input.subject) throw new Error("חסר נושא לפגישה");
      if (!input.startTime) throw new Error("חסר זמן התחלה");
      return input;
    },
  )
  .handler(async ({ data, context }) => {
    const key = await getStoredKey(context.userId);
    if (!key) throw new Error("Teams לא מחובר. יש להתחבר בהגדרות תחילה.");
    const start = new Date(data.startTime);
    const end = data.endTime ? new Date(data.endTime) : new Date(start.getTime() + 60 * 60 * 1000);
    const res = await callAsAppUser({
      gatewayBaseUrl: GATEWAY_BASE_URL,
      connectionAPIKey: key,
      connectorId: CONNECTOR_ID,
      path: "/me/onlineMeetings",
      init: {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: data.subject,
          startDateTime: start.toISOString(),
          endDateTime: end.toISOString(),
        }),
      },
    });
    const text = await res.text();
    if (!res.ok) {
      console.error("Teams onlineMeetings failed", res.status, text);
      throw new Error(`יצירת קישור Teams נכשלה (${res.status})`);
    }
    const body = JSON.parse(text);
    const joinUrl: string | undefined = body.joinUrl ?? body.joinWebUrl;
    if (!joinUrl) throw new Error("Microsoft לא החזיר קישור לפגישה");
    return { joinUrl };
  });
