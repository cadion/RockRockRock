/**
 * Card Data Model
 * Defines card structure and comparison logic
 */

// Card color and shape constants
const COLORS = {
    BLUE: 'blue',
    YELLOW: 'yellow',
    ORANGE: 'orange',
    PURPLE: 'purple',
    WHITE: 'white'
};

const SHAPES = {
    ROCK: 'rock',
    PAPER: 'paper',
    SCISSORS: 'scissors'
};

// Shape symbols for visual representation
const SHAPE_SYMBOLS = {
    [SHAPES.ROCK]: '✊',
    [SHAPES.PAPER]: '✋',
    [SHAPES.SCISSORS]: '✌️'
};

// Korean names for display
const COLOR_NAMES_KR = {
    [COLORS.BLUE]: '파랑',
    [COLORS.YELLOW]: '노랑',
    [COLORS.ORANGE]: '주황',
    [COLORS.PURPLE]: '보라',
    [COLORS.WHITE]: '흰색'
};

const SHAPE_NAMES_KR = {
    [SHAPES.ROCK]: '바위',
    [SHAPES.PAPER]: '보',
    [SHAPES.SCISSORS]: '가위'
};

/**
 * Card class
 */
class Card {
    constructor(color, shape) {
        this.color = color;
        this.shape = shape;
        this.id = `${color}-${shape}-${Date.now()}-${Math.random()}`;
    }

    /**
     * Get display symbol for the card
     */
    getSymbol() {
        return SHAPE_SYMBOLS[this.shape];
    }

    /**
     * Get Korean name
     */
    getName() {
        return `${COLOR_NAMES_KR[this.color]} ${SHAPE_NAMES_KR[this.shape]}`;
    }

    /**
     * Clone the card
     */
    clone() {
        return new Card(this.color, this.shape);
    }
}

/**
 * Compare two cards using rock-paper-scissors logic
 * Returns: 1 (player wins), -1 (enemy wins), 0 (draw)
 */
function compareShapes(playerShape, enemyShape) {
    if (playerShape === enemyShape) {
        return 0; // Draw
    }
    
    if (
        (playerShape === SHAPES.ROCK && enemyShape === SHAPES.SCISSORS) ||
        (playerShape === SHAPES.PAPER && enemyShape === SHAPES.ROCK) ||
        (playerShape === SHAPES.SCISSORS && enemyShape === SHAPES.PAPER)
    ) {
        return 1; // Player wins
    }
    
    return -1; // Enemy wins
}

/**
 * Create a random card
 */
function createRandomCard() {
    const colors = Object.values(COLORS);
    const shapes = Object.values(SHAPES);
    
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const randomShape = shapes[Math.floor(Math.random() * shapes.length)];
    
    return new Card(randomColor, randomShape);
}

/**
 * Create initial player deck (15 cards: 5 colors x 3 shapes)
 */
function createInitialDeck() {
    const deck = [];
    
    for (const color of Object.values(COLORS)) {
        for (const shape of Object.values(SHAPES)) {
            deck.push(new Card(color, shape));
        }
    }
    
    return deck;
}

/**
 * Shuffle an array
 */
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}
