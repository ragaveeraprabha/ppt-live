"use client";

import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import PptxViewer from "../components/PptxViewer";

const realtimeServerUrl = process.env.NEXT_PUBLIC_REALTIME_SERVER_URL || "http://localhost:3002";

export default function AdminPage() {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [slide, setSlide] = useState(1);
  const [slideCount, setSlideCount] = useState(1);
  const [presentation, setPresentation] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = io(realtimeServerUrl);
    socketRef.current = socket;

    socket.on("slide-change", setSlide);
    socket.on("presentation-upload", setPresentation);

    return () => socket.disconnect();
  }, []);

  const uploadPPT = () => {
    if (!file) {
      setMessage("Please select a PPT file.");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const uploadedPresentation = {
        name: file.name,
        type: file.type || "application/octet-stream",
        data: reader.result,
      };

      setPresentation(uploadedPresentation);
      setSlide(1);
      setSlideCount(1);

      const socket = socketRef.current;
      if (socket?.connected) {
        socket.emit("presentation-upload", uploadedPresentation);
      } else {
        socket?.once("connect", () => {
          socket.emit("presentation-upload", uploadedPresentation);
        });
      }
      setMessage("PPT uploaded: " + file.name);
    };

    reader.onerror = () => setMessage("Could not read the PPT file.");
    reader.readAsDataURL(file);
  };

  const previousSlide = () => {
    if (slide > 1) {
      socketRef.current?.emit("change-slide", slide - 1);
    }
  };

  const nextSlide = () => {
    if (slide < slideCount) {
      socketRef.current?.emit("change-slide", slide + 1);
    }
  };

  return (
    <main className="page">

      {/* Header */}

      <div className="header">
        <h1>Admin Page</h1>
        <p>Upload and control the presentation</p>
      </div>

      {/* Upload */}

      <section className="upload-section">

        <h2>Upload PPT</h2>

        <input
          className="file-input"
          type="file"
          accept=".ppt,.pptx"
          onChange={(event) => {
            setFile(event.target.files[0]);
          }}
        />

        <button
          className="button button-primary"
          onClick={uploadPPT}
        >
          Upload PPT
        </button>

        <p className="message">
          {message}
        </p>

        {presentation && (
          <p className="uploaded-file">
            Shared file: <a href={presentation.data} download={presentation.name}>{presentation.name}</a>
          </p>
        )}

      </section>

      {/* Presentation */}

      <section className="presentation-section">

        <h2>Presentation</h2>

        <div className="slide">
          {presentation ? <PptxViewer presentation={presentation} activeSlide={slide} onSlideCount={setSlideCount} /> : <h1>Slide {slide}</h1>}
        </div>

        <div className="controls">

          <button
            className="button button-secondary"
            onClick={previousSlide}
          >
            Previous
          </button>

          <span className="slide-number">
            Slide {slide}
          </span>

          <button
            className="button button-primary"
            onClick={nextSlide}
          >
            Next
          </button>

        </div>

      </section>

    </main>
  );
}