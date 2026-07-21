#include "power_manager.h"
#include <WiFi.h>
#include <BLEDevice.h> // Trocamos o Wi-Fi pelo Bluetooth

#ifndef SYSTEM_DEBUG
#define SYSTEM_DEBUG 1
#endif

namespace {
constexpr uint32_t STATE_TRANSITION_DELAY_MS = 500;
constexpr bool POWER_DEBUG_LOGS = SYSTEM_DEBUG;
}

void PowerManager::init() {
  // Configuração inicial agressiva de baixo consumo
  setCpuFrequencyMhz(80); 
  
  // Força o Wi-Fi a morrer completamente no hardware e nunca guardar lixo na Flash
  WiFi.persistent(false);
  WiFi.disconnect(true, true);
  WiFi.mode(WIFI_OFF);
  
  // Inicializa variáveis de controlo
  currentState_ = STATE_IDLE;
  bootStartMs_ = millis();
  lastTransitionMs_ = bootStartMs_;
  
  pinMode(BATTERY_PIN, INPUT);
}

void PowerManager::setLowPowerMode() {
  setCpuFrequencyMhz(80);
}

bool PowerManager::isBatteryLow() const {
  return readBatteryPercent() <= 20;
}

// Esta será a tua função principal chamada no loop do main.cpp
void PowerManager::update(uint32_t nowMs) {
  // Se precisares de alguma verificação cíclica (ex: ler bateria a cada X segundos), entra aqui.
  // Já não precisas de reconciliar estados complexos de Wi-Fi a cada milissegundo!
}

void PowerManager::requestState(State newState) {
  if (newState == currentState_) return;
  
  uint32_t nowMs = millis();
  if (nowMs - lastTransitionMs_ < STATE_TRANSITION_DELAY_MS) return;

  if (POWER_DEBUG_LOGS) {
    Serial.printf("[Power FSM] transição de estado: %d -> %d\n", static_cast<int>(currentState_), static_cast<int>(newState));
  }

  // ─── A Nova Máquina de Estados de Energia ───
  switch (newState) {
    case STATE_IDLE:
      setCpuFrequencyMhz(80);
      // Mantem BLE ativo em idle para evitar brick apos resetSession
      WiFi.mode(WIFI_OFF);
      break;

    case STATE_IMU_TRACKING: // MODO JOGO (Offline total)
      setCpuFrequencyMhz(80);  // 80MHz poupa imensa bateria e chega para ler a IMU
      BLEDevice::deinit(true); // DESLIGA BLUETOOTH (Anti-Brownout)
      WiFi.mode(WIFI_OFF);     // DESLIGA WI-FI (Anti-Brownout)
      if (POWER_DEBUG_LOGS) {
        Serial.println("[Power] Rádios desligados fisicamente. Modo Jogo Ativo.");
      }
      break;

    case STATE_BLE_SYNC:     // MODO SINCRONIZAÇÃO (Pós-Jogo)
      setCpuFrequencyMhz(240); // Sobe o clock para processar a transferência rápida
      // O teu api_server/session_manager vai ligar o BLE aqui.
      break;
  }

  currentState_ = newState;
  lastTransitionMs_ = nowMs;
}

int PowerManager::readBatteryPercent() const {
  long sum = 0;
  for (int i = 0; i < BATTERY_SAMPLES; i++) {
    sum += analogRead(BATTERY_PIN);
  }
  float raw = (float)sum / BATTERY_SAMPLES;
  
  // Traduz a leitura analógica para a voltagem real da célula LiPo
  float voltage = (raw / 4095.0f) * 3.3f * BATTERY_DIVIDER;
  
  // Mapeia usando os novos limites do config.h
  int pct = (int)(((voltage - BATTERY_V_MIN) / (BATTERY_V_MAX - BATTERY_V_MIN)) * 100.0f);
  return constrain(pct, 0, 100);
}