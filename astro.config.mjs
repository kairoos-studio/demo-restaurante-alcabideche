// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  // Site estático: sem adaptadores, sem serviços externos.
  output: 'static',
  devToolbar: { enabled: false },
});
