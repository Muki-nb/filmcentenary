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
    finalScore?: number,
    allCards: string[],
}

interface IMatchStatsRecord {
    turnCount?: number,
    winner: string,
    players: IPlayerStatsRecord[],
}

interface ITurnStatsSummary {
    averageTurnCount: number,
    maxTurnCount: number,
    minTurnCount: number,
    recordedTurnGames: number,
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
}

interface ICardStatsRow {
    cardID: string,
    games: number,
    wins: number,
    winRate: number,
    avgRank: number,
}

type CardStatsFilterMode = "all" | "school" | "era1";
type RegionFilter = "all" | "EE" | "WE" | "NA" | "ASIA";
type EraFilter = "all" | "1" | "2" | "3";
type CardTypeFilter = "all" | "film" | "school" | "person";
type CardSortMode = "winRate" | "avgRank" | "games";
const NO_SCHOOL_CARD_ID = "__NO_SCHOOL__";

const seatLabels = ["1位", "2位", "3位", "4位"];
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

const buildSeatStats = (records: IMatchStatsRecord[]): ISeatStatsRow[] => {
    const buckets = seatLabels.map((label) => ({
        label,
        games: 0,
        wins: 0,
        winRate: 0,
        avgRank: 0,
        rankSum: 0,
        rankGames: 0,
    }));

    records.forEach(record => {
        const rankMap = buildRankMap(record);
        record.players.forEach(player => {
            if (player.seat >= 0 && player.seat < buckets.length) {
                buckets[player.seat].games += 1;
                if (player.playerID === record.winner) {
                    buckets[player.seat].wins += 1;
                }
                const rank = rankMap.get(player.playerID);
                if (typeof rank === "number") {
                    buckets[player.seat].rankSum += rank;
                    buckets[player.seat].rankGames += 1;
                }
            }
        });
    });

    return buckets.map(bucket => ({
        ...bucket,
        winRate: bucket.games > 0 ? bucket.wins / bucket.games : 0,
        avgRank: bucket.rankGames > 0 ? bucket.rankSum / bucket.rankGames : 0,
    }));
};

