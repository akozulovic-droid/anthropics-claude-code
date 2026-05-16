"use client";

import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      theme="dark"
      position="top-center"
      richColors
      toastOptions={{
        style: {
          background: "hsl(250 18% 9%)",
          border: "1px solid hsl(250 12% 18%)",
          color: "hsl(0 0% 98%)",
        },
      }}
    />
  );
}
