# 프로젝트 구조 정리 스크립트
# 실행 위치: frontend/src 디렉토리

Write-Host "프로젝트 구조 정리를 시작합니다..." -ForegroundColor Green

# 1. 컴포넌트별 폴더 생성
Write-Host "컴포넌트 폴더를 생성합니다..." -ForegroundColor Yellow
$componentFolders = @("GoalSection", "Divider", "Modal", "Sidebar", "TopMenu")
foreach ($folder in $componentFolders) {
    if (!(Test-Path "components\$folder")) {
        New-Item -ItemType Directory -Path "components\$folder" -Force
        Write-Host "  ✓ components\$folder 폴더 생성" -ForegroundColor Green
    }
}

# 2. styles 폴더 생성
if (!(Test-Path "styles")) {
    New-Item -ItemType Directory -Path "styles" -Force
    Write-Host "  ✓ styles 폴더 생성" -ForegroundColor Green
}

# 3. 파일 이동
Write-Host "파일을 이동합니다..." -ForegroundColor Yellow

# GoalSection 파일 이동
if (Test-Path "components\GoalSection.jsx") {
    Move-Item "components\GoalSection.jsx" "components\GoalSection\index.jsx" -Force
    Write-Host "  ✓ GoalSection.jsx → GoalSection\index.jsx" -ForegroundColor Green
}
if (Test-Path "components\GoalSection.css") {
    Move-Item "components\GoalSection.css" "components\GoalSection\GoalSection.css" -Force
    Write-Host "  ✓ GoalSection.css → GoalSection\GoalSection.css" -ForegroundColor Green
}

# Divider 파일 이동
if (Test-Path "components\Divider.jsx") {
    Move-Item "components\Divider.jsx" "components\Divider\index.jsx" -Force
    Write-Host "  ✓ Divider.jsx → Divider\index.jsx" -ForegroundColor Green
}
if (Test-Path "components\Divider.css") {
    Move-Item "components\Divider.css" "components\Divider\Divider.css" -Force
    Write-Host "  ✓ Divider.css → Divider\Divider.css" -ForegroundColor Green
}

# Modal 파일 이동
if (Test-Path "components\Modal.jsx") {
    Move-Item "components\Modal.jsx" "components\Modal\index.jsx" -Force
    Write-Host "  ✓ Modal.jsx → Modal\index.jsx" -ForegroundColor Green
}
if (Test-Path "components\Modal.css") {
    Move-Item "components\Modal.css" "components\Modal\Modal.css" -Force
    Write-Host "  ✓ Modal.css → Modal\Modal.css" -ForegroundColor Green
}

# Sidebar 파일 이동
if (Test-Path "components\Sidebar.jsx") {
    Move-Item "components\Sidebar.jsx" "components\Sidebar\index.jsx" -Force
    Write-Host "  ✓ Sidebar.jsx → Sidebar\index.jsx" -ForegroundColor Green
}
if (Test-Path "components\Sidebar.css") {
    Move-Item "components\Sidebar.css" "components\Sidebar\Sidebar.css" -Force
    Write-Host "  ✓ Sidebar.css → Sidebar\Sidebar.css" -ForegroundColor Green
}
if (Test-Path "components\SidebarButton.jsx") {
    Move-Item "components\SidebarButton.jsx" "components\Sidebar\SidebarButton.jsx" -Force
    Write-Host "  ✓ SidebarButton.jsx → Sidebar\SidebarButton.jsx" -ForegroundColor Green
}

# TopMenu 파일 이동
if (Test-Path "components\TopMenu.jsx") {
    Move-Item "components\TopMenu.jsx" "components\TopMenu\index.jsx" -Force
    Write-Host "  ✓ TopMenu.jsx → TopMenu\index.jsx" -ForegroundColor Green
}

# 4. index.css를 global.css로 이동
if (Test-Path "index.css") {
    Move-Item "index.css" "styles\global.css" -Force
    Write-Host "  ✓ index.css → styles\global.css" -ForegroundColor Green
}

# 5. import 경로 수정을 위한 안내
Write-Host "`n다음 단계를 진행하세요:" -ForegroundColor Cyan
Write-Host "1. 각 컴포넌트의 import 경로를 수정해야 합니다." -ForegroundColor White
Write-Host "2. main.jsx에서 global.css 경로를 수정해야 합니다." -ForegroundColor White
Write-Host "3. 각 컴포넌트 폴더 내의 CSS import 경로를 수정해야 합니다." -ForegroundColor White

Write-Host "`n프로젝트 구조 정리가 완료되었습니다!" -ForegroundColor Green 