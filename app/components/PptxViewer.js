"use client";

import { useEffect, useRef, useState } from "react";

export default function PptxViewer({ presentation, activeSlide = 1, onSlideCount }) {
  const viewerRef = useRef(null);
  const previewerRef = useRef(null);
  const activeSlideRef = useRef(activeSlide);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
      if (!presentation || !viewerRef.current) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");
      previewerRef.current = null;
      viewerRef.current.replaceChildren();

      try {
        console.log("=== Starting renderPresentation ===");
        console.log("Presentation object:", {
          name: presentation.name,
          dataLength: presentation.data?.length,
          dataStart: presentation.data?.substring(0, 50),
        });

        // Import pptx-preview
        let PptxPreview;
        try {
          PptxPreview = await import("pptx-preview");
          console.log("pptx-preview imported successfully");
        } catch (importErr) {
          throw new Error("Failed to load pptx-preview library: " + importErr.message);
        }

        const { init } = PptxPreview;
        if (!init) {
          throw new Error("pptx-preview init function not found");
        }

        // Convert DataURL to ArrayBuffer
        const dataUrl = presentation.data;
        if (!dataUrl || typeof dataUrl !== "string") {
          throw new Error("Invalid presentation data: " + typeof dataUrl);
        }

        console.log("Converting DataURL to ArrayBuffer, length:", dataUrl.length);
        
        const parts = dataUrl.split(',');
        if (parts.length !== 2) {
          throw new Error(`Invalid DataURL format (expected 2 parts, got ${parts.length})`);
        }
        
        const byteString = atob(parts[1]);
        const ab = new ArrayBuffer(byteString.length);
        const view = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          view[i] = byteString.charCodeAt(i);
        }
        const buffer = ab;
        console.log("ArrayBuffer created, length:", buffer.byteLength);

        if (cancelled || !viewerRef.current) {
          console.log("Cancelled or viewerRef not available, returning");
          return;
        }

        console.log("Initializing previewer...");
        const previewer = init(viewerRef.current, {
          width: 960,
          height: 540,
          mode: "slide",
        });
        console.log("PptxPreview initialized successfully");
        
        console.log("Loading presentation...");
        const pptx = await previewer.preview(buffer);
        console.log("✓ Presentation loaded successfully, slides:", pptx.slides.length);
        
        if (!cancelled) {
          previewerRef.current = previewer;
          if (typeof onSlideCount === "function") {
            onSlideCount(pptx.slides.length);
            console.log("onSlideCount called with:", pptx.slides.length);
          }
          const slideToRender = Math.max(0, Math.min(activeSlideRef.current - 1, pptx.slides.length - 1));
          previewer.renderSingleSlide(slideToRender);
          console.log("Rendered slide:", slideToRender);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("❌ PPT Preview Error:", err);
          console.error("Error message:", err.message);
          console.error("Error stack:", err.stack);
          setError("❌ Error loading PPT: " + err.message);
          setLoading(false);
        }
      }
    }

    renderPresentation();

    return () => {
      cancelled = true;
    };
  }, [onSlideCount, presentation]);

  return (
    <>
      {!presentation && (
        <div className="ppt-viewer">
          <h1>Waiting for a presentation</h1>
        </div>
      )}
      {presentation && loading && (
        <div className="ppt-viewer">
          <h2>Loading presentation...</h2>
        </div>
      )}
      {error && (
        <div style={{
          padding: "15px",
          backgroundColor: "#f8d7da",
          color: "#721c24",
          border: "1px solid #f5c6cb",
          borderRadius: "5px",
          margin: "10px 0",
          fontSize: "14px",
          fontWeight: "bold"
        }}>
          {error}
        </div>
      )}
      <div ref={viewerRef} className="ppt-viewer">
        {/* Content will be rendered here by pptx-preview */}
      </div>
    </>
  );
}
