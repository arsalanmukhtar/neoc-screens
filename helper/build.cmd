@echo off
rem Builds downloads\NEOC-Alert-Helper.exe with the C# compiler that ships with Windows (.NET Framework 4.x).
setlocal
set CSC=%WINDIR%\Microsoft.NET\Framework64\v4.0.30319\csc.exe
if not exist "%CSC%" set CSC=%WINDIR%\Microsoft.NET\Framework\v4.0.30319\csc.exe
if not exist "%CSC%" (
    echo C# compiler not found. .NET Framework 4.x is required.
    exit /b 1
)
cd /d "%~dp0"
if not exist ..\downloads mkdir ..\downloads
"%CSC%" /nologo /codepage:65001 /target:winexe /optimize+ /win32icon:neoc.ico ^
    /reference:System.Web.Extensions.dll ^
    /out:..\downloads\NEOC-Alert-Helper.exe NeocAlertHelper.cs
if errorlevel 1 exit /b 1
echo Built ..\downloads\NEOC-Alert-Helper.exe
