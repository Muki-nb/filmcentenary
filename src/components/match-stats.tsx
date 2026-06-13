import React from "react";
import Grid from "@material-ui/core/Grid";
import Paper from "@material-ui/core/Paper";
import Typography from "@material-ui/core/Typography";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableContainer from "@material-ui/core/TableContainer";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import Button from "@material-ui/core/Button";
import {getCardName} from "./card";
import i18n from "../constant/i18n";
import {BasicCardID, CardType, IEra, getCardById, Region} from "../types/core";
import {getColor} from "./icons";

interface IPlayerStatsRecord {
    playerID: string,
    seat: number,
    industry?: number,
    aesthetics?: number,
    finalScore?: number,
    allCards: string[],
}

interface IMatchStatsRecord {
    turnCount?: number,
    winner: string,
    players: IPlayerStatsRecord[],
}

interface ITurnStatsGroup {
    averageTurnCount: number,
    maxTurnCount: number,
    minTurnCount: number,
    recordedTurnGames: number,
}

interface ITurnStatsSummary {
    all: ITurnStatsGroup,
    p3: ITurnStatsGroup,
    p4: ITurnStatsGroup,
}

interface ITurnDistributionPoint {
    turnCount: number,
    sampleCount: number,
}

interface ISeatStatsRow {
    label: string,
    games: number,
    wins: number,
    winRate: number,
    avgRank: number,
    rankStdDev: number,
}

interface ISeatStatsGroup {
    p3: ISeatStatsRow[],
    p4: ISeatStatsRow[],
}

interface ICardStatsRow {
    cardID: string,
    games: number,
    wins: number,
    winRate: number,
    avgRank: number,
    rankStdDev: number,
}

interface ILevelThresholdRow {
    threshold: number,
    games: number,
    wins: number,
    winRate: number,
    avgRank: number,
    rankStdDev: number,
}

interface ILevelRelationStatsRow {
    relation: "industry_gt_aesthetics" | "aesthetics_gt_industry" | "industry_eq_aesthetics",
    label: string,
    games: number,
    wins: number,
    winRate: number,
    avgRank: number,
    rankStdDev: number,
    avgIndustryLevel?: number,
    avgAestheticsLevel?: number,
    winAvgIndustryLevel?: number,
    winAvgAestheticsLevel?: number,
}

interface IMatchCompositionStatsRow {
    composition: "3i1a" | "2i2a" | "1i3a",
    label: string,
    games: number,
    indWins: number,
    indWinRate: number,
    aesWins: number,
    aesWinRate: number,
}

type CardStatsFilterMode = "all" | "school" | "era1";
type RegionFilter = "all" | "EE" | "WE" | "NA" | "ASIA";
type EraFilter = "all" | "1" | "2" | "3";
type CardTypeFilter = "all" | "film" | "school" | "person";
type CardSortMode = "winRate" | "avgRank" | "games";
type StatsPanel = "turn" | "seat" | "level" | "card";
const NO_SCHOOL_CARD_ID = "__NO_SCHOOL__";

const seatLabels = ["1位", "2位", "3位", "4位"];
const levelThresholds = [5, 6, 7, 8, 9, 10];
const levelThresholdMin = 5;
const statsUrls = ["/api/match-stats", "/data/film-match-stats.jsonl"];
const sectionPaperStyle: React.CSSProperties = {
    padding: 12,
    borderRadius: 10,
};
const tableHeadRowStyle: React.CSSProperties = {
    backgroundColor: "#f5f7fb",
};
const topPanelStyle: React.CSSProperties = {
    padding: 16,
    borderRadius: 10,
    background: "linear-gradient(135deg, #f8fbff 0%, #f3f7ff 100%)",
};

const formatRate = (value: number): string => `${(value * 100).toFixed(1)}%`;

const calcStdDev = (sum: number, sqSum: number, n: number): number => {
    if (n <= 0) {
        return 0;
    }
    const mean = sum / n;
    const meanSq = sqSum / n;
    const variance = meanSq - mean * mean;
    const v = variance > 0 ? variance : 0;
    return Math.sqrt(v);
}

const formatStdDev = (value: number): string => `±${value.toFixed(3)}`;

const normalizeCardId = (raw: string): string => {
    return (raw || "").trim().toUpperCase();
}

const numericPart = (cardID: string): string | null => {
    const matched = normalizeCardId(cardID).match(/^[A-Z](\d+)$/);
    return matched ? matched[1] : null;
}

const isBasicCard = (cardID: string): boolean => {
    const normalized = normalizeCardId(cardID);
    if (normalized in BasicCardID) {
        return true;
    }
    return /^B\d+$/.test(normalized);
}

const isSchoolCard = (cardID: string): boolean => /^S\d+$/i.test(normalizeCardId(cardID));

const isFirstScoringCard = (cardID: string): boolean => {
    const normalized = normalizeCardId(cardID);
    const matched = normalized.match(/^V(\d+)$/);
    if (!matched) {
        return false;
    }
    return matched[1].endsWith("1");
}

const getCardType = (cardID: string): CardTypeFilter | "other" => {
    const normalized = normalizeCardId(cardID);
    if (normalized === NO_SCHOOL_CARD_ID) {
        return "school";
    }
    try {
        const card = getCardById(normalized);
        if (card.type === CardType.F) {
            return "film";
        }
        if (card.type === CardType.S) {
            return "school";
        }
        if (card.type === CardType.P) {
            return "person";
        }
        return "other";
    } catch {
        return "other";
    }
}

const getCardEra = (cardID: string): "1" | "2" | "3" | null => {
    const normalized = normalizeCardId(cardID);
    if (normalized === NO_SCHOOL_CARD_ID) {
        return null;
    }
    try {
        const card = getCardById(normalized) as any;
        if (card.era === IEra.ONE) {
            return "1";
        }
        if (card.era === IEra.TWO) {
            return "2";
        }
        if (card.era === IEra.THREE) {
            return "3";
        }
        return null;
    } catch {
        return null;
    }
}

const getCardRegion = (cardID: string): Region | null => {
    const normalized = normalizeCardId(cardID);
    if (normalized === NO_SCHOOL_CARD_ID) {
        return null;
    }
    try {
        return getCardById(normalized).region;
    } catch {
        const n = numericPart(normalized);
        if (!n) {
            return null;
        }
        try {
            return getCardById(`F${n}`).region;
        } catch {
            return null;
        }
    }
}

const safeCardName = (cardID: string): string => {
    const normalized = normalizeCardId(cardID);
    if (normalized === NO_SCHOOL_CARD_ID) {
        return "无流派";
    }
    try {
        const name = getCardName(normalized);
        if (!name.startsWith("Unknown id ")) {
            return name;
        }
        const n = numericPart(normalized);
        if (n && (n in i18n.card)) {
            // @ts-ignore
            return i18n.card[n];
        }
        if (normalized in i18n.card) {
            // @ts-ignore
            return i18n.card[normalized];
        }
        return name;
    } catch {
        const n = numericPart(normalized);
        if (n && (n in i18n.card)) {
            // @ts-ignore
            return i18n.card[n];
        }
        return normalized;
    }
};

