#include <Arduino.h>
#include "config.h"
#include "sensor.h"          // Substituído pelo novo SensorManager
#include "power_manager.h"
#include "session_manager.h"
#include "ble_server.h"    // [FUTURO] O teu novo servidor BLE para a Etapa 2

// Instâncias Globais dos teus Gestores de Hardware e Estado
PowerManager   gPowerManager;
SensorManager  gSensorManager; // O novo motor otimizado para o MPU6050
SessionManager gSessionManager(gPowerManager, gSensorManager);
BLEServerManager gBleServer(gSessionManager); // 2. Instanciar o BLE globalmente, passando a sessão

void setup() {
  // Inicializa a comunicação Serial para debug com o PC
  Serial.begin(115200);
  delay(1000); // Pequena pausa para estabilizar a tensão na Serial

  // Configuração nativa e estável do ADC para leitura da LiPo (Evita flutuações)
  analogReadResolution(12);
  analogSetAttenuation(ADC_11db);

  // Inicialização encadeada dos módulos (Ordem Crítica de Hardware)
  gPowerManager.init();   // 1. Garante que os rádios arrancam em OFF (Anti-brownout)
  delay(100); // Pequena pausa para estabilizar a tensão da LiPo
  gSensorManager.init();  // 2. Acorda a I2C e configura o MPU6050 para ±16G
  delay(300); // Pequena pausa para estabilizar a I2C
  gSessionManager.init(); // 3. Monta o sistema de ficheiros LittleFS na Flash
  delay(100); // Pequena pausa para estabilizar a Flash
  gBleServer.init();      // 4. Inicializar o hardware e os serviços Bluetooth aqui!

  Serial.println("[MAIN] Axon Tracker Inicializado em Modo Offline com Sucesso.");
}

void loop() {
  const uint32_t nowMs = millis();

  // 1. Atualiza a máquina de estados (Trata da gravação a 100Hz se estiver em jogo)
  gSessionManager.update(nowMs);

  // 2. Deixa o gestor de energia verificar rotinas cíclicas (Ex: leitura de bateria)
  gPowerManager.update(nowMs);

    // 3. Gestão do BLE: desliga no modo jogo, reativa no modo sync/idle
    static bool bleWasShutdown = false;
    if (gSessionManager.getState() == STATE_IMU_TRACKING) {
      if (!bleWasShutdown) {
        gBleServer.shutdown();
        bleWasShutdown = true;
      }
    } else {
      bleWasShutdown = false;
      gBleServer.handle();
    }
}