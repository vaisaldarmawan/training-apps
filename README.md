# Training Apps 

## Project Structure

Create the following structure:

```
training-apps/
├── docker-compose.yml
└── app/
    ├── Dockerfile
    ├── index.js
    ├── package.json
    ├── .env
    └── .gitignore
```

---

## Create env variable

```
vim .env
```

```
APP_PORT=3000
```
---

## Create `Dockerfile`

```dockerfile
FROM node:18.20-slim
WORKDIR /app
ADD . /app
RUN npm install
EXPOSE 3000
CMD [ "npm", "start" ]
```


---

## Create `docker-compose.yml`

File ini ada di luar folder `app` (di root proyek):

```yaml
name: simple

services:
  app:
    build: ./app
    ports:
      - "5050:3000"
    volumes:
      - vol-simple:/app/public/images/

volumes:
  vol-simple:
```

---


## Build dan Jalankan dengan Docker Compose

Dari root folder (`training-apps`):

```bash
docker compose up -d
```

---

## Cek Status

```bash
docker compose ps
```

Akses aplikasi di browser:
```
http://localhost:5050
```

---


## Perintah Tambahan

Hentikan container:
```bash
docker compose down
```

Hapus container dan volume:
```bash
docker compose down --volumes
```

Rebuild ulang:
```bash
docker compose up -d --build
```

---

💡 **Tips:**
- Jika port `5050` sudah digunakan, ubah di `docker-compose.yml`.
- Volume `vol-simple` bisa kamu lihat dengan:
  ```bash
  docker volume ls
  ```
- Untuk masuk ke container:
  ```bash
  docker compose exec app sh
  ```
