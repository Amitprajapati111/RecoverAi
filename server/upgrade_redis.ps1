# -------------------------------------------------
# upgrade_redis.ps1 – Upgrade Windows Redis to 7.x
# -------------------------------------------------
# 1️⃣ Download Redis 7.x ZIP (Microsoft archive)
$downloadUrl = "https://github.com/microsoftarchive/redis/releases/download/v7.0.12/Redis-x64-7.0.12.zip"
$zipPath     = "$env:TEMP\redis.zip"
$installDir  = "C:\Program Files\Redis"

Write-Host "Downloading Redis 7.x..."
Invoke-WebRequest -Uri $downloadUrl -OutFile $zipPath -UseBasicParsing

# 2️⃣ Extract
Write-Host "Extracting to $installDir..."
if (Test-Path $installDir) { Remove-Item -Recurse -Force $installDir }
Expand-Archive -Path $zipPath -DestinationPath $installDir

# 3️⃣ Stop existing Redis service (if any)
$serviceName = "Redis"
if (Get-Service -Name $serviceName -ErrorAction SilentlyContinue) {
    Write-Host "Stopping existing Redis service..."
    Stop-Service -Name $serviceName -Force
    & "$installDir\redis-server.exe" --service-uninstall
}

# 4️⃣ Install new Redis service
Write-Host "Installing new Redis service..."
& "$installDir\redis-server.exe" --service-install "$installDir\redis.windows-service.conf" --loglevel verbose

# 5️⃣ Start the service
Start-Service -Name $serviceName
Write-Host "Redis service started."

# 6️⃣ Verify version
$versionInfo = & "$installDir\redis-cli.exe" INFO server | Select-String "redis_version"
Write-Host "✅ Redis version:" $versionInfo.Line.Split(":")[1].Trim()

# 7️⃣ Clean up temporary zip
Remove-Item $zipPath -Force
Write-Host "Upgrade complete. Restart RecoverAI (npm run dev)."
