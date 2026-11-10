import { defineConfig } from 'vite'

// Không dùng plugin React: esbuild tự biên dịch JSX với runtime mới (không cần `import React` ở mỗi file).
export default defineConfig({
  esbuild: { jsx: 'automatic' },
})
