#ifndef SESSION_MANAGER_H
#define SESSION_MANAGER_H

#include <Arduino.h>
#include "config.h"
#include "sensor.h"
#include "power_manager.h"
#include "session_recorder.h"

class SessionManager {
public:
    SessionManager(
        PowerManager& powerManager,
        SensorManager& sensorManager,
        SessionRecorder& sessionRecorder
    );

    void init();
    void update(uint32_t nowMs);

    bool startSession();
    bool stopSession();
    void resetSession();

    State getState() const { return currentState_; }
    bool isSessionRunning() const { return sessionRunning_; }
    String getSessionId() const { return currentSessionId_; }
    int readBatteryPercent() const { return powerManager_.readBatteryPercent(); }

    size_t getSessionFileSize();
    File openSessionFile();
    bool hasSessionFile() const;
private:
    String generateSessionId();

    // Dependências
    PowerManager& powerManager_;
    SensorManager& sensorManager_;
    SessionRecorder& sessionRecorder_;

    // Estado da sessão
    State currentState_ = STATE_IDLE;
    bool sessionRunning_ = false;
    uint32_t lastWriteMs_ = 0;

    String currentSessionId_ = "";
    uint16_t sessionCounter_ = 0;
};

#endif