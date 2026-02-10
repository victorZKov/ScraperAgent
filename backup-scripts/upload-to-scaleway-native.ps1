# Upload Backup to ScaleWay Object Storage (Native PowerShell version)
# Uses native PowerShell HTTP requests instead of AWS CLI

param(
    [string]$ConfigFile = "$PSScriptRoot\.env.backup",
    [string]$BackupFile
)

# Load environment variables
if (Test-Path $ConfigFile) {
    Get-Content $ConfigFile | ForEach-Object {
        if ($_ -match '^([^#][^=]+)=(.+)$') {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($name, $value, "Process")
        }
    }
} else {
    Write-Error "Configuration file not found: $ConfigFile"
    exit 1
}

if (!$BackupFile -or !(Test-Path $BackupFile)) {
    Write-Error "Backup file not found: $BackupFile"
    exit 1
}

$fileName = Split-Path $BackupFile -Leaf
$s3Key = "backups/$fileName"

Write-Host "Uploading backup to ScaleWay Object Storage..."
Write-Host "Bucket: $($env:SCALEWAY_BUCKET)"
Write-Host "File: $fileName"

# Function to create AWS4 signature
function Get-AWS4Signature {
    param(
        [string]$AccessKey,
        [string]$SecretKey,
        [string]$Region,
        [string]$Service,
        [string]$Method,
        [string]$Endpoint,
        [string]$Path,
        [hashtable]$Headers,
        [byte[]]$Payload
    )

    $algorithm = "AWS4-HMAC-SHA256"
    $dateStamp = (Get-Date).ToUniversalTime().ToString("yyyyMMdd")
    $amzDate = (Get-Date).ToUniversalTime().ToString("yyyyMMddTHHmmssZ")

    # Create canonical request
    $canonicalUri = $Path
    $canonicalQueryString = ""
    $canonicalHeaders = ""
    $signedHeaders = ""

    $sortedHeaders = $Headers.GetEnumerator() | Sort-Object Name
    foreach ($header in $sortedHeaders) {
        $canonicalHeaders += "$($header.Name.ToLower()):$($header.Value)`n"
        $signedHeaders += "$($header.Name.ToLower());"
    }
    $signedHeaders = $signedHeaders.TrimEnd(';')

    $payloadHash = if ($Payload) {
        $sha256 = [System.Security.Cryptography.SHA256]::Create()
        $hashBytes = $sha256.ComputeHash($Payload)
        [System.BitConverter]::ToString($hashBytes).Replace("-", "").ToLower()
    } else {
        "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    }

    $canonicalRequest = "$Method`n$canonicalUri`n$canonicalQueryString`n$canonicalHeaders`n$signedHeaders`n$payloadHash"

    # Create string to sign
    $credentialScope = "$dateStamp/$Region/$Service/aws4_request"
    $sha256CR = [System.Security.Cryptography.SHA256]::Create()
    $canonicalRequestHash = [System.BitConverter]::ToString($sha256CR.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($canonicalRequest))).Replace("-", "").ToLower()
    $stringToSign = "$algorithm`n$amzDate`n$credentialScope`n$canonicalRequestHash"

    # Calculate signature
    $kDate = [System.Security.Cryptography.HMACSHA256]::new([System.Text.Encoding]::UTF8.GetBytes("AWS4$SecretKey")).ComputeHash([System.Text.Encoding]::UTF8.GetBytes($dateStamp))
    $kRegion = [System.Security.Cryptography.HMACSHA256]::new($kDate).ComputeHash([System.Text.Encoding]::UTF8.GetBytes($Region))
    $kService = [System.Security.Cryptography.HMACSHA256]::new($kRegion).ComputeHash([System.Text.Encoding]::UTF8.GetBytes($Service))
    $kSigning = [System.Security.Cryptography.HMACSHA256]::new($kService).ComputeHash([System.Text.Encoding]::UTF8.GetBytes("aws4_request"))
    $signature = [System.BitConverter]::ToString([System.Security.Cryptography.HMACSHA256]::new($kSigning).ComputeHash([System.Text.Encoding]::UTF8.GetBytes($stringToSign))).Replace("-", "").ToLower()

    return @{
        Authorization = "$algorithm Credential=$AccessKey/$credentialScope, SignedHeaders=$signedHeaders, Signature=$signature"
        AmzDate = $amzDate
    }
}

try {
    $endpoint = "s3.$($env:SCALEWAY_REGION).scw.cloud"
    $url = "https://$endpoint/$($env:SCALEWAY_BUCKET)/$s3Key"

    # Read file content
    $fileContent = [System.IO.File]::ReadAllBytes($BackupFile)
    $fileSize = $fileContent.Length / 1MB

    Write-Host "File size: $([math]::Round($fileSize, 2)) MB"
    Write-Host "Uploading to: $url"

    # Create headers
    $headers = @{
        "Host" = $endpoint
        "x-amz-content-sha256" = [System.BitConverter]::ToString([System.Security.Cryptography.SHA256]::Create().ComputeHash($fileContent)).Replace("-", "").ToLower()
    }

    # Get signature
    $sig = Get-AWS4Signature -AccessKey $env:SCALEWAY_ACCESS_KEY -SecretKey $env:SCALEWAY_SECRET_KEY `
        -Region $env:SCALEWAY_REGION -Service "s3" -Method "PUT" -Endpoint $endpoint `
        -Path "/$($env:SCALEWAY_BUCKET)/$s3Key" -Headers $headers -Payload $fileContent

    $headers["Authorization"] = $sig.Authorization
    $headers["x-amz-date"] = $sig.AmzDate

    # Upload file
    $response = Invoke-WebRequest -Uri $url -Method Put -Headers $headers -Body $fileContent -UseBasicParsing

    if ($response.StatusCode -eq 200) {
        Write-Host "Upload completed successfully!"
    } else {
        throw "Upload failed with status code: $($response.StatusCode)"
    }

    # Note: Cleanup of old backups would require listing objects which is complex with native PowerShell
    # For now, we'll skip this feature in the native version
    Write-Host "Note: Automatic cleanup of old backups requires AWS CLI"

} catch {
    Write-Error "Upload failed: $_"
    Write-Host "Response: $($_.Exception.Response)"
    exit 1
}

# Clean up local old backups
Write-Host "Cleaning up local old backups..."
$cutoffDate = (Get-Date).AddDays(-[int]$env:BACKUP_RETENTION_DAYS)
$localBackups = Get-ChildItem -Path $env:BACKUP_LOCAL_PATH -Filter "postgres_backup_*.dump" -ErrorAction SilentlyContinue |
    Where-Object { $_.LastWriteTime -lt $cutoffDate }

foreach ($backup in $localBackups) {
    Write-Host "Deleting local backup: $($backup.Name)"
    Remove-Item $backup.FullName -Force
}

Write-Host "Local cleanup completed!"
