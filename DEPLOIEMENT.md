# Tuto — Déployer une modification du site sur le VPS

Même circuit que pour le bot : de ton PC jusqu'au serveur qui tourne sur
le VPS, en passant par GitHub.

Dépôt GitHub : https://github.com/MrIllian/Site-WEB

## Vue d'ensemble

```
Ton PC (modif code) → git commit → git push → GitHub
                                                  │
                                                  ▼
                    VPS (/srv/Site-WEB) → git pull → systemctl restart beep-web
```

---

## 1. Sur ton PC — modifier et envoyer le code

```bash
git status
git diff
git add <fichiers modifiés>
git commit -m "Description courte du changement"
git push origin main
```

Évite `git add .` si tu n'es pas sûr de ce qu'il y a dans le dossier —
`.env` (secrets Discord) est censé être ignoré par `.gitignore`, mais
vérifie toujours avant de push.

---

## 2. Sur le VPS — récupérer et redémarrer

```bash
cd /srv/Site-WEB
git pull
sudo systemctl restart beep-web
sudo systemctl status beep-web
```

Logs en direct (utile si le serveur crash au démarrage) :

```bash
sudo journalctl -u beep-web -f
```

`Ctrl+C` pour quitter les logs.

---

## 3. Installer le service systemd (première fois seulement)

```bash
sudo cp deploy/beep-web.service /etc/systemd/system/beep-web.service
sudo systemctl daemon-reload
sudo systemctl enable --now beep-web
sudo systemctl status beep-web
```

Le fichier `deploy/beep-web.service` suppose :
- le code sur `/srv/Site-WEB`
- un `.env` déjà rempli à cet endroit (voir `.env.example`)
- `node` accessible via `/usr/bin/node` — vérifier avec `which node` et
  ajuster `ExecStart` dans le `.service` si le chemin diffère

---

## 4. Points d'attention

- **Ne jamais commit le fichier `.env`** — il contient le Client Secret
  Discord et la clé de signature des sessions.
- Après toute modification de `deploy/beep-web.service` sur le VPS :
  `sudo systemctl daemon-reload` puis `sudo systemctl restart beep-web`.
- `git pull` peut échouer s'il y a des modifications locales sur le VPS
  qui n'existent pas sur GitHub. `git status` sur le VPS indiquera quoi
  faire (en général `git stash` avant le `pull`).
