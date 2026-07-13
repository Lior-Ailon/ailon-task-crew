import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import {
  listSystemUsers,
  createSystemUser,
  setUserRole,
  deleteSystemUser,
  setUserPassword,
} from "@/lib/users.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Shield, Pencil, Eye, Trash2, UserPlus, ShieldAlert, KeyRound } from "lucide-react";

type Role = "admin" | "editor" | "viewer";

const roleMeta: Record<Role, { label: string; icon: any; className: string }> = {
  admin: { label: "ניהול", icon: Shield, className: "bg-primary/15 text-primary border-primary/30" },
  editor: { label: "עריכה", icon: Pencil, className: "bg-accent/15 text-accent border-accent/30" },
  viewer: { label: "קריאה", icon: Eye, className: "bg-muted text-muted-foreground border-border" },
};

export function UsersManager() {
  const qc = useQueryClient();
  const listFn = useServerFn(listSystemUsers);
  const createFn = useServerFn(createSystemUser);
  const setRoleFn = useServerFn(setUserRole);
  const deleteFn = useServerFn(deleteSystemUser);
  const setPasswordFn = useServerFn(setUserPassword);

  const { data: users, isLoading, error } = useQuery({
    queryKey: ["system-users"],
    queryFn: () => listFn(),
  });

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", full_name: "", role: "viewer" as Role });
  const [pwUser, setPwUser] = useState<{ id: string; email: string } | null>(null);
  const [newPassword, setNewPassword] = useState("");

  const createMut = useMutation({
    mutationFn: (data: typeof form) => createFn({ data }),
    onSuccess: () => {
      toast.success("משתמש נוצר");
      setOpen(false);
      setForm({ email: "", password: "", full_name: "", role: "viewer" });
      qc.invalidateQueries({ queryKey: ["system-users"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const roleMut = useMutation({
    mutationFn: ({ user_id, role }: { user_id: string; role: Role }) =>
      setRoleFn({ data: { user_id, role } }),
    onSuccess: () => {
      toast.success("ההרשאה עודכנה");
      qc.invalidateQueries({ queryKey: ["system-users"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (user_id: string) => deleteFn({ data: { user_id } }),
    onSuccess: () => {
      toast.success("המשתמש נמחק");
      qc.invalidateQueries({ queryKey: ["system-users"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const passwordMut = useMutation({
    mutationFn: ({ user_id, password }: { user_id: string; password: string }) =>
      setPasswordFn({ data: { user_id, password } }),
    onSuccess: () => {
      toast.success("הסיסמה עודכנה");
      setPwUser(null);
      setNewPassword("");
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (error) {
    return (
      <div className="glass-strong rounded-3xl p-8 text-center">
        <ShieldAlert className="size-10 mx-auto text-destructive mb-3" />
        <h2 className="text-lg font-semibold">אין גישה</h2>
        <p className="text-sm text-muted-foreground mt-1">
          רק משתמשים עם הרשאת <b>ניהול</b> יכולים לנהל משתמשים.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">משתמשי מערכת</h2>
          <p className="text-sm text-muted-foreground">ניהול חשבונות והרשאות</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-l from-primary to-accent text-primary-foreground">
              <UserPlus className="size-4" /> משתמש חדש
            </Button>
          </DialogTrigger>
          <DialogContent dir="rtl">
            <DialogHeader>
              <DialogTitle>יצירת משתמש חדש</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>שם מלא</Label>
                <Input
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                />
              </div>
              <div>
                <Label>אימייל</Label>
                <Input
                  type="email"
                  dir="ltr"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div>
                <Label>סיסמה ראשונית</Label>
                <Input
                  type="text"
                  dir="ltr"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </div>
              <div>
                <Label>הרשאה</Label>
                <Select
                  value={form.role}
                  onValueChange={(v) => setForm({ ...form, role: v as Role })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">ניהול (מלא)</SelectItem>
                    <SelectItem value="editor">עריכה</SelectItem>
                    <SelectItem value="viewer">קריאה בלבד</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={() => createMut.mutate(form)}
                disabled={createMut.isPending}
                className="bg-gradient-to-l from-primary to-accent text-primary-foreground"
              >
                {createMut.isPending ? "יוצר..." : "צור משתמש"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="glass-strong rounded-3xl p-8 text-center text-muted-foreground">טוען...</div>
      ) : (
        <div className="glass-strong rounded-3xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr className="text-right">
                <th className="p-3 font-semibold">שם</th>
                <th className="p-3 font-semibold">אימייל</th>
                <th className="p-3 font-semibold">הרשאה</th>
                <th className="p-3 font-semibold">כניסה אחרונה</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {users?.map((u) => {
                const currentRole: Role = (u.roles[0] as Role) ?? "viewer";
                const meta = roleMeta[currentRole];
                const Icon = meta.icon;
                return (
                  <tr key={u.id} className="border-t border-border/50">
                    <td className="p-3 font-medium">{u.full_name || "—"}</td>
                    <td className="p-3 text-muted-foreground" dir="ltr">{u.email}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs border ${meta.className}`}
                        >
                          <Icon className="size-3" /> {meta.label}
                        </span>
                        <Select
                          value={currentRole}
                          onValueChange={(v) =>
                            roleMut.mutate({ user_id: u.id, role: v as Role })
                          }
                        >
                          <SelectTrigger className="h-8 w-28"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">ניהול</SelectItem>
                            <SelectItem value="editor">עריכה</SelectItem>
                            <SelectItem value="viewer">קריאה</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {u.last_sign_in_at
                        ? new Date(u.last_sign_in_at).toLocaleDateString("he-IL")
                        : "—"}
                    </td>
                    <td className="p-3 text-left">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm(`למחוק את ${u.email}?`)) deleteMut.mutate(u.id);
                        }}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
