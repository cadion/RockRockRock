// ===== 오디오 관리자 (Audio Manager) =====

class AudioManager {
    constructor() {
        this.bgm = null;
        this.sfxVolume = 0.5;
        this.bgmVolume = 0.3;
        this.isMuted = false;

        // 오디오 파일 경로 (placeholder URLs or local paths)
        this.sounds = {
            cardSelect: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3', // Click
            clash: 'https://assets.mixkit.co/active_storage/sfx/1633/1633-preview.mp3',      // Hit
            win: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3',        // Fanfare
            lose: 'https://assets.mixkit.co/active_storage/sfx/270/270-preview.mp3',         // Dull thud
            draw: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'       // Bounce
        };
    }

    playSFX(name) {
        if (this.isMuted || !this.sounds[name]) return;
        const audio = new Audio(this.sounds[name]);
        audio.volume = this.sfxVolume;
        audio.play().catch(e => console.warn('Audio play failed:', e));
    }

    playBGM(url, loop = true) {
        if (this.bgm) {
            this.bgm.pause();
        }
        this.bgm = new Audio(url);
        this.bgm.volume = this.bgmVolume;
        this.bgm.loop = loop;
        this.bgm.play().catch(e => console.warn('BGM play failed:', e));
    }

    setMute(mute) {
        this.isMuted = mute;
        if (this.bgm) {
            this.bgm.muted = mute;
        }
    }
}

export const audioManager = new AudioManager();
