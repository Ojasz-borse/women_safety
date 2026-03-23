import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system/legacy";

/**
 * SirenPlayer: Generates a WAV siren tone programmatically and plays it in a loop.
 * No external audio files needed — creates the siren from raw PCM data.
 */

const toBase64 = (bytes: number[]): string => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let result = "";
    for (let i = 0; i < bytes.length; i += 3) {
        const b1 = bytes[i];
        const b2 = i + 1 < bytes.length ? bytes[i + 1] : 0;
        const b3 = i + 2 < bytes.length ? bytes[i + 2] : 0;
        result += chars[b1 >> 2];
        result += chars[((b1 & 3) << 4) | (b2 >> 4)];
        result += i + 1 < bytes.length ? chars[((b2 & 15) << 2) | (b3 >> 6)] : "=";
        result += i + 2 < bytes.length ? chars[b3 & 63] : "=";
    }
    return result;
};

const writeUint32LE = (arr: number[], value: number) => {
    arr.push(value & 0xff, (value >> 8) & 0xff, (value >> 16) & 0xff, (value >> 24) & 0xff);
};
const writeUint16LE = (arr: number[], value: number) => {
    arr.push(value & 0xff, (value >> 8) & 0xff);
};
const writeString = (arr: number[], str: string) => {
    for (let i = 0; i < str.length; i++) arr.push(str.charCodeAt(i));
};

class SirenPlayer {
    private sound: Audio.Sound | null = null;
    private isPlaying = false;

    /**
     * Generate a WAV siren file: alternating frequency sine wave (800-1400 Hz)
     */
    private async generateSirenFile(): Promise<string> {
        const FS = FileSystem as any;
        const filePath = (FS.cacheDirectory || FS.documentDirectory) + "siren_alarm.wav";

        const info = await FileSystem.getInfoAsync(filePath);
        if (info.exists) return filePath;

        const sampleRate = 8000;
        const duration = 2; // 2 seconds, will loop
        const numSamples = sampleRate * duration;
        const bytes: number[] = [];

        // WAV header
        writeString(bytes, "RIFF");
        writeUint32LE(bytes, 36 + numSamples);
        writeString(bytes, "WAVE");

        // fmt chunk
        writeString(bytes, "fmt ");
        writeUint32LE(bytes, 16); // chunk size
        writeUint16LE(bytes, 1); // PCM
        writeUint16LE(bytes, 1); // mono
        writeUint32LE(bytes, sampleRate);
        writeUint32LE(bytes, sampleRate); // byte rate
        writeUint16LE(bytes, 1); // block align
        writeUint16LE(bytes, 8); // 8 bits per sample

        // data chunk
        writeString(bytes, "data");
        writeUint32LE(bytes, numSamples);

        // Generate siren: frequency sweeps between 800Hz and 1400Hz
        for (let i = 0; i < numSamples; i++) {
            const t = i / sampleRate;
            const freq = 800 + 600 * Math.sin(2 * Math.PI * 3 * t); // 3Hz sweep
            const sample = Math.sin(2 * Math.PI * freq * t);
            bytes.push(Math.round((sample * 0.45 + 0.5) * 255)); // 8-bit unsigned
        }

        const base64 = toBase64(bytes);
        await FileSystem.writeAsStringAsync(filePath, base64, {
            encoding: FileSystem.EncodingType.Base64,
        });

        return filePath;
    }

    async play() {
        if (this.isPlaying) return;
        try {
            const uri = await this.generateSirenFile();
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
                playsInSilentModeIOS: true,
                staysActiveInBackground: true,
            });
            const { sound } = await Audio.Sound.createAsync(
                { uri },
                { isLooping: true, volume: 1.0, shouldPlay: true }
            );
            this.sound = sound;
            this.isPlaying = true;
            console.log("🔊 Siren started");
        } catch (err) {
            console.log("Siren play error:", err);
        }
    }

    async stop() {
        if (this.sound) {
            try {
                await this.sound.stopAsync();
                await this.sound.unloadAsync();
            } catch { }
            this.sound = null;
        }
        this.isPlaying = false;
        console.log("🔇 Siren stopped");
    }

    getIsPlaying() {
        return this.isPlaying;
    }
}

export default new SirenPlayer();
