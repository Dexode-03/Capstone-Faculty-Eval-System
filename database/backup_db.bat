@echo off
REM ============================================================
REM FEFAS Database Backup Script
REM Creates a timestamped mysqldump backup of the specified database.
REM
REM Usage:
REM   backup_db.bat                          (uses defaults)
REM   backup_db.bat faculty_evaluation_db    (specify database)
REM
REM Configuration:
REM   Edit the variables below to match your XAMPP/MariaDB setup.
REM ============================================================

setlocal

REM ── Configuration ──────────────────────────────────────────
set MYSQL_USER=root
set MYSQL_PASS=
set MYSQL_HOST=127.0.0.1
set MYSQL_PORT=3307
set DB_NAME=%~1
if "%DB_NAME%"=="" set DB_NAME=faculty_evaluation_db

REM ── Paths ──────────────────────────────────────────────────
set MYSQLDUMP_PATH=C:\xampp\mysql\bin\mysqldump.exe
set BACKUP_DIR=%~dp0backups

REM ── Create backup directory if it doesn't exist ────────────
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

REM ── Generate timestamped filename ──────────────────────────
for /f "tokens=1-3 delims=/ " %%a in ('date /t') do set DATE=%%c-%%a-%%b
for /f "tokens=1-2 delims=: " %%a in ('time /t') do set TIME=%%a%%b
set TIMESTAMP=%DATE%_%TIME%
set BACKUP_FILE=%BACKUP_DIR%\%DB_NAME%_%TIMESTAMP%.sql

REM ── Run mysqldump ──────────────────────────────────────────
echo.
echo ============================================================
echo  FEFAS Database Backup
echo ============================================================
echo  Database:  %DB_NAME%
echo  Host:      %MYSQL_HOST%:%MYSQL_PORT%
echo  Output:    %BACKUP_FILE%
echo ============================================================
echo.

if "%MYSQL_PASS%"=="" (
  "%MYSQLDUMP_PATH%" -u%MYSQL_USER% -h%MYSQL_HOST% -P%MYSQL_PORT% --routines --triggers --single-transaction --add-drop-table %DB_NAME% > "%BACKUP_FILE%" 2>&1
) else (
  "%MYSQLDUMP_PATH%" -u%MYSQL_USER% -p%MYSQL_PASS% -h%MYSQL_HOST% -P%MYSQL_PORT% --routines --triggers --single-transaction --add-drop-table %DB_NAME% > "%BACKUP_FILE%" 2>&1
)

if %ERRORLEVEL% NEQ 0 (
  echo [ERROR] Backup failed with exit code %ERRORLEVEL%.
  echo Check that mysqldump is at: %MYSQLDUMP_PATH%
  echo Check that the database "%DB_NAME%" exists and is accessible.
  del "%BACKUP_FILE%" 2>nul
  exit /b 1
)

REM ── Report results ─────────────────────────────────────────
for %%A in ("%BACKUP_FILE%") do set FILE_SIZE=%%~zA
echo [OK] Backup completed successfully.
echo      File: %BACKUP_FILE%
echo      Size: %FILE_SIZE% bytes
echo.

REM ── Cleanup: keep only the 10 most recent backups ──────────
echo Cleaning up old backups (keeping last 10)...
set /a COUNT=0
for /f "delims=" %%f in ('dir /b /o-d "%BACKUP_DIR%\%DB_NAME%_*.sql" 2^>nul') do (
  set /a COUNT+=1
  if !COUNT! GTR 10 (
    del "%BACKUP_DIR%\%%f"
    echo   Deleted: %%f
  )
)
echo Done.

endlocal
