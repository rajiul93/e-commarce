import { rollbackUploadedMedia, updateMedia, uploadMedia } from '@/lib/media-api';
import type { useProductGallery } from '@/hooks/use-product-gallery';
import type { useProductThumbnail } from '@/hooks/use-product-thumbnail';

type Gallery = ReturnType<typeof useProductGallery>;
type Thumbnail = ReturnType<typeof useProductThumbnail>;

export type ResolvedProductImages = {
  thumbnail?: string | null;
  gallery: string[];
  newUploadedIds: string[];
};

/** Create flow: upload thumbnail + gallery pending files. */
export async function resolveProductImagesForCreate(
  thumbnail: Thumbnail,
  gallery: Gallery,
  token: string,
  alt: string,
): Promise<ResolvedProductImages> {
  const newUploadedIds: string[] = [];

  try {
    let thumbnailId: string | undefined;

    if (thumbnail.selectedFile) {
      const uploaded = await uploadMedia(thumbnail.selectedFile, token, { alt, useCase: 'PRODUCT' });
      newUploadedIds.push(uploaded._id);
      thumbnailId = uploaded._id;
    }

    const galleryIds: string[] = [];
    for (const pending of gallery.pendingItems) {
      const uploaded = await uploadMedia(pending.file, token, { alt, useCase: 'PRODUCT' });
      newUploadedIds.push(uploaded._id);
      galleryIds.push(uploaded._id);
    }

    return { thumbnail: thumbnailId, gallery: galleryIds, newUploadedIds };
  } catch (err) {
    await rollbackUploadedMedia(newUploadedIds, token);
    throw err;
  }
}

/** Edit flow: update/replace thumbnail in-place, resolve gallery ids. */
export async function resolveProductImagesForUpdate(
  thumbnail: Thumbnail,
  gallery: Gallery,
  token: string,
  alt: string,
): Promise<ResolvedProductImages> {
  const newUploadedIds: string[] = [];

  try {
    let thumbnailId: string | null | undefined;

    if (thumbnail.removed) {
      thumbnailId = null;
    } else if (thumbnail.selectedFile) {
      if (thumbnail.existingImageId) {
        await updateMedia(thumbnail.existingImageId, thumbnail.selectedFile, token, {
          alt,
          useCase: 'PRODUCT',
        });
        thumbnailId = thumbnail.existingImageId;
      } else {
        const uploaded = await uploadMedia(thumbnail.selectedFile, token, { alt, useCase: 'PRODUCT' });
        newUploadedIds.push(uploaded._id);
        thumbnailId = uploaded._id;
      }
    } else if (thumbnail.existingImageId) {
      thumbnailId = thumbnail.existingImageId;
    } else {
      thumbnailId = undefined;
    }

    const galleryIds: string[] = [];

    for (const item of gallery.existingItems) {
      if (gallery.removedIds.has(item.id)) continue;
      const replacement = gallery.replacements.find((r) => r.mediaId === item.id);
      if (replacement) {
        await updateMedia(item.id, replacement.file, token, { alt, useCase: 'PRODUCT' });
      }
      galleryIds.push(item.id);
    }

    for (const pending of gallery.pendingItems) {
      const uploaded = await uploadMedia(pending.file, token, { alt, useCase: 'PRODUCT' });
      newUploadedIds.push(uploaded._id);
      galleryIds.push(uploaded._id);
    }

    return { thumbnail: thumbnailId, gallery: galleryIds, newUploadedIds };
  } catch (err) {
    await rollbackUploadedMedia(newUploadedIds, token);
    throw err;
  }
}

export { rollbackUploadedMedia } from '@/lib/media-api';

/** Upload or replace a single optional image (e.g. Open Graph). */
export async function resolveSingleImageForCreate(
  image: Thumbnail,
  token: string,
  alt: string,
): Promise<{ id?: string; newUploadedIds: string[] }> {
  if (!image.selectedFile) {
    return { newUploadedIds: [] };
  }

  const newUploadedIds: string[] = [];
  try {
    const uploaded = await uploadMedia(image.selectedFile, token, { alt, useCase: 'BANNER' });
    newUploadedIds.push(uploaded._id);
    return { id: uploaded._id, newUploadedIds };
  } catch (err) {
    await rollbackUploadedMedia(newUploadedIds, token);
    throw err;
  }
}

export async function resolveSingleImageForUpdate(
  image: Thumbnail,
  token: string,
  alt: string,
): Promise<{ id?: string | null; newUploadedIds: string[] }> {
  const newUploadedIds: string[] = [];

  try {
    if (image.removed) {
      return { id: null, newUploadedIds };
    }

    if (image.selectedFile) {
      if (image.existingImageId) {
        await updateMedia(image.existingImageId, image.selectedFile, token, {
          alt,
          useCase: 'BANNER',
        });
        return { id: image.existingImageId, newUploadedIds };
      }

      const uploaded = await uploadMedia(image.selectedFile, token, { alt, useCase: 'BANNER' });
      newUploadedIds.push(uploaded._id);
      return { id: uploaded._id, newUploadedIds };
    }

    if (image.existingImageId) {
      return { id: image.existingImageId, newUploadedIds };
    }

    return { newUploadedIds };
  } catch (err) {
    await rollbackUploadedMedia(newUploadedIds, token);
    throw err;
  }
}
