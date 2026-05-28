import React from "react";
import {useI18n} from "@i18n-chain/react";
import i18n from "../../constant/i18n";
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import Button from '@material-ui/core/Button';
import {IG} from "../../types/setup";
import {rank} from "../../game/util";
import {Ctx, PlayerID} from "boardgame.io";
import {
    Region,
} from "../../types/core";
import {getColor} from "../icons";
import {calcCardEfficiency, calcRoundFromTurn} from "../../game/statMetrics";
import './final.css';


export interface IFinalScoreTableProps {
    G: IG,
    ctx: Ctx,
    getName:(p:PlayerID)=>string;
    showFinalScoreTable?: boolean,
    showStatsSection?: boolean,
}

type MetricType = "level" | "score" | "eraRatio" | "time";

const regionsBySeat = [Region.NA, Region.WE, Region.EE, Region.ASIA];

const getTimeSnapshotForPlayer = (G: IG, playerIndex: number): { roundTimeMs: number, totalTimeMs: number } => {
    const playerID = playerIndex.toString();
    const tracking = G.timeTracking;
    const baseRound = tracking?.roundTimeMsByPlayer?.[playerID] || 0;
    const baseTotal = tracking?.totalTimeMsByPlayer?.[playerID] || 0;
    const currentPlayer = tracking?.currentTurnPlayer;
    const startedAt = tracking?.currentTurnStartedAtMs || 0;
    if (currentPlayer === playerID && startedAt > 0) {
        const running = Math.max(0, Date.now() - startedAt);
        return {
            roundTimeMs: baseRound + running,
            totalTimeMs: baseTotal + running,
        };
    }
    return {
        roundTimeMs: baseRound,
        totalTimeMs: baseTotal,
    };
}

const metricValue = (
    metric: MetricType,
    item: { industry: number, aesthetics: number, score: number, eraRatio: number, roundTimeMs: number, totalTimeMs: number },
): number => {
    if (metric === "level") {
        return (item.industry || 0) + (item.aesthetics || 0);
    }
    if (metric === "score") {
        return item.score || 0;
    }
    if (metric === "time") {
        return (item.totalTimeMs || 0) / 1000;
    }
    return (item.eraRatio || 0) * 100;
}

const metricLabel = (metric: MetricType): string => {
    if (metric === "level") {
        return "等级";
    }
    if (metric === "score") {
        return "分数";
    }
    if (metric === "eraRatio") {
        return "牌效比";
    }
    if (metric === "time") {
        return "时间（总用时）";
    }
    return "";
}

