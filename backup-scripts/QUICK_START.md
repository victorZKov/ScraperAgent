# Guía Rápida de Configuración

## Pasos para Activar el Sistema de Backups

### 1️⃣ Obtén tus Credenciales de ScaleWay

1. Ve a: https://console.scaleway.com/
2. Menú lateral → **Identity and Access Management (IAM)**
3. **API Keys** → **Generate API Key**
4. Dale un nombre: "ScraperAgent Backups"
5. Permisos necesarios: **Object Storage**
6. Copia y guarda:
   - **Access Key ID**
   - **Secret Key**

### 2️⃣ Configura las Credenciales

Edita el archivo `.env.backup` en este directorio:

```bash
# Reemplaza estos valores:
SCALEWAY_ACCESS_KEY=tu_access_key_aqui      # ← Pega tu Access Key
SCALEWAY_SECRET_KEY=tu_secret_key_aqui      # ← Pega tu Secret Key
SCALEWAY_BUCKET=scraperagent-backups        # ← Nombre del bucket (se creará automáticamente)
```

### 3️⃣ Ejecuta el Setup

Abre **PowerShell como Administrador**:

```powershell
cd e:\api.scraperagent.eu\ScraperAgent\backup-scripts
.\setup-backup.ps1
```

El script:
- ✅ Instalará AWS CLI (si es necesario)
- ✅ Validará tu configuración
- ✅ Creará el bucket en ScaleWay
- ✅ Ejecutará un backup de prueba
- ✅ Programará backups cada 8 horas

### 4️⃣ ¡Listo!

El sistema está configurado. Los backups se ejecutarán automáticamente cada 8 horas.

## Comandos Útiles

### Ejecutar backup ahora
```powershell
.\run-backup.ps1
```

### Ver backups disponibles
```powershell
.\restore-backup.ps1 -ListBackups
```

### Restaurar último backup
```powershell
.\restore-backup.ps1 -Latest
```

## ¿Necesitas Ayuda?

Lee la documentación completa en [README.md](./README.md)
