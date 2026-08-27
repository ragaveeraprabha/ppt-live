"use client";

import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import PptxViewer from "../components/PptxViewer";

const realtimeServerUrl = process.env.NEXT_PUBLIC_REALTIME_SERVER_URL || "http://localhost:3002";

export default function UserPage() {
  const [slide, setSlide] = useState(1);
  const [presentation, setPresentation] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket = io(realtimeServerUrl);

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on("slide-change", setSlide);
    socket.on("presentation-upload", setPresentation);

    return () => socket.disconnect();
  }, []);

  return (
    <main className="page">
      <div className="header">
        <h1>Live Presentation</h1>
        <p>{connected ? "Connected to the admin" : "Connecting..."}</p>
      </div>

      <section className="presentation-section">
        <h2>{presentation ? presentation.name : "Waiting for a presentation"}</h2>

        <div className="slide">
          {presentation ? <PptxViewer presentation={presentation} activeSlide={slide} /> : <h1>Slide {slide}</h1>}
        </div>

        <p className="message">
          The admin controls the current slide. This view updates automatically.
        </p>

        {presentation && (
          <p className="uploaded-file">
            <a href={presentation.data} download={presentation.name}>
              Open uploaded presentation
            </a>
          </p>
        )}
      </section>
    </main>
  );
}
