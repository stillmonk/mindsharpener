import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';

// https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  vite: () => ({
    plugins: [tailwindcss()],
  }),
  manifest: ({ browser, manifestVersion }) => ({
    // Nombre y descripción traducidos en public/_locales/<idioma>/messages.json
    name: '__MSG_extName__',
    description: '__MSG_extDescription__',
    default_locale: 'en',
    permissions: ['declarativeNetRequest', 'storage', 'alarms', 'notifications'],
    // Necesario solo para que declarativeNetRequest pueda *redirigir* las webs
    // bloqueadas a nuestra página de foco y para limpiar YouTube.
    // La extensión no lee ni guarda tu navegación.
    host_permissions: ['<all_urls>'],
    web_accessible_resources: [
      {
        resources: ['blocked.html'],
        matches: ['<all_urls>'],
      },
    ],
    action: {
      default_title: '__MSG_extName__',
    },
    // Un solo atajo, fácil de recordar: Alt+Mayús+F («F de foco») abre el popup
    // con el cursor en la tarea; Enter empieza la sesión.
    // En Manifest V2 (Firefox) el comando del popup se llama _execute_browser_action.
    commands: {
      [manifestVersion === 2 ? '_execute_browser_action' : '_execute_action']: {
        suggested_key: { default: 'Alt+Shift+F', mac: 'Alt+Shift+F' },
      },
    },
    ...(browser === 'firefox' && {
      browser_specific_settings: {
        gecko: {
          // No se puede cambiar una vez publicada en addons.mozilla.org.
          id: 'mindsharpener@stillmonk',
          // 140 es la primera versión que entiende data_collection_permissions.
          strict_min_version: '140.0',
          // Obligatorio en AMO: la extensión no recoge ningún dato.
          data_collection_permissions: { required: ['none'] },
        },
      },
    }),
  }),
});
