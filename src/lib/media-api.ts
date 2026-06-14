import type { ApiResponse } from '@/types';
import { apiUrl } from '@/lib/api-base';
import { ApiError } from '@/lib/api';

export type MediaImage = {
  _id: string;
  userId?: string;
  name: string;
  url: string;
  r2_key: string;
  alt?: string;
  useCase?: string;
  size?: number;
  createdAt?: string;
};

async function parseResponse<T>(res: Response): Promise<T> {
  const json = (await res.json()) as ApiResponse<T>;
  if (!res.ok) {
    throw new ApiError(json.message ?? 'Request failed', res.status);
  }
  return json.data;
}

export async function uploadMedia(
  file: File,
  token: string,
  options?: { alt?: string; useCase?: string },
): Promise<MediaImage> {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('useCase', options?.useCase ?? 'PRODUCT');
  if (options?.alt) formData.append('alt', options.alt);

  const res = await fetch(apiUrl('/api/v1/media'), {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
    credentials: 'include',
  });

  return parseResponse<MediaImage>(res);
}

/** Replace file in R2; MongoDB `_id` stays the same. */
export async function updateMedia(
  mediaId: string,
  file: File,
  token: string,
  options?: { alt?: string; useCase?: string },
): Promise<MediaImage> {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('useCase', options?.useCase ?? 'PRODUCT');
  if (options?.alt) formData.append('alt', options.alt);

  const res = await fetch(apiUrl(`/api/v1/media/${mediaId}`), {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
    credentials: 'include',
  });

  return parseResponse<MediaImage>(res);
}

export async function deleteMedia(mediaId: string, token: string): Promise<void> {
  const res = await fetch(apiUrl(`/api/v1/media/${mediaId}`), {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
    credentials: 'include',
  });

  await parseResponse<null>(res);
}

/** Roll back freshly uploaded images when product create/update fails. */
export async function rollbackUploadedMedia(
  mediaIds: string[],
  token: string,
): Promise<void> {
  await Promise.all(
    mediaIds.map((id) => deleteMedia(id, token).catch(() => undefined)),
  );
}
