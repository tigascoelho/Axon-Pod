#include "session_recorder.h"

SessionRecorder::SessionRecorder() {}

SessionRecorder::~SessionRecorder()
{
    stopRecording();
}

bool SessionRecorder::init()
{
    if (!LittleFS.begin(true))
    {
        Serial.println("[RECORDER] Erro ao inicializar LittleFS.");
        return false;
    }

    return true;
}

bool SessionRecorder::startRecording()
{
    // Fecha qualquer sessão anterior
    stopRecording();

    sessionFile_ = LittleFS.open(SESSION_FILE, "w");

    if (!sessionFile_)
    {
        Serial.println("[RECORDER] Erro ao criar ficheiro da sessão.");
        recording_ = false;
        return false;
    }

    recording_ = true;
    return true;
}

void SessionRecorder::stopRecording()
{
    if (!recording_)
    {
        return;
    }

    if (sessionFile_)
    {
        sessionFile_.flush();
        sessionFile_.close();
    }

    recording_ = false;
}

bool SessionRecorder::record(const IMURecord& sample)
{
    if (!recording_ || !sessionFile_)
    {
        return false;
    }

    size_t bytesWritten = sessionFile_.write(
        reinterpret_cast<const uint8_t*>(&sample),
        sizeof(IMURecord)
    );

    return bytesWritten == sizeof(IMURecord);
}

File SessionRecorder::openForReading()
{
    if (recording_ && sessionFile_)
    {
        sessionFile_.flush();
    }

    return LittleFS.open(SESSION_FILE, "r");
}

void SessionRecorder::reset()
{
    stopRecording();

    if (LittleFS.exists(SESSION_FILE))
    {
        LittleFS.remove(SESSION_FILE);
    }
}

bool SessionRecorder::exists() const
{
    return LittleFS.exists(SESSION_FILE);
}

bool SessionRecorder::isRecording() const
{
    return recording_;
}

size_t SessionRecorder::size() const
{
    if (recording_ && sessionFile_)
    {
        return sessionFile_.size();
    }

    if (!LittleFS.exists(SESSION_FILE))
    {
        return 0;
    }

    File file = LittleFS.open(SESSION_FILE, "r");

    if (!file)
    {
        return 0;
    }

    size_t fileSize = file.size();
    file.close();

    return fileSize;
}