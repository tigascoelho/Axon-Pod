#include "session_manager.h"
#include <LittleFS.h>

#ifndef SYSTEM_DEBUG
#define SYSTEM_DEBUG 1
#endif

#if SYSTEM_DEBUG
#define SYS_LOG(...) Serial.printf(__VA_ARGS__)
#else
#define SYS_LOG(...) do { } while (0)
#endif

namespace {
const char* FILE_PATH = "/jogo.bin";
}

SessionManager::SessionManager(PowerManager& powerManager, SensorManager& sensorManager)
    : powerManager_(powerManager), sensorManager_(sensorManager) {}

void SessionManager::init() {
    // Inicializa o sistema de ficheiros interno do ESP32 (LittleFS)
    if (!LittleFS.begin(true)) {
        Serial.println("[SYS] Erro crítico ao iniciar o LittleFS!");
    }
    currentState_ = STATE_IDLE;
    powerManager_.requestState(currentState_);
}

void SessionManager::update(uint32_t nowMs) {
    // ─── MODO JOGO: Captura e Gravação Ultra-Rápida ───
    if (sessionRunning_ && currentState_ == STATE_IMU_TRACKING) {
        // Verifica se passaram os 10ms da nossa taxa de amostragem de 100Hz
        if (nowMs - lastWriteMs_ >= IMU_PERIOD_MS) {
            IMURecord record;
            record.deltaTime = static_cast<uint16_t>(nowMs - lastWriteMs_);
            
            // Lê dados crús do SensorManager (Subtrações rápidas de int16_t)
            if (sensorManager_.readRawData(record)) {
                if (activeSessionFile_){
                    activeSessionFile_.write(reinterpret_cast<const uint8_t*>(&record), sizeof(IMURecord));
                }
            }
            lastWriteMs_ = nowMs;
        }
    }
}

bool SessionManager::startSession() {
    if (sessionRunning_) return false; // Já estamos a correr um jogo, ignora o comando
    sensorManager_.setLowPowerMode(false); // Acorda o sensor para começar a ler
    sensorManager_.calibrate(); // Calibração rápida antes de começar a gravar

   activeSessionFile_ = LittleFS.open(FILE_PATH, "w");
    
   if (!activeSessionFile_) {
        SYS_LOG("[SYS] Erro ao criar o ficheiro da sessão!\n");
        sensorManager_.setLowPowerMode(true); // Volta o sensor para standby se falhou
        return false;
    }

    currentSessionId_ = generateSessionId();
    const uint32_t nowMs = millis();
    lastWriteMs_ = nowMs;

    sessionRunning_ = true;
    currentState_ = STATE_IMU_TRACKING;

    powerManager_.requestState(STATE_IMU_TRACKING); // Pede ao PowerManager para otimizar o sistema para gravação
    return true;
}

bool SessionManager::stopSession() {
    if (!sessionRunning_ || currentState_ != STATE_IMU_TRACKING) return false;
    

    sessionRunning_ = false;
    if (activeSessionFile_) {
        activeSessionFile_.flush();
        activeSessionFile_.close();
    }

    // Coloca o sensor em standby para poupar energia pós-jogo
    sensorManager_.setLowPowerMode(true);

    const uint32_t nowMs = millis();
    currentState_ = STATE_BLE_SYNC;

    // Pede ao PowerManager para subir o clock da CPU e preparar o rádio BLE
    powerManager_.requestState(STATE_BLE_SYNC);

    SYS_LOG("[SYS] JOGO TERMINADO. Ficheiro guardado com %d bytes.\n", getSessionFileSize());
    return true;
}

void SessionManager::resetSession() {
    sessionRunning_ = false;
    currentSessionId_ = "";
    if (activeSessionFile_) {
        activeSessionFile_.flush();
        activeSessionFile_.close();
    }
    sensorManager_.setLowPowerMode(true);
    if (LittleFS.exists(FILE_PATH)) {
        LittleFS.remove(FILE_PATH);
    }
    const uint32_t nowMs = millis();
    currentState_ = STATE_IDLE;
    powerManager_.requestState(STATE_IDLE);
}

size_t SessionManager::getSessionFileSize() {

    if (sessionRunning_ && activeSessionFile_) {
        return activeSessionFile_.size();
    }
    if (!LittleFS.exists(FILE_PATH)) return 0;
    
    File file = LittleFS.open(FILE_PATH, "r");
    size_t size = file.size();
    file.close();
    return size;
}

String SessionManager::generateSessionId() {
    uint32_t sec = millis() / 1000;
    int hh = (sec / 3600) % 24;
    int mm = (sec / 60) % 60;
    int ss = sec % 60;
    sessionCounter_++;
    char buf[32];
    snprintf(buf, sizeof(buf), "AXON_%02d%02d%02d_%03u", hh, mm, ss, sessionCounter_);
    return String(buf);
}
