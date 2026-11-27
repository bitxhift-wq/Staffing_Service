import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { DEFAULT_SITE_URL, renderBodyTags, renderHeadTags } from './src/seo.ts';
/**
 * Injects the SEO <head> (title, description, canonical, Open Graph, Twitter, JSON-LD,
 * analytics placeholders) into index.html for both `vite dev` and `vite build`.
 * Content lives in src/seo.ts so the HTML, the React app and the prerender share one source.
 */
function seoHtmlPlugin(mode) {
    return {
        name: 'smrikaam-seo-html',
        transformIndexHtml(html) {
            const env = loadEnv(mode, process.cwd(), 'VITE_');
            const siteUrl = (env.VITE_SITE_URL || DEFAULT_SITE_URL).replace(/\/$/, '');
            const analytics = {
                gtmId: env.VITE_GTM_ID,
                ga4Id: env.VITE_GA4_MEASUREMENT_ID,
                gscToken: env.VITE_GOOGLE_SITE_VERIFICATION
            };
            return html
                .replace('<!--seo:head-->', renderHeadTags({ siteUrl, pathname: '/', analytics }))
                .replace('<!--seo:body-->', renderBodyTags(analytics));
        }
    };
}
export default defineConfig(({ mode }) => ({
    plugins: [react(), seoHtmlPlugin(mode)],
    server: {
        port: 5173,
        host: '127.0.0.1',
        watch: {
            ignored: ['**/.tmp-*/**', '**/test-artifacts/**', '**/*.png', '**/*.jpg']
        }
    }
}));
