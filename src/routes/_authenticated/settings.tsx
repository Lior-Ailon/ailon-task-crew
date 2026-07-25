import { createFileRoute } from "@tanstack/react-router";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UsersManager } from "@/components/UsersManager";
import { TeamsConnectCard } from "@/components/TeamsConnectCard";
import { MonthlyTargetEditor } from "@/components/MonthlyTarget";
import { ShieldCheck, Settings as SettingsIcon, Plug, Target, KeyRound } from "lucide-react";
import { ApiKeysManager } from "@/components/ApiKeysManager";

export const Route = createFileRoute("/_authenticated/settings")({
  ssr: false,
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <SettingsIcon className="size-6" /> הגדרות
        </h1>
        <p className="text-sm text-muted-foreground">ניהול הגדרות המערכת</p>
      </div>

      <Tabs defaultValue="users" dir="rtl">
        <TabsList>
          <TabsTrigger value="users" className="gap-2">
            <ShieldCheck className="size-4" /> משתמשים
          </TabsTrigger>
          <TabsTrigger value="integrations" className="gap-2">
            <Plug className="size-4" /> אינטגרציות
          </TabsTrigger>
          <TabsTrigger value="goals" className="gap-2">
            <Target className="size-4" /> יעדים
          </TabsTrigger>
          <TabsTrigger value="api" className="gap-2">
            <KeyRound className="size-4" /> API
          </TabsTrigger>
        </TabsList>
        <TabsContent value="users" className="mt-6">
          <UsersManager />
        </TabsContent>
        <TabsContent value="integrations" className="mt-6 space-y-4">
          <TeamsConnectCard />
        </TabsContent>
        <TabsContent value="goals" className="mt-6 space-y-4">
          <MonthlyTargetEditor />
        </TabsContent>
        <TabsContent value="api" className="mt-6 space-y-4">
          <ApiKeysManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
