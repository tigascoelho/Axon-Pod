#ifndef SESSION_RECORDER_H
#define SESSION_RECORDER_H

#include <Arduino.h>
#include <LittleFS.h>

#include "config.h"

class SessionRecorder
{
public:
    SessionRecorder();
    ~SessionRecorder();

    // Inicialização
    bool init();

    // Gestão da sessão
    bool startRecording();
    void stopRecording();
    void reset();

    // Escrita
    bool record(const IMURecord& sample);

    // Leitura (BLE)
    File openForReading();

    // Informação
    bool exists() const;
    bool isRecording() const;
    size_t size() const;

private:
    static constexpr const char* SESSION_FILE = "/jogo.bin";

    File sessionFile_;
    bool recording_ = false;
};

#endif