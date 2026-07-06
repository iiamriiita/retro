import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // 相對路徑：這樣不管掛在網域根目錄或 /retro/ 子路徑都能正確載入資產
  base: "./",
  plugins: [react()],
});
