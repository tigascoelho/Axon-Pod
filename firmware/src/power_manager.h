#ifndef POWER_MANAGER_H
#define POWER_MANAGER_H

#include <Arduino.h>
#include "config.h"

class PowerManager {
public:
    // ─── Métodos Públicos do Ciclo de Vida ───
    void init();
    void setLowPowerMode();
    void update(uint32_t nowMs);
    void requestState(State state);
    int readBatteryPercent() const;

    // ─── Métodos de Diagnóstico (Úteis para a UI/Main) ───
    State getCurrentState() const { return currentState_; }
    bool isBatteryLow() const;

private:
    // ─── Variáveis de Controlo de Estado e Tempo ───
    State currentState_ = STATE_IDLE;
    uint32_t lastTransitionMs_ = 0;
    uint32_t bootStartMs_ = 0;
};

#endif