const buildCardStats = (records: IMatchStatsRecord[], filterMode: CardStatsFilterMode): ICardStatsRow[] => {
    const cardMap = new Map<string, {games: number, wins: number, rankSum: number, rankGames: number}>();

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
                    const current = cardMap.get(cardID) ?? {games: 0, wins: 0, rankSum: 0, rankGames: 0};
                    current.games += 1;
                    if (player.playerID === record.winner) {
                        current.wins += 1;
                    }
                    const rank = rankMap.get(player.playerID);
                    if (typeof rank === "number") {
                        current.rankSum += rank;
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
                const current = cardMap.get(normalizedCardID) ?? {games: 0, wins: 0, rankSum: 0, rankGames: 0};
                current.games += 1;
                if (player.playerID === record.winner) {
                    current.wins += 1;
                }
                const rank = rankMap.get(player.playerID);
                if (typeof rank === "number") {
                    current.rankSum += rank;
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

const buildTurnStats = (records: IMatchStatsRecord[]): ITurnStatsSummary => {
    const turnCounts = records
        .map(record => record.turnCount)
        .filter((turnCount): turnCount is number => typeof turnCount === "number" && turnCount > 0);

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
};

const buildTurnDistribution = (records: IMatchStatsRecord[]): ITurnDistributionPoint[] => {
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

const MatchStatsPage = () => {
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState("");
    const [records, setRecords] = React.useState<IMatchStatsRecord[]>([]);
    const [seatStats, setSeatStats] = React.useState<ISeatStatsRow[]>([]);
    const [cardStatsFilterMode, setCardStatsFilterMode] = React.useState<CardStatsFilterMode>("all");
    const [cardRegionFilter, setCardRegionFilter] = React.useState<RegionFilter>("all");
    const [cardEraFilter, setCardEraFilter] = React.useState<EraFilter>("all");
    const [cardTypeFilter, setCardTypeFilter] = React.useState<CardTypeFilter>("all");
    const [cardSortMode, setCardSortMode] = React.useState<CardSortMode>("winRate");
    const [turnStats, setTurnStats] = React.useState<ITurnStatsSummary>({
        averageTurnCount: 0,
        maxTurnCount: 0,
        minTurnCount: 0,
        recordedTurnGames: 0,
    });
    const [recordCount, setRecordCount] = React.useState(0);

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
            setSeatStats([]);
            setTurnStats({
                averageTurnCount: 0,
                maxTurnCount: 0,
                minTurnCount: 0,
                recordedTurnGames: 0,
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

    const turnDistributionChart = React.useMemo(() => {
        if (turnDistribution.length === 0) {
            return null;
        }

        const width = 880;
        const height = 220;
        const left = 44;
        const right = 16;
        const top = 12;
        const bottom = 30;
        const plotWidth = width - left - right;
        const plotHeight = height - top - bottom;

        const minX = turnDistribution[0].turnCount;
        const maxX = turnDistribution[turnDistribution.length - 1].turnCount;
        const maxY = Math.max(...turnDistribution.map(p => p.sampleCount));

        const xRange = Math.max(1, maxX - minX);
        const yRange = Math.max(1, maxY);

        const points = turnDistribution.map(p => {
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
                <Grid container spacing={1} style={{...sectionPaperStyle, padding: 16}}>
                    <Grid item xs={12}>
                        <Typography variant="h6" component="h2">回合统计</Typography>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <Typography>平均回合数：{turnStats.recordedTurnGames > 0 ? turnStats.averageTurnCount.toFixed(2) : "-"}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <Typography>最短回合：{turnStats.recordedTurnGames > 0 ? turnStats.minTurnCount.toFixed(2) : "-"}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <Typography>最长回合：{turnStats.recordedTurnGames > 0 ? turnStats.maxTurnCount.toFixed(2) : "-"}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <Typography>含回合数据对局：{turnStats.recordedTurnGames}</Typography>
                    </Grid>
                    <Grid item xs={12}>
                        <Typography variant="body2" color="textSecondary" style={{marginTop: 8, marginBottom: 4}}>
                            回合分布图（X=回合数，Y=样本数）
                        </Typography>
                        {turnDistributionChart ? <div style={{width: "100%", overflowX: "auto"}}>
                            <svg
                                viewBox={`0 0 ${turnDistributionChart.width} ${turnDistributionChart.height}`}
                                preserveAspectRatio="xMidYMid meet"
                                style={{width: "100%", height: "auto", minWidth: 420, aspectRatio: `${turnDistributionChart.width} / ${turnDistributionChart.height}`, background: "#fbfcff", border: "1px solid #eef2f7", borderRadius: 8}}
                            >
                                {turnDistributionChart.yTicks.map((tick, idx) => <g key={`yt-${idx}`}>
                                    <line
                                        x1={turnDistributionChart.left}
                                        y1={tick.y}
                                        x2={turnDistributionChart.width - turnDistributionChart.right}
                                        y2={tick.y}
                                        stroke="#e7ecf4"
                                        strokeWidth="1"
                                    />
                                    <text
                                        x={turnDistributionChart.left - 8}
                                        y={tick.y + 4}
                                        textAnchor="end"
                                        fill="#7f8da3"
                                        fontSize="11"
                                    >
                                        {tick.value}
                                    </text>
                                </g>)}

                                <polyline
                                    fill="none"
                                    stroke="#3f51b5"
                                    strokeWidth="2"
                                    points={turnDistributionChart.polyline}
                                />

                                {turnDistributionChart.points.map(point => <g key={`p-${point.turnCount}`}>
                                    <circle cx={point.x} cy={point.y} r="2.8" fill="#3f51b5" />
                                    <text x={point.x} y={point.y - 6} textAnchor="middle" fill="#5f6b7a" fontSize="10">
                                        {point.sampleCount}
                                    </text>
                                </g>)}

                                <text x={turnDistributionChart.left} y={turnDistributionChart.height - 8} fill="#7f8da3" fontSize="11">
                                    {turnDistributionChart.minX} 回合
                                </text>
                                <text
                                    x={turnDistributionChart.width - turnDistributionChart.right}
                                    y={turnDistributionChart.height - 8}
                                    textAnchor="end"
                                    fill="#7f8da3"
                                    fontSize="11"
                                >
                                    {turnDistributionChart.maxX} 回合
                                </text>
                            </svg>
                        </div> : <Typography color="textSecondary">暂无回合样本。</Typography>}
                    </Grid>
                </Grid>
            </Paper>
        </Grid>
        {error ? <Grid item xs={12}>
            <Paper>
                <Grid container style={{padding: 16}}>
                    <Grid item xs={12}>
                        <Typography color="error">{error}</Typography>
                    </Grid>
                </Grid>
            </Paper>
        </Grid> : <></>}
        <Grid item xs={12}>
            <Paper>
                <Grid container style={sectionPaperStyle}>
                    <Grid item xs={12}>
                        <Typography variant="h6" component="h2">位次胜率</Typography>
                    </Grid>
                </Grid>
                <TableContainer>
                    <Table size="small" aria-label="seat win rates">
                        <TableHead>
                            <TableRow style={tableHeadRowStyle}>
                                <TableCell>位次</TableCell>
                                <TableCell>胜率</TableCell>
                                <TableCell>平均名次</TableCell>
                                <TableCell>胜场</TableCell>
                                <TableCell>样本</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {seatStats.map((row, idx) => <TableRow key={row.label} hover style={{backgroundColor: idx % 2 === 0 ? "#ffffff" : "#fafafa"}}>
                                <TableCell>{row.label}</TableCell>
                                <TableCell>{row.games > 0 ? formatRate(row.winRate) : "-"}</TableCell>
                                <TableCell>{row.games > 0 ? row.avgRank.toFixed(2) : "-"}</TableCell>
                                <TableCell>{row.wins}</TableCell>
                                <TableCell>{row.games}</TableCell>
                            </TableRow>)}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Grid>
        <Grid item xs={12}>
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
                                <TableCell>{row.wins}</TableCell>
                                <TableCell>{row.games}</TableCell>
                            </TableRow>)}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Grid>
    </Grid>;
};

export default MatchStatsPage;
