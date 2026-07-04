// sensor.h - Sensor logic for MPU6050 (Optimized for Football Tracking)

#ifndef SENSOR_H
#define SENSOR_H

#include <Arduino.h>
#include <Wire.h>
#include "config.h"

class SensorManager {
public:
    // ─── Métodos Públicos do Ciclo de Vida ───
    void init();
    bool isReady() const { return imuInitialized_; }
    void calibrate();
    
    // ─── Leitura Otimizada para Modo Jogo (Binário) ───
    // Lê os dados crús diretamente para a struct de 14 bytes que definimos no config.h
    bool readRawData(IMURecord &record);
    
    // Configura o registo interno do MPU6050 para consumir quase zero em standby
    void setLowPowerMode(bool enable);

private:
    bool imuInitialized_ = false;

    // Valores de calibração guardados internamente
    int16_t axOffset_ = 0, ayOffset_ = 0, azOffset_ = 0;
    int16_t gxOffset_ = 0, gyOffset_ = 0, gzOffset_ = 0;

    // Métodos internos de configuração de registos do MPU6050
    void configureRegisters();
};

#endif