const formatDuration = (ms: number): string => {
    const totalSeconds = Math.max(0, Math.floor((ms || 0) / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

const formatMetric = (metric: MetricType, value: number): string => {
    if (metric === "eraRatio") {
        return value.toFixed(2);
    }
    if (metric === "time") {
        return formatDuration(value * 1000);
    }
    return value.toFixed(2);
}

const FinalScoreTable = ({G, ctx, getName, showFinalScoreTable = true, showStatsSection = true}: IFinalScoreTableProps) => {
    useI18n(i18n);
    const [metric, setMetric] = React.useState<MetricType>("level");
    const [hoveredPlayer, setHoveredPlayer] = React.useState<number | null>(null);
    const [showStats, setShowStats] = React.useState<boolean>(showStatsSection && !showFinalScoreTable);

    const scoreRank = (a: string, b: string) => rank(G, ctx, parseInt(a), parseInt(b));
    const order = [...G.order]
    const getPlainPlayerName = (playerIndex: number): string => {
        const raw = getName(playerIndex.toString() as PlayerID);
        return raw.replace(/\(\*\*\)|\(\*\)/g, "");
    };

    const timeline = React.useMemo(() => {
        const source = Array.isArray(G.settlementTimeline) ? [...G.settlementTimeline] : [];
        const currentTurn = typeof ctx.turn === "number" && Number.isFinite(ctx.turn) ? ctx.turn : 0;
        const playerCount = G.playerCount || G.pub.length || 1;
        const currentSnapshot = {
            turn: currentTurn,
            round: calcRoundFromTurn(currentTurn, playerCount),
            players: G.pub.map((p, idx) => ({
                industry: p.industry || 0,
                aesthetics: p.aesthetics || 0,
                score: (p.finalScoring?.total || 0) > 0 ? (p.finalScoring?.total || 0) : (p.vp || 0),
                eraRatio: calcCardEfficiency(G, idx),
                roundTimeMs: 0,
                totalTimeMs: 0,
            })),
        };
        currentSnapshot.players = currentSnapshot.players.map((item, idx) => {
            const t = getTimeSnapshotForPlayer(G, idx);
            return {
                ...item,
                roundTimeMs: t.roundTimeMs,
                totalTimeMs: t.totalTimeMs,
            };
        });
        if (!source.some(s => s.turn === currentTurn)) {
            source.push(currentSnapshot);
        }
        const normalized = source.map((s) => ({
            ...s,
            round: typeof (s as any).round === "number" ? (s as any).round : calcRoundFromTurn(s.turn, playerCount),
        }));
        normalized.sort((a, b) => a.turn - b.turn);
        const byRound = new Map<number, typeof normalized[number]>();
        normalized.forEach((s) => {
            byRound.set(s.round, s);
        });
        return Array.from(byRound.values()).sort((a, b) => a.round - b.round);
    }, [G, ctx.turn]);

    const chart = React.useMemo(() => {
        if (timeline.length === 0 || G.pub.length === 0) {
            return null;
        }
        const width = 900;
        const height = 260;
        const left = 46;
        const right = 16;
        const top = 18;
        const bottom = 34;
        const plotW = width - left - right;
        const plotH = height - top - bottom;

        const rounds = timeline.map(t => t.round);
        const minRound = Math.min(...rounds);
        const maxRound = Math.max(...rounds);
        const xRange = Math.max(1, maxRound - minRound);

        const values = timeline.flatMap(t => t.players.map(p => metricValue(metric, p)));
        const minY = Math.min(...values);
        const maxY = Math.max(...values);
        const yRange = Math.max(1e-6, maxY - minY);

        const lines = G.pub.map((_, playerIdx) => {
            const pts = timeline.map(t => {
                const player = t.players[playerIdx] || {industry: 0, aesthetics: 0, score: 0, eraRatio: 0, roundTimeMs: 0, totalTimeMs: 0};
                const v = metricValue(metric, player);
                const x = left + ((t.round - minRound) / xRange) * plotW;
                const y = top + (1 - ((v - minY) / yRange)) * plotH;
                return {x, y, v};
            });
            return {
                playerIdx,
                color: getColor(regionsBySeat[playerIdx] ?? Region.NONE),
                polyline: pts.map(p => `${p.x},${p.y}`).join(" "),
                pts,
            };
        });

        const yTicks = [0, 0.25, 0.5, 0.75, 1].map(r => ({
            y: top + (1 - r) * plotH,
            v: minY + r * yRange,
        }));

        return {width, height, left, right, top, bottom, minRound, maxRound, yTicks, lines};
    }, [timeline, metric, G.pub]);

    return <TableContainer component={Paper}>
        {showFinalScoreTable ? <Table className={"table"} size="small" aria-label="Scoring table">
            <TableHead>
                <TableRow>
                    <TableCell>{i18n.playerName.player}</TableCell>
                    <TableCell>{i18n.gameOver.table.board}</TableCell>
                    <TableCell>{i18n.gameOver.table.card}</TableCell>
                    <TableCell>{i18n.gameOver.table.industryAward}</TableCell>
                    <TableCell>{i18n.gameOver.table.aesAward}</TableCell>
                    <TableCell>{i18n.gameOver.table.archive}</TableCell>
                    <TableCell>{i18n.gameOver.table.events}</TableCell>
                    <TableCell>{i18n.gameOver.table.total}</TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
                {order.sort(scoreRank).map(p => {
                    const pub = G.pub[parseInt(p)];
                    const f = pub.finalScoring;
                    return <TableRow key={p}>
                        <TableCell component="th" scope="row">
                            {getName(p)}
                        </TableCell>
                        <TableCell>{pub.vp}</TableCell>
                        <TableCell>{f.card}</TableCell>
                        <TableCell>{f.industryAward}</TableCell>
                        <TableCell>{f.aestheticsAward}</TableCell>
                        <TableCell>{f.archive}</TableCell>
                        <TableCell>{f.events}</TableCell>
                        <TableCell>{f.total}</TableCell>
                    </TableRow>
                })}
            </TableBody>
        </Table> : null}

        <div style={{padding: 12}}>
            {showFinalScoreTable && showStatsSection ? <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8}}>
                <div style={{fontSize: 13, color: "#5f6b7a"}}>数据统计</div>
                <Button size="small" variant="outlined" color="primary" onClick={() => setShowStats(v => !v)}>
                    {showStats ? "隐藏统计" : "显示统计"}
                </Button>
            </div> : null}

            {showStatsSection && showStats ? <>
            <div style={{display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10}}>
                <Button size="small" variant={metric === "level" ? "contained" : "outlined"} color="primary" onClick={() => setMetric("level")}>等级</Button>
                <Button size="small" variant={metric === "score" ? "contained" : "outlined"} color="primary" onClick={() => setMetric("score")}>分数</Button>
                <Button size="small" variant={metric === "eraRatio" ? "contained" : "outlined"} color="primary" onClick={() => setMetric("eraRatio")}>牌效比</Button>
                <Button size="small" variant={metric === "time" ? "contained" : "outlined"} color="primary" onClick={() => setMetric("time")}>时间</Button>
            </div>

            <div style={{marginBottom: 8, fontSize: 13, color: "#5f6b7a"}}>{metricLabel(metric)} 随轮变化折线</div>
            {metric === "time" ? <div style={{marginBottom: 8, fontSize: 12, color: "#8a94a6"}}>时间折线按总用时绘制</div> : null}

            {chart ? <div style={{width: "100%", overflowX: "auto", marginBottom: 12}}>
                <svg
                    viewBox={`0 0 ${chart.width} ${chart.height}`}
                    preserveAspectRatio="xMidYMid meet"
                    style={{width: "100%", height: "auto", minWidth: 500, aspectRatio: `${chart.width}/${chart.height}`, background: "#fbfcff", border: "1px solid #eef2f7", borderRadius: 8}}
                >
                    {chart.yTicks.map((tick, i) => <g key={`y-${i}`}>
                        <line x1={chart.left} y1={tick.y} x2={chart.width - chart.right} y2={tick.y} stroke="#e7ecf4" strokeWidth="1" />
                        <text x={chart.left - 8} y={tick.y + 4} textAnchor="end" fill="#7f8da3" fontSize="11">{formatMetric(metric, tick.v)}</text>
                    </g>)}

                    {chart.lines.map(line => {
                        const isActive = hoveredPlayer === null || hoveredPlayer === line.playerIdx;
                        const lastPt = line.pts[line.pts.length - 1];
                        return <g
                            key={`line-${line.playerIdx}`}
                            onMouseEnter={() => setHoveredPlayer(line.playerIdx)}
                            onMouseLeave={() => setHoveredPlayer(null)}
                            style={{cursor: "pointer"}}
                        >
                            <polyline
                                fill="none"
                                stroke={line.color}
                                strokeWidth={isActive ? "3" : "2"}
                                strokeOpacity={isActive ? 1 : 0.25}
                                points={line.polyline}
                            />
                            {line.pts.map((p, idx) => <circle
                                key={`pt-${line.playerIdx}-${idx}`}
                                cx={p.x}
                                cy={p.y}
                                r={isActive ? "3.2" : "2.2"}
                                fill={line.color}
                                fillOpacity={isActive ? 1 : 0.25}
                            />)}
                            {lastPt ? <text
                                x={Math.min(lastPt.x + 8, chart.width - chart.right - 8)}
                                y={lastPt.y - 6}
                                fill={line.color}
                                fillOpacity={isActive ? 1 : 0.35}
                                fontSize={isActive ? "12" : "11"}
                                fontWeight={isActive ? "bold" : "normal"}
                            >{getPlainPlayerName(line.playerIdx)}</text> : null}
                        </g>
                    })}

                    <text x={chart.left} y={chart.height - 8} fill="#7f8da3" fontSize="11">第 {chart.minRound} 轮</text>
                    <text x={chart.width - chart.right} y={chart.height - 8} textAnchor="end" fill="#7f8da3" fontSize="11">第 {chart.maxRound} 轮</text>
                </svg>
            </div> : null}

            <Table size="small" aria-label="metric round table">
                <TableHead>
                    <TableRow>
                        <TableCell>轮</TableCell>
                        {G.pub.map((_, idx) => <TableCell key={`p-header-${idx}`}>
                            <span style={{color: getColor(regionsBySeat[idx] ?? Region.NONE)}}>{getPlainPlayerName(idx)}</span>
                        </TableCell>)}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {timeline.map((t) => <TableRow key={`r-${t.round}`}>
                        <TableCell>{t.round}</TableCell>
                        {G.pub.map((_, idx) => {
                            const player = t.players[idx] || {industry: 0, aesthetics: 0, score: 0, eraRatio: 0, roundTimeMs: 0, totalTimeMs: 0};
                            const v = metricValue(metric, player);
                            return <TableCell key={`v-${t.round}-${idx}`}>{metric === "time" ? `${formatDuration(player.totalTimeMs || 0)}` : formatMetric(metric, v)}</TableCell>
                        })}
                    </TableRow>)}
                </TableBody>
            </Table>
            </> : null}
        </div>
    </TableContainer>
}

export default FinalScoreTable;