const safeCardColor = (cardID: string): string | undefined => {
    const normalized = normalizeCardId(cardID);
    if (normalized === NO_SCHOOL_CARD_ID) {
        return getColor(Region.NONE);
    }
    try {
        const c = getCardById(normalized);
        return getColor(c.region);
    } catch {
        const n = numericPart(normalized);
        if (!n) {
            return undefined;
        }
        const maybeClassicCardID = `F${n}`;
        try {
            const c = getCardById(maybeClassicCardID);
            return getColor(c.region);
        } catch {
            return getColor(Region.NONE);
        }
    }
}

const parseJsonLines = (text: string): IMatchStatsRecord[] => {
    return text
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map(line => {
            try {
                return JSON.parse(line) as IMatchStatsRecord;
            } catch {
                return null;
            }
        })
        .filter((record): record is IMatchStatsRecord => {
            return !!record && typeof record.winner === "string" && Array.isArray(record.players);
        });
};

const buildRankMap = (record: IMatchStatsRecord): Map<string, number> => {
    const rankMap = new Map<string, number>();
    const playersWithScore = record.players
        .filter(player => typeof player.finalScore === "number" && Number.isFinite(player.finalScore))
        .map(player => ({
            playerID: player.playerID,
            finalScore: Number(player.finalScore),
        }))
        .sort((left, right) => {
            if (right.finalScore !== left.finalScore) {
                return right.finalScore - left.finalScore;
            }
            return left.playerID.localeCompare(right.playerID);
        });

    if (playersWithScore.length === 0) {
        return rankMap;
    }

    for (let i = 0; i < playersWithScore.length; i += 1) {
        rankMap.set(playersWithScore[i].playerID, i + 1);
    }

    return rankMap;
}

const buildSeatStats = (records: IMatchStatsRecord[]): ISeatStatsGroup => {
    const buckets3 = [0, 1, 2].map((seat) => ({
        label: `${seat + 1}位`,
        seat,
        games: 0,
        wins: 0,
        winRate: 0,
        avgRank: 0,
        rankStdDev: 0,
        rankSum: 0,
        rankSqSum: 0,
        rankGames: 0,
    }));

    const buckets4 = [0, 1, 2, 3].map((seat) => ({
        label: `${seat + 1}位`,
        seat,
        games: 0,
        wins: 0,
        winRate: 0,
        avgRank: 0,
        rankStdDev: 0,
        rankSum: 0,
        rankSqSum: 0,
        rankGames: 0,
    }));

    records.forEach(record => {
        const rankMap = buildRankMap(record);
        const playerCount = record.players.length;
        const buckets = playerCount === 3 ? buckets3 : (playerCount === 4 ? buckets4 : null);
        
        if (!buckets) return;

        record.players.forEach(player => {
            if (player.seat >= 0 && player.seat < buckets.length) {
                buckets[player.seat].games += 1;
                if (player.playerID === record.winner) {
                    buckets[player.seat].wins += 1;
                }
                const rank = rankMap.get(player.playerID);
                if (typeof rank === "number") {
                    buckets[player.seat].rankSum += rank;
                    buckets[player.seat].rankSqSum += rank * rank;
                    buckets[player.seat].rankGames += 1;
                }
            }
        });
    });

    return {
        p3: buckets3.map(bucket => ({
            ...bucket,
            winRate: bucket.games > 0 ? bucket.wins / bucket.games : 0,
            avgRank: bucket.rankGames > 0 ? bucket.rankSum / bucket.rankGames : 0,
            rankStdDev: calcStdDev(bucket.rankSum, bucket.rankSqSum, bucket.rankGames),
        })),
        p4: buckets4.map(bucket => ({
            ...bucket,
            winRate: bucket.games > 0 ? bucket.wins / bucket.games : 0,
            avgRank: bucket.rankGames > 0 ? bucket.rankSum / bucket.rankGames : 0,
            rankStdDev: calcStdDev(bucket.rankSum, bucket.rankSqSum, bucket.rankGames),
        })),
    };
};

const buildCardStats = (records: IMatchStatsRecord[], filterMode: CardStatsFilterMode): ICardStatsRow[] => {
    const cardMap = new Map<string, {games: number, wins: number, rankSum: number, rankSqSum: number, rankGames: number}>();

    records.forEach(record => {
        const rankMap = buildRankMap(record);
        record.players.forEach(player => {
            const uniqueCards = Array.from(new Set(player.allCards || []));

            if (filterMode === "school") {
                const schoolCards = uniqueCards
                    .map(cardID => normalizeCardId(cardID))
                    .filter(cardID => !!cardID)
                    .filter(cardID => isSchoolCard(cardID));
                const targets = schoolCards.length > 0 ? schoolCards : [NO_SCHOOL_CARD_ID];

                targets.forEach(cardID => {
                    const current = cardMap.get(cardID) ?? {games: 0, wins: 0, rankSum: 0, rankSqSum: 0, rankGames: 0};
                    current.games += 1;
                    if (player.playerID === record.winner) {
                        current.wins += 1;
                    }
                    const rank = rankMap.get(player.playerID);
                    if (typeof rank === "number") {
                        current.rankSum += rank;
                        current.rankSqSum += rank * rank;
                        current.rankGames += 1;
                    }
                    cardMap.set(cardID, current);
                });
                return;
            }

            uniqueCards.forEach(cardID => {
                const normalizedCardID = normalizeCardId(cardID);
                if (!normalizedCardID) {
                    return;
                }
                if (isBasicCard(normalizedCardID)) {
                    return;
                }
                if (filterMode === "era1" && !isFirstScoringCard(normalizedCardID)) {
                    return;
                }
                const current = cardMap.get(normalizedCardID) ?? {games: 0, wins: 0, rankSum: 0, rankSqSum: 0, rankGames: 0};
                current.games += 1;
                if (player.playerID === record.winner) {
                    current.wins += 1;
                }
                const rank = rankMap.get(player.playerID);
                if (typeof rank === "number") {
                    current.rankSum += rank;
                    current.rankSqSum += rank * rank;
                    current.rankGames += 1;
                }
                cardMap.set(normalizedCardID, current);
            });
        });
    });

    return Array.from(cardMap.entries())
        .map(([cardID, stat]) => ({
            cardID,
            games: stat.games,
            wins: stat.wins,
            winRate: stat.games > 0 ? stat.wins / stat.games : 0,
            avgRank: stat.rankGames > 0 ? stat.rankSum / stat.rankGames : 0,
            rankStdDev: calcStdDev(stat.rankSum, stat.rankSqSum, stat.rankGames),
        }))
        .sort((left, right) => {
            if (right.winRate !== left.winRate) {
                return right.winRate - left.winRate;
            }
            if (left.avgRank !== right.avgRank) {
                return left.avgRank - right.avgRank;
            }
            if (right.games !== left.games) {
                return right.games - left.games;
            }
            return left.cardID.localeCompare(right.cardID);
        });
};

