import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import logoAsset from "@/assets/ailon-logo.png.asset.json";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  useEffect(() => {
    // Supabase auto-processes the recovery token from URL hash and fires PASSWORD_RECOVERY
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) return toast.error("סיסמה חייבת להיות לפחות 6 תווים");
    if (password !== confirm) return toast.error("הסיסמאות אינן תואמות");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("הסיסמה עודכנה בהצלחה");
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" dir="rtl">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <img src={logoAsset.url} alt="AILON TASK" className="size-16 mx-auto object-contain" />
          <h1 className="mt-3 text-2xl font-bold text-primary tracking-wider">AILON TASK</h1>
        </div>
        <div className="glass-strong rounded-3xl p-6 sm:p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">איפוס סיסמה</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {ready ? "בחר סיסמה חדשה לחשבונך" : "מאמת קישור איפוס..."}
            </p>
          </div>
          {ready && (
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pw1">סיסמה חדשה</Label>
                <Input
                  id="pw1"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pw2">אישור סיסמה</Label>
                <Input
                  id="pw2"
                  type="password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  dir="ltr"
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-l from-primary to-accent text-primary-foreground font-semibold"
              >
                {loading ? "מעדכן..." : "עדכן סיסמה"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
