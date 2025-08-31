"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
// import { Separator } from "@/components/ui/separator";
import { useProfileApi } from "@/lib/hooks/use-profile";
import { showErrorToast, showSuccessToast } from "@/lib/utils/toast";
import { useUser } from "@clerk/nextjs";

export default function ProfilePage() {
  const api = useProfileApi();
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPwd, setChangingPwd] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isPwdOpen, setIsPwdOpen] = useState(false);
  // Local editable fields

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [initialName, setInitialName] = useState("");
  const [initialEmail, setInitialEmail] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const me = await api.getMe();
        const nm = me.name || "";
        const em = me.email;
        setName(nm);
        setEmail(em);
        setInitialName(nm);
        setInitialEmail(em);
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Failed to load profile';
        showErrorToast(message);
      } finally {
        setLoading(false);
      }
    })();
  }, [api]);

  const onSave = async () => {
    try {
      setSaving(true);
      await api.updateProfile({ name });
      showSuccessToast("Profile updated");
      setInitialName(name);
      setIsEditing(false);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to update profile';
      showErrorToast(message);
    } finally {
      setSaving(false);
    }
  };

  const onCancel = () => {
    setName(initialName);
    setEmail(initialEmail);
    setIsEditing(false);
  };

  const onChangePassword = async () => {
    if ((!user?.passwordEnabled && (!newPassword || !confirmPassword)) ||
        (user?.passwordEnabled && (!currentPassword || !newPassword || !confirmPassword))) {
      return;
    }
    if (newPassword !== confirmPassword) {
      showErrorToast("Passwords do not match");
      return;
    }
    try {
      setChangingPwd(true);
      if (!user) throw new Error("Not authenticated");
      type PWUser = {
        updatePassword: (args: { newPassword: string; currentPassword?: string; signOutOfOtherSessions?: boolean }) => Promise<unknown>;
        createPassword?: (args: { newPassword: string; signOutOfOtherSessions?: boolean }) => Promise<unknown>;
        passwordEnabled?: boolean;
      };
      const pwUser: PWUser = user as unknown as PWUser;

      if (pwUser.passwordEnabled) {
        await pwUser.updatePassword({ currentPassword, newPassword });
      } else if (typeof pwUser.createPassword === 'function') {
        await pwUser.createPassword({ newPassword });
      } else {
        // Last resort: try updatePassword without currentPassword
        await pwUser.updatePassword({ newPassword });
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
  setIsPwdOpen(false);
      showSuccessToast("Password updated");
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to update password';
      showErrorToast(message);
    } finally {
      setChangingPwd(false);
    }
  };

  return (
    <div className="p-4 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Profile</h1>
        <p className="text-sm opacity-80">Manage your account settings and preferences</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Profile Information</CardTitle>
          <CardDescription>Update your account details and personal information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading || !isEditing}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled
            />
          </div>
          <div className="pt-2 flex items-center gap-3">
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)} disabled={loading}>
                Edit Profile
              </Button>
            ) : (
              <>
                <Button onClick={onSave} disabled={loading || saving || name.trim() === initialName.trim()}>
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
                <Button variant="outline" onClick={onCancel} disabled={loading || saving}>
                  Cancel
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Password</CardTitle>
          <CardDescription>Change your password to keep your account secure</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isPwdOpen ? (
            <div>
              <Button onClick={() => setIsPwdOpen(true)} disabled={loading}>
                Change Password
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {user?.passwordEnabled && (
                <div className="grid gap-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    placeholder="••••••••"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    disabled={loading}
                  />
                </div>
              )}
              <div className="grid gap-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={onChangePassword}
                  disabled={
                    loading ||
                    changingPwd ||
                    (user?.passwordEnabled ? !currentPassword : false) ||
                    !newPassword ||
                    !confirmPassword ||
                    newPassword !== confirmPassword
                  }
                >
                  {changingPwd ? "Confirming..." : "Confirm"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsPwdOpen(false);
                    setCurrentPassword("");
                    setNewPassword("");
                    setConfirmPassword("");
                  }}
                  disabled={changingPwd}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
