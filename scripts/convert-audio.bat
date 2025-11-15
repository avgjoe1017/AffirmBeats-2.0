@echo off
REM Audio Optimization Conversion Script (Windows)
REM Converts large WAV files (600+ MB) to optimized 3-minute AAC loops (2-5 MB)
REM
REM Prerequisites:
REM - ffmpeg installed and in PATH
REM - Run from the project root directory

setlocal enabledelayedexpansion

REM Check if ffmpeg is installed
where ffmpeg >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Error: ffmpeg is not installed. Please install ffmpeg first.
    exit /b 1
)

REM Set up directories
set "SCRIPT_DIR=%~dp0"
set "PROJECT_ROOT=%SCRIPT_DIR%.."
set "OUTPUT_DIR=%PROJECT_ROOT%\assets\audio"
set "BINAURAL_DIR=%OUTPUT_DIR%\binaural"
set "SOLFEGGIO_DIR=%OUTPUT_DIR%\solfeggio"

REM Create output directories
if not exist "%BINAURAL_DIR%" mkdir "%BINAURAL_DIR%"
if not exist "%SOLFEGGIO_DIR%" mkdir "%SOLFEGGIO_DIR%"

echo Audio Optimization Conversion Script
echo =====================================
echo.
echo Output directory: %OUTPUT_DIR%
echo.

REM Get the directory containing raw audio files
set "RAW_AUDIO_DIR=%PROJECT_ROOT%\raw audio files"

if not exist "%RAW_AUDIO_DIR%" (
    echo Warning: Raw audio files directory not found: %RAW_AUDIO_DIR%
    echo Please update RAW_AUDIO_DIR in the script or provide it as an argument.
    echo.
    if "%~1"=="" (
        echo Error: No input directory specified.
        exit /b 1
    ) else (
        set "RAW_AUDIO_DIR=%~1"
        echo Using provided directory: %RAW_AUDIO_DIR%
    )
)

set "BINAURAL_SOURCE_DIR=%RAW_AUDIO_DIR%\ZENmix - Pure Binaural Beats"
set "SOLFEGGIO_SOURCE_DIR=%RAW_AUDIO_DIR%\ZENmix - Pure Solfeggio"

echo Source directories:
echo   Binaural: %BINAURAL_SOURCE_DIR%
echo   Solfeggio: %SOLFEGGIO_SOURCE_DIR%
echo.

REM Function to convert a single file
REM Usage: call :convert_file "input" "output" "category"
:convert_file
set "INPUT_FILE=%~1"
set "OUTPUT_FILE=%~2"
set "CATEGORY=%~3"

if not exist "!INPUT_FILE!" (
    echo Warning: Input file not found: !INPUT_FILE!
    goto :eof
)

echo Converting: !INPUT_FILE!
echo   → !OUTPUT_FILE!

ffmpeg -y ^
    -i "!INPUT_FILE!" ^
    -ac 2 ^
    -ar 44100 ^
    -c:a aac ^
    -b:a 128k ^
    -t 180 ^
    "!OUTPUT_FILE!" >nul 2>&1

if exist "!OUTPUT_FILE!" (
    for %%A in ("!OUTPUT_FILE!") do (
        echo   ✓ Created: !OUTPUT_FILE! (%%~zA bytes)
    )
) else (
    echo   ✗ Failed to create: !OUTPUT_FILE!
)
echo.
goto :eof

