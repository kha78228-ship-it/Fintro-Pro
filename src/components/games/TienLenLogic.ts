export type Suit = 'spades' | 'clubs' | 'diamonds' | 'hearts';
export type Rank = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15; // 11=J, 12=Q, 13=K, 14=A, 15=2

export interface Card {
    id: string; // e.g. "3_spades"
    rank: Rank;
    suit: Suit;
    value: number; // For sorting: rank * 4 + suit_value
    label?: string;
}

export const SUIT_VALUES: Record<Suit, number> = {
    spades: 0,
    clubs: 1,
    diamonds: 2,
    hearts: 3,
};

export function getCardValue(rank: Rank, suit: Suit): number {
    return rank * 4 + SUIT_VALUES[suit];
}

export function createDeck(): Card[] {
    const deck: Card[] = [];
    const suits: Suit[] = ['spades', 'clubs', 'diamonds', 'hearts'];
    for (let rank = 3; rank <= 15; rank++) {
        for (const suit of suits) {
            deck.push({
                id: `${rank}_${suit}`,
                rank: rank as Rank,
                suit,
                value: getCardValue(rank as Rank, suit)
            });
        }
    }
    return deck;
}

export function shuffleDeck(deck: Card[]): Card[] {
    const newDeck = [...deck];
    for (let i = newDeck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
    }
    return newDeck;
}

export type PlayType = 'single' | 'pair' | 'triple' | 'quad' | 'straight' | '3_pairs_straight' | '4_pairs_straight' | 'invalid';

export interface PlayedCards {
    cards: Card[];
    type: PlayType;
    highestValue: number;
    owner: string;
}

export function analyzePlay(cards: Card[], isMienBac: boolean = false): PlayType {
    if (!cards || cards.length === 0) return 'invalid';
    const sorted = [...cards].sort((a, b) => a.value - b.value);
    
    if (sorted.length === 1) return 'single';
    if (sorted.length === 2 && sorted[0].rank === sorted[1].rank) {
        if (isMienBac) {
            // Đôi đồng màu (cùng đen hoặc cùng đỏ)
            const c1 = sorted[0].suit;
            const c2 = sorted[1].suit;
            const isRed1 = c1 === 'hearts' || c1 === 'diamonds';
            const isRed2 = c2 === 'hearts' || c2 === 'diamonds';
            if (isRed1 !== isRed2) {
                // Not same color
                // Wait, if rank is Pig (15), can Pig pair be any color in Mien Bac? No, usually Pig pairs also follow same color logically, but we enforce same color for all pairs as strict Miền Bắc rule.
                return 'invalid';
            }
        }
        return 'pair';
    }
    if (sorted.length === 3 && sorted[0].rank === sorted[1].rank && sorted[1].rank === sorted[2].rank) return 'triple';
    if (sorted.length === 4 && sorted[0].rank === sorted[1].rank && sorted[1].rank === sorted[2].rank && sorted[2].rank === sorted[3].rank) return 'quad';
    
    // Check pairs straight (đôi thông)
    if (sorted.length >= 6 && sorted.length % 2 === 0) {
        let isPairsStraight = true;
        for (let i = 0; i < sorted.length; i += 2) {
            if (sorted[i].rank !== sorted[i+1].rank) {
                isPairsStraight = false;
                break;
            }
            if (isMienBac) {
                const isRed1 = sorted[i].suit === 'hearts' || sorted[i].suit === 'diamonds';
                const isRed2 = sorted[i+1].suit === 'hearts' || sorted[i+1].suit === 'diamonds';
                if (isRed1 !== isRed2) {
                    isPairsStraight = false;
                    break;
                }
            }
            if (sorted[i].rank === 15) {
                isPairsStraight = false;
                break;
            }
            if (i > 0 && sorted[i].rank !== sorted[i-2].rank + 1) {
                isPairsStraight = false;
                break;
            }
        }
        if (isPairsStraight) {
            if (sorted.length === 6) return '3_pairs_straight';
            if (sorted.length === 8) return '4_pairs_straight';
        }
    }
    
    // Check straight
    if (sorted.length >= 3) {
        let isStraight = true;
        for (let i = 0; i < sorted.length - 1; i++) {
            // Straight cannot include 2 (rank 15)
            if (sorted[i].rank === 15 || sorted[i+1].rank === 15) {
                isStraight = false; 
                break;
            }
            if (sorted[i+1].rank !== sorted[i].rank + 1) {
                isStraight = false;
                break;
            }
            if (isMienBac && sorted[i].suit !== sorted[i+1].suit) {
                // Must be same suit
                isStraight = false;
                break;
            }
        }
        if (isStraight) return 'straight';
    }
    
    return 'invalid';
}

