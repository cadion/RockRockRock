/**
 * Gimmick System
 * Defines gimmicks (special rules) that modify enemy behavior
 */

// Gimmick types
const GIMMICK_TYPES = {
    FOUR_CARDS: 'four_cards',        // 적이 4개 카드 냄
    TWO_CARDS: 'two_cards',          // 적이 2개 카드 냄
    ONLY_BLUE: 'only_blue',          // 적이 파랑색만 냄 (초록색->파랑색으로 수정)
    ONLY_SCISSORS: 'only_scissors'   // 적이 가위만 냄
};

/**
 * Gimmick definition class
 */
class Gimmick {
    constructor(type, name, description) {
        this.id = `gimmick-${type}-${Date.now()}`;
        this.type = type;
        this.name = name;
        this.description = description;
    }

    /**
     * Get number of cards enemy should play
     */
    getEnemyCardCount() {
        switch (this.type) {
            case GIMMICK_TYPES.FOUR_CARDS:
                return 4;
            case GIMMICK_TYPES.TWO_CARDS:
                return 2;
            default:
                return 3; // Default
        }
    }

    /**
     * Filter cards based on gimmick restrictions
     */
    filterEnemyCards(cards) {
        switch (this.type) {
            case GIMMICK_TYPES.ONLY_BLUE:
                return cards.filter(c => c.color === COLORS.BLUE);
            case GIMMICK_TYPES.ONLY_SCISSORS:
                return cards.filter(c => c.shape === SHAPES.SCISSORS);
            default:
                return cards;
        }
    }

    /**
     * Generate enemy cards according to gimmick
     */
    generateEnemyCards() {
        const count = this.getEnemyCardCount();
        let cards = [];

        switch (this.type) {
            case GIMMICK_TYPES.ONLY_BLUE:
                // Generate only blue cards
                for (let i = 0; i < count; i++) {
                    const shapes = Object.values(SHAPES);
                    const randomShape = shapes[Math.floor(Math.random() * shapes.length)];
                    cards.push(new Card(COLORS.BLUE, randomShape));
                }
                break;

            case GIMMICK_TYPES.ONLY_SCISSORS:
                // Generate only scissors
                for (let i = 0; i < count; i++) {
                    const colors = Object.values(COLORS);
                    const randomColor = colors[Math.floor(Math.random() * colors.length)];
                    cards.push(new Card(randomColor, SHAPES.SCISSORS));
                }
                break;

            default:
                // Generate random cards
                for (let i = 0; i < count; i++) {
                    cards.push(createRandomCard());
                }
                break;
        }

        return cards;
    }
}

/**
 * Get all available gimmicks
 */
function getAllGimmicks() {
    return [
        new Gimmick(
            GIMMICK_TYPES.FOUR_CARDS,
            '4장 공격',
            '적이 카드를 3개 대신 4개 냅니다'
        ),
        new Gimmick(
            GIMMICK_TYPES.TWO_CARDS,
            '2장 공격',
            '적이 카드를 3개 대신 2개 냅니다'
        ),
        new Gimmick(
            GIMMICK_TYPES.ONLY_BLUE,
            '파랑 한정',
            '적이 파랑색 카드만 냅니다'
        ),
        new Gimmick(
            GIMMICK_TYPES.ONLY_SCISSORS,
            '가위 한정',
            '적이 가위 모양만 냅니다'
        )
    ];
}

/**
 * Get random gimmick
 */
function getRandomGimmick() {
    const gimmicks = getAllGimmicks();
    const randomIndex = Math.floor(Math.random() * gimmicks.length);
    return gimmicks[randomIndex];
}
