// ===== 게임 지속성 관리 (Persistence Manager) =====

const SAVE_KEY = 'rps_roguelike_save';
const STATS_KEY = 'rps_roguelike_stats';

class PersistenceManager {
    constructor() {
        this.stats = this.loadStats();
    }

    // 게임 상태 저장
    saveGameState(state) {
        try {
            const saveData = {
                round: state.round,
                deck: state.deck,
                hand: state.hand,
                discardPile: state.discardPile,
                deckSize: state.deckSize,
                // 패시브는 ID만 저장
                passiveIds: state.passives.map(p => p.id),
                // 기믹과 보스도 ID만 저장
                currentGimmickId: state.currentGimmick?.id || null,
                currentBossId: state.currentBoss?.id || null,
                consecutiveWins: state.consecutiveWins,
                lastWinColors: state.lastWinColors,
                timestamp: Date.now()
            };
            localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
            return true;
        } catch (e) {
            console.warn('세이브 실패:', e);
            return false;
        }
    }

    // 게임 상태 불러오기
    loadGameState(PASSIVES, GIMMICKS, BOSSES) {
        try {
            const saved = localStorage.getItem(SAVE_KEY);
            if (!saved) return null;

            const data = JSON.parse(saved);

            // 패시브 복구
            const passives = data.passiveIds
                .map(id => PASSIVES[id])
                .filter(p => p !== undefined);

            // 기믹 복구
            const currentGimmick = data.currentGimmickId ? GIMMICKS[data.currentGimmickId] : null;

            // 보스 복구
            const currentBoss = data.currentBossId ? BOSSES[data.currentBossId] : null;

            return {
                ...data,
                passives,
                currentGimmick,
                currentBoss
            };
        } catch (e) {
            console.warn('로드 실패:', e);
            return null;
        }
    }

    // 세이브 삭제
    clearGameState() {
        localStorage.removeItem(SAVE_KEY);
    }

    // 세이브 존재 확인
    hasSave() {
        return localStorage.getItem(SAVE_KEY) !== null;
    }

    // 통계 로드
    loadStats() {
        try {
            const saved = localStorage.getItem(STATS_KEY);
            if (!saved) {
                return {
                    bestRound: 0,
                    totalGames: 0,
                    totalVictories: 0
                };
            }
            return JSON.parse(saved);
        } catch (e) {
            console.warn('통계 로드 실패:', e);
            return {
                bestRound: 0,
                totalGames: 0,
                totalVictories: 0
            };
        }
    }

    // 통계 저장
    saveStats(stats) {
        try {
            localStorage.setItem(STATS_KEY, JSON.stringify(stats));
        } catch (e) {
            console.warn('통계 저장 실패:', e);
        }
    }

    // 게임 오버 시 통계 업데이트
    updateStatsOnGameOver(round, isVictory) {
        this.stats.totalGames++;
        if (isVictory) {
            this.stats.totalVictories++;
        }
        if (round > this.stats.bestRound) {
            this.stats.bestRound = round;
        }
        this.saveStats(this.stats);
    }

    // 최고 기록 가져오기
    getBestRound() {
        return this.stats.bestRound;
    }
}

export const persistenceManager = new PersistenceManager();
