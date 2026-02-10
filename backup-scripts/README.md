# ScraperAgent Backup System

Sistema automatizado de backups incrementales para PostgreSQL con almacenamiento en ScaleWay Object Storage.

## Características

- ✅ Backups automáticos cada 8 horas
- ✅ Compresión de backups (formato custom de PostgreSQL)
- ✅ Subida automática a ScaleWay Object Storage (S3-compatible)
- ✅ Rotación automática de backups (retención configurable)
- ✅ Scripts de restauración incluidos
- ✅ Logging de operaciones

## Requisitos

- Windows con PowerShell 5.1+
- Docker Desktop
- AWS CLI (se instala automáticamente con setup-backup.ps1)
- Cuenta de ScaleWay con Object Storage habilitado

## Configuración Inicial

### 1. Obtener Credenciales de ScaleWay

1. Ve a [ScaleWay Console](https://console.scaleway.com/)
2. Navega a **Identity and Access Management (IAM)**
3. Crea un nuevo **API Key** con permisos de Object Storage
4. Guarda tu **Access Key** y **Secret Key**

### 2. Configurar Credenciales

Edita el archivo `.env.backup` y actualiza los siguientes valores:

```bash
# ScaleWay Object Storage Credentials
SCALEWAY_ACCESS_KEY=tu_access_key_de_scaleway
SCALEWAY_SECRET_KEY=tu_secret_key_de_scaleway
SCALEWAY_REGION=nl-ams
SCALEWAY_BUCKET=scraperagent-backups

# Backup Configuration
BACKUP_RETENTION_DAYS=30  # Días de retención de backups
```

### 3. Ejecutar Setup

Abre PowerShell **como Administrador** y ejecuta:

```powershell
cd e:\api.scraperagent.eu\ScraperAgent\backup-scripts
.\setup-backup.ps1
```

Este script:
- Instala AWS CLI si no está presente
- Valida la configuración
- Ejecuta un backup de prueba
- Crea una tarea programada de Windows

## Uso

### Backup Manual

Para ejecutar un backup manualmente:

```powershell
.\run-backup.ps1
```

### Ejecutar Tarea Programada Manualmente

```powershell
Start-ScheduledTask -TaskName "ScraperAgent-Backup"
```

### Ver Estado de la Tarea Programada

```powershell
Get-ScheduledTask -TaskName "ScraperAgent-Backup" | Get-ScheduledTaskInfo
```

### Listar Backups Disponibles

```powershell
.\restore-backup.ps1 -ListBackups
```

### Restaurar Último Backup

```powershell
.\restore-backup.ps1 -Latest
```

### Restaurar Backup Específico

```powershell
.\restore-backup.ps1 -BackupFile "postgres_backup_20260210_143022.sql.gz"
```

## Estructura de Archivos

```
backup-scripts/
├── .env.backup              # Configuración y credenciales
├── backup-postgres.ps1      # Script de backup de PostgreSQL
├── upload-to-scaleway.ps1   # Script de subida a ScaleWay
├── run-backup.ps1           # Script principal (ejecuta backup + upload)
├── restore-backup.ps1       # Script de restauración
├── setup-backup.ps1         # Script de instalación inicial
├── backup-log.txt           # Log de operaciones
└── README.md                # Esta documentación
```

## Backups Locales

Los backups también se guardan localmente en:
```
./backups/
```

Los backups locales se limpian automáticamente después de los días configurados en `BACKUP_RETENTION_DAYS`.

## Rotación de Backups

El sistema automáticamente elimina backups antiguos tanto en ScaleWay como localmente:
- Retención: Configurable en `.env.backup` (default: 30 días)
- Se ejecuta después de cada backup
- Mantiene los backups más recientes

## Programación

La tarea programada ejecuta backups:
- **Frecuencia**: Cada 8 horas
- **Primera ejecución**: Inmediatamente después del setup
- **Ejecución**: En segundo plano, incluso si la máquina está en batería

Para modificar la frecuencia, edita la tarea en **Task Scheduler** de Windows o ejecuta de nuevo `setup-backup.ps1` con modificaciones.

## Monitoreo

### Ver Logs

```powershell
Get-Content backup-log.txt -Tail 20
```

### Ver Última Ejecución de la Tarea

```powershell
Get-ScheduledTask -TaskName "ScraperAgent-Backup" | Get-ScheduledTaskInfo
```

### Verificar Backups en ScaleWay

```powershell
# Usando AWS CLI
$env:AWS_ACCESS_KEY_ID="tu_access_key"
$env:AWS_SECRET_ACCESS_KEY="tu_secret_key"
aws s3 ls s3://scraperagent-backups/backups/ --endpoint-url https://s3.nl-ams.scw.cloud
```

## Troubleshooting

### Error: "AWS CLI is not installed"
Ejecuta `setup-backup.ps1` de nuevo o instala manualmente desde:
https://aws.amazon.com/cli/

### Error: "Docker is not running"
Asegúrate de que Docker Desktop está ejecutándose.

### Error de credenciales de ScaleWay
Verifica que:
1. Las credenciales en `.env.backup` son correctas
2. El bucket existe o puede ser creado
3. La región es correcta (nl-ams, fr-par, pl-waw)

### Backup falla pero no muestra error
Revisa `backup-log.txt` para más detalles.

## Seguridad

- ⚠️ El archivo `.env.backup` contiene credenciales sensibles
- Asegúrate de que está en `.gitignore`
- No compartas este archivo
- Considera usar variables de entorno del sistema para credenciales en producción

## Restauración de Desastres

En caso de pérdida total de datos:

1. Reinstala Docker y la aplicación
2. Configura el sistema de backup (pasos 1-3 de arriba)
3. Restaura el último backup:
   ```powershell
   .\restore-backup.ps1 -Latest
   ```

## Soporte

Para problemas o preguntas, contacta al equipo de desarrollo.

---

**Última actualización**: 2026-02-10
