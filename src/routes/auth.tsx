import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import logoAsset from "@/assets/ailon-logo.png.asset.json";
import officeAsset from "@/assets/ailon-office.jpg.asset.json";

export const Route = createFileRoute("/auth")({
  ssr: false,
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("ברוך הבא!");
    navigate({ to: "/dashboard" });
  }

  async function signUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: fullName },
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("נרשמת בהצלחה!");
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-[1.1fr_1fr]">
      {/* Brand panel */}
      <div className="relative hidden lg:block overflow-hidden">
        <img
          src={officeAsset.url}
          alt="AILON TASK"
          className="absolute inset-0 size-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-l from-primary/85 via-primary/55 to-primary/20" />
        <div className="relative z-10 h-full flex flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-3">
            <img src={logoAsset.url} alt="" className="size-14 object-contain drop-shadow-lg" />
            <div>
              <div className="text-xl font-bold tracking-wider">AILON TASK</div>
              <div className="text-[11px] tracking-[0.25em] opacity-80">CRM SYSTEM</div>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-5xl font-extrabold leading-tight">
              Dream it.<br />Plan it.<br />
              <span className="text-accent">Achieve it.</span>
            </h2>
            <div className="h-px w-24 bg-white/50" />
            <p className="text-sm opacity-85 max-w-xs">
              נהל לידים, לקוחות, פרויקטים ומשימות —<br />הכל במקום אחד, מעוצב לעבודה אמיתית.
            </p>
          </div>

          <div className="text-[11px] opacity-70 tracking-wider">
            © {new Date().getFullYear()} AILON TASK · We empower dreamers to build the future.
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <div className="text-center mb-8 lg:hidden">
            <img src={logoAsset.url} alt="AILON TASK" className="size-16 mx-auto object-contain" />
            <h1 className="mt-3 text-2xl font-bold text-primary tracking-wider">AILON TASK</h1>
            <p className="text-xs text-muted-foreground mt-1">Dream it. Plan it. Achieve it.</p>
          </div>

          <div className="glass-strong rounded-3xl p-6 sm:p-8">
            <div className="hidden lg:block mb-6">
              <h1 className="text-2xl font-bold text-foreground">ברוכים הבאים</h1>
              <p className="text-sm text-muted-foreground mt-1">היכנס לחשבון שלך או צור חשבון חדש</p>
            </div>

            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="signin">כניסה</TabsTrigger>
                <TabsTrigger value="signup">הרשמה</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={signIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email-in">אימייל</Label>
                    <Input id="email-in" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} dir="ltr" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pass-in">סיסמה</Label>
                    <Input id="pass-in" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} dir="ltr" />
                  </div>
                  <Button type="submit" disabled={loading} className="w-full bg-gradient-to-l from-primary to-accent text-primary-foreground font-semibold">
                    {loading ? "מתחבר..." : "כניסה למערכת"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={signUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name-up">שם מלא</Label>
                    <Input id="name-up" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email-up">אימייל</Label>
                    <Input id="email-up" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} dir="ltr" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pass-up">סיסמה</Label>
                    <Input id="pass-up" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} dir="ltr" />
                  </div>
                  <Button type="submit" disabled={loading} className="w-full bg-gradient-to-l from-primary to-accent text-primary-foreground font-semibold">
                    {loading ? "יוצר חשבון..." : "צור חשבון חדש"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
