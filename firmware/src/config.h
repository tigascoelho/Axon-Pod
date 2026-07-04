// config.h - Constants, enums, structs for Axon Tracker

#ifndef CONFIG_H
#define CONFIG_H

#include <Arduino.h>

// ─── Device Identity ─────────────────────────────────────────────
const char* const DEVICE_ID      = "axon-v1-001";
#define IMU_PERIOD_MS            10 // 100Hz
const char* const FIRMWARE_VER   = "1.1.0";

// ─── Battery ─────────────────────────────────────────────────────
const int   BATTERY_PIN          = 36;         // GPIO36 (ADC1_CH0, VP)
const int   BATTERY_SAMPLES      = 10;         // readings to average
const float BATTERY_V_MIN        = 3.4f;       // LiPo empty
const float BATTERY_V_MAX        = 4.2f;       // LiPo full
// Voltage divider ratio (if using one). Set to 2.0 for a 50/50 divider,
// or 1.0 if reading the cell directly through a level-safe ADC.
const float BATTERY_DIVIDER      = 2.0f;

// ─── Step / Motion Detection ────────────────────────────────────
const float STEP_THRESHOLD = 25.0f; // acceleration magnitude threshold for step detection (m/s²) - realistic for football
const int MIN_CONSECUTIVE = 3; // minimum consecutive readings above threshold to count as step
const int MIN_STEPS_TO_START = 10; // minimum steps to auto-start session
const unsigned long STEP_COOLDOWN_MS = 200; // debounce time between steps (ms)

const float STEP_LENGTH = 0.85f; // estimated step length in meters
const float IMPACT_THRESHOLD = 78.4f; // acceleration magnitude for impact detection (m/s²)

const float ZONE_LOW_MAX = 5.0f; // max speed for low intensity zone (km/h)
const float ZONE_MED_MAX = 12.0f; // max speed for medium intensity zone (km/h)
const float SPRINT_SPEED_THRESHOLD = 19.0f; // speed threshold for sprint detection (km/h)

const int READINGS_PER_PERIOD = 1000; // readings per speed calculation period (10s at 10ms loop)
const int SPRINT_MIN_PERIODS = 1; // minimum periods for sprint detection (10s)
const unsigned long INACTIVITY_TIMEOUT = 180000; // inactivity timeout in ms (30s)

// ─── Storage (LittleFS Binary) ──────────────────────────────────
// Esta struct compacta de 14 bytes grava os dados diretamente na Flash
// sem gastar tempo de processamento a converter para texto (.csv)

struct __attribute__((__packed__)) IMURecord {
  int16_t ax, ay, az;   // Aceleração crua (escala configurada para ±16G)
  int16_t gx, gy, gz;   // Giroscópio cru (escala configurada para ±2000 dps)
  uint16_t deltaTime;   // Tempo em milissegundos desde a última leitura
};

// ─── New Device States ──────────────────────────────────────────
// Os estados reais que o teu hardware vai gerir agora
enum State { 
  STATE_IDLE,          // Ligado, à espera do comando da App para começar
  STATE_IMU_TRACKING,  // Modo Jogo: Wi-Fi/BLE desligados, a gravar na Flash a 100Hz
  STATE_BLE_SYNC       // Fim do jogo: BLE ligado, a descarregar os bytes para o iPhone
};

#endif