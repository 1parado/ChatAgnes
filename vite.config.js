import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// 静态部署：使用相对 base，确保在 GitHub Pages 子路径下也能正常加载资源
export default defineConfig({
  base: './',
  plugins: [vue()]
})
