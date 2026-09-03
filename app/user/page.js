"use client";

import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import PptxViewer from "../components/PptxViewer";

const realtimeServerUrl =
  typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.hostname}:5033`
    : "http://localhost:5033";

export default function UserPage() {
  const [slide, setSlide] = useState(1);
  const [presentation, setPresentation] = useState(null);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = io(realtimeServerUrl);
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Connected to realtime server:", socket.id);
      setConnected(true);
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from realtime server");
      setConnected(false);
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error.message);
    });

    socket.on("slide-change", (slideNumber) => {
      setSlide(slideNumber);
    });

    socket.on("presentation-upload", (uploadedPresentation) => {
      console.log("Received presentation-upload event:", {
        name: uploadedPresentation?.name,
        dataLength: uploadedPresentation?.data?.length,
      });
      setPresentation(uploadedPresentation);
    });

    return () => socket.disconnect();
  }, []);

  return (
    <main className="page">
      <div className="header">
        <h1>Live Presentation</h1>
        <p>{connected ? "🟢 Connected to the admin" : "🔴 Connecting..."}</p>
      </div>

      <section className="presentation-section">
        <h2>{presentation ? presentation.name : "Waiting for a presentation"}</h2>

        <div className="slide">
          {presentation ? <PptxViewer presentation={presentation} activeSlide={slide} /> : <h1>Slide {slide}</h1>}
        </div>

        <p className="message">
          The admin controls the current slide. This view updates automatically.
        </p>

      </section>
    </main>
  );
}
