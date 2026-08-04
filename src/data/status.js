import { reactive } from "vue";

export const beepStatus = reactive({
  online: true,
  discordPing: 38,
  apiLatency: 41,
  uptime30d: 99.94,
  lastRestart: "il y a 6 jours",
  services: [
    { id: "s1", name: "Gateway Discord", status: "ok", detail: "38ms" },
    { id: "s2", name: "API REST", status: "ok", detail: "41ms" },
    { id: "s3", name: "Base de données", status: "ok", detail: "12ms" },
    { id: "s4", name: "Requêtes serveurs (Query)", status: "degraded", detail: "3 serveurs injoignables" },
    { id: "s5", name: "File de commandes", status: "ok", detail: "0 en attente" },
  ],
  incidents: [
    {
      id: "i1",
      date: "2026-07-29",
      title: "Latence élevée sur l'API REST",
      body: "Pic de latence de 8 minutes causé par une migration de base de données. Résolu automatiquement.",
      resolved: true,
    },
    {
      id: "i2",
      date: "2026-07-14",
      title: "Interruption Gateway Discord",
      body: "Coupure côté Discord ayant affecté plusieurs bots simultanément. Reconnexion automatique en 3 minutes.",
      resolved: true,
    },
  ],
});
