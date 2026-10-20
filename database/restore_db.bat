@echo off
REM ============================================================
REM FEFAS Database Restore Script
REM Restores a mysqldump backup file into the specified database.
REM
REM Usage:
REM   restore_db.bat <backup_file.sql>
REM   restore_db.bat <backup_file.sql> faculty_evaluation_db_dev
REM
REM WARNING: This will DROP and recreate all tables in the target
REM database. Make sure you're restoring into the correct database.
REM ============================================================

setlocal

REM ── Validate arguments ─────────────────────────────────────
if "%~1"=="" (
  echo.
  echo Usage: restore_db.bat ^<backup_file.sql^> [database_name]
  echo.
  echo   backup_file.sql  - Path to the mysqldump backup file
  echo   database_name    - Target database (default: faculty_evaluation_db_dev)
  echo.
  exit /b 1
)

set BACKUP_FILE=%~1
if not exist "%BACKUP_FILE%" (
  echo [ERROR] Backup file not found: %BACKUP_FILE%
  exit /b 1
)

REM ── Configuration ──────────────────────────────────────────
set MYSQL_USER=root
set MYSQL_PASS=
set MYSQL_HOST=127.0.0.1
set MYSQL_PORT=3307
set MYSQL_PATH=C:\xampp\mysql\bin\mysql.exe
set DB_NAME=%~2
if "%DB_NAME%"=="" set DB_NAME=faculty_evaluation_db_dev

echo.
echo ============================================================
echo  FEFAS Database Restore
echo ============================================================
echo  Backup:    %BACKUP_FILE%
echo  Database:  %DB_NAME%
echo  Host:      %MYSQL_HOST%:%MYSQL_PORT%
echo ============================================================
echo.
echo [WARNING] This will replace ALL data in "%DB_NAME%".
echo.
set /p CONFIRM="Continue? (y/N): "
if /i not "%CONFIRM%"=="y" (
  echo Aborted.
  exit /b 0
)

REM ── Create database if it doesn't exist ────────────────────
echo Creating database "%DB_NAME%" if it doesn't exist...
if "%MYSQL_PASS%"=="" (
  "%MYSQL_PATH%" -u%MYSQL_USER% -h%MYSQL_HOST% -P%MYSQL_PORT% -e "CREATE DATABASE IF NOT EXISTS `%DB_NAME%` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;" 2>&1
) else (
  "%MYSQL_PATH%" -u%MYSQL_USER% -p%MYSQL_PASS% -h%MYSQL_HOST% -P%MYSQL_PORT% -e "CREATE DATABASE IF NOT EXISTS `%DB_NAME%` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;" 2>&1
)

REM ── Count tables before restore ────────────────────────────
echo.
echo Counting tables before restore...
if "%MYSQL_PASS%"=="" (
  for /f %%a in ('"%MYSQL_PATH%" -u%MYSQL_USER% -h%MYSQL_HOST% -P%MYSQL_PORT% -N -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='%DB_NAME%';" 2^>nul') do set TABLES_BEFORE=%%a
) else (
  for /f %%a in ('"%MYSQL_PATH%" -u%MYSQL_USER% -p%MYSQL_PASS% -h%MYSQL_HOST% -P%MYSQL_PORT% -N -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='%DB_NAME%';" 2^>nul') do set TABLES_BEFORE=%%a
)
echo   Tables before: %TABLES_BEFORE%

REM ── Restore ────────────────────────────────────────────────
echo.
echo Restoring...
if "%MYSQL_PASS%"=="" (
  "%MYSQL_PATH%" -u%MYSQL_USER% -h%MYSQL_HOST% -P%MYSQL_PORT% %DB_NAME% < "%BACKUP_FILE%" 2>&1
) else (
  "%MYSQL_PATH%" -u%MYSQL_USER% -p%MYSQL_PASS% -h%MYSQL_HOST% -P%MYSQL_PORT% %DB_NAME% < "%BACKUP_FILE%" 2>&1
)

if %ERRORLEVEL% NEQ 0 (
  echo [ERROR] Restore failed with exit code %ERRORLEVEL%.
  exit /b 1
)

REM ── Verify: count tables and rows after restore ────────────
echo.
echo Verifying restore...
if "%MYSQL_PASS%"=="" (
  for /f %%a in ('"%MYSQL_PATH%" -u%MYSQL_USER% -h%MYSQL_HOST% -P%MYSQL_PORT% -N -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='%DB_NAME%';" 2^>nul') do set TABLES_AFTER=%%a
) else (
  for /f %%a in ('"%MYSQL_PATH%" -u%MYSQL_USER% -p%MYSQL_PASS% -h%MYSQL_HOST% -P%MYSQL_PORT% -N -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='%DB_NAME%';" 2^>nul') do set TABLES_AFTER=%%a
)
echo   Tables after:  %TABLES_AFTER%

echo.
echo Row counts per table:
if "%MYSQL_PASS%"=="" (
  "%MYSQL_PATH%" -u%MYSQL_USER% -h%MYSQL_HOST% -P%MYSQL_PORT% -e "SELECT table_name AS 'Table', table_rows AS 'Rows' FROM information_schema.tables WHERE table_schema='%DB_NAME%' ORDER BY table_name;" 2>&1
) else (
  "%MYSQL_PATH%" -u%MYSQL_USER% -p%MYSQL_PASS% -h%MYSQL_HOST% -P%MYSQL_PORT% -e "SELECT table_name AS 'Table', table_rows AS 'Rows' FROM information_schema.tables WHERE table_schema='%DB_NAME%' ORDER BY table_name;" 2>&1
)

echo.
echo [OK] Restore completed successfully.
echo.

endlocal
