import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    nitro: true,
    server: {
      entry: "server",
      preset: "vercel", // 🔥 ADD THIS
    },
  },
  vite: {
    // optional but helps avoid adapter conflicts
    ssr: {
      noExternal: ["@tanstack/react-start"],
    },
  },
});