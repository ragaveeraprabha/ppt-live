"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const port = window.location.port;
    if (port === "5030") {
      router.push("/admin");
    } else if (port === "5031") {
      router.push("/user");
    }
  }, [router]);

  return (
    <main className="home">
      <h1>Loading...</h1>
    </main>
  );
}
