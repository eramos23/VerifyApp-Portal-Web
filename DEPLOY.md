# Guía de Despliegue en AWS EC2 (Directo con Node.js & PM2)

Esta guía detalla los pasos para desplegar "VerifyApp Monitor" directamente en una instancia EC2 (Ubuntu/Amazon Linux) usando Node.js y PM2.

## Prerrequisitos

1.  **Instancia EC2**: Ubuntu 22.04 (recomendado) o Amazon Linux 2023.
2.  **Dominio**: `monitor.verifyapp.nexiestudio.com` apuntando a la IP pública.
3.  **Puertos**: Asegúrate de que el Security Group permita tráfico en puertos 80 (HTTP), 443 (HTTPS) y 22 (SSH).

## Pasos de Instalación

### 1. Instalar Node.js (v18+)

Conéctate por SSH y ejecuta:

```bash
# Instalar NVM (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc

# Instalar Node.js 18 (o la versión que uses)
nvm install 18
nvm use 18
nvm alias default 18

# Verificar instalación
node -v
npm -v
```

### 2. Instalar PM2 (Gestor de Procesos)

PM2 mantendrá la aplicación corriendo en segundo plano y la reiniciará si falla.

```bash
npm install -g pm2
```

### 3. Preparar el Proyecto

Sube tu código al servidor (git clone o SCP).
Supongamos que la app está en `~/verify-monitor`.

```bash
cd ~/verify-monitor

# Instalar dependencias
npm install

# Crear archivo .env
nano .env
```
Pega tus variables de entorno:
```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_key_anonima
NEXT_PUBLIC_APP_URL=https://monitor.verifyapp.nexiestudio.com
```

### 4. Construir la Aplicación

```bash
npm run build
```

### 5. Iniciar con PM2

```bash
pm2 start npm --name "verify-monitor" -- start
# O si prefieres ejecutar el script de start directamente:
# pm2 start npm --name "verify-monitor" -- run start
```

Para que PM2 inicie con el sistema:
```bash
pm2 save
pm2 startup
# Copia y pega el comando que te muestre la terminal
```

### 6. Configurar Nginx y SSL

Usaremos Nginx para recibir el tráfico web y pasarlo a la app (Reverse Proxy).

```bash
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx
```

#### Configurar Bloque de Servidor
Edita la configuración:
```bash
sudo nano /etc/nginx/sites-available/default
```

Reemplaza el contenido con:

```nginx
server {
    server_name monitor.verifyapp.nexiestudio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### Reiniciar y Certificar
```bash
sudo systemctl restart nginx
sudo certbot --nginx -d monitor.verifyapp.nexiestudio.com
```

¡Listo! Tu aplicación debería estar en línea.
