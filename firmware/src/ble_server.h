#ifndef BLE_SERVER_H
#define BLE_SERVER_H

#include <Arduino.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

#include "session_manager.h"

// UUIDs Únicos para o Axon Tracker
#define SERVICE_UUID      "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define COMMAND_CHAR_UUID "beb5483e-36e1-4688-b7f5-ea07361b26a8"
#define STATUS_CHAR_UUID  "d06d4e5c-0001-4475-a859-00977d206fd9"
#define DATA_CHAR_UUID    "d06d4e5c-0002-4475-a859-00977d206fd9"

class BLEServerManager : public BLEServerCallbacks
{
public:
    explicit BLEServerManager(SessionManager& sessionManager);

    void init();
    void startAdvertising();
    void shutdown();
    void handle();

    // Gestão da sincronização
    void startFileSync();
    void sendFileChunk();

    // Callbacks BLE
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

    // Estado interno da sincronização
    File syncFile_;
    bool isSyncing_ = false;

    static constexpr size_t BLE_CHUNK_SIZE = 240;

    uint32_t lastStatusUpdateMs_ = 0;
    uint32_t lastChunkMs_ = 0;

    friend class CommandCallbacks;
};

// ========================================================
// Callback dos comandos vindos da aplicação
// ========================================================

class CommandCallbacks : public BLECharacteristicCallbacks
{
public:
    CommandCallbacks(SessionManager& sessionManager,
                     BLEServerManager& bleManager);

    void onWrite(BLECharacteristic* pCharacteristic) override;

private:
    SessionManager& sessionManager_;
    BLEServerManager& bleManager_;
};

#endif