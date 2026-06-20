# Script para instalar Chocolatey, Git, Node.js e dependências

Write-Host "Verificando se o terminal possui privilégios de Administrador..."
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "AVISO: Este script precisa ser executado como Administrador para instalar programas (Chocolatey, Git, Node.js)." -ForegroundColor Red
    Write-Host "Por favor, abra o PowerShell como Administrador e execute este script, ou aceite a solicitação de elevação." -ForegroundColor Yellow
}

# Instala o Chocolatey se não estiver instalado
if (!(Get-Command choco -ErrorAction SilentlyContinue)) {
    Write-Host "Instalando Chocolatey..."
    Set-ExecutionPolicy Bypass -Scope Process -Force
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
    iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
} else {
    Write-Host "Chocolatey já está instalado." -ForegroundColor Green
}

# Atualiza os paths de ambiente na sessão atual
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

# Instala Git
if (!(Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "Instalando Git..."
    choco install git -y
} else {
    Write-Host "Git já está instalado." -ForegroundColor Green
}

# Instala Node.js
if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "Instalando Node.js..."
    choco install nodejs-lts -y
} else {
    Write-Host "Node.js já está instalado." -ForegroundColor Green
}

# Atualiza os paths novamente para garantir que node/npm estão disponíveis
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

# Inicializa o projeto Node se não existir
if (!(Test-Path package.json)) {
    Write-Host "Inicializando projeto NPM (package.json)..."
    
    if (Get-Command npm -ErrorAction SilentlyContinue) {
        npm init -y
        Write-Host "Instalando live-server como dependência de desenvolvimento..."
        npm install --save-dev live-server
        
        # Adiciona o script "dev" no package.json
        $packageJson = Get-Content package.json | ConvertFrom-Json
        if (-not $packageJson.scripts) {
            $packageJson | Add-Member -MemberType NoteProperty -Name "scripts" -Value @{}
        }
        $packageJson.scripts | Add-Member -MemberType NoteProperty -Name "dev" -Value "live-server" -Force
        $packageJson | ConvertTo-Json -Depth 10 | Set-Content package.json
        
        Write-Host "Dependências instaladas com sucesso! Você pode rodar 'npm run dev' em breve." -ForegroundColor Green
    } else {
        Write-Host "NPM ainda não está disponível nesta sessão. Por favor, reinicie o terminal e execute:" -ForegroundColor Yellow
        Write-Host "npm init -y && npm install --save-dev live-server" -ForegroundColor Yellow
    }
} else {
    Write-Host "O arquivo package.json já existe. Instalando dependências de desenvolvimento..."
    if (Get-Command npm -ErrorAction SilentlyContinue) {
        npm install --save-dev live-server
        Write-Host "Dependências instaladas com sucesso!" -ForegroundColor Green
    }
}

Write-Host "Configuração finalizada!" -ForegroundColor Cyan
Write-Host "ATENÇÃO: Você pode precisar FECHAR e ABRIR NOVAMENTE o seu editor/terminal para que todos os comandos (git, node, npm) funcionem perfeitamente." -ForegroundColor Yellow
