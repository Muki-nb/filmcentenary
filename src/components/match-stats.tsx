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
    cinemaBuilt?: boolean,
    studioBuilt?: boolean,
}

interface IBuildingRecord {
    region: string,
    slotIndex: number,
    building: string | null,
    owner: string,
    activated: boolean,
}

interface IMatchStatsRecord {
    turnCount?: number,
    winner: string,
    players: IPlayerStatsRecord[],
    finishedAt?: string,
    buildings?: IBuildingRecord[],
    version?: number,
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

type PlayerStatsSubPanel = "leaderboard" | "detail";
type PlayerLeaderboardSortMode = "winRate" | "avgRank" | "games";
type PlayerLeaderboardScope = "all" | "weekly" | "monthly";

interface IPlayerLeaderboardRow {
    playerID: string;
    games: number;
    wins: number;
    winRate: number;
    avgRank: number;
    rankStdDev: number;
}

interface IPlayerTopItem {
    cardID: string;
    count: number;
    rate: number;
}

interface IPlayerTopRegion {
    region: Region;
    regionName: string;
    count: number;
    rate: number;
}

interface IPlayerDetailData {
    playerID: string;
    games: number;
    wins: number;
    topTwoGames: number;
    winRate: number;
    avgRank: number;
    rankStdDev: number;
    avgTurnCount: number;
    indGames: number;
    indWins: number;
    indWinRate: number;
    aesGames: number;
    aesWins: number;
    aesWinRate: number;
    avgIndustry: number;
    avgAesthetics: number;
    avgLevelSum: number;
    avgCinemaCount: number;
    avgStudioCount: number;
    avgPersonCount: number;
    topEra1Films: IPlayerTopItem[];
    topEra1Schools: IPlayerTopItem[];
    topEra1Persons: IPlayerTopItem[];
    topEra2Films: IPlayerTopItem[];
    topEra2Schools: IPlayerTopItem[];
    topEra2Persons: IPlayerTopItem[];
    topEra3Films: IPlayerTopItem[];
    topEra3Schools: IPlayerTopItem[];
    topEra3Persons: IPlayerTopItem[];
    topCinemaRegions: IPlayerTopRegion[];
    topStudioRegions: IPlayerTopRegion[];
}

type CardStatsFilterMode = "all" | "school" | "era1";
type RegionFilter = "all" | "EE" | "WE" | "NA" | "ASIA";
type EraFilter = "all" | "1" | "2" | "3";
type CardTypeFilter = "all" | "film" | "school" | "person";
type CardSortMode = "winRate" | "avgRank" | "games";
type StatsPanel = "turn" | "seat" | "level" | "card" | "player";
const NO_SCHOOL_CARD_ID = "__NO_SCHOOL__";

const regionNameMap: Record<number, string> = {
    [Region.NA]: "北美",
    [Region.WE]: "西欧",
    [Region.EE]: "东欧",
    [Region.ASIA]: "亚洲",
    [Region.NONE]: "无",
};

const regionStringToEnum: Record<string, Region> = {
    "NA": Region.NA,
    "WE": Region.WE,
    "EE": Region.EE,
    "ASIA": Region.ASIA,
};

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
        const rawTurnCount = record.turnCount;
        if (typeof rawTurnCount === "number" && rawTurnCount > 0) {
            allTurnCounts.push(rawTurnCount);
            if (record.players.length === 3) {
                // 3人局：老数据统一按4人局归一化存储（turnCount = (turn-1)/4），
                // 实际回合应为 (turn-1)/3，故需乘以 4/3 修正
                p3TurnCounts.push(rawTurnCount * 4 / 3);
            } else if (record.players.length === 4) {
                p4TurnCounts.push(rawTurnCount);
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
    // 3人局：老数据统一按4人局归一化存储，需乘以 4/3 修正回合数
    const adjustP3Records = (recs: IMatchStatsRecord[]): IMatchStatsRecord[] =>
        recs.map(r => ({...r, turnCount: typeof r.turnCount === "number" && r.turnCount > 0 ? r.turnCount * 4 / 3 : r.turnCount}));

    return {
        all: buildTurnDistributionList(records),
        p3: buildTurnDistributionList(adjustP3Records(records.filter(r => r.players.length === 3))),
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

const isPersonCard = (cardID: string): boolean => /^P\d+$/i.test(normalizeCardId(cardID));
const isFilmCard = (cardID: string): boolean => /^F\d+$/i.test(normalizeCardId(cardID));
const isScoringCard = (cardID: string): boolean => /^V\d+$/i.test(normalizeCardId(cardID));

const filterRecordsByScope = (records: IMatchStatsRecord[], scope: PlayerLeaderboardScope): IMatchStatsRecord[] => {
    if (scope === "all") return records;
    const now = new Date();
    let cutoff: number;
    if (scope === "weekly") {
        // 本周一 00:00:00
        const dayOfWeek = now.getDay();
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + mondayOffset);
        cutoff = monday.getTime();
    } else {
        // 本月1日 00:00:00
        const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        cutoff = firstOfMonth.getTime();
    }
    return records.filter(record => {
        if (!record.finishedAt) return false;
        const ts = new Date(record.finishedAt).getTime();
        return !isNaN(ts) && ts >= cutoff;
    });
};

const buildTopItems = (
    cardCounts: Map<string, number>,
    totalGames: number,
    limit: number,
): IPlayerTopItem[] => {
    return Array.from(cardCounts.entries())
        .map(([cardID, count]) => ({cardID, count, rate: totalGames > 0 ? count / totalGames : 0}))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
};

const buildTopRegions = (
    regionCounts: Map<Region, number>,
    totalGames: number,
    limit: number,
): IPlayerTopRegion[] => {
    return Array.from(regionCounts.entries())
        .map(([region, count]) => ({
            region,
            regionName: regionNameMap[region] ?? "未知",
            count,
            rate: totalGames > 0 ? count / totalGames : 0,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
};

const buildPlayerLeaderboard = (
    records: IMatchStatsRecord[],
    scope: PlayerLeaderboardScope,
    sortMode: PlayerLeaderboardSortMode,
): IPlayerLeaderboardRow[] => {
    const filtered = filterRecordsByScope(records, scope);
    const playerMap = new Map<string, {
        games: number; wins: number; rankSum: number; rankSqSum: number; rankGames: number;
    }>();

    filtered.forEach(record => {
        const rankMap = buildRankMap(record);
        record.players.forEach(player => {
            // 忽略无名玩家（playerID 为 0/1/2/3）
            if (player.playerID === "0" || player.playerID === "1" || player.playerID === "2" || player.playerID === "3") return;
            const entry = playerMap.get(player.playerID) ?? {
                games: 0, wins: 0, rankSum: 0, rankSqSum: 0, rankGames: 0,
            };
            entry.games += 1;
            if (player.playerID === record.winner) {
                entry.wins += 1;
            }
            const rank = rankMap.get(player.playerID);
            if (typeof rank === "number") {
                entry.rankSum += rank;
                entry.rankSqSum += rank * rank;
                entry.rankGames += 1;
            }
            playerMap.set(player.playerID, entry);
        });
    });

    return Array.from(playerMap.entries())
        .map(([playerID, stat]) => ({
            playerID,
            games: stat.games,
            wins: stat.wins,
            winRate: stat.games > 0 ? stat.wins / stat.games : 0,
            avgRank: stat.rankGames > 0 ? stat.rankSum / stat.rankGames : 0,
            rankStdDev: calcStdDev(stat.rankSum, stat.rankSqSum, stat.rankGames),
        }))
        .sort((left, right) => {
            if (sortMode === "avgRank") {
                if (left.avgRank !== right.avgRank) return left.avgRank - right.avgRank;
                if (right.winRate !== left.winRate) return right.winRate - left.winRate;
                return right.games - left.games;
            }
            if (sortMode === "games") {
                if (right.games !== left.games) return right.games - left.games;
                if (right.winRate !== left.winRate) return right.winRate - left.winRate;
                return left.avgRank - right.avgRank;
            }
            if (right.winRate !== left.winRate) return right.winRate - left.winRate;
            if (left.avgRank !== right.avgRank) return left.avgRank - right.avgRank;
            return right.games - left.games;
        })
        .slice(0, 10);
};

const buildPlayerDetail = (
    records: IMatchStatsRecord[],
    playerID: string,
): IPlayerDetailData | null => {
    const playerRecords: Array<{record: IMatchStatsRecord; player: IPlayerStatsRecord}> = [];

    // 忽略无名玩家（playerID 为 0/1/2/3）
    if (playerID === "0" || playerID === "1" || playerID === "2" || playerID === "3") return null;

    records.forEach(record => {
        const player = record.players.find(p => p.playerID === playerID);
        if (player) {
            playerRecords.push({record, player});
        }
    });

    if (playerRecords.length === 0) return null;

    const games = playerRecords.length;
    let wins = 0;
    let topTwoGames = 0;
    let rankSum = 0;
    let rankSqSum = 0;
    let rankGames = 0;
    let turnSum = 0;
    let turnGames = 0;
    let indGames = 0;
    let indWins = 0;
    let aesGames = 0;
    let aesWins = 0;
    let industrySum = 0;
    let industryGames = 0;
    let aestheticsSum = 0;
    let aestheticsGames = 0;
    let levelSumTotal = 0;
    let levelSumGames = 0;
    let cinemaSum = 0;
    let studioSum = 0;
    let personSum = 0;

    const era1FilmCounts = new Map<string, number>();
    const era1SchoolCounts = new Map<string, number>();
    const era1PersonCounts = new Map<string, number>();
    const era2FilmCounts = new Map<string, number>();
    const era2SchoolCounts = new Map<string, number>();
    const era2PersonCounts = new Map<string, number>();
    const era3FilmCounts = new Map<string, number>();
    const era3SchoolCounts = new Map<string, number>();
    const era3PersonCounts = new Map<string, number>();
    const cinemaRegionCounts = new Map<Region, number>();
    const studioRegionCounts = new Map<Region, number>();

    playerRecords.forEach(({record, player}) => {
        const rankMap = buildRankMap(record);

        if (player.playerID === record.winner) wins++;

        const rank = rankMap.get(player.playerID);
        if (typeof rank === "number") {
            rankSum += rank;
            rankSqSum += rank * rank;
            rankGames++;
            if (rank <= 2) topTwoGames++;
        }

        if (typeof record.turnCount === "number" && record.turnCount > 0) {
            const adjustedTurn = record.players.length === 3 ? record.turnCount * 4 / 3 : record.turnCount;
            turnSum += adjustedTurn;
            turnGames++;
        }

        const rel = getIndustryAestheticsRelation(player);
        if (rel === "industry_gt_aesthetics") {
            indGames++;
            if (player.playerID === record.winner) indWins++;
        } else if (rel === "aesthetics_gt_industry") {
            aesGames++;
            if (player.playerID === record.winner) aesWins++;
        }

        if (typeof player.industry === "number" && Number.isFinite(player.industry)) {
            industrySum += player.industry;
            industryGames++;
        }
        if (typeof player.aesthetics === "number" && Number.isFinite(player.aesthetics)) {
            aestheticsSum += player.aesthetics;
            aestheticsGames++;
        }
        if (typeof player.industry === "number" && Number.isFinite(player.industry)
            && typeof player.aesthetics === "number" && Number.isFinite(player.aesthetics)) {
            levelSumTotal += player.industry + player.aesthetics;
            levelSumGames++;
        }

        const uniqueCards = Array.from(new Set(player.allCards || []));
        let cinemaCount = 0;
        let studioCount = 0;
        let personCount = 0;

        // 电影院/制片厂：从服务器端快照数据统计
        if (player.cinemaBuilt) {
            cinemaCount = 1;
        }
        if (player.studioBuilt) {
            studioCount = 1;
        }
        // 从 buildings 快照中统计地区分布
        if (record.buildings) {
            record.buildings.forEach(b => {
                if (!b.owner || b.owner !== playerID) return;
                const regionEnum = regionStringToEnum[b.region];
                if (regionEnum == null) return;
                if (b.building === "cinema" || b.building === "Cinema") {
                    cinemaRegionCounts.set(regionEnum, (cinemaRegionCounts.get(regionEnum) ?? 0) + 1);
                } else if (b.building === "studio" || b.building === "Studio") {
                    studioRegionCounts.set(regionEnum, (studioRegionCounts.get(regionEnum) ?? 0) + 1);
                }
            });
        }

        uniqueCards.forEach(cardID => {
            const normalized = normalizeCardId(cardID);
            if (!normalized || isBasicCard(normalized) || isScoringCard(normalized)) return;

            const era = getCardEra(normalized);
            if (era === "1") {
                if (isFilmCard(normalized)) {
                    era1FilmCounts.set(normalized, (era1FilmCounts.get(normalized) ?? 0) + 1);
                } else if (isSchoolCard(normalized)) {
                    era1SchoolCounts.set(normalized, (era1SchoolCounts.get(normalized) ?? 0) + 1);
                } else if (isPersonCard(normalized)) {
                    personCount++;
                    era1PersonCounts.set(normalized, (era1PersonCounts.get(normalized) ?? 0) + 1);
                }
            } else if (era === "2") {
                if (isFilmCard(normalized)) {
                    era2FilmCounts.set(normalized, (era2FilmCounts.get(normalized) ?? 0) + 1);
                } else if (isSchoolCard(normalized)) {
                    era2SchoolCounts.set(normalized, (era2SchoolCounts.get(normalized) ?? 0) + 1);
                } else if (isPersonCard(normalized)) {
                    personCount++;
                    era2PersonCounts.set(normalized, (era2PersonCounts.get(normalized) ?? 0) + 1);
                }
            } else if (era === "3") {
                if (isFilmCard(normalized)) {
                    era3FilmCounts.set(normalized, (era3FilmCounts.get(normalized) ?? 0) + 1);
                } else if (isSchoolCard(normalized)) {
                    era3SchoolCounts.set(normalized, (era3SchoolCounts.get(normalized) ?? 0) + 1);
                } else if (isPersonCard(normalized)) {
                    personCount++;
                    era3PersonCounts.set(normalized, (era3PersonCounts.get(normalized) ?? 0) + 1);
                }
            }
        });

        cinemaSum += cinemaCount;
        studioSum += studioCount;
        personSum += personCount;
    });

    return {
        playerID,
        games,
        wins,
        topTwoGames,
        winRate: games > 0 ? wins / games : 0,
        avgRank: rankGames > 0 ? rankSum / rankGames : 0,
        rankStdDev: calcStdDev(rankSum, rankSqSum, rankGames),
        avgTurnCount: turnGames > 0 ? turnSum / turnGames : 0,
        indGames,
        indWins,
        indWinRate: indGames > 0 ? indWins / indGames : 0,
        aesGames,
        aesWins,
        aesWinRate: aesGames > 0 ? aesWins / aesGames : 0,
        avgIndustry: industryGames > 0 ? industrySum / industryGames : 0,
        avgAesthetics: aestheticsGames > 0 ? aestheticsSum / aestheticsGames : 0,
        avgLevelSum: levelSumGames > 0 ? levelSumTotal / levelSumGames : 0,
        avgCinemaCount: games > 0 ? cinemaSum / games : 0,
        avgStudioCount: games > 0 ? studioSum / games : 0,
        avgPersonCount: games > 0 ? personSum / games : 0,
        topEra1Films: buildTopItems(era1FilmCounts, games, 3),
        topEra1Schools: buildTopItems(era1SchoolCounts, games, 3),
        topEra1Persons: buildTopItems(era1PersonCounts, games, 3),
        topEra2Films: buildTopItems(era2FilmCounts, games, 3),
        topEra2Schools: buildTopItems(era2SchoolCounts, games, 3),
        topEra2Persons: buildTopItems(era2PersonCounts, games, 3),
        topEra3Films: buildTopItems(era3FilmCounts, games, 3),
        topEra3Schools: buildTopItems(era3SchoolCounts, games, 3),
        topEra3Persons: buildTopItems(era3PersonCounts, games, 3),
        topCinemaRegions: buildTopRegions(cinemaRegionCounts, games, 2),
        topStudioRegions: buildTopRegions(studioRegionCounts, games, 2),
    };
};

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
    const [activePlayerSubPanel, setActivePlayerSubPanel] = React.useState<PlayerStatsSubPanel>("leaderboard");
    const [playerLeaderboardScope, setPlayerLeaderboardScope] = React.useState<PlayerLeaderboardScope>("all");
    const [playerLeaderboardSortMode, setPlayerLeaderboardSortMode] = React.useState<PlayerLeaderboardSortMode>("winRate");
    const [playerDetailInput, setPlayerDetailInput] = React.useState("");
    const [playerDetailSearchedID, setPlayerDetailSearchedID] = React.useState("");

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

    const playerLeaderboard = React.useMemo(() => {
        return buildPlayerLeaderboard(records, playerLeaderboardScope, playerLeaderboardSortMode);
    }, [records, playerLeaderboardScope, playerLeaderboardSortMode]);

    const playerDetail = React.useMemo(() => {
        if (!playerDetailSearchedID) return null;
        return buildPlayerDetail(records, playerDetailSearchedID);
    }, [records, playerDetailSearchedID]);

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
                    <Grid item>
                        <Button
                            size="small"
                            variant={activePanel === "player" ? "contained" : "outlined"}
                            color="primary"
                            onClick={() => setActivePanel("player")}
                        >
                            玩家数据
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
        {activePanel === "player" ? <Grid item xs={12}>
            <Paper>
                <Grid container style={sectionPaperStyle}>
                    <Grid item xs={12}>
                        <Typography variant="h6" component="h2">玩家数据</Typography>
                    </Grid>
                </Grid>
                <Grid container spacing={1} style={{padding: "0 12px 12px 12px"}}>
                    <Grid item>
                        <Button
                            size="small"
                            variant={activePlayerSubPanel === "leaderboard" ? "contained" : "outlined"}
                            color="primary"
                            onClick={() => setActivePlayerSubPanel("leaderboard")}
                        >
                            总榜单
                        </Button>
                    </Grid>
                    <Grid item>
                        <Button
                            size="small"
                            variant={activePlayerSubPanel === "detail" ? "contained" : "outlined"}
                            color="primary"
                            onClick={() => setActivePlayerSubPanel("detail")}
                        >
                            玩家详细数据
                        </Button>
                    </Grid>
                </Grid>
                {activePlayerSubPanel === "leaderboard" ? <>
                    <Grid container spacing={1} style={{padding: "0 12px 12px 12px"}}>
                        <Grid item xs={12} md={6}>
                            <div style={{display: "flex", alignItems: "center", gap: 8}}>
                                <Typography variant="body2" color="textSecondary" style={{minWidth: 36, flexShrink: 0}}>范围：</Typography>
                                <div style={{overflowX: "auto", whiteSpace: "nowrap", flex: 1}}>
                                    <Button size="small" variant={playerLeaderboardScope === "all" ? "contained" : "outlined"} color="primary" onClick={() => setPlayerLeaderboardScope("all")} style={{marginRight: 6}}>总榜</Button>
                                    <Button size="small" variant={playerLeaderboardScope === "weekly" ? "contained" : "outlined"} color="primary" onClick={() => setPlayerLeaderboardScope("weekly")} style={{marginRight: 6}}>周榜</Button>
                                    <Button size="small" variant={playerLeaderboardScope === "monthly" ? "contained" : "outlined"} color="primary" onClick={() => setPlayerLeaderboardScope("monthly")}>月榜</Button>
                                </div>
                            </div>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <div style={{display: "flex", alignItems: "center", gap: 8}}>
                                <Typography variant="body2" color="textSecondary" style={{minWidth: 36, flexShrink: 0}}>排序：</Typography>
                                <div style={{overflowX: "auto", whiteSpace: "nowrap", flex: 1}}>
                                    <Button size="small" variant={playerLeaderboardSortMode === "winRate" ? "contained" : "outlined"} color="primary" onClick={() => setPlayerLeaderboardSortMode("winRate")} style={{marginRight: 6}}>胜率</Button>
                                    <Button size="small" variant={playerLeaderboardSortMode === "avgRank" ? "contained" : "outlined"} color="primary" onClick={() => setPlayerLeaderboardSortMode("avgRank")} style={{marginRight: 6}}>名次</Button>
                                    <Button size="small" variant={playerLeaderboardSortMode === "games" ? "contained" : "outlined"} color="primary" onClick={() => setPlayerLeaderboardSortMode("games")}>对局数</Button>
                                </div>
                            </div>
                        </Grid>
                    </Grid>
                    <TableContainer>
                        <Table size="small" aria-label="player leaderboard">
                            <TableHead>
                                <TableRow style={tableHeadRowStyle}>
                                    <TableCell>玩家名</TableCell>
                                    <TableCell>胜率</TableCell>
                                    <TableCell>平均名次</TableCell>
                                    <TableCell>胜局数</TableCell>
                                    <TableCell>对局数</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {playerLeaderboard.map((row, idx) => <TableRow key={row.playerID} hover style={{backgroundColor: idx % 2 === 0 ? "#ffffff" : "#fafafa"}}>
                                    <TableCell>{row.playerID}</TableCell>
                                    <TableCell>{row.games > 0 ? formatRate(row.winRate) : "-"}</TableCell>
                                    <TableCell>{row.games > 0 ? row.avgRank.toFixed(2) : "-"}</TableCell>
                                    <TableCell>{row.wins}</TableCell>
                                    <TableCell>{row.games}</TableCell>
                                </TableRow>)}
                                {playerLeaderboard.length === 0 ? <TableRow>
                                    <TableCell align="center">暂无数据</TableCell>
                                    <TableCell></TableCell>
                                    <TableCell></TableCell>
                                    <TableCell></TableCell>
                                    <TableCell></TableCell>
                                </TableRow> : null}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </> : <></>}
                {activePlayerSubPanel === "detail" ? <>
                    <Grid container spacing={1} style={{padding: "0 12px 12px 12px"}}>
                        <Grid item xs={12} sm={6} md={4}>
                            <div style={{display: "flex", alignItems: "center", gap: 8}}>
                                <Typography variant="body2" style={{flexShrink: 0}}>玩家名：</Typography>
                                <input
                                    type="text"
                                    value={playerDetailInput}
                                    onChange={e => setPlayerDetailInput(e.target.value)}
                                    onKeyDown={e => { if (e.key === "Enter") setPlayerDetailSearchedID(playerDetailInput.trim()); }}
                                    placeholder="输入玩家名后回车"
                                    style={{flex: 1, padding: "6px 8px", border: "1px solid #ccc", borderRadius: 4, fontSize: 14}}
                                />
                                <Button size="small" variant="contained" color="primary" onClick={() => setPlayerDetailSearchedID(playerDetailInput.trim())}>
                                    查询
                                </Button>
                            </div>
                        </Grid>
                    </Grid>
                    {playerDetail ? <Grid container spacing={2} style={{padding: "0 12px 12px 12px"}}>
                        <Grid item xs={12}>
                            <Typography variant="h6">
                                玩家 {playerDetail.playerID}
                            </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6} md={4}>
                            <div style={{padding: 12, textAlign: "center", borderRadius: 10, border: "1px solid #eef2f7"}}>
                                <Typography variant="body2" color="textSecondary">对局数</Typography>
                                <Typography variant="h5">{playerDetail.games}</Typography>
                            </div>
                        </Grid>
                        <Grid item xs={12} sm={6} md={4}>
                            <div style={{padding: 12, textAlign: "center", borderRadius: 10, border: "1px solid #eef2f7"}}>
                                <Typography variant="body2" color="textSecondary">胜局数</Typography>
                                <Typography variant="h5">{playerDetail.wins}</Typography>
                            </div>
                        </Grid>
                        <Grid item xs={12} sm={6} md={4}>
                            <div style={{padding: 12, textAlign: "center", borderRadius: 10, border: "1px solid #eef2f7"}}>
                                <Typography variant="body2" color="textSecondary">前二局数</Typography>
                                <Typography variant="h5">{playerDetail.topTwoGames}</Typography>
                            </div>
                        </Grid>
                        <Grid item xs={12} sm={6} md={4}>
                            <div style={{padding: 12, textAlign: "center", borderRadius: 10, border: "1px solid #eef2f7"}}>
                                <Typography variant="body2" color="textSecondary">胜率</Typography>
                                <Typography variant="h5">{formatRate(playerDetail.winRate)}</Typography>
                            </div>
                        </Grid>
                        <Grid item xs={12} sm={6} md={4}>
                            <div style={{padding: 12, textAlign: "center", borderRadius: 10, border: "1px solid #eef2f7"}}>
                                <Typography variant="body2" color="textSecondary">平均名次</Typography>
                                <Typography variant="h5">{playerDetail.avgRank.toFixed(2)}</Typography>
                            </div>
                        </Grid>
                        <Grid item xs={12} sm={6} md={4}>
                            <div style={{padding: 12, textAlign: "center", borderRadius: 10, border: "1px solid #eef2f7"}}>
                                <Typography variant="body2" color="textSecondary">平均回合数</Typography>
                                <Typography variant="h5">{playerDetail.avgTurnCount > 0 ? playerDetail.avgTurnCount.toFixed(1) : "-"}</Typography>
                            </div>
                        </Grid>
                        <Grid item xs={12} sm={6} md={4}>
                            <div style={{padding: 12, textAlign: "center", borderRadius: 10, border: "1px solid #eef2f7"}}>
                                <Typography variant="body2" color="textSecondary">工业对局数</Typography>
                                <Typography variant="h5">{playerDetail.indGames}</Typography>
                            </div>
                        </Grid>
                        <Grid item xs={12} sm={6} md={4}>
                            <div style={{padding: 12, textAlign: "center", borderRadius: 10, border: "1px solid #eef2f7"}}>
                                <Typography variant="body2" color="textSecondary">工业胜局数</Typography>
                                <Typography variant="h5">{playerDetail.indWins}</Typography>
                            </div>
                        </Grid>
                        <Grid item xs={12} sm={6} md={4}>
                            <div style={{padding: 12, textAlign: "center", borderRadius: 10, border: "1px solid #eef2f7"}}>
                                <Typography variant="body2" color="textSecondary">工业胜率</Typography>
                                <Typography variant="h5">{playerDetail.indGames > 0 ? formatRate(playerDetail.indWinRate) : "-"}</Typography>
                            </div>
                        </Grid>
                        <Grid item xs={12} sm={6} md={4}>
                            <div style={{padding: 12, textAlign: "center", borderRadius: 10, border: "1px solid #eef2f7"}}>
                                <Typography variant="body2" color="textSecondary">美学对局数</Typography>
                                <Typography variant="h5">{playerDetail.aesGames}</Typography>
                            </div>
                        </Grid>
                        <Grid item xs={12} sm={6} md={4}>
                            <div style={{padding: 12, textAlign: "center", borderRadius: 10, border: "1px solid #eef2f7"}}>
                                <Typography variant="body2" color="textSecondary">美学胜局数</Typography>
                                <Typography variant="h5">{playerDetail.aesWins}</Typography>
                            </div>
                        </Grid>
                        <Grid item xs={12} sm={6} md={4}>
                            <div style={{padding: 12, textAlign: "center", borderRadius: 10, border: "1px solid #eef2f7"}}>
                                <Typography variant="body2" color="textSecondary">美学胜率</Typography>
                                <Typography variant="h5">{playerDetail.aesGames > 0 ? formatRate(playerDetail.aesWinRate) : "-"}</Typography>
                            </div>
                        </Grid>
                        <Grid item xs={12} sm={6} md={4}>
                            <div style={{padding: 12, textAlign: "center", borderRadius: 10, border: "1px solid #eef2f7"}}>
                                <Typography variant="body2" color="textSecondary">平均电影院数</Typography>
                                <Typography variant="h5">{playerDetail.avgCinemaCount > 0 ? playerDetail.avgCinemaCount.toFixed(2) : "-"}</Typography>
                            </div>
                        </Grid>
                        <Grid item xs={12} sm={6} md={4}>
                            <div style={{padding: 12, textAlign: "center", borderRadius: 10, border: "1px solid #eef2f7"}}>
                                <Typography variant="body2" color="textSecondary">平均制片厂数</Typography>
                                <Typography variant="h5">{playerDetail.avgStudioCount > 0 ? playerDetail.avgStudioCount.toFixed(2) : "-"}</Typography>
                            </div>
                        </Grid>
                        <Grid item xs={12} sm={6} md={4}>
                            <div style={{padding: 12, textAlign: "center", borderRadius: 10, border: "1px solid #eef2f7"}}>
                                <Typography variant="body2" color="textSecondary">平均人物牌数</Typography>
                                <Typography variant="h5">{playerDetail.avgPersonCount > 0 ? playerDetail.avgPersonCount.toFixed(2) : "-"}</Typography>
                            </div>
                        </Grid>
                        <Grid item xs={12} sm={6} md={4}>
                            <div style={{padding: 12, textAlign: "center", borderRadius: 10, border: "1px solid #eef2f7"}}>
                                <Typography variant="body2" color="textSecondary">平均等级总和</Typography>
                                <Typography variant="h5">{playerDetail.avgLevelSum > 0 ? playerDetail.avgLevelSum.toFixed(2) : "-"}</Typography>
                            </div>
                        </Grid>
                        <Grid item xs={12} sm={6} md={4}>
                            <div style={{padding: 12, textAlign: "center", borderRadius: 10, border: "1px solid #eef2f7"}}>
                                <Typography variant="body2" color="textSecondary">平均工业等级</Typography>
                                <Typography variant="h5">{playerDetail.avgIndustry > 0 ? playerDetail.avgIndustry.toFixed(2) : "-"}</Typography>
                            </div>
                        </Grid>
                        <Grid item xs={12} sm={6} md={4}>
                            <div style={{padding: 12, textAlign: "center", borderRadius: 10, border: "1px solid #eef2f7"}}>
                                <Typography variant="body2" color="textSecondary">平均美学等级</Typography>
                                <Typography variant="h5">{playerDetail.avgAesthetics > 0 ? playerDetail.avgAesthetics.toFixed(2) : "-"}</Typography>
                            </div>
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <Typography variant="subtitle1" style={{marginTop: 8, fontWeight: "bold"}}>最常购买1时代影片</Typography>
                            {playerDetail.topEra1Films.length > 0 ? playerDetail.topEra1Films.map(item => <Typography key={item.cardID} variant="body2" style={{color: safeCardColor(item.cardID)}}>
                                {safeCardName(item.cardID)}（{formatRate(item.rate)}）
                            </Typography>) : <Typography variant="body2" color="textSecondary">暂无数据</Typography>}
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Typography variant="subtitle1" style={{marginTop: 8, fontWeight: "bold"}}>最常购买1时代流派</Typography>
                            {playerDetail.topEra1Schools.length > 0 ? playerDetail.topEra1Schools.map(item => <Typography key={item.cardID} variant="body2" style={{color: safeCardColor(item.cardID)}}>
                                {safeCardName(item.cardID)}（{formatRate(item.rate)}）
                            </Typography>) : <Typography variant="body2" color="textSecondary">暂无数据</Typography>}
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Typography variant="subtitle1" style={{marginTop: 8, fontWeight: "bold"}}>最常购买1时代人物</Typography>
                            {playerDetail.topEra1Persons.length > 0 ? playerDetail.topEra1Persons.map(item => <Typography key={item.cardID} variant="body2" style={{color: safeCardColor(item.cardID)}}>
                                {safeCardName(item.cardID)}（{formatRate(item.rate)}）
                            </Typography>) : <Typography variant="body2" color="textSecondary">暂无数据</Typography>}
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Typography variant="subtitle1" style={{marginTop: 8, fontWeight: "bold"}}>最常购买2时代影片</Typography>
                            {playerDetail.topEra2Films.length > 0 ? playerDetail.topEra2Films.map(item => <Typography key={item.cardID} variant="body2" style={{color: safeCardColor(item.cardID)}}>
                                {safeCardName(item.cardID)}（{formatRate(item.rate)}）
                            </Typography>) : <Typography variant="body2" color="textSecondary">暂无数据</Typography>}
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Typography variant="subtitle1" style={{marginTop: 8, fontWeight: "bold"}}>最常购买2时代流派</Typography>
                            {playerDetail.topEra2Schools.length > 0 ? playerDetail.topEra2Schools.map(item => <Typography key={item.cardID} variant="body2" style={{color: safeCardColor(item.cardID)}}>
                                {safeCardName(item.cardID)}（{formatRate(item.rate)}）
                            </Typography>) : <Typography variant="body2" color="textSecondary">暂无数据</Typography>}
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Typography variant="subtitle1" style={{marginTop: 8, fontWeight: "bold"}}>最常购买2时代人物</Typography>
                            {playerDetail.topEra2Persons.length > 0 ? playerDetail.topEra2Persons.map(item => <Typography key={item.cardID} variant="body2" style={{color: safeCardColor(item.cardID)}}>
                                {safeCardName(item.cardID)}（{formatRate(item.rate)}）
                            </Typography>) : <Typography variant="body2" color="textSecondary">暂无数据</Typography>}
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Typography variant="subtitle1" style={{marginTop: 8, fontWeight: "bold"}}>最常购买3时代影片</Typography>
                            {playerDetail.topEra3Films.length > 0 ? playerDetail.topEra3Films.map(item => <Typography key={item.cardID} variant="body2" style={{color: safeCardColor(item.cardID)}}>
                                {safeCardName(item.cardID)}（{formatRate(item.rate)}）
                            </Typography>) : <Typography variant="body2" color="textSecondary">暂无数据</Typography>}
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Typography variant="subtitle1" style={{marginTop: 8, fontWeight: "bold"}}>最常购买3时代流派</Typography>
                            {playerDetail.topEra3Schools.length > 0 ? playerDetail.topEra3Schools.map(item => <Typography key={item.cardID} variant="body2" style={{color: safeCardColor(item.cardID)}}>
                                {safeCardName(item.cardID)}（{formatRate(item.rate)}）
                            </Typography>) : <Typography variant="body2" color="textSecondary">暂无数据</Typography>}
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Typography variant="subtitle1" style={{marginTop: 8, fontWeight: "bold"}}>最常购买3时代人物</Typography>
                            {playerDetail.topEra3Persons.length > 0 ? playerDetail.topEra3Persons.map(item => <Typography key={item.cardID} variant="body2" style={{color: safeCardColor(item.cardID)}}>
                                {safeCardName(item.cardID)}（{formatRate(item.rate)}）
                            </Typography>) : <Typography variant="body2" color="textSecondary">暂无数据</Typography>}
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Typography variant="subtitle1" style={{marginTop: 8, fontWeight: "bold"}}>最常电影院位置</Typography>
                            {playerDetail.topCinemaRegions.length > 0 ? playerDetail.topCinemaRegions.map(item => <Typography key={item.region} variant="body2" style={{color: getColor(item.region)}}>
                                {item.regionName}（{formatRate(item.rate)}）
                            </Typography>) : <Typography variant="body2" color="textSecondary">暂无数据</Typography>}
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Typography variant="subtitle1" style={{marginTop: 8, fontWeight: "bold"}}>最常制片厂位置</Typography>
                            {playerDetail.topStudioRegions.length > 0 ? playerDetail.topStudioRegions.map(item => <Typography key={item.region} variant="body2" style={{color: getColor(item.region)}}>
                                {item.regionName}（{formatRate(item.rate)}）
                            </Typography>) : <Typography variant="body2" color="textSecondary">暂无数据</Typography>}
                        </Grid>
                    </Grid> : (playerDetailSearchedID ? <Grid container style={{padding: 16}}>
                        <Grid item xs={12}>
                            <Typography color="error">未找到玩家 "{playerDetailSearchedID}" 的数据</Typography>
                        </Grid>
                    </Grid> : <Grid container style={{padding: 16}}>
                        <Grid item xs={12}>
                            <Typography color="textSecondary">请输入玩家名进行查询</Typography>
                        </Grid>
                    </Grid>)}
                </> : <></>}
            </Paper>
        </Grid> : <></>}
    </Grid>;
};

export default MatchStatsPage;
