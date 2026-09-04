"use client";

import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import PptxViewer from "../components/PptxViewer";

export default function AdminPage() {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [slide, setSlide] = useState(1);
  const [slideCount, setSlideCount] = useState(1);
  const [presentation, setPresentation] = useState(null);
  const [jumpSlide, setJumpSlide] = useState("");
  const [socketConnected, setSocketConnected] = useState(false);
  const [uploading, setUploading] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = io(
      `${window.location.protocol}//${window.location.hostname}:5031`,
      { auth: { role: "admin" } }
    );

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("✓ Connected to realtime server:", socket.id);
      setSocketConnected(true);
      setMessage("Connected to realtime server");
    });

    socket.on("connect_error", (error) => {
      console.error("✗ Socket connection error:", error);
      setSocketConnected(false);
      setMessage("❌ Could not connect to realtime server: " + error.message);
    });

    socket.on("slide-change", (slideNumber) => {
      console.log("Slide changed to:", slideNumber);
      setSlide(slideNumber);
    });

    socket.on("presentation-upload", (uploadedPresentation) => {
      console.log("Received presentation-upload event:", {
        name: uploadedPresentation?.name,
        dataLength: uploadedPresentation?.data?.length,
      });
      setPresentation(uploadedPresentation);
      setMessage("✓ PPT received! Rendering slides...");
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from realtime server");
      setSocketConnected(false);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const uploadPPT = () => {
    if (!file) {
      setMessage("❌ Please select a PPT file.");
      return;
    }

    setUploading(true);
    setMessage("📤 Reading file...");
    console.log("=== Upload Starting ===");
    console.log("File selected:", { name: file.name, size: file.size, type: file.type });

    const reader = new FileReader();

    reader.onload = () => {
      console.log("✓ File read successfully, size:", reader.result.length);
      
      const uploadedPresentation = {
        name: file.name,
        type: file.type || "application/octet-stream",
        data: reader.result,
      };

      console.log("Presentation object created:", {
        name: uploadedPresentation.name,
        type: uploadedPresentation.type,
        dataLength: uploadedPresentation.data?.length,
      });

      console.log("Setting local presentation state...");
      setPresentation(uploadedPresentation);
      setSlide(1);
      setSlideCount(1);

      const socket = socketRef.current;

      if (!socket) {
        console.error("Socket not available");
        setMessage("❌ Realtime server connection is not available.");
        setUploading(false);
        return;
      }

      console.log("Socket status - Connected:", socket.connected);

      if (socket.connected) {
        console.log("✓ Socket connected, emitting presentation-upload event...");
        setMessage("📤 Uploading to realtime server...");
        socket.emit("presentation-upload", uploadedPresentation);
        setMessage("✓ PPT uploaded: " + file.name);
        setUploading(false);
      } else {
        console.log("Socket not connected yet, waiting for connection...");
        setMessage("⏳ Waiting for realtime server connection...");

        socket.once("connect", () => {
          console.log("✓ Socket connected after waiting, emitting presentation-upload event...");
          setMessage("📤 Uploading to realtime server...");
          socket.emit("presentation-upload", uploadedPresentation);
          setMessage("✓ PPT uploaded: " + file.name);
          setUploading(false);
        });

        // Timeout if connection takes too long
        setTimeout(() => {
          if (uploading) {
            console.error("Connection timeout");
            setMessage("❌ Connection timeout. Check that the server is running on port 5031.");
            setUploading(false);
          }
        }, 5000);
      }
    };

    reader.onerror = (error) => {
      console.error("FileReader error:", error);
      setMessage("❌ Could not read the PPT file: " + error.message);
      setUploading(false);
    };

    reader.onprogress = (event) => {
      const percent = Math.round((event.loaded / event.total) * 100);
      console.log("File reading progress:", percent + "%");
      setMessage("📤 Reading file: " + percent + "%");
    };

    console.log("Starting to read file:", file.name);
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

  const goToSlide = () => {
    const slideNum = parseInt(jumpSlide, 10);

    if (slideNum && slideNum > 0 && slideNum <= slideCount) {
      socketRef.current?.emit("change-slide", slideNum);
      setJumpSlide("");
    } else {
      setMessage(
        `Please enter a slide number between 1 and ${slideCount}`
      );
    }
  };

  return (
    <main className="page">

      <div className="header">
        <h1>Admin Page</h1>
        <p>Upload and control the presentation</p>
        <p style={{
          marginTop: "10px",
          padding: "8px 12px",
          borderRadius: "4px",
          fontSize: "14px",
          backgroundColor: socketConnected ? "#d4edda" : "#f8d7da",
          color: socketConnected ? "#155724" : "#721c24",
          fontWeight: "bold"
        }}>
          {socketConnected ? "🟢 Connected to Realtime Server" : "🔴 Disconnected from Realtime Server"}
        </p>
      </div>

      <section className="upload-section">
        <h2>Upload PPT</h2>

        <input
          className="file-input"
          type="file"
          accept=".pptx"
          onChange={(event) => {
            setFile(event.target.files?.[0] || null);
          }}
        />

        <button
          className="button button-primary"
          onClick={uploadPPT}
          disabled={!file || uploading}
        >
          {uploading ? "⏳ Uploading..." : "Upload PPT"}
        </button>

        <p className="message">
          {message}
        </p>
      </section>

      <section className="presentation-section">
        <h2>Presentation</h2>

        <div className="slide">
          {presentation ? (
            <PptxViewer
              presentation={presentation}
              activeSlide={slide}
              onSlideCount={setSlideCount}
            />
          ) : (
            <h1>Slide {slide}</h1>
          )}
        </div>

        <div className="slide-controls">
          <div className="controls">

            <button
              className="button button-secondary"
              onClick={previousSlide}
              disabled={slide <= 1}
            >
              ← Previous
            </button>

            <div className="slide-info">

              <span className="slide-number">
                Slide {slide} of {slideCount}
              </span>

              <div className="jump-slide-section">
                <input
                  type="number"
                  min="1"
                  max={slideCount}
                  value={jumpSlide}
                  onChange={(e) => setJumpSlide(e.target.value)}
                  placeholder="Go to slide..."
                  className="slide-input"
                />

                <button
                  className="button button-primary button-small"
                  onClick={goToSlide}
                >
                  Go
                </button>
              </div>

            </div>

            <button
              className="button button-primary"
              onClick={nextSlide}
              disabled={slide >= slideCount}
            >
              Next →
            </button>

          </div>
        </div>
      </section>

    </main>
  );
}