REM Convert Binaural Beats
if exist "%BINAURAL_SOURCE_DIR%" (
    echo Converting Binaural Beats...
    echo.
    
    call :convert_file "%BINAURAL_SOURCE_DIR%\Binaural Beat - Alpha@10Hz - 400Hz Base.wav" "%BINAURAL_DIR%\alpha_10hz_400_3min.m4a" "alpha"
    call :convert_file "%BINAURAL_SOURCE_DIR%\Binaural Beat - Alpha@12Hz - 120Hz Base.wav" "%BINAURAL_DIR%\alpha_12hz_120_3min.m4a" "alpha"
    
    call :convert_file "%BINAURAL_SOURCE_DIR%\Binaural Beat - Beta@13Hz - 400Hz Base.wav" "%BINAURAL_DIR%\beta_13hz_400_3min.m4a" "beta"
    call :convert_file "%BINAURAL_SOURCE_DIR%\Binaural Beat - Beta@20Hz - 120Hz Base.wav" "%BINAURAL_DIR%\beta_20hz_120_3min.m4a" "beta"
    
    call :convert_file "%BINAURAL_SOURCE_DIR%\Binaural Beat - Delta@1Hz - 100Hz Base.wav" "%BINAURAL_DIR%\delta_1hz_100_3min.m4a" "delta"
    call :convert_file "%BINAURAL_SOURCE_DIR%\Binaural Beat - Delta@2Hz - 120Hz Base.wav" "%BINAURAL_DIR%\delta_2hz_120_3min.m4a" "delta"
    call :convert_file "%BINAURAL_SOURCE_DIR%\Binaural Beat - Delta@4Hz - 400Hz Base.wav" "%BINAURAL_DIR%\delta_4hz_400_3min.m4a" "delta"
    
    call :convert_file "%BINAURAL_SOURCE_DIR%\Binaural Beat - Gamma@38Hz - 100Hz Base.wav" "%BINAURAL_DIR%\gamma_38hz_100_3min.m4a" "gamma"
    call :convert_file "%BINAURAL_SOURCE_DIR%\Binaural Beat - Gamma@40Hz - 120Hz Base.wav" "%BINAURAL_DIR%\gamma_40hz_120_3min.m4a" "gamma"
    call :convert_file "%BINAURAL_SOURCE_DIR%\Binaural Beat - Gamma@42Hz - 400Hz Base.wav" "%BINAURAL_DIR%\gamma_42hz_400_3min.m4a" "gamma"
    
    call :convert_file "%BINAURAL_SOURCE_DIR%\Binaural Beat - Theta@4Hz - 400Hz Base.wav" "%BINAURAL_DIR%\theta_4hz_400_3min.m4a" "theta"
    call :convert_file "%BINAURAL_SOURCE_DIR%\Binaural Beat - Theta@8Hz - 120Hz Base.wav" "%BINAURAL_DIR%\theta_8hz_120_3min.m4a" "theta"
) else (
    echo Warning: Binaural beats directory not found: %BINAURAL_SOURCE_DIR%
)

echo.

REM Convert Solfeggio Tones
if exist "%SOLFEGGIO_SOURCE_DIR%" (
    echo Converting Solfeggio Tones...
    echo.
    
    call :convert_file "%SOLFEGGIO_SOURCE_DIR%\Solfeggio 174hz.wav" "%SOLFEGGIO_DIR%\solfeggio_174_3min.m4a" "solfeggio"
    call :convert_file "%SOLFEGGIO_SOURCE_DIR%\Solfeggio 285hz.wav" "%SOLFEGGIO_DIR%\solfeggio_285_3min.m4a" "solfeggio"
    call :convert_file "%SOLFEGGIO_SOURCE_DIR%\Solfeggio 396hz.wav" "%SOLFEGGIO_DIR%\solfeggio_396_3min.m4a" "solfeggio"
    call :convert_file "%SOLFEGGIO_SOURCE_DIR%\Solfeggio 40hz.wav" "%SOLFEGGIO_DIR%\solfeggio_40_3min.m4a" "solfeggio"
    call :convert_file "%SOLFEGGIO_SOURCE_DIR%\Solfeggio 417hz.wav" "%SOLFEGGIO_DIR%\solfeggio_417_3min.m4a" "solfeggio"
    call :convert_file "%SOLFEGGIO_SOURCE_DIR%\Solfeggio 432hz.wav" "%SOLFEGGIO_DIR%\solfeggio_432_3min.m4a" "solfeggio"
    call :convert_file "%SOLFEGGIO_SOURCE_DIR%\Solfeggio 528hz.wav" "%SOLFEGGIO_DIR%\solfeggio_528_3min.m4a" "solfeggio"
    call :convert_file "%SOLFEGGIO_SOURCE_DIR%\Solfeggio 639hz.wav" "%SOLFEGGIO_DIR%\solfeggio_639_3min.m4a" "solfeggio"
    call :convert_file "%SOLFEGGIO_SOURCE_DIR%\Solfeggio 741hz.wav" "%SOLFEGGIO_DIR%\solfeggio_741_3min.m4a" "solfeggio"
    call :convert_file "%SOLFEGGIO_SOURCE_DIR%\Solfeggio 852hz.wav" "%SOLFEGGIO_DIR%\solfeggio_852_3min.m4a" "solfeggio"
    call :convert_file "%SOLFEGGIO_SOURCE_DIR%\Solfeggio 963hz.wav" "%SOLFEGGIO_DIR%\solfeggio_963_3min.m4a" "solfeggio"
) else (
    echo Warning: Solfeggio directory not found: %SOLFEGGIO_SOURCE_DIR%
)

echo.
echo =====================================
echo Conversion Complete!
echo.
echo Optimized files are in: %OUTPUT_DIR%
echo.
echo Next steps:
echo 1. Verify all files were created successfully
echo 2. Update src/utils/audioFiles.ts to use the new file names
echo 3. Test audio playback in the app
echo 4. Remove references to old 600MB+ WAV files
echo.

endlocal

