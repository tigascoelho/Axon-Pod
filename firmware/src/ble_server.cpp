// ble_server.cpp
#include "ble_server.h"
#include <LittleFS.h>

CommandCallbacks::CommandCallbacks(SessionManager& sessionManager, BLEServerManager& bleManager)
    : sessionManager_(sessionManager), bleManager_(bleManager) {}
BLEServerManager::BLEServerManager(SessionManager& sessionManager) 
    : sessionManager_(sessionManager) {}

void BLEServerManager::init() {
    startAdvertising(); // Inicia o Advertising para que o iPhone possa encontrar o dispositivo
}

void BLEServerManager::startAdvertising() {
    if (isInitialized_) return; 
    
    // Força o nome explicitamente aqui para garantir que nunca fica "unnamed"
    BLEDevice::init("axon pod"); 
    BLEDevice::setMTU(247); 

    pServer_ = BLEDevice::createServer();
    pServer_->setCallbacks(this);

    BLEService* pService = pServer_->createService(SERVICE_UUID);

    // 1. Característica de COMANDO
    pCmdChar_ = pService->createCharacteristic(
        COMMAND_CHAR_UUID,
        BLECharacteristic::PROPERTY_WRITE
    );
    pCmdChar_->setCallbacks(new CommandCallbacks(sessionManager_, *this));

    // 2. Característica de ESTADO
    pStatusChar_ = pService->createCharacteristic(
        STATUS_CHAR_UUID,
        BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_NOTIFY
    );
    pStatusChar_->addDescriptor(new BLE2902());

    // 3. Característica de DADOS
    pDataChar_ = pService->createCharacteristic(
        DATA_CHAR_UUID,
        BLECharacteristic::PROPERTY_NOTIFY
    );
    pDataChar_->addDescriptor(new BLE2902());

    pService->start();
    
    // ─── ALTERAÇÃO SEGURA PARA O IOS ───
    BLEAdvertising* pAdvertising = BLEDevice::getAdvertising();
    pAdvertising->addServiceUUID(SERVICE_UUID);
    
    // Diz explicitamente ao iOS que este dispositivo aceita conexões diretas
    pAdvertising->setScanResponse(true);
    
    // Parâmetros de timing cruciais para o ecossistema Apple não falhar o Connect
    pAdvertising->setMinPreferred(0x06);  
    pAdvertising->setMinPreferred(0x12);
    
    // Inicia a publicidade de forma limpa
    pServer_->getAdvertising()->start(); 
    
    isInitialized_ = true;
    Serial.println("[BLE] Servidor inicializado com sucesso como 'axon pod'. À espera de ligação...");
}

void BLEServerManager::shutdown() {
    if (!isInitialized_) return; // Se não estiver inicializado, não há nada a desligar

    deviceConnected_ = false;
    oldDeviceConnected_ = false;
    isSyncing_ = false;
    if (fileToSync_) fileToSync_.close();
    
    BLEDevice::deinit(true); // Desliga o stack BLE completamente
    isInitialized_ = false;
    Serial.println("[BLE] Stack Bluetooth desligado e flags reinicializadas.");
}

void BLEServerManager::onConnect(BLEServer* pServer) {
    deviceConnected_ = true;
    Serial.println("[BLE] Conectado!");
}

void BLEServerManager::onDisconnect(BLEServer* pServer) {
    deviceConnected_ = false;
    isSyncing_ = false;
    if (fileToSync_) fileToSync_.close();
    Serial.println("[BLE] Desconectado.");
}

void BLEServerManager::handle() {
    uint32_t nowMs = millis();

   // 1. Gestão automática se a app desconectar (Reinicia o Advertising de forma robusta)
    if (!deviceConnected_ && oldDeviceConnected_) {
        delay(200); // Pequena pausa para estabilizar o rádio
        BLEDevice::startAdvertising(); // ✅ Chamar a pilha global é muito mais seguro
        Serial.println("[BLE] Conexão perdida. A reativar Advertising...");
        oldDeviceConnected_ = deviceConnected_;
    }
    
    if (deviceConnected_ && !oldDeviceConnected_) {
        oldDeviceConnected_ = deviceConnected_;
    }

    // 2. Se a sincronização estiver ativa, envia o próximo bloco
    if (deviceConnected_ && isSyncing_) {
        sendFileChunk();
    }

    // 3. Notificação Cíclica de Telemetria (Estado, Bateria, Gravação)
    if (deviceConnected_ && (nowMs - lastStatusUpdateMs_ > 2000)) {
        uint8_t statusBuffer[3];
        statusBuffer[0] = static_cast<uint8_t>(sessionManager_.getState());
        statusBuffer[1] = static_cast<uint8_t>(sessionManager_.readBatteryPercent());
        statusBuffer[2] = sessionManager_.isSessionRunning() ? 1 : 0;

        pStatusChar_->setValue(statusBuffer, 3);
        pStatusChar_->notify();
        lastStatusUpdateMs_ = nowMs;
    }
}

void BLEServerManager::sendFileChunk() {
    if (!fileToSync_ || !fileToSync_.available()) {
        // O ficheiro chegou ao fim!
        isSyncing_ = false;
        if (fileToSync_) fileToSync_.close();
        
        // Envia um pacote de controlo vazio (0 bytes) para avisar a App que terminou
        uint8_t eofSignal[3] = {'E', 'O', 'F'}; // Pode ser qualquer coisa, o importante é que seja um pacote distinto
        pDataChar_->setValue(eofSignal, 3);
        pDataChar_->notify();
        
        Serial.println("[BLE] Sincronização do ficheiro terminada com sucesso!");
        return;
    }

    // Lê um bloco de bytes (máximo de 240 bytes para caber no MTU do BLE de forma segura)
    uint8_t chunkBuffer[240];
    size_t bytesRead = fileToSync_.read(chunkBuffer, sizeof(chunkBuffer));

    if (bytesRead > 0) {
        pDataChar_->setValue(chunkBuffer, bytesRead);
        pDataChar_->notify(); // Cospe o pacote para o ar; o iPhone apanha-o
    }
}

// ─── CALLBACK DE COMANDOS (O que vem do iPhone) ───
void CommandCallbacks::onWrite(BLECharacteristic* pCharacteristic) {
    std::string rxValue = pCharacteristic->getValue();

    if (rxValue.length() > 0) {
        char comando = rxValue[0];

        if (comando == 'S') { // Letra 'S' enviada pela App
            sessionManager_.startSession();

        } 
        else if (comando == 'T') { // Letra 'T' enviada pela App
            sessionManager_.stopSession();
        }
        else if (comando == 'Y') { // Letra 'Y' enviada pela App para puxar dados
            // Só deixa sincronizar se o jogo estiver parado e o ficheiro existir
            if (!sessionManager_.isSessionRunning()) {
                bleManager_.fileToSync_ = LittleFS.open("/jogo.bin", "r");
                if (bleManager_.fileToSync_) {
                    bleManager_.isSyncing_ = true;
                    Serial.printf("[BLE] A iniciar streaming de %d bytes...\n", bleManager_.fileToSync_.size());
                }
            }
        }
    }
}