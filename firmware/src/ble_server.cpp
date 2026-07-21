#include "ble_server.h"

CommandCallbacks::CommandCallbacks(SessionManager& sessionManager,
                                   BLEServerManager& bleManager)
    : sessionManager_(sessionManager),
      bleManager_(bleManager)
{
}

BLEServerManager::BLEServerManager(SessionManager& sessionManager)
    : sessionManager_(sessionManager)
{
}

void BLEServerManager::init()
{
    startAdvertising();
}

void BLEServerManager::startAdvertising()
{
    if (isInitialized_)
        return;

    BLEDevice::init("axon pod");
    BLEDevice::setMTU(247);

    pServer_ = BLEDevice::createServer();
    pServer_->setCallbacks(this);

    BLEService* pService = pServer_->createService(SERVICE_UUID);

    //--------------------------------------
    // COMMAND
    //--------------------------------------

    pCmdChar_ = pService->createCharacteristic(
        COMMAND_CHAR_UUID,
        BLECharacteristic::PROPERTY_WRITE);

    pCmdChar_->setCallbacks(
        new CommandCallbacks(sessionManager_, *this));

    //--------------------------------------
    // STATUS
    //--------------------------------------

    pStatusChar_ = pService->createCharacteristic(
        STATUS_CHAR_UUID,
        BLECharacteristic::PROPERTY_READ |
        BLECharacteristic::PROPERTY_NOTIFY);

    pStatusChar_->addDescriptor(new BLE2902());

    //--------------------------------------
    // DATA
    //--------------------------------------

    pDataChar_ = pService->createCharacteristic(
        DATA_CHAR_UUID,
        BLECharacteristic::PROPERTY_NOTIFY);

    pDataChar_->addDescriptor(new BLE2902());

    //--------------------------------------

    pService->start();

    BLEAdvertising* advertising = BLEDevice::getAdvertising();

    advertising->addServiceUUID(SERVICE_UUID);
    advertising->setScanResponse(true);

    // Recomendado para Apple
    advertising->setMinPreferred(0x06);
    advertising->setMaxPreferred(0x12);

    advertising->start();

    isInitialized_ = true;

    Serial.println("[BLE] Advertising iniciado.");
}

void BLEServerManager::shutdown()
{
    if (!isInitialized_)
        return;

    deviceConnected_ = false;
    oldDeviceConnected_ = false;

    isSyncing_ = false;

    if (syncFile_)
        syncFile_.close();

    BLEDevice::deinit(true);

    isInitialized_ = false;

    Serial.println("[BLE] Bluetooth desligado.");
}

void BLEServerManager::onConnect(BLEServer*)
{
    deviceConnected_ = true;
    lastStatusUpdateMs_ = 0;
    Serial.println("[BLE] Dispositivo ligado.");
}

void BLEServerManager::onDisconnect(BLEServer* pServer)
{
    deviceConnected_ = false;
    isSyncing_ = false;

    if (syncFile_)
        syncFile_.close();

    Serial.println("[BLE] Dispositivo desligado.");
}

void BLEServerManager::handle()
{
    const uint32_t nowMs = millis();

    //--------------------------------------------------
    // Reconexão automática
    //--------------------------------------------------

    if (!deviceConnected_ && oldDeviceConnected_)
    {
        BLEDevice::startAdvertising();

        Serial.println("[BLE] Advertising reiniciado.");

        oldDeviceConnected_ = false;
    }

    if (deviceConnected_ && !oldDeviceConnected_)
    {
        oldDeviceConnected_ = true;
    }

    //--------------------------------------------------
    // Streaming da sessão
    //--------------------------------------------------

    if (deviceConnected_ && isSyncing_)
    {
        sendFileChunk();
    }

    //--------------------------------------------------
    // Estado do dispositivo
    //--------------------------------------------------

    if (deviceConnected_ &&
        (nowMs - lastStatusUpdateMs_ >= 2000))
    {
        uint8_t status[3];

        status[0] = static_cast<uint8_t>(
            sessionManager_.getState());

        status[1] = static_cast<uint8_t>(
            sessionManager_.readBatteryPercent());

        status[2] = sessionManager_.isSessionRunning();

        pStatusChar_->setValue(status, sizeof(status));
        
        if (deviceConnected_) {
            pStatusChar_->notify();
        }
        lastStatusUpdateMs_ = nowMs;
    }
}

void BLEServerManager::startFileSync()
{
    //--------------------------------------------------
    // Limpa qualquer sincronização antiga
    //--------------------------------------------------

    isSyncing_ = false;

    if (syncFile_)
    {
        syncFile_.close();
    }

    //--------------------------------------------------
    // Validações
    //--------------------------------------------------

    if (sessionManager_.isSessionRunning())
    {
        Serial.println("[BLE] Não é possível sincronizar durante a gravação.");
        return;
    }

    if (!sessionManager_.hasSessionFile())
    {
        Serial.println("[BLE] Nenhum ficheiro disponível.");
        return;
    }

    //--------------------------------------------------
    // Abre ficheiro
    //--------------------------------------------------

    syncFile_ = sessionManager_.openSessionFile();

    if (!syncFile_)
    {
        Serial.println("[BLE] Erro ao abrir ficheiro.");
        return;
    }

    isSyncing_ = true;
    lastChunkMs_ = 0;

    Serial.printf(
        "[BLE] A iniciar sincronização (%u bytes).\n",
        (unsigned)syncFile_.size());
}

void BLEServerManager::sendFileChunk()
{
    const uint32_t nowMs = millis();

    // Limita a velocidade de envio
    if (nowMs - lastChunkMs_ < 20)
    {
        return;
    }

    lastChunkMs_ = nowMs;

    //----------------------------------------------------
    // Fim do ficheiro
    //----------------------------------------------------

    if (!syncFile_ || !syncFile_.available())
    {
        isSyncing_ = false;

        if (syncFile_)
        {
            syncFile_.close();
        }

        uint8_t eof[] = { 'E', 'O', 'F' };

        pDataChar_->setValue(eof, sizeof(eof));
        
        if (deviceConnected_) {
            pDataChar_->notify();
        }

        Serial.println("[BLE] Sincronização concluída.");

        return;
    }

    //----------------------------------------------------
    // Envia próximo bloco
    //----------------------------------------------------

    uint8_t buffer[BLE_CHUNK_SIZE];

    size_t bytesRead =
        syncFile_.read(buffer, BLE_CHUNK_SIZE);

    if (bytesRead == 0)
    {
        return;
    }

    pDataChar_->setValue(buffer, bytesRead);
    
    if (deviceConnected_) {
        pDataChar_->notify();
    }
}

void CommandCallbacks::onWrite(BLECharacteristic* pCharacteristic)
{
    std::string value = pCharacteristic->getValue();

    if (value.empty())
    {
        return;
    }

    uint8_t command = static_cast<uint8_t>(value[0]);

    switch (command)
    {
        case 0x01:
            sessionManager_.startSession();
            break;

        case 0x02:
            sessionManager_.stopSession();
            break;

        case 0x03:
            bleManager_.startFileSync();
            break;

        case 0x04:
            sessionManager_.resetSession();
            break;
        
        case 0x05:
            Serial.println("[BLE] Ping.");

        default:
            Serial.printf("[BLE] Comando desconhecido: %c\n", value[0]);
            break;
    }
}
