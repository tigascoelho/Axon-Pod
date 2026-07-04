// ble_server.h - Servidor BLE para sincronização de dados binários
#ifndef BLE_SERVER_H
#define BLE_SERVER_H

#include <Arduino.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>
#include <LittleFS.h>
#include "session_manager.h"

// UUIDs Únicos para o Axon Tracker (Gerados para o teu dispositivo)
#define SERVICE_UUID           "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define COMMAND_CHAR_UUID      "beb5483e-36e1-4688-b7f5-ea07361b26a8"
#define STATUS_CHAR_UUID       "d06d4e5c-0001-4475-a859-00977d206fd9"
#define DATA_CHAR_UUID         "d06d4e5c-0002-4475-a859-00977d206fd9"

class BLEServerManager : public BLEServerCallbacks {
public:
    BLEServerManager(SessionManager& sessionManager);
    
    File fileToSync_;
    bool isSyncing_ = false;
    
    void init();
    void startAdvertising();
    void shutdown();
    void handle();
    void sendFileChunk(); // Processa o envio do ficheiro às prestações

    // Callbacks do Servidor BLE
    void onConnect(BLEServer* pServer) override;
    void onDisconnect(BLEServer* pServer) override;

private:
    SessionManager& sessionManager_;
    BLEServer* pServer_ = nullptr;
    BLECharacteristic* pCmdChar_ = nullptr;
    BLECharacteristic* pStatusChar_ = nullptr;
    BLECharacteristic* pDataChar_ = nullptr;

    bool deviceConnected_ = false;
    bool oldDeviceConnected_ = false;
    bool isInitialized_ = false;
    
    // Controlo de transferência de ficheiro
    
    uint32_t lastStatusUpdateMs_ = 0;
};

// Classe Callback para receber os comandos da App do iPhone
class CommandCallbacks : public BLECharacteristicCallbacks {
public:
    CommandCallbacks(SessionManager& sessionManager, BLEServerManager& bleManager);
    void onWrite(BLECharacteristic* pCharacteristic) override;
private:
    SessionManager& sessionManager_;
    BLEServerManager& bleManager_;
};

#endif