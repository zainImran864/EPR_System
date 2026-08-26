"use client";

import { useMutation } from "convex/react";
import type { Id } from "@/convex/_generated/dataModel";
import { accountApi } from "@/app/api/account";
import { useAuthStore } from "@/app/store/useAuthStore";

/** Per-user account/settings actions, all scoped by the session token. */
export function useAccount() {
  const { token } = useAuthStore();

  const updateProfileM = useMutation(accountApi.updateProfile);
  const changePasswordM = useMutation(accountApi.changePassword);
  const setTwoFactorM = useMutation(accountApi.setTwoFactor);
  const setNotificationsM = useMutation(accountApi.setNotifications);
  const genUploadUrlM = useMutation(accountApi.generateUploadUrl);
  const setAvatarM = useMutation(accountApi.setAvatar);
  const setSchoolLogoM = useMutation(accountApi.setSchoolLogo);
  const requestNameChangeM = useMutation(accountApi.requestSchoolNameChange);

  const require = <T,>(fn: () => T): T => {
    if (!token) throw new Error("Not authenticated");
    return fn();
  };

  const updateProfile = (name?: string, phone?: string) =>
    require(() => updateProfileM({ token: token!, name, phone }));

  const changePassword = (currentPassword: string, newPassword: string) =>
    require(() => changePasswordM({ token: token!, currentPassword, newPassword }));

  const setTwoFactor = (enabled: boolean) =>
    require(() => setTwoFactorM({ token: token!, enabled }));

  const setNotifications = (enabled: boolean) =>
    require(() => setNotificationsM({ token: token!, enabled }));

  const requestSchoolNameChange = (requestedValue: string) =>
    require(() => requestNameChangeM({ token: token!, requestedValue }));

  /** Upload a file to Convex storage, then attach it as avatar or school logo. */
  const uploadImage = async (file: File, target: "avatar" | "logo") => {
    if (!token) throw new Error("Not authenticated");
    const uploadUrl = await genUploadUrlM({ token });
    const res = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": file.type },
      body: file,
    });
    const { storageId } = await res.json();
    if (target === "avatar")
      return setAvatarM({ token, storageId: storageId as Id<"_storage"> });
    return setSchoolLogoM({ token, storageId: storageId as Id<"_storage"> });
  };

  return {
    updateProfile,
    changePassword,
    setTwoFactor,
    setNotifications,
    requestSchoolNameChange,
    uploadImage,
  };
}
