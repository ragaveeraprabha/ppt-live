"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Detect which port we're on and redirect to the appropriate page
    if (typeof window !== "undefined") {
      const port = window.location.port;
      
      // Admin port
      if (port === "5030") {
        router.push("/admin");
      }
      // User port
      else if (port === "5032") {
        router.push("/user");
      }
      // Default to admin if no specific port
      else {
        router.push("/admin");
      }
    }
  }, [router]);

  return null;
}