# Setup Environment for Transformer Management System
# Run this script in any new PowerShell terminal to set up Maven and Java

Write-Host "Setting up environment variables..." -ForegroundColor Green

# Add Scoop and Maven to PATH
$scoopShims = "$env:USERPROFILE\scoop\shims"
$mavenBin = "$env:USERPROFILE\scoop\apps\maven\current\bin"

if ($env:PATH -notlike "*$scoopShims*") {
    $env:PATH += ";$scoopShims"
    Write-Host "Added Scoop shims to PATH" -ForegroundColor Yellow
}

if ($env:PATH -notlike "*$mavenBin*") {
    $env:PATH += ";$mavenBin"
    Write-Host "Added Maven to PATH" -ForegroundColor Yellow
}

# Set JAVA_HOME
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-21.0.8.9-hotspot"
Write-Host "Set JAVA_HOME to: $env:JAVA_HOME" -ForegroundColor Yellow

# Verify setup
Write-Host "`nVerifying setup..." -ForegroundColor Green
try {
    $javaVersion = java -version 2>&1 | Select-String "version"
    Write-Host "Java: $javaVersion" -ForegroundColor Cyan
    
    $mavenVersion = mvn --version | Select-String "Apache Maven"
    Write-Host "Maven: $mavenVersion" -ForegroundColor Cyan
    
    Write-Host "`n✅ Environment setup complete!" -ForegroundColor Green
    Write-Host "You can now run: mvn spring-boot:run" -ForegroundColor White
} catch {
    Write-Host "❌ Setup failed: $_" -ForegroundColor Red
}