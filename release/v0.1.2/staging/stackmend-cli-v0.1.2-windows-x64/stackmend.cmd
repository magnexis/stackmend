@echo off
setlocal
cd /d %~dp0
node apps\cli\dist\apps\cli\src\index.js %*