const buildTurnStatsGroup = (turnCounts: number[]): ITurnStatsGroup => {
    if (turnCounts.length === 0) {
        return {
            averageTurnCount: 0,
            maxTurnCount: 0,
            minTurnCount: 0,
            recordedTurnGames: 0,
        };
    }

    const totalTurnCount = turnCounts.reduce((sum, turnCount) => sum + turnCount, 0);
    return {
        averageTurnCount: totalTurnCount / turnCounts.length,
        maxTurnCount: Math.max(...turnCounts),
        minTurnCount: Math.min(...turnCounts),
        recordedTurnGames: turnCounts.length,
    };
}

const buildTurnStats = (records: IMatchStatsRecord[]): ITurnStatsSummary => {
    const defaultStats: ITurnStatsSummary = {
        all: buildTurnStatsGroup([]),
        p3: buildTurnStatsGroup([]),
        p4: buildTurnStatsGroup([]),
    };

    const allTurnCounts: number[] = [];
    const p3TurnCounts: number[] = [];
    const p4TurnCounts: number[] = [];

    records.forEach(record => {
        const turnCount = record.turnCount;
        if (typeof turnCount === "number" && turnCount > 0) {
            allTurnCounts.push(turnCount);
            if (record.players.length === 3) {
                p3TurnCounts.push(turnCount);
            } else if (record.players.length === 4) {
                p4TurnCounts.push(turnCount);
            }
        }
    });

    return {
        all: buildTurnStatsGroup(allTurnCounts),
        p3: buildTurnStatsGroup(p3TurnCounts),
        p4: buildTurnStatsGroup(p4TurnCounts),
    };
};

interface ITurnDistributionGroup {
    all: ITurnDistributionPoint[],
    p3: ITurnDistributionPoint[],
    p4: ITurnDistributionPoint[],
}

const buildTurnDistributionList = (records: IMatchStatsRecord[]): ITurnDistributionPoint[] => {
    const counter = new Map<number, number>();
    records.forEach(record => {
        const t = record.turnCount;
        if (typeof t === "number" && t > 0 && Number.isFinite(t)) {
            const rounded = Math.round(t);
            counter.set(rounded, (counter.get(rounded) || 0) + 1);
        }
    });

    return Array.from(counter.entries())
        .map(([turnCount, sampleCount]) => ({turnCount, sampleCount}))
        .sort((a, b) => a.turnCount - b.turnCount);
}

const buildTurnDistribution = (records: IMatchStatsRecord[]): ITurnDistributionGroup => {
    return {
        all: buildTurnDistributionList(records),
        p3: buildTurnDistributionList(records.filter(r => r.players.length === 3)),
        p4: buildTurnDistributionList(records.filter(r => r.players.length === 4)),
    };
}

const buildLevelThresholdStats = (
    records: IMatchStatsRecord[],
    selector: (player: IPlayerStatsRecord) => number | undefined,
): ILevelThresholdRow[] => {
    const entries: Array<{ value: number, isWin: boolean, rank?: number }> = [];
    const winnerValues: number[] = [];

    records.forEach(record => {
        const rankMap = buildRankMap(record);
        record.players.forEach(player => {
            const value = selector(player);
            if (typeof value !== "number" || !Number.isFinite(value)) {
                return;
            }
            entries.push({
                value,
                isWin: player.playerID === record.winner,
                rank: rankMap.get(player.playerID),
            });

            if (player.playerID === record.winner) {
                winnerValues.push(value);
            }
        });
    });

    const totalGames = winnerValues.length;

    return levelThresholds.map(threshold => {
        let games = 0;
        let wins = 0;
        let rankSum = 0;
        let rankSqSum = 0;
        let rankGames = 0;

        entries.forEach(entry => {
            if (entry.value >= levelThresholdMin && entry.value <= threshold) {
                games += 1;
                if (entry.isWin) {
                    wins += 1;
                }
                if (typeof entry.rank === "number") {
                    rankSum += entry.rank;
                    rankSqSum += entry.rank * entry.rank;
                    rankGames += 1;
                }
            }
        });

        return {
            threshold,
            games,
            wins,
            // 使用统一分母（全部有效对局），保证“某等级冠军占比”的累计可加。
            winRate: totalGames > 0
                ? winnerValues.filter(value => value >= levelThresholdMin && value <= threshold).length / totalGames
                : 0,
            avgRank: rankGames > 0 ? rankSum / rankGames : 0,
            rankStdDev: calcStdDev(rankSum, rankSqSum, rankGames),
        };
    });
}

const getIndustryAestheticsRelation = (player: IPlayerStatsRecord): ILevelRelationStatsRow["relation"] | null => {
    if (typeof player.industry !== "number" || !Number.isFinite(player.industry)) {
        return null;
    }
    if (typeof player.aesthetics !== "number" || !Number.isFinite(player.aesthetics)) {
        return null;
    }
    if (player.industry > player.aesthetics) {
        return "industry_gt_aesthetics";
    }
    if (player.aesthetics > player.industry) {
        return "aesthetics_gt_industry";
    }
    return "industry_eq_aesthetics";
}

const buildIndustryAestheticsRelationStats = (records: IMatchStatsRecord[]): ILevelRelationStatsRow[] => {
    const rows: ILevelRelationStatsRow[] = [
        {relation: "industry_gt_aesthetics", label: "工业 > 美学", games: 0, wins: 0, winRate: 0, avgRank: 0, rankStdDev: 0, avgIndustryLevel: 0, avgAestheticsLevel: 0},
        {relation: "aesthetics_gt_industry", label: "美学 > 工业", games: 0, wins: 0, winRate: 0, avgRank: 0, rankStdDev: 0, avgIndustryLevel: 0, avgAestheticsLevel: 0},
        {relation: "industry_eq_aesthetics", label: "工业 = 美学", games: 0, wins: 0, winRate: 0, avgRank: 0, rankStdDev: 0, avgIndustryLevel: 0, avgAestheticsLevel: 0},
    ];

    const rowMap = new Map<ILevelRelationStatsRow["relation"], {games: number, rankSum: number, rankSqSum: number, rankGames: number, industrySum: number, aestheticsSum: number}>([
        ["industry_gt_aesthetics", {games: 0, rankSum: 0, rankSqSum: 0, rankGames: 0, industrySum: 0, aestheticsSum: 0}],
        ["aesthetics_gt_industry", {games: 0, rankSum: 0, rankSqSum: 0, rankGames: 0, industrySum: 0, aestheticsSum: 0}],
        ["industry_eq_aesthetics", {games: 0, rankSum: 0, rankSqSum: 0, rankGames: 0, industrySum: 0, aestheticsSum: 0}],
    ]);

    const winnerRelations: ILevelRelationStatsRow["relation"][] = [];
    const winnerLevelMap = new Map<ILevelRelationStatsRow["relation"], {winIndustrySum: number, winAestheticsSum: number, wins: number}>([
        ["industry_gt_aesthetics", {winIndustrySum: 0, winAestheticsSum: 0, wins: 0}],
        ["aesthetics_gt_industry", {winIndustrySum: 0, winAestheticsSum: 0, wins: 0}],
        ["industry_eq_aesthetics", {winIndustrySum: 0, winAestheticsSum: 0, wins: 0}],
    ]);

    records.forEach(record => {
        const rankMap = buildRankMap(record);
        record.players.forEach(player => {
            const relation = getIndustryAestheticsRelation(player);
            if (!relation) {
                return;
            }
            const bucket = rowMap.get(relation)!;
            bucket.games += 1;
            bucket.industrySum += player.industry as number;
            bucket.aestheticsSum += player.aesthetics as number;
            const rank = rankMap.get(player.playerID);
            if (typeof rank === "number") {
                bucket.rankSum += rank;
                bucket.rankSqSum += rank * rank;
                bucket.rankGames += 1;
            }
            if (player.playerID === record.winner) {
                winnerRelations.push(relation);
                const winnerBucket = winnerLevelMap.get(relation)!;
                winnerBucket.wins += 1;
                winnerBucket.winIndustrySum += player.industry as number;
                winnerBucket.winAestheticsSum += player.aesthetics as number;
            }
        });
    });

    const totalGames = winnerRelations.length;

    return rows.map(row => {
        const bucket = rowMap.get(row.relation)!;
        const wins = winnerRelations.filter(relation => relation === row.relation).length;
        const winnerBucket = winnerLevelMap.get(row.relation)!;
        return {
            ...row,
            games: bucket.games,
            wins,
            winRate: totalGames > 0 ? wins / totalGames : 0,
            avgRank: bucket.rankGames > 0 ? bucket.rankSum / bucket.rankGames : 0,
            rankStdDev: calcStdDev(bucket.rankSum, bucket.rankSqSum, bucket.rankGames),
            avgIndustryLevel: bucket.games > 0 ? bucket.industrySum / bucket.games : 0,
            avgAestheticsLevel: bucket.games > 0 ? bucket.aestheticsSum / bucket.games : 0,
            winAvgIndustryLevel: winnerBucket.wins > 0 ? winnerBucket.winIndustrySum / winnerBucket.wins : 0,
            winAvgAestheticsLevel: winnerBucket.wins > 0 ? winnerBucket.winAestheticsSum / winnerBucket.wins : 0,
        };
    });
}

