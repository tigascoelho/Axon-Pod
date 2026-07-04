#ifndef SESSION_MANAGER_H
#define SESSION_MANAGER_H

#include <Arduino.h>
#include <LittleFS.h>
#include "config.h"
#include "sensor.h"       // Trocado pelo novo SensorManager
#include "power_manager.h"

class SessionManager {
public:
    // Construtor atualizado com o novo SensorManager
    SessionManager(PowerManager& powerManager, SensorManager& sensorManager);

    void init();
    void update(uint32_t nowMs);

    // Controlo manual da sessão (comandos que virão via BLE da App)
    bool startSession();
    bool stopSession();
    void resetSession();

    // Diagnósticos para o Main loop
    State getState() const { return currentState_; }
    bool isSessionRunning() const { return sessionRunning_; }
    String getSessionId() const { return currentSessionId_; }
    int readBatteryPercent() const { return powerManager_.readBatteryPercent(); }
    
    // Retorna o tamanho atual do ficheiro gravado (útil para a barra de progresso na App)
    size_t getSessionFileSize(); 

private:
    String generateSessionId();

    // Referências dos teus gestores de hardware
    PowerManager& powerManager_;
    SensorManager& sensorManager_;

    // Variáveis de controlo internas
    State currentState_ = STATE_IDLE;
    bool sessionRunning_ = false;
    uint32_t lastWriteMs_ = 0;
    
    String currentSessionId_ = "";
    uint16_t sessionCounter_ = 0;

    File activeSessionFile_; // Handle para o ficheiro atual da sessão
};

#endif