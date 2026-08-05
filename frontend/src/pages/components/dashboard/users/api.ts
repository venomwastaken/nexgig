// Thin wrappers around the proposed `/admin/users*` endpoints. None of these exist on
// the backend yet — see `backend/ADMIN_USERS_API_TODO.md`. Every function below takes
// the caller's `useApi()` instance so it stays a plain function (not a hook) and can be
// called from event handlers.

import type { AxiosInstance } from "axios";
import {
  AdminAccountStatus,
  AdminRole,
  AdminUser,
  AdminUserListResponse,
  ApiAdminUser,
  BulkAction,
  mapApiAdminUser,
  SortField,
  SortOrder,
} from "./types";

export interface ListUsersParams {
  q?: string;
  status?: AdminAccountStatus | "all";
  role?: AdminRole | "all";
  sort: SortField;
  order: SortOrder;
  limit: number;
  offset: number;
}

export async function fetchUsers(
  api: AxiosInstance,
  params: ListUsersParams
): Promise<{ users: AdminUser[]; total: number }> {
  const res = await api.get<AdminUserListResponse>("/admin/users", {
    params: {
      q: params.q || undefined,
      status: params.status && params.status !== "all" ? params.status : undefined,
      role: params.role && params.role !== "all" ? params.role : undefined,
      sort: params.sort,
      order: params.order,
      limit: params.limit,
      offset: params.offset,
    },
  });
  return { users: res.data.items.map(mapApiAdminUser), total: res.data.total };
}

export async function fetchUserDetail(api: AxiosInstance, userId: string): Promise<AdminUser> {
  const res = await api.get<ApiAdminUser>(`/admin/users/${userId}`);
  return mapApiAdminUser(res.data);
}

export interface UpdateUserPayload {
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
}

export async function updateUser(
  api: AxiosInstance,
  userId: string,
  payload: UpdateUserPayload
): Promise<AdminUser> {
  const res = await api.patch<ApiAdminUser>(`/admin/users/${userId}`, {
    username: payload.username,
    email: payload.email,
    first_name: payload.firstName,
    last_name: payload.lastName,
  });
  return mapApiAdminUser(res.data);
}

export async function setUserRole(
  api: AxiosInstance,
  userId: string,
  role: AdminRole
): Promise<AdminUser> {
  const res = await api.patch<ApiAdminUser>(`/admin/users/${userId}/role`, { role });
  return mapApiAdminUser(res.data);
}

export async function banUser(
  api: AxiosInstance,
  userId: string,
  reason?: string
): Promise<AdminUser> {
  const res = await api.post<ApiAdminUser>(`/admin/users/${userId}/ban`, { reason });
  return mapApiAdminUser(res.data);
}

export async function unbanUser(api: AxiosInstance, userId: string): Promise<AdminUser> {
  const res = await api.post<ApiAdminUser>(`/admin/users/${userId}/unban`);
  return mapApiAdminUser(res.data);
}

export interface SuspendPayload {
  reason?: string;
  durationHours?: number;
}

export async function suspendUser(
  api: AxiosInstance,
  userId: string,
  payload: SuspendPayload
): Promise<AdminUser> {
  const res = await api.post<ApiAdminUser>(`/admin/users/${userId}/suspend`, {
    reason: payload.reason,
    duration_hours: payload.durationHours,
  });
  return mapApiAdminUser(res.data);
}

export async function unsuspendUser(api: AxiosInstance, userId: string): Promise<AdminUser> {
  const res = await api.post<ApiAdminUser>(`/admin/users/${userId}/unsuspend`);
  return mapApiAdminUser(res.data);
}

export async function deleteUser(api: AxiosInstance, userId: string): Promise<void> {
  await api.delete(`/admin/users/${userId}`);
}

export async function sendPasswordReset(api: AxiosInstance, userId: string): Promise<void> {
  await api.post(`/admin/users/${userId}/reset-password`);
}

export interface BulkActionPayload {
  userIds: string[];
  action: BulkAction;
  reason?: string;
  durationHours?: number;
  role?: AdminRole;
}

export async function performBulkAction(
  api: AxiosInstance,
  payload: BulkActionPayload
): Promise<void> {
  await api.post("/admin/users/bulk", {
    user_ids: payload.userIds,
    action: payload.action,
    reason: payload.reason,
    duration_hours: payload.durationHours,
    role: payload.role,
  });
}
