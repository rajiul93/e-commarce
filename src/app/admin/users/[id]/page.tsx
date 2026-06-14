'use client';

import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';
import { uploadMedia } from '@/lib/media-api';
import { useAuthStore } from '@/stores/auth-store';
import type { UserProfile, UserProfileImage } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

function resolveProfileImage(profileImage?: UserProfileImage | string): UserProfileImage | null {
  if (!profileImage || typeof profileImage === 'string') return null;
  if (profileImage.url) return profileImage;
  return null;
}

export default function AdminUserManagePage() {
  const params = useParams<{ id: string }>();
  const userId = params.id;
  const token = useAuthStore((s) => s.accessToken);
  const currentUser = useAuthStore((s) => s.user);
  const router = useRouter();
  const queryClient = useQueryClient();
  const isAdmin = currentUser?.role === 'ADMIN';

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [nid, setNid] = useState('');
  const [password, setPassword] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (currentUser && !isAdmin) {
      router.replace('/admin/users');
    }
  }, [currentUser, isAdmin, router]);

  const userQuery = useQuery({
    queryKey: ['admin', 'user', userId],
    queryFn: () => apiFetch<UserProfile>(`/api/v1/user/admin/${userId}`, { token }),
    enabled: !!token && !!userId && isAdmin,
  });

  useEffect(() => {
    const user = userQuery.data;
    if (!user) return;
    setName(user.name);
    setPhone(user.phone ?? '');
    setNid(user.nid ?? '');
    setPassword('');
    setImageFile(null);
    setRemoveImage(false);
  }, [userQuery.data]);

  const save = useMutation({
    mutationFn: async () => {
      const body: Record<string, unknown> = {};
      const user = userQuery.data;
      if (!user) throw new Error('User not loaded');

      const trimmedName = name.trim();
      if (trimmedName && trimmedName !== user.name) {
        body.name = trimmedName;
      }

      const trimmedPhone = phone.trim();
      if (trimmedPhone !== (user.phone ?? '')) {
        body.phone = trimmedPhone || null;
      }

      const trimmedNid = nid.trim();
      if (trimmedNid !== (user.nid ?? '')) {
        body.nid = trimmedNid || null;
      }

      if (password.trim()) {
        body.password = password.trim();
      }

      if (removeImage) {
        body.profileImageId = null;
      } else if (imageFile && token) {
        const uploaded = await uploadMedia(imageFile, token, {
          useCase: 'USER',
          alt: `${trimmedName || user.name} profile`,
        });
        body.profileImageId = uploaded._id;
      }

      if (Object.keys(body).length === 0) {
        throw new Error('No changes to save');
      }

      return apiFetch<UserProfile>(`/api/v1/user/admin/${userId}`, {
        method: 'PATCH',
        token,
        body: JSON.stringify(body),
      });
    },
    onSuccess: () => {
      setPassword('');
      setImageFile(null);
      setRemoveImage(false);
      setMessage('User updated');
      queryClient.invalidateQueries({ queryKey: ['admin', 'user', userId] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'staff'] });
    },
    onError: (err: Error) => setMessage(err.message),
  });

  if (currentUser && !isAdmin) {
    return <p className="text-sm text-zinc-500">Redirecting…</p>;
  }

  if (userQuery.isLoading) {
    return <p className="text-sm text-zinc-500">Loading…</p>;
  }

  if (userQuery.isError || !userQuery.data) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-red-600">User not found.</p>
        <Link href="/admin/users" className="text-sm text-blue-600 hover:underline">
          Back to users
        </Link>
      </div>
    );
  }

  const user = userQuery.data;
  const existingImage = resolveProfileImage(user.profileImage);
  const previewUrl = imageFile
    ? URL.createObjectURL(imageFile)
    : removeImage
      ? null
      : existingImage?.url ?? null;

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <Link href="/admin/users" className="text-sm text-zinc-500 hover:text-zinc-800">
          ← Back to users
        </Link>
        <h1 className="mt-2 text-2xl font-bold">Manage user</h1>
        <p className="text-sm text-zinc-500">
          {user.email} · {user.role}
        </p>
      </div>

      {message ? <p className="text-sm text-zinc-600">{message}</p> : null}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
        className="space-y-5 rounded-xl border border-zinc-200 p-4"
      >
        <div className="space-y-2">
          <span className="text-sm font-medium">Profile image</span>
          <div className="flex items-center gap-4">
            {previewUrl ? (
              <div className="relative h-20 w-20 overflow-hidden rounded-full border border-zinc-200">
                <Image src={previewUrl} alt="Profile" fill className="object-cover" unoptimized />
              </div>
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full border border-dashed border-zinc-300 text-xs text-zinc-400">
                No image
              </div>
            )}
            <div className="space-y-2">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  setImageFile(file);
                  if (file) setRemoveImage(false);
                }}
                className="block text-sm"
              />
              {existingImage && !imageFile ? (
                <button
                  type="button"
                  onClick={() => setRemoveImage((v) => !v)}
                  className="text-sm text-red-600 hover:underline"
                >
                  {removeImage ? 'Undo remove' : 'Remove image'}
                </button>
              ) : null}
            </div>
          </div>
        </div>

        <label className="block space-y-1 text-sm">
          <span className="font-medium">Name</span>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2"
          />
        </label>

        <label className="block space-y-1 text-sm">
          <span className="font-medium">Phone</span>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2"
          />
        </label>

        <label className="block space-y-1 text-sm">
          <span className="font-medium">NID</span>
          <input
            value={nid}
            onChange={(e) => setNid(e.target.value)}
            placeholder="National ID number"
            maxLength={32}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2"
          />
        </label>

        <label className="block space-y-1 text-sm">
          <span className="font-medium">New password</span>
          <input
            type="password"
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Leave blank to keep current password"
            className="w-full rounded-lg border border-zinc-300 px-3 py-2"
          />
        </label>

        <Button type="submit" disabled={save.isPending}>
          {save.isPending ? 'Saving…' : 'Save changes'}
        </Button>
      </form>
    </div>
  );
}
