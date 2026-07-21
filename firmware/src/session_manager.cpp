#include "session_manager.h"


#ifndef SYSTEM_DEBUG
#define SYSTEM_DEBUG 1
#endif

#if SYSTEM_DEBUG
#define SYS_LOG(...) Serial.printf(__VA_ARGS__)
#else
#define SYS_LOG(...) do { } while (0)
#endif

SessionManager::SessionManager(PowerManager& powerManager, SensorManager& sensorManager, SessionRecorder& sessionRecorder)
    : powerManager_(powerManager), sensorManager_(sensorManager), sessionRecorder_(sessionRecorder) {}

void SessionManager::init() {
    
    if (!sessionRecorder_.init()) {
        Serial.println("[SYS] Erro crítico ao iniciar o SessionRecorder!");
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
                if (!sessionRecorder_.record(record)) {
                    SYS_LOG("[SYS] Erro ao gravar dados da sessão!\n");
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
  
    if (!sessionRecorder_.startRecording()) {
        SYS_LOG("[SYS] Erro ao criar o ficheiro da sessão!\n");
        sensorManager_.setLowPowerMode(true); // Volta o sensor para standby se falhou
        return false;
    }

    currentSessionId_ = generateSessionId();
    lastWriteMs_ = millis();

    sessionRunning_ = true;
    currentState_ = STATE_IMU_TRACKING;

    powerManager_.requestState(STATE_IMU_TRACKING); // Pede ao PowerManager para otimizar o sistema para gravação
    SYS_LOG("[SYS] JOGO INICIADO.\n");
    return true;
}

bool SessionManager::stopSession() {
    if (!sessionRunning_ || currentState_ != STATE_IMU_TRACKING) 
        return false;
    

    sessionRunning_ = false;
    sessionRecorder_.stopRecording();
    sensorManager_.setLowPowerMode(true);

    currentState_ = STATE_BLE_SYNC;
    powerManager_.requestState(STATE_BLE_SYNC);

    SYS_LOG("[SYS] JOGO TERMINADO. Ficheiro guardado com %d bytes.\n", getSessionFileSize());
    return true;
}

void SessionManager::resetSession() {
    
    sessionRunning_ = false;
    currentSessionId_ = "";
    sessionRecorder_.reset();
    sensorManager_.setLowPowerMode(true);
   
    currentState_ = STATE_IDLE;
    powerManager_.requestState(STATE_IDLE);
}

size_t SessionManager::getSessionFileSize() {

    return sessionRecorder_.size();
}

File SessionManager::openSessionFile() {
    return sessionRecorder_.openForReading();
}

bool SessionManager::hasSessionFile() const {
    return sessionRecorder_.exists();
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
