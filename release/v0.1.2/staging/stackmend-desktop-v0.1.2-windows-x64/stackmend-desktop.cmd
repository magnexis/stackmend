@echo off
setlocal
cd /d %~dp0
"node_modules\electron\dist\electron.exe" .
