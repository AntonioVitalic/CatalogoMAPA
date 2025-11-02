export interface ComponentImageForm {
  imagen: string;
  descripcion?: string;
  file?: File;
  file_name?: string;
  uploadField?: string;
}

export interface PreparedComponentPayload {
  payload: any[];
  files: { field: string; file: File }[];
}

export type ComponentImagePayloadEntry =
  | { upload_field: string; descripcion: string; file_name: string }
  | { file_name: string; descripcion: string };

export const MEDIA_SEGMENT = '/imagenes/';

export function extractMediaFileName(url?: string): string | undefined {
  if (!url) {
    return undefined;
  }

  if (url.startsWith('blob:') || url.startsWith('data:')) {
    return undefined;
  }

  const base = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';

  try {
    const parsed = new URL(url, base);
    const path = parsed.pathname || '';
    const mediaIndex = path.indexOf(MEDIA_SEGMENT);
    if (mediaIndex !== -1) {
      return path.slice(mediaIndex + MEDIA_SEGMENT.length).replace(/^\/+/, '') || undefined;
    }
    return path.replace(/^\/+/, '') || undefined;
  } catch (err) {
    const mediaIndex = url.indexOf(MEDIA_SEGMENT);
    if (mediaIndex !== -1) {
      return url.slice(mediaIndex + MEDIA_SEGMENT.length).replace(/^\/+/, '') || undefined;
    }
    return url.replace(/^\/+/, '') || undefined;
  }
}

export function prepareComponentPayload(
  components: Array<{ imagenes?: ComponentImageForm[]; [key: string]: any }>
): PreparedComponentPayload {
  const files: { field: string; file: File }[] = [];

  const payload = components.map((component, compIndex) => {
    const { imagenes, ...rest } = component;
    const sanitized: Record<string, any> = { ...rest };

    const normalizedImages: ComponentImagePayloadEntry[] = (imagenes ?? [])
      .map((img, imgIndex) => {
        if (!img) {
          return null;
        }

        const descripcion = img.descripcion ?? '';

        if (img.file) {
          const field = `component_image_${compIndex}_${imgIndex}`;
          files.push({ field, file: img.file });
          return {
            upload_field: field,
            descripcion,
            file_name: img.file.name,
          };
        }

        const fileName = img.file_name ?? extractMediaFileName(img.imagen);
        if (!fileName) {
          return null;
        }

        return {
          file_name: fileName,
          descripcion,
        };
      })
      .filter((entry): entry is ComponentImagePayloadEntry => entry !== null);

    sanitized.imagenes = normalizedImages;
    return sanitized;
  });

  return { payload, files };
}