const buildCompositionStats = (records: IMatchStatsRecord[]): IMatchCompositionStatsRow[] => {
    const defaultStats: Record<string, {games: number, indWins: number, aesWins: number}> = {
        "3i1a": {games: 0, indWins: 0, aesWins: 0},
        "2i2a": {games: 0, indWins: 0, aesWins: 0},
        "1i3a": {games: 0, indWins: 0, aesWins: 0},
    };

    records.forEach(record => {
        let indCount = 0;
        let aesCount = 0;
        let winnerRelation: "ind" | "aes" | "eq" | null = null;
        for (const player of record.players) {
            const rel = getIndustryAestheticsRelation(player);
            if (rel === "industry_gt_aesthetics") {
                indCount++;
            } else if (rel === "aesthetics_gt_industry") {
                aesCount++;
            }
            if (player.playerID === record.winner) {
                if (rel === "industry_gt_aesthetics") {
                    winnerRelation = "ind";
                } else if (rel === "aesthetics_gt_industry") {
                    winnerRelation = "aes";
                } else if (rel === "industry_eq_aesthetics") {
                    winnerRelation = "eq";
                }
            }
        }

        let comp: string | null = null;
        if (indCount === 3 && aesCount === 1) {
            comp = "3i1a";
        } else if (indCount === 2 && aesCount === 2) {
            comp = "2i2a";
        } else if (indCount === 1 && aesCount === 3) {
            comp = "1i3a";
        }

        if (comp) {
            defaultStats[comp].games++;
            if (winnerRelation === "ind") {
                defaultStats[comp].indWins++;
            } else if (winnerRelation === "aes") {
                defaultStats[comp].aesWins++;
            }
        }
    });

    const toRow = (comp: "3i1a" | "2i2a" | "1i3a", label: string): IMatchCompositionStatsRow => {
        const stats = defaultStats[comp];
        return {
            composition: comp,
            label,
            games: stats.games,
            indWins: stats.indWins,
            indWinRate: stats.games > 0 ? stats.indWins / stats.games : 0,
            aesWins: stats.aesWins,
            aesWinRate: stats.games > 0 ? stats.aesWins / stats.games : 0,
        };
    };

    return [
        toRow("3i1a", "3工1美"),
        toRow("2i2a", "2工2美"),
        toRow("1i3a", "1工3美"),
    ];
}