export function canPlay(attempt: Card[], current: PlayedCards | null, isMienBac: boolean = false): boolean {
    const type = analyzePlay(attempt, isMienBac);
    if (type === 'invalid') return false;
    
    if (!current) return true; // Can play anything valid if new round
    
    const attemptHighest = Math.max(...attempt.map(c => c.value));
    
    // Normal beat
    if (type === current.type && attempt.length === current.cards.length) {
        if (isMienBac) {
            if (type === 'single') {
                // Rác phải đồng chất, trừ phi lá đánh chặn là Heo (rank 15)
                if (attempt[0].rank !== 15 && attempt[0].suit !== current.cards[0].suit) {
                    return false;
                }
            } else if (type === 'straight') {
                // Sảnh phải đồng chất
                if (current.cards[0].suit !== attempt[0].suit) {
                    return false;
                }
            } else if (type === 'pair') {
                // Đôi phải đồng màu, trừ phi đánh Đôi Heo
                if (attempt[0].rank !== 15) {
                    const currentIsRed = current.cards[0].suit === 'hearts' || current.cards[0].suit === 'diamonds';
                    const attemptIsRed = attempt[0].suit === 'hearts' || attempt[0].suit === 'diamonds';
                    if (currentIsRed !== attemptIsRed) return false;
                }
            } else if (type === '3_pairs_straight' || type === '4_pairs_straight') {
                const currentIsRed = current.cards[0].suit === 'hearts' || current.cards[0].suit === 'diamonds';
                const attemptIsRed = attempt[0].suit === 'hearts' || attempt[0].suit === 'diamonds';
                if (currentIsRed !== attemptIsRed) return false;
            }
        }
        return attemptHighest > current.highestValue;
    }
    
    // Chặt heo (Cutting Pig rules)
    const isSinglePig = current.type === 'single' && current.cards[0].rank === 15;
    const isPairPig = current.type === 'pair' && current.cards[0].rank === 15 && current.cards[1].rank === 15;
    
    // In Mien Bac, Tứ quý có thể chặt Heo, nhưng 3 đôi thông có chặt Heo không? 
    // Wait, Tiền Lên Miền Bắc thường KHÔNG CÓ 3 Đôi Thông, 4 Đôi Thông! Chỉ có Tứ Quý mới chặt được 1 con Heo (kể cả Heo đen hay đỏ). Đôi Heo chỉ có Tứ Quý chặt được? Không, Đôi Heo không thể bị chặt bởi 1 tứ quý! Mien Bac uses Tứ Quý chặt 2 (1 con 2). KHÔNG CÓ 3 đôi thông / 4 đôi thông.
    if (isMienBac) {
        if (type === 'quad') {
            if (isSinglePig) return true; // Tứ quý chặt 1 Heo
            // In strict TLMB, Tứ quý KHÔNG chặt được đôi Heo.
        }
        return false; // Tiền lên MB không dùng 3-4 đôi thông để chặt heo.
    }
    
    if (type === '3_pairs_straight') {
        if (isSinglePig) return true;
        if (current.type === '3_pairs_straight' && attemptHighest > current.highestValue) return true;
    }
    
    if (type === 'quad') {
        if (isSinglePig || isPairPig) return true;
        if (current.type === '3_pairs_straight') return true;
        if (current.type === 'quad' && attemptHighest > current.highestValue) return true;
    }
    
    if (type === '4_pairs_straight') {
        if (isSinglePig || isPairPig) return true;
        if (current.type === '3_pairs_straight' || current.type === 'quad') return true;
        if (current.type === '4_pairs_straight' && attemptHighest > current.highestValue) return true;
    }
    return false;
}
    
