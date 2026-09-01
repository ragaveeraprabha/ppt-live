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
        const { init } = await import("pptx-preview");

        // Convert DataURL to ArrayBuffer
        const dataUrl = presentation.data;
        const byteString = atob(dataUrl.split(',')[1]);
        const ab = new ArrayBuffer(byteString.length);
        const view = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          view[i] = byteString.charCodeAt(i);
        }
        const buffer = ab;

        if (cancelled || !viewerRef.current) return;

        const previewer = init(viewerRef.current, {
          width: 960,
          height: 540,
          mode: "slide",
        });
        const pptx = await previewer.preview(buffer);
        previewerRef.current = previewer;
        if (typeof onSlideCount === "function") onSlideCount(pptx.slides.length);
        previewer.renderSingleSlide(Math.max(0, Math.min(activeSlideRef.current - 1, pptx.slides.length - 1)));
      } catch (err) {
        if (!cancelled) {
          console.error("PPT Preview Error:", err);
          setError("This presentation could not be displayed in the browser.");
        }
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
