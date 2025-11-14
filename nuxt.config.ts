// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    compatibilityDate: '2025-07-15',
    devtools         : {enabled: true},
    modules          : ['@nuxt/ui', '@vueuse/nuxt'],
    css              : ['~/assets/css/main.css'],

    devServer: {
        host: '0.0.0.0'
    },

    runtimeConfig: {
        public: {
            socketServer: process.env.NUXT_SOCKET_SERVER
        }
    }
})
