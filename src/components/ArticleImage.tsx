import { fetchNoCors } from "@decky/api";
import { useEffect, useRef, useState, type ImgHTMLAttributes } from "react";

type ImageState = { source: string; url?: string; failed: boolean };

const useArticleImage = (src?: string, enabled = true) => {
  const [image, setImage] = useState<ImageState>();

  useEffect(() => {
    setImage(undefined);
    if (!src || !enabled) return;
    let cancelled = false;
    let objectUrl: string | undefined;
    const controller = new AbortController();

    void (async () => {
      try {
        const response = await fetchNoCors(src, { method: "GET", signal: controller.signal });
        if (cancelled) return;
        if (!response.ok) {
          setImage({ source: src, failed: true });
          return;
        }
        const blob = await response.blob();
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setImage({ source: src, url: objectUrl, failed: false });
      } catch {
        if (!cancelled) setImage({ source: src, failed: true });
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src, enabled]);

  return enabled && image?.source === src ? image : undefined;
};

export const useArticleImageSource = (src?: string, enabled = true): string | undefined =>
  useArticleImage(src, enabled)?.url;

export const ArticleImage = ({
  src, onError, loading, width, height, ...props
}: ImgHTMLAttributes<HTMLImageElement>) => {
  const placeholderRef = useRef<HTMLSpanElement>(null);
  const [requestedSource, setRequestedSource] = useState<string>();
  const [failedSource, setFailedSource] = useState<string>();
  const enabled = loading !== "lazy" || requestedSource === src;
  const image = useArticleImage(src, enabled);

  useEffect(() => setRequestedSource(undefined), [src]);

  useEffect(() => {
    if (!src || loading !== "lazy" || requestedSource === src) return;
    const placeholder = placeholderRef.current;
    if (!placeholder) return;
    const Observer = placeholder.ownerDocument.defaultView?.IntersectionObserver;
    if (!Observer) {
      setRequestedSource(src);
      return;
    }
    let cancelled = false;
    const observer = new Observer((entries) => {
      if (!cancelled && entries.some((entry) => entry.isIntersecting)) {
        setRequestedSource(src);
        observer.disconnect();
      }
    }, { root: null, rootMargin: "200px 0px", threshold: 0 });
    observer.observe(placeholder);
    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [src, loading, requestedSource]);

  if (!src || image?.failed || (image?.url && image.url === failedSource)) return null;

  if (!image?.url) {
    const imageWidth = Number(width);
    const imageHeight = Number(height);
    const ratio = Number.isFinite(imageWidth) && imageWidth > 0
      && Number.isFinite(imageHeight) && imageHeight > 0
      ? `${imageWidth} / ${imageHeight}` : "16 / 9";
    return (
      <span ref={placeholderRef} className="sdhq-article-image-placeholder" aria-hidden
        style={{ display: "block", width: "100%", aspectRatio: ratio }} />
    );
  }

  return (
    <img {...props} src={image.url} loading={loading} width={width} height={height}
      onError={(event) => {
        setFailedSource(image.url);
        onError?.(event);
      }} />
  );
};