const MatchStatsPage = () => {
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState("");
    const [records, setRecords] = React.useState<IMatchStatsRecord[]>([]);
    const [seatStats, setSeatStats] = React.useState<ISeatStatsGroup>({p3: [], p4: []});
    const [cardStatsFilterMode, setCardStatsFilterMode] = React.useState<CardStatsFilterMode>("all");
    const [cardRegionFilter, setCardRegionFilter] = React.useState<RegionFilter>("all");
    const [cardEraFilter, setCardEraFilter] = React.useState<EraFilter>("all");
    const [cardTypeFilter, setCardTypeFilter] = React.useState<CardTypeFilter>("all");
    const [cardSortMode, setCardSortMode] = React.useState<CardSortMode>("winRate");
    const [turnStats, setTurnStats] = React.useState<ITurnStatsSummary>({
        all: buildTurnStatsGroup([]),
        p3: buildTurnStatsGroup([]),
        p4: buildTurnStatsGroup([]),
    });
    const [recordCount, setRecordCount] = React.useState(0);
    const [activePanel, setActivePanel] = React.useState<StatsPanel>("turn");

    const loadStats = React.useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            let loadedText = "";
            let loadedFrom = "";
            let lastError = "";

            for (const url of statsUrls) {
                try {
                    const response = await fetch(url, {cache: "no-store"});
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}`);
                    }
                    loadedText = await response.text();
                    loadedFrom = url;
                    break;
                } catch (err) {
                    lastError = `${err}`;
                }
            }

            if (!loadedText) {
                throw new Error(lastError || "no stats source available");
            }

            const records = parseJsonLines(loadedText);
            setRecords(records);
            setRecordCount(records.length);
            setSeatStats(buildSeatStats(records));
            setTurnStats(buildTurnStats(records));
            setError(loadedFrom === "/api/match-stats" ? "" : "暂无可用数据");
        } catch (err) {
            setRecords([]);
            setRecordCount(0);
            setSeatStats({p3: [], p4: []});
            setTurnStats({
                all: buildTurnStatsGroup([]),
                p3: buildTurnStatsGroup([]),
                p4: buildTurnStatsGroup([]),
            });
            setError(`暂无可用数据`);
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        loadStats().then(() => {});
    }, [loadStats]);

    const cardStats = React.useMemo(() => {
        const rows = buildCardStats(records, cardStatsFilterMode)
            .filter(row => {
                if (cardTypeFilter !== "all") {
                    const type = getCardType(row.cardID);
                    if (type !== cardTypeFilter) {
                        return false;
                    }
                }

                if (cardEraFilter !== "all") {
                    const era = getCardEra(row.cardID);
                    if (era !== cardEraFilter) {
                        return false;
                    }
                }

                if (cardRegionFilter !== "all") {
                    const region = getCardRegion(row.cardID);
                    if (region == null) {
                        return false;
                    }
                    const regionMatched =
                        (cardRegionFilter === "EE" && region === Region.EE)
                        || (cardRegionFilter === "WE" && region === Region.WE)
                        || (cardRegionFilter === "NA" && region === Region.NA)
                        || (cardRegionFilter === "ASIA" && region === Region.ASIA);
                    if (!regionMatched) {
                        return false;
                    }
                }

                return true;
            });

        return rows.sort((left, right) => {
            if (cardSortMode === "games") {
                if (right.games !== left.games) {
                    return right.games - left.games;
                }
                if (right.winRate !== left.winRate) {
                    return right.winRate - left.winRate;
                }
                if (left.avgRank !== right.avgRank) {
                    return left.avgRank - right.avgRank;
                }
                return left.cardID.localeCompare(right.cardID);
            }

            if (cardSortMode === "avgRank") {
                if (left.avgRank !== right.avgRank) {
                    return left.avgRank - right.avgRank;
                }
                if (right.winRate !== left.winRate) {
                    return right.winRate - left.winRate;
                }
                if (right.games !== left.games) {
                    return right.games - left.games;
                }
                return left.cardID.localeCompare(right.cardID);
            }

            if (right.winRate !== left.winRate) {
                return right.winRate - left.winRate;
            }
            if (left.avgRank !== right.avgRank) {
                return left.avgRank - right.avgRank;
            }
            if (right.games !== left.games) {
                return right.games - left.games;
            }
            return left.cardID.localeCompare(right.cardID);
        });
    }, [records, cardStatsFilterMode, cardTypeFilter, cardEraFilter, cardRegionFilter, cardSortMode]);

    const turnDistribution = React.useMemo(() => {
        return buildTurnDistribution(records);
    }, [records]);

    const industryThresholdStats = React.useMemo(() => {
        return buildLevelThresholdStats(records, player => player.industry);
    }, [records]);

    const aestheticsThresholdStats = React.useMemo(() => {
        return buildLevelThresholdStats(records, player => player.aesthetics);
    }, [records]);

    const industryAestheticsRelationStats = React.useMemo(() => {
        return buildIndustryAestheticsRelationStats(records);
    }, [records]);

    const compositionStats = React.useMemo(() => {
        return buildCompositionStats(records);
    }, [records]);

    const allIndustryAestheticsRelationStats = React.useMemo(() => {
        return industryAestheticsRelationStats.map(row => {
            if (row.relation === "industry_gt_aesthetics") {
                return {...row, label: "工业>美学"};
            }
            if (row.relation === "aesthetics_gt_industry") {
                return {...row, label: "美学>工业"};
            }
            return {...row, label: "美学=工业"};
        });
    }, [industryAestheticsRelationStats]);

    const renderDistributionChart = (chart: ReturnType<typeof buildChart>, title: string) => {
        return <Grid item xs={12}>
            <Typography variant="body2" color="textSecondary" style={{marginTop: 16, marginBottom: 4}}>
                {title}
            </Typography>
            {chart ? <div style={{width: "100%", overflowX: "auto"}}>
                <svg
                    viewBox={`0 0 ${chart.width} ${chart.height}`}
                    preserveAspectRatio="xMidYMid meet"
                    style={{width: "100%", height: "auto", minWidth: 420, aspectRatio: `${chart.width} / ${chart.height}`, background: "#fbfcff", border: "1px solid #eef2f7", borderRadius: 8}}
                >
                    {chart.yTicks.map((tick, idx) => <g key={`yt-${idx}`}>
                        <line
                            x1={chart.left}
                            y1={tick.y}
                            x2={chart.width - chart.right}
                            y2={tick.y}
                            stroke="#e7ecf4"
                            strokeWidth="1"
                        />
                        <text
                            x={chart.left - 8}
                            y={tick.y + 4}
                            textAnchor="end"
                            fill="#a8b5c9"
                            fontSize="11"
                        >
                            {tick.value}
                        </text>
                    </g>)}

                    <polyline
                        fill="none"
                        stroke="#4a8bf5"
                        strokeWidth="3"
                        strokeLinejoin="round"
                        points={chart.polyline}
                    />

                    {chart.points.map(point => <g key={`p-${point.turnCount}`}>
                        <circle cx={point.x} cy={point.y} r="4" fill="#ffffff" stroke="#4a8bf5" strokeWidth="2" />
                        <title>{point.turnCount} 回合: {point.sampleCount} 局</title>
                    </g>)}

                    <text x={chart.left} y={chart.height - 8} fill="#7f8da3" fontSize="11">
                        {chart.minX} 回合
                    </text>
                    <text
                        x={chart.width - chart.right}
                        y={chart.height - 8}
                        textAnchor="end"
                        fill="#7f8da3"
                        fontSize="11"
                    >
                        {chart.maxX} 回合
                    </text>
                </svg>
            </div> : <Typography color="textSecondary">暂无回合样本。</Typography>}
        </Grid>;
    };

    const buildChart = (dist: ITurnDistributionPoint[]) => {
        if (dist.length === 0) return null;
        const width = 880;
        const height = 220;
        const left = 44;
        const right = 16;
        const top = 12;
        const bottom = 30;
        const plotWidth = width - left - right;
        const plotHeight = height - top - bottom;

        const minX = dist[0].turnCount;
        const maxX = dist[dist.length - 1].turnCount;
        const maxY = Math.max(...dist.map(p => p.sampleCount));

        const xRange = Math.max(1, maxX - minX);
        const yRange = Math.max(1, maxY);

        const points = dist.map(p => {
            const x = left + ((p.turnCount - minX) / xRange) * plotWidth;
            const y = top + (1 - p.sampleCount / yRange) * plotHeight;
            return {...p, x, y};
        });

        const polyline = points.map(p => `${p.x},${p.y}`).join(" ");
        const yTicks = [0, 0.25, 0.5, 0.75, 1].map(r => ({
            y: top + (1 - r) * plotHeight,
            value: Math.round(r * yRange),
        }));

        return {width, height, left, right, top, bottom, points, polyline, yTicks, minX, maxX};
    };

    const turnDistributionCharts = React.useMemo(() => {
        return {
            all: buildChart(turnDistribution.all),
            p3: buildChart(turnDistribution.p3),
            p4: buildChart(turnDistribution.p4),
        };
    }, [turnDistribution]);

    const resetCardFilters = React.useCallback(() => {
        setCardStatsFilterMode("all");
        setCardRegionFilter("all");
        setCardEraFilter("all");
        setCardTypeFilter("all");
        setCardSortMode("winRate");
    }, []);

    return <Grid container spacing={2} style={{paddingBottom: 16}}>
        <Grid item xs={12}>
            <Paper>
                <div style={topPanelStyle}>
                    <Typography variant="h4" component="h1">对局数据</Typography>
                    <Typography variant="body2" color="textSecondary">
                        当前记录数：{recordCount}
                    </Typography>
                </div>
            </Paper>
        </Grid>
        <Grid item xs={12}>
            <Button variant="contained" color="primary" onClick={loadStats} disabled={loading}>
                {loading ? "读取中..." : "重新读取"}
            </Button>
        </Grid>
        <Grid item xs={12}>
            <Paper>
                <Grid container spacing={1} style={{padding: 12}}>
                    <Grid item>
                        <Button
                            size="small"
                            variant={activePanel === "turn" ? "contained" : "outlined"}
                            color="primary"
                            onClick={() => setActivePanel("turn")}
                        >
                            回合数据
                        </Button>
                    </Grid>
                    <Grid item>
                        <Button
                            size="small"
                            variant={activePanel === "seat" ? "contained" : "outlined"}
                            color="primary"
                            onClick={() => setActivePanel("seat")}
                        >
                            位次胜率
                        </Button>
                    </Grid>
                    <Grid item>
                        <Button
                            size="small"
                            variant={activePanel === "level" ? "contained" : "outlined"}
                            color="primary"
                            onClick={() => setActivePanel("level")}
                        >
                            等级数据
                        </Button>
                    </Grid>
                    <Grid item>
                        <Button
                            size="small"
                            variant={activePanel === "card" ? "contained" : "outlined"}
                            color="primary"
                            onClick={() => setActivePanel("card")}
                        >
                            卡牌数据
                        </Button>
                    </Grid>
                </Grid>
            </Paper>
        </Grid>
        {activePanel === "turn" ? <Grid item xs={12}>
            <Paper>
                <Grid container spacing={1} style={{...sectionPaperStyle, padding: 16}}>
                    <Grid item xs={12}>
                        <Typography variant="h6" component="h2">回合统计</Typography>
                    </Grid>

                    <Grid item xs={12}>
                        <Typography variant="subtitle1" style={{marginTop: 8, fontWeight: "bold"}}>4人局</Typography>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <Typography>平均回合数：{turnStats.p4.recordedTurnGames > 0 ? turnStats.p4.averageTurnCount.toFixed(2) : "-"}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <Typography>最短回合：{turnStats.p4.recordedTurnGames > 0 ? turnStats.p4.minTurnCount.toFixed(2) : "-"}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <Typography>最长回合：{turnStats.p4.recordedTurnGames > 0 ? turnStats.p4.maxTurnCount.toFixed(2) : "-"}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <Typography>含回合数据对局：{turnStats.p4.recordedTurnGames}</Typography>
                    </Grid>

                    {renderDistributionChart(turnDistributionCharts.p4, "4人局回合分布图")}

                    <Grid item xs={12}>
                        <Typography variant="subtitle1" style={{marginTop: 8, fontWeight: "bold"}}>3人局</Typography>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <Typography>平均回合数：{turnStats.p3.recordedTurnGames > 0 ? turnStats.p3.averageTurnCount.toFixed(2) : "-"}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <Typography>最短回合：{turnStats.p3.recordedTurnGames > 0 ? turnStats.p3.minTurnCount.toFixed(2) : "-"}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <Typography>最长回合：{turnStats.p3.recordedTurnGames > 0 ? turnStats.p3.maxTurnCount.toFixed(2) : "-"}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <Typography>含回合数据对局：{turnStats.p3.recordedTurnGames}</Typography>
                    </Grid>

                    {renderDistributionChart(turnDistributionCharts.p3, "3人局回合分布图")}
                </Grid>
            </Paper>
        </Grid> : <></>}
        {error ? <Grid item xs={12}>
            <Paper>
                <Grid container style={{padding: 16}}>
                    <Grid item xs={12}>
                        <Typography color="error">{error}</Typography>
                    </Grid>
                </Grid>
            </Paper>
        </Grid> : <></>}
        {activePanel === "seat" ? <Grid item xs={12}>
            <Paper>
                <Grid container style={sectionPaperStyle}>
                    <Grid item xs={12}>
                        <Typography variant="h6" component="h2" style={{marginBottom: 8}}>位次胜率</Typography>
                    </Grid>
                </Grid>
                
                <Grid container style={{...sectionPaperStyle, paddingTop: 0}}>
                    <Grid item xs={12}>
                        <Typography variant="subtitle1" component="h3" style={{marginTop: 8}}>4人局位次胜率</Typography>
                    </Grid>
                </Grid>
                <TableContainer>
                    <Table size="small" aria-label="4 player seat win rates">
                        <TableHead>
                            <TableRow style={tableHeadRowStyle}>
                                <TableCell>位次</TableCell>
                                <TableCell>胜率</TableCell>
                                <TableCell>平均名次</TableCell>
                                <TableCell>位次标准差</TableCell>
                                <TableCell>胜场</TableCell>
                                <TableCell>样本</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {seatStats.p4.map((row, idx) => <TableRow key={row.label} hover style={{backgroundColor: idx % 2 === 0 ? "#ffffff" : "#fafafa"}}>
                                <TableCell>{row.label}</TableCell>
                                <TableCell>{row.games > 0 ? formatRate(row.winRate) : "-"}</TableCell>
                                <TableCell>{row.games > 0 ? row.avgRank.toFixed(2) : "-"}</TableCell>
                                <TableCell>{row.games > 0 ? formatStdDev(row.rankStdDev) : "-"}</TableCell>
                                <TableCell>{row.wins}</TableCell>
                                <TableCell>{row.games}</TableCell>
                            </TableRow>)}
                        </TableBody>
                    </Table>
                </TableContainer>

                <Grid container style={{...sectionPaperStyle, paddingTop: 16}}>
                    <Grid item xs={12}>
                        <Typography variant="subtitle1" component="h3" style={{marginTop: 8}}>3人局位次胜率</Typography>
                    </Grid>
                </Grid>
                <TableContainer>
                    <Table size="small" aria-label="3 player seat win rates">
                        <TableHead>
                            <TableRow style={tableHeadRowStyle}>
                                <TableCell>位次</TableCell>
                                <TableCell>胜率</TableCell>
                                <TableCell>平均名次</TableCell>
                                <TableCell>位次标准差</TableCell>
                                <TableCell>胜场</TableCell>
                                <TableCell>样本</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {seatStats.p3.map((row, idx) => <TableRow key={row.label} hover style={{backgroundColor: idx % 2 === 0 ? "#ffffff" : "#fafafa"}}>
                                <TableCell>{row.label}</TableCell>
                                <TableCell>{row.games > 0 ? formatRate(row.winRate) : "-"}</TableCell>
                                <TableCell>{row.games > 0 ? row.avgRank.toFixed(2) : "-"}</TableCell>
                                <TableCell>{row.games > 0 ? formatStdDev(row.rankStdDev) : "-"}</TableCell>
                                <TableCell>{row.wins}</TableCell>
                                <TableCell>{row.games}</TableCell>
                            </TableRow>)}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Grid> : <></>}
        {activePanel === "level" ? <Grid item xs={12}>
            <Paper>
                <Grid container style={sectionPaperStyle}>
                    <Grid item xs={12}>
                        <Typography variant="h6" component="h2">工美等级统计（5~X）</Typography>
                    </Grid>
                </Grid>
                <TableContainer>
                    <Table size="small" aria-label="industry aesthetics threshold stats">
                        <TableHead>
                            <TableRow style={tableHeadRowStyle}>
                                <TableCell>区间</TableCell>
                                <TableCell>工业胜率</TableCell>
                                <TableCell>工业平均顺位</TableCell>
                                <TableCell>工业位次标准差</TableCell>
                                <TableCell>工业场次</TableCell>
                                <TableCell>美学胜率</TableCell>
                                <TableCell>美学平均顺位</TableCell>
                                <TableCell>美学位次标准差</TableCell>
                                <TableCell>美学场次</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {levelThresholds.map((threshold, idx) => {
                                const industryRow = industryThresholdStats[idx];
                                const aestheticsRow = aestheticsThresholdStats[idx];
                                return <TableRow key={`lv-${threshold}`} hover style={{backgroundColor: idx % 2 === 0 ? "#ffffff" : "#fafafa"}}>
                                    <TableCell>{`5~${threshold}`}</TableCell>
                                    <TableCell>{industryRow.games > 0 ? formatRate(industryRow.winRate) : "-"}</TableCell>
                                    <TableCell>{industryRow.games > 0 ? industryRow.avgRank.toFixed(2) : "-"}</TableCell>
                                    <TableCell>{industryRow.games > 0 ? formatStdDev(industryRow.rankStdDev) : "-"}</TableCell>
                                    <TableCell>{industryRow.games}</TableCell>
                                    <TableCell>{aestheticsRow.games > 0 ? formatRate(aestheticsRow.winRate) : "-"}</TableCell>
                                    <TableCell>{aestheticsRow.games > 0 ? aestheticsRow.avgRank.toFixed(2) : "-"}</TableCell>
                                    <TableCell>{aestheticsRow.games > 0 ? formatStdDev(aestheticsRow.rankStdDev) : "-"}</TableCell>
                                    <TableCell>{aestheticsRow.games}</TableCell>
                                </TableRow>;
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>

                <Grid container style={{...sectionPaperStyle, paddingTop: 0}}>
                    <Grid item xs={12}>
                        <Typography variant="subtitle1" component="h3" style={{marginTop: 8}}>所有工美统计</Typography>
                    </Grid>
                </Grid>
                <TableContainer>
                    <Table size="small" aria-label="all industry aesthetics relation stats">
                        <TableHead>
                            <TableRow style={tableHeadRowStyle}>
                                <TableCell>关系</TableCell>
                                <TableCell>样本量</TableCell>
                                <TableCell>获胜场次</TableCell>
                                <TableCell>平均工业等级</TableCell>
                                <TableCell>平均美学等级</TableCell>
                                <TableCell>获胜平均工业等级</TableCell>
                                <TableCell>获胜平均美学等级</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {allIndustryAestheticsRelationStats.map((row, idx) => <TableRow key={`all-${row.relation}`} hover style={{backgroundColor: idx % 2 === 0 ? "#ffffff" : "#fafafa"}}>
                                <TableCell>{row.label}</TableCell>
                                <TableCell>{row.games}</TableCell>
                                <TableCell>{row.wins}</TableCell>
                                <TableCell>{row.relation === "industry_eq_aesthetics" || row.games <= 0 ? "-" : (row.avgIndustryLevel as number).toFixed(2)}</TableCell>
                                <TableCell>{row.relation === "industry_eq_aesthetics" || row.games <= 0 ? "-" : (row.avgAestheticsLevel as number).toFixed(2)}</TableCell>
                                <TableCell>{row.relation === "industry_eq_aesthetics" || row.wins <= 0 ? "-" : (row.winAvgIndustryLevel as number).toFixed(2)}</TableCell>
                                <TableCell>{row.relation === "industry_eq_aesthetics" || row.wins <= 0 ? "-" : (row.winAvgAestheticsLevel as number).toFixed(2)}</TableCell>
                            </TableRow>)}
                        </TableBody>
                    </Table>
                </TableContainer>

                <Grid container style={{...sectionPaperStyle, paddingTop: 0}}>
                    <Grid item xs={12}>
                        <Typography variant="subtitle1" component="h3" style={{marginTop: 8}}>最终工美关系统计</Typography>
                    </Grid>
                </Grid>
                <TableContainer>
                    <Table size="small" aria-label="industry aesthetics relation stats">
                        <TableHead>
                            <TableRow style={tableHeadRowStyle}>
                                <TableCell>关系</TableCell>
                                <TableCell>胜率</TableCell>
                                <TableCell>平均顺位</TableCell>
                                <TableCell>位次标准差</TableCell>
                                <TableCell>场次</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {industryAestheticsRelationStats.map((row, idx) => <TableRow key={row.relation} hover style={{backgroundColor: idx % 2 === 0 ? "#ffffff" : "#fafafa"}}>
                                <TableCell>{row.label}</TableCell>
                                <TableCell>{formatRate(row.winRate)}</TableCell>
                                <TableCell>{row.games > 0 ? row.avgRank.toFixed(2) : "-"}</TableCell>
                                <TableCell>{row.games > 0 ? formatStdDev(row.rankStdDev) : "-"}</TableCell>
                                <TableCell>{row.games}</TableCell>
                            </TableRow>)}
                        </TableBody>
                    </Table>
                </TableContainer>

                <Grid container style={{...sectionPaperStyle, paddingTop: 0}}>
                    <Grid item xs={12}>
                        <Typography variant="subtitle1" component="h3" style={{marginTop: 8}}>对局工美环境划分</Typography>
                    </Grid>
                </Grid>
                <TableContainer>
                    <Table size="small" aria-label="match composition stats">
                        <TableHead>
                            <TableRow style={tableHeadRowStyle}>
                                <TableCell>对局类型</TableCell>
                                <TableCell>对局数</TableCell>
                                <TableCell>工业获胜次数</TableCell>
                                <TableCell>美学获胜次数</TableCell>
                                <TableCell>工业胜率</TableCell>
                                <TableCell>美学胜率</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {compositionStats.map((row, idx) => <TableRow key={row.composition} hover style={{backgroundColor: idx % 2 === 0 ? "#ffffff" : "#fafafa"}}>
                                <TableCell>{row.label}</TableCell>
                                <TableCell>{row.games}</TableCell>
                                <TableCell>{row.indWins}</TableCell>
                                <TableCell>{row.aesWins}</TableCell>
                                <TableCell>{row.games > 0 ? formatRate(row.indWinRate) : "-"}</TableCell>
                                <TableCell>{row.games > 0 ? formatRate(row.aesWinRate) : "-"}</TableCell>
                            </TableRow>)}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Grid> : <></>}
        {activePanel === "card" ? <Grid item xs={12}>
            <Paper>
                <Grid container style={sectionPaperStyle}>
                    <Grid item xs={12} sm={6}>
                        <Typography variant="h6" component="h2">卡牌胜率</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} style={{textAlign: "right"}}>
                        <Button
                            size="small"
                            variant={cardStatsFilterMode === "all" ? "contained" : "outlined"}
                            color="primary"
                            onClick={() => setCardStatsFilterMode("all")}
                            style={{marginRight: 8}}
                        >
                            全部卡牌
                        </Button>
                        <Button
                            size="small"
                            variant={cardStatsFilterMode === "school" ? "contained" : "outlined"}
                            color="primary"
                            onClick={() => setCardStatsFilterMode("school")}
                            style={{marginRight: 8}}
                        >
                            仅看流派
                        </Button>
                        <Button
                            size="small"
                            variant={cardStatsFilterMode === "era1" ? "contained" : "outlined"}
                            color="primary"
                            onClick={() => setCardStatsFilterMode("era1")}
                            style={{marginRight: 8}}
                        >
                            只看计分第一
                        </Button>
                        <Button
                            size="small"
                            variant="outlined"
                            color="secondary"
                            onClick={resetCardFilters}
                        >
                            重置筛选
                        </Button>
                    </Grid>
                    <Grid item xs={12}>
                        <Grid container spacing={1} style={{marginTop: 4}}>
                            <Grid item xs={12} md={6}>
                                <div style={{display: "flex", alignItems: "center", gap: 8}}>
                                    <Typography variant="body2" color="textSecondary" style={{minWidth: 36, flexShrink: 0}}>地区：</Typography>
                                    <div style={{overflowX: "auto", whiteSpace: "nowrap", flex: 1}}>
                                        <Button size="small" variant={cardRegionFilter === "all" ? "contained" : "outlined"} color="primary" onClick={() => setCardRegionFilter("all")} style={{marginRight: 6}}>全部</Button>
                                        <Button size="small" variant={cardRegionFilter === "EE" ? "contained" : "outlined"} color="primary" onClick={() => setCardRegionFilter("EE")} style={{marginRight: 6}}>东欧</Button>
                                        <Button size="small" variant={cardRegionFilter === "WE" ? "contained" : "outlined"} color="primary" onClick={() => setCardRegionFilter("WE")} style={{marginRight: 6}}>西欧</Button>
                                        <Button size="small" variant={cardRegionFilter === "NA" ? "contained" : "outlined"} color="primary" onClick={() => setCardRegionFilter("NA")} style={{marginRight: 6}}>北美</Button>
                                        <Button size="small" variant={cardRegionFilter === "ASIA" ? "contained" : "outlined"} color="primary" onClick={() => setCardRegionFilter("ASIA")}>亚洲</Button>
                                    </div>
                                </div>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <div style={{display: "flex", alignItems: "center", gap: 8}}>
                                    <Typography variant="body2" color="textSecondary" style={{minWidth: 36, flexShrink: 0}}>时代：</Typography>
                                    <div style={{overflowX: "auto", whiteSpace: "nowrap", flex: 1}}>
                                        <Button size="small" variant={cardEraFilter === "all" ? "contained" : "outlined"} color="primary" onClick={() => setCardEraFilter("all")} style={{marginRight: 6}}>全部</Button>
                                        <Button size="small" variant={cardEraFilter === "1" ? "contained" : "outlined"} color="primary" onClick={() => setCardEraFilter("1")} style={{marginRight: 6}}>1</Button>
                                        <Button size="small" variant={cardEraFilter === "2" ? "contained" : "outlined"} color="primary" onClick={() => setCardEraFilter("2")} style={{marginRight: 6}}>2</Button>
                                        <Button size="small" variant={cardEraFilter === "3" ? "contained" : "outlined"} color="primary" onClick={() => setCardEraFilter("3")}>3</Button>
                                    </div>
                                </div>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <div style={{display: "flex", alignItems: "center", gap: 8}}>
                                    <Typography variant="body2" color="textSecondary" style={{minWidth: 36, flexShrink: 0}}>类型：</Typography>
                                    <div style={{overflowX: "auto", whiteSpace: "nowrap", flex: 1}}>
                                        <Button size="small" variant={cardTypeFilter === "all" ? "contained" : "outlined"} color="primary" onClick={() => setCardTypeFilter("all")} style={{marginRight: 6}}>全部</Button>
                                        <Button size="small" variant={cardTypeFilter === "film" ? "contained" : "outlined"} color="primary" onClick={() => setCardTypeFilter("film")} style={{marginRight: 6}}>影片</Button>
                                        <Button size="small" variant={cardTypeFilter === "school" ? "contained" : "outlined"} color="primary" onClick={() => setCardTypeFilter("school")} style={{marginRight: 6}}>流派</Button>
                                        <Button size="small" variant={cardTypeFilter === "person" ? "contained" : "outlined"} color="primary" onClick={() => setCardTypeFilter("person")}>人物</Button>
                                    </div>
                                </div>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <div style={{display: "flex", alignItems: "center", gap: 8}}>
                                    <Typography variant="body2" color="textSecondary" style={{minWidth: 36, flexShrink: 0}}>排序：</Typography>
                                    <div style={{overflowX: "auto", whiteSpace: "nowrap", flex: 1}}>
                                        <Button size="small" variant={cardSortMode === "winRate" ? "contained" : "outlined"} color="primary" onClick={() => setCardSortMode("winRate")} style={{marginRight: 6}}>胜率</Button>
                                        <Button size="small" variant={cardSortMode === "avgRank" ? "contained" : "outlined"} color="primary" onClick={() => setCardSortMode("avgRank")} style={{marginRight: 6}}>名次</Button>
                                        <Button size="small" variant={cardSortMode === "games" ? "contained" : "outlined"} color="primary" onClick={() => setCardSortMode("games")}>样本量</Button>
                                    </div>
                                </div>
                            </Grid>
                        </Grid>
                    </Grid>
                    <Grid item xs={12}>
                        <Typography variant="body2" color="textSecondary" style={{marginTop: 4}}>
                            筛选后卡牌数：{cardStats.length}
                        </Typography>
                    </Grid>
                </Grid>
                <TableContainer>
                    <Table size="small" aria-label="card win rates">
                        <TableHead>
                            <TableRow style={tableHeadRowStyle}>
                                <TableCell>卡牌</TableCell>
                                <TableCell>胜率</TableCell>
                                <TableCell>平均名次</TableCell>
                                <TableCell>位次标准差</TableCell>
                                <TableCell>胜场</TableCell>
                                <TableCell>样本</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {cardStats.map((row, idx) => <TableRow key={row.cardID} hover style={{backgroundColor: idx % 2 === 0 ? "#ffffff" : "#fafafa"}}>
                                <TableCell>
                                    <span style={{color: safeCardColor(row.cardID)}}>
                                        {row.cardID} / {safeCardName(row.cardID)}
                                    </span>
                                </TableCell>
                                <TableCell>{formatRate(row.winRate)}</TableCell>
                                <TableCell>{row.avgRank > 0 ? row.avgRank.toFixed(2) : "-"}</TableCell>
                                <TableCell>{row.games > 0 ? formatStdDev(row.rankStdDev) : "-"}</TableCell>
                                <TableCell>{row.wins}</TableCell>
                                <TableCell>{row.games}</TableCell>
                            </TableRow>)}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Grid> : <></>}
    </Grid>;
};

export default MatchStatsPage;
