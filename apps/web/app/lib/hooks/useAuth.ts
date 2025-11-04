"use client";

import { useSession } from "next-auth/react";

export function useAuth() {
  const { data: session, status } = useSession();

  const user = session?.user;
  const tenantId = user?.tenantId || null;
  const role = user?.role || null;
  const isAuthenticated = status === "authenticated";
  const isLoading = status === "loading";
  const isAdmin = role === "admin" || role === "owner";
  const isOwner = role === "owner";

  return {
    user,
    tenantId,
    role,
    isAuthenticated,
    isLoading,
    isAdmin,
    isOwner,
    session,
    status,
  };
}