export function getBotPlay(hand: Card[], currentTable: PlayedCards | null, isMienBac: boolean = false): Card[] {
    const plays: Card[][] = [];
    const n = hand.length;
    
    // We can generate standard combinations: singles, pairs, triples, quads, straights.
    // Since hand length is max 13, it's very fast to just generate all valid types
    
    // 1. Singles
    for (const c of hand) plays.push([c]);
    
    // Group by rank
    const groups: Card[][] = [];
    hand.forEach(c => {
        const last = groups[groups.length - 1];
        if (last && last[0].rank === c.rank) last.push(c);
        else groups.push([c]);
    });
    
    // 2. Pairs, Triples, Quads
    groups.forEach(g => {
        if (g.length >= 2) {
            plays.push([g[0], g[1]]);
            if (g.length >= 3) plays.push([g[0], g[1], g[2]]);
            if (g.length >= 4) plays.push([g[0], g[1], g[2], g[3]]);
            // All combinations of pairs
            if (g.length === 3) {
                plays.push([g[0], g[2]]);
                plays.push([g[1], g[2]]);
            }
            if (g.length === 4) {
                plays.push([g[0], g[2]]);
                plays.push([g[0], g[3]]);
                plays.push([g[1], g[2]]);
                plays.push([g[1], g[3]]);
                plays.push([g[2], g[3]]);
            }
        }
    });

    // 3. Straights (length 3 to 13)
    // To handle Mien Bac (same suit), we can group cards by suit first
    if (isMienBac) {
        const suits: Suit[] = ['spades', 'clubs', 'diamonds', 'hearts'];
        suits.forEach(suit => {
            const suitCards = hand.filter(c => c.suit === suit).sort((a,b)=>a.value-b.value);
            for (let i = 0; i < suitCards.length; i++) {
                if (suitCards[i].rank === 15) continue;
                // build consecutive
                let currentStraight = [suitCards[i]];
                for (let j = i + 1; j < suitCards.length; j++) {
                    if (suitCards[j].rank === 15) break;
                    if (suitCards[j].rank === currentStraight[currentStraight.length-1].rank + 1) {
                        currentStraight.push(suitCards[j]);
                        if (currentStraight.length >= 3) plays.push([...currentStraight]);
                    } else if (suitCards[j].rank > currentStraight[currentStraight.length-1].rank + 1) {
                        break;
                    }
                }
            }
        });
    } else {
        // Mien Nam straights
        const uniqueRanks: Card[] = []; // actually we need all combinations of ranks
        // Since we want simple bot, we take best cards or lowest cards for straight. It's easiest to backtrack
        const straightStarts = groups.filter(g => g[0].rank !== 15);
        for (let i = 0; i < straightStarts.length; i++) {
            let straights = [ [straightStarts[i][0]] ]; // just pick the first one for simplicity 
            for (let j = i + 1; j < straightStarts.length; j++) {
                if (straightStarts[j][0].rank === straightStarts[j-1][0].rank + 1 && straightStarts[j][0].rank !== 15) {
                    straights[0].push(straightStarts[j][0]);
                    if (straights[0].length >= 3) plays.push([...straights[0]]);
                } else break;
            }
        }
    }
    
    // Filter out invalid plays
    const validPlays = plays.filter(p => canPlay(p, currentTable, isMienBac));
    
    if (validPlays.length === 0) return [];
    
    // Sort plays: if we have table, we want to play the lowest valid play to save high cards
    // If no table, play lowest card
    validPlays.sort((a, b) => Math.max(...a.map(c=>c.value)) - Math.max(...b.map(c=>c.value)));
    
    // If table is null, perhaps sometimes play pair or straight, but for now lowest single or 3 spades
    if (!currentTable) {
        const threeSpades = validPlays.find(p => p.length === 1 && p[0].id === '3_spades');
        if (threeSpades) return threeSpades;
        // preferring longer plays is usually better if they are low
        validPlays.sort((a, b) => {
           // sort by length descending, then high card ascending
           if (a.length !== b.length) return b.length - a.length;
           return Math.max(...a.map(c=>c.value)) - Math.max(...b.map(c=>c.value));
        });
        return validPlays[0];
    }
    
    return validPlays[0];
}