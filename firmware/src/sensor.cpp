#include "sensor.h"
#include <MPU6050.h>

// Instância estática privada dentro do arquivo de implementação
static MPU6050 mpu;

// Funções utilitárias mantidas como estáticas privadas (escopo local)
static bool i2cDevicePresent(uint8_t i2cAddr) {
  Wire.beginTransmission(i2cAddr);
  return Wire.endTransmission() == 0;
}

static bool readWhoAmIByte(uint8_t i2cAddr, uint8_t *out) {
  Wire.beginTransmission(i2cAddr);
  Wire.write(0x75);
  if (Wire.endTransmission(false) != 0) return false;
  if (Wire.requestFrom(i2cAddr, (uint8_t)1) != 1) return false;
  *out = Wire.read();
  return true;
}

void SensorManager::init() {
  if (!i2cDevicePresent(0x68)) {
    imuInitialized_ = false;
    return;
  }

  mpu.initialize();

  uint8_t whoFull = 0;
  bool haveWho = readWhoAmIByte(0x68, &whoFull);
  bool knownWho = haveWho && (whoFull == 0x68 || whoFull == 0x70 || whoFull == 0x72);

  if (!knownWho || !mpu.testConnection()) {
    imuInitialized_ = false;
    return;
  }

  // Configura as escalas nativas máximas para futebol de alta intensidade
  configureRegisters();
  
  imuInitialized_ = true;
}

void SensorManager::configureRegisters() {
  // 1. Escala de Aceleração: ±16G (Crucial para impactos de remates e pisadelas)
  mpu.setFullScaleAccelRange(MPU6050_ACCEL_FS_16);
  
  // 2. Escala de Giroscópio: ±2000 dps (Graus por segundo - para rotações rápidas do pé)
  mpu.setFullScaleGyroRange(MPU6050_GYRO_FS_2000);
  
  // 3. Taxa de Amostragem (Sample Rate) para 100Hz:
  // Formula: Sample Rate = Gyro Output Rate / (1 + SMPLRT_DIV)
  // Com o DLPF ativo, o Gyro Output Rate é 1kHz (1000Hz).
  // Para obter 100Hz: 1000 / (1 + 9) = 100. Logo, o divisor é 9.
  mpu.setRate(9);
  
  // 4. Digital Low Pass Filter (DLPF): BW de 42Hz reduz o ruído de alta frequência 
  // da relva/trepidação sem atrasar o sinal mecânico do impacto.
  mpu.setDLPFMode(MPU6050_DLPF_BW_42);
}

void SensorManager::calibrate() {
  const int samples = 200;
  int32_t sumAx = 0, sumAy = 0, sumAz = 0;
  int32_t sumGx = 0, sumGy = 0, sumGz = 0;

  if (!imuInitialized_) return;
  
  // Calibração crua (estática) enquanto o jogador está parado a colocar a caneleira
  for (int i = 0; i < samples; i++) {
    int16_t ax, ay, az, gx, gy, gz;
    mpu.getMotion6(&ax, &ay, &az, &gx, &gy, &gz);
    
    sumAx += ax; sumAy += ay; sumAz += az;
    sumGx += gx; sumGy += gy; sumGz += gz;
    delay(2); // Pequeno delay estável entre amostras de calibração
  }

  axOffset_ = sumAx / samples;
  ayOffset_ = sumAy / samples;
  // O eixo Z estático sente a gravidade da Terra (~1G). 
  // Na escala de ±16G, 1G equivale a 2048 LSB. Descontamos isso no offset.
  azOffset_ = (sumAz / samples) - 2048; 

  gxOffset_ = sumGx / samples;
  gyOffset_ = sumGy / samples;
  gzOffset_ = sumGz / samples;
}

bool SensorManager::readRawData(IMURecord &record) {
  if (!imuInitialized_) return false;

  int16_t axRaw, ayRaw, azRaw, gxRaw, gyRaw, gzRaw;
  mpu.getMotion6(&axRaw, &ayRaw, &azRaw, &gxRaw, &gyRaw, &gzRaw);

  // Aplica os offsets de calibração diretamente nos inteiros e popula a struct binária
  record.ax = axRaw - axOffset_;
  record.ay = ayRaw - ayOffset_;
  record.az = azRaw - azOffset_;
  
  record.gx = gxRaw - gxOffset_;
  record.gy = gyRaw - gyOffset_;
  record.gz = gzRaw - gzOffset_;

  return true;
}

void SensorManager::setLowPowerMode(bool enable) {
  if (!imuInitialized_) return;
  
  // Coloca o MPU6050 em modo de hibernação profunda (Sleep) ou acorda-o
  mpu.setSleepEnabled(enable);
}