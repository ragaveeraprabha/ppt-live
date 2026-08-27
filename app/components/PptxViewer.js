"use client";

import { useEffect, useRef, useState } from "react";

export default function PptxViewer({ presentation, activeSlide = 1, onSlideCount }) {
  const viewerRef = useRef(null);
  const previewerRef = useRef(null);
  const activeSlideRef = useRef(activeSlide);
  const [error, setError] = useState("");

  useEffect(() => {
    activeSlideRef.current = activeSlide;
    if (!previewerRef.current || activeSlide < 1) return;

    const slideCount = previewerRef.current.pptx?.slides.length || 0;
    if (activeSlide <= slideCount) {
      previewerRef.current.renderSingleSlide(activeSlide - 1);
    }
  }, [activeSlide]);

  useEffect(() => {
    let cancelled = false;

    async function renderPresentation() {
      if (!presentation || !viewerRef.current) return;

      setError("");
      previewerRef.current = null;
      viewerRef.current.replaceChildren();

      try {
        const [{ init }, response] = await Promise.all([
          import("pptx-preview"),
          fetch(presentation.data),
        ]);
        const buffer = await response.arrayBuffer();

        if (cancelled || !viewerRef.current) return;

        const width = Math.max(320, viewerRef.current.clientWidth);
        const previewer = init(viewerRef.current, {
          width,
          height: Math.round(width * 9 / 16),
          mode: "slide",
        });
        const pptx = await previewer.preview(buffer);
        previewerRef.current = previewer;
        if (typeof onSlideCount === "function") onSlideCount(pptx.slides.length);
        previewer.renderSingleSlide(Math.max(0, Math.min(activeSlideRef.current - 1, pptx.slides.length - 1)));
      } catch {
        if (!cancelled) setError("This presentation could not be displayed in the browser.");
      }
    }

    renderPresentation();

    return () => {
      cancelled = true;
    };
  }, [onSlideCount, presentation]);

  return (
    <div ref={viewerRef} className="ppt-viewer">
      {!presentation && <h1>Waiting for a presentation</h1>}
      {error && <p className="message">{error}</p>}
    </div>
  );
}
