import React from "react";
import {BoardProps} from "boardgame.io/react";
import {IG} from "../types/setup";
import {BoardCardSlot, BoardRegion, SchoolRegion} from "./region";
import {activePlayer, canAfford} from "../game/util";
import i18n from "../constant/i18n";
import {PlayerID} from "boardgame.io";
import Button from "@material-ui/core/Button";
import PubPanel from "./pub";
import {
    BasicCardID,
    BuildingType,
    EventCardID,
    ExtensionMode,
    IBuildingSlot,
    ICardSlot,
    Region,
    SimpleRuleNumPlayers,
    valid_regions
} from "../types/core";
import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography";
import Paper from "@material-ui/core/Paper";
import LogView from './log-view';
import DeckIcon from '@material-ui/icons/Layers';
import NormalCardIcon from '@material-ui/icons/RadioButtonUnchecked';
import LegendCardIcon from '@material-ui/icons/StarBorder';
import StudioIcon from '@material-ui/icons/Business';
import TheatersIcon from '@material-ui/icons/Theaters';
import {useI18n} from "@i18n-chain/react";
import OperationPanel from "./boards/operation";
import FinalScoreTable from "./boards/final";
import {getCardName} from "./card";
import {nanoid} from "nanoid";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogContent from "@material-ui/core/DialogContent";
import SetupPanel from "./boards/setup-game-mode";
// @ts-ignore
import disconnectedSfx from './media/connect.mp3'
// @ts-ignore
import playerTurnSfx from './media/turn.mp3';
import {ChampionIcon, DrawnShareIcon, getColor} from "./icons";
import Dialog from "@material-ui/core/Dialog";
import ErrorBoundary from "./error";

let sound: HTMLAudioElement;
let connectedSound: HTMLAudioElement;

export const playConnectedSound = () => {
    if (!connectedSound) {
        connectedSound = new Audio(disconnectedSfx);
    }
    connectedSound.play().then(() => {
    });
}

export const playSound = () => {
    if (!sound) {
        sound = new Audio(playerTurnSfx);
    }
    sound.play().then(() => {
    });
};


export function usePrevious(value: any) {
    const ref = React.useRef();

    React.useEffect(() => {
        ref.current = value;
    }, [value]);

    return ref.current;
}

export const FilmCentenaryBoard = ({
                                       G,
                                       log,
                                       ctx,
                                       events,
                                       moves,
                                       undo,
                                       redo,
                                       matchData,
                                       matchID,
                                       playerID,
                                       isActive,
                                       isMultiplayer,
                                       isConnected
                                   }: BoardProps<IG>) => {

    useI18n(i18n);
    const canMoveCurrent = ctx.currentPlayer === playerID && activePlayer(ctx) === playerID;
    const canMoveOutOfTurn = ctx.currentPlayer !== playerID && activePlayer(ctx) === playerID;
    const canMove = ctx.currentPlayer === playerID ? canMoveCurrent : canMoveOutOfTurn;
    const curPlayerSuffix = "(*)";
    const connectedPrefix = "---";
    const prevIsActive = usePrevious(isActive);
    const prevIsConnected = usePrevious(isConnected);

    React.useEffect(() => {
        if (isMultiplayer && !isConnected && prevIsConnected) {
            playConnectedSound();
        }
    }, [prevIsConnected, isConnected])

    React.useEffect(() => {
        if (isActive && prevIsActive === false) {
            playSound();
        }
    }, [prevIsActive, isActive])

    const locale = i18n._.getLocaleName();

    React.useEffect((): () => void => {
        document.title = (isActive ? curPlayerSuffix : "") + i18n.title;
        return () => document.title = i18n.title;
    }, [isActive, locale])

    const getName = (playerID: PlayerID | null = ctx.currentPlayer): string => {
        const fallbackName = i18n.playerName.player + playerID;
        const curSuffix = ctx.currentPlayer === playerID ? curPlayerSuffix : ""
        const activeSuffix = activePlayer(ctx) === playerID && ctx.currentPlayer !== playerID ? "(**)" : ""
        const markSuffix = G.regionScoreCompensateMarker === playerID ? "" : ""
        let name = "";
        if (playerID === null) {
            return i18n.playerName.spectator
        }

        // 从 matchData 获取基础名称（joinMatch 时敲定的名字）
        const getMatchDataName = (): string | null => {
            if (matchData === undefined) return null;
            const arr = matchData.filter(m => m.id.toString() === playerID);
            if (arr.length === 0) return null;
            const n = arr[0].name;
            if (n === undefined || n === null) return null;
            return n;
        };

        const matchDataName = getMatchDataName();

        // 匿名随机模式
        if (G.anonymousRandomMode) {
            // 游戏进行中（非初始化阶段、非终局）：使用匿名公司名
            const isGameActive = ctx.phase !== "InitPhase" && ctx.gameover === undefined;
            if (isGameActive) {
                const anonymousName = G.anonymousPlayerNames[parseInt(playerID)] || "";
                if (G.anonymousRandomRevealed && anonymousName !== "") {
                    name = anonymousName;
                } else {
                    const hasJoinedPlayer = matchDataName !== null;
                    name = hasJoinedPlayer ? "！！！" : "？？？";
                }
                return `${name}${curSuffix}${activeSuffix}${markSuffix}`;
            }
            // 游戏开始前 / 游戏结束时：使用自定义名称（走下面的普通名称逻辑）
        }

        // 普通名称逻辑
        if (matchDataName === null) {
            name = fallbackName;
        } else {
            name = matchDataName;
        }

        // 重名处理：同一局中如有重复名称，按 playerID 顺序追加 -1, -2, -3, -4
        if (matchData !== undefined && ctx.gameover === undefined && matchDataName !== null) {
            const sameNamePlayers: string[] = [];
            for (const m of matchData) {
                if (m.name === matchDataName) {
                    sameNamePlayers.push(m.id.toString());
                }
            }
            if (sameNamePlayers.length > 1) {
                // 按 playerID 排序，确定当前玩家是第几个
                sameNamePlayers.sort((a, b) => parseInt(a) - parseInt(b));
                const idx = sameNamePlayers.indexOf(playerID);
                if (idx >= 0) {
                    name = `${name}-${idx + 1}`;
                }
            }
        }

        return `${name}${curSuffix}${activeSuffix}${markSuffix}`
    }

    const comment = (slot: ICardSlot, card: BasicCardID | null) => moves.comment({
        target: slot.card,
        comment: card,
        p: playerID
    })

    const showBoardStatus = () => {
        const args = ctx.numPlayers > SimpleRuleNumPlayers ? {
            regions: [
                G.regions[Region.NA],
                G.regions[Region.WE],
                G.regions[Region.EE],
                G.regions[Region.ASIA],
                G.regions[Region.EXTENSION],
            ],
            school: [],
            film: [],
            matchID: matchID,
        } : {
            regions: [],
            school: G.twoPlayer.school,
            film: G.twoPlayer.film,
            matchID: matchID,
        }
        moves.showBoardStatus(args);
    }

    const endPhase = () => events?.endPhase?.();

    const [open, setOpen] = React.useState(true);
    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);
    const [showSpectatorTrend, setShowSpectatorTrend] = React.useState(true);
    const [filterRegion, setFilterRegion] = React.useState<Region | null>(null);

    // 切换地区后，仅当筛选栏不在视口内时才滚动到筛选栏顶部
    React.useEffect(() => {
        if (filterRegion !== null) {
            requestAnimationFrame(() => {
                const el = document.getElementById('regionFilter');
                if (!el) return;
                const rect = el.getBoundingClientRect();
                // 筛选栏顶部被 sticky AppBar 遮挡（约80px），或已滚出视口上方时，才需要滚动
                const isVisible = rect.top >= 80 && rect.bottom <= window.innerHeight;
                if (!isVisible) {
                    el.scrollIntoView({ block: 'start' });
                }
            });
        }
    }, [filterRegion]);

    const isRegionVisible = (r: Region): boolean => {
        if (r === Region.EXTENSION) {
            if (ExtensionMode.FIXED === G.extensionMode) return false;
            if (G.extensionMode === ExtensionMode.FOUR) return true;
            return G.hasSchoolExtension;
        }
        if (r === Region.EXTENSION1) {
            if (ExtensionMode.FIXED === G.extensionMode) return false;
            if (G.extensionMode === ExtensionMode.FOUR) return false;
            return G.hasSchoolExtensionMuki || G.hasSchoolExtensionQM;
        }
        if (r === Region.EXTENSION2) {
            if (ExtensionMode.FIXED === G.extensionMode) return false;
            if (G.extensionMode === ExtensionMode.FOUR) return false;
            return G.hasSchoolExtensionMuki2;
        }
        // 主地区始终可见
        return true;
    };

    const allRegions: Region[] = [
        Region.NA, Region.WE, Region.EE, Region.ASIA,
        Region.EXTENSION, Region.EXTENSION1, Region.EXTENSION2
    ];

    const visibleDisplayRegions: Region[] = allRegions.filter(r => isRegionVisible(r));

    // 键盘 A/D 左右切换地区
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
            if (ctx.phase === "InitPhase") return;
            if (ctx.numPlayers === SimpleRuleNumPlayers) return;
            if (visibleDisplayRegions.length === 0) return;

            const currentIndex = filterRegion === null ? -1 : visibleDisplayRegions.indexOf(filterRegion);

            if (e.key === 'a' || e.key === 'A') {
                e.preventDefault();
                const newIndex = currentIndex <= 0 ? visibleDisplayRegions.length - 1 : currentIndex - 1;
                setFilterRegion(visibleDisplayRegions[newIndex]);
            } else if (e.key === 'd' || e.key === 'D') {
                e.preventDefault();
                const newIndex = currentIndex >= visibleDisplayRegions.length - 1 ? 0 : currentIndex + 1;
                setFilterRegion(visibleDisplayRegions[newIndex]);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [filterRegion, visibleDisplayRegions, ctx.phase, ctx.numPlayers]);

    const isExtensionRegion = (r: Region): boolean =>
        r === Region.EXTENSION || r === Region.EXTENSION1 || r === Region.EXTENSION2;

    const renderRegionButtonContent = (r: Region, selected: boolean): React.ReactNode => {
        // @ts-ignore
        const regionInfo = G.regions[r];
        const color = getColor(r);
        const textColor = selected ? '#fff' : color;

        // 建筑槽位显示（参考地区组件的显示方式）
        const activeSlots = regionInfo.buildings.filter((slot: IBuildingSlot) => slot.activated);
        const buildingNodes: React.ReactNode[] = activeSlots.map((slot: IBuildingSlot, idx: number) => {
            const ownerName = slot.owner === "" ? i18n.pub.emptyBuildingSlot : getName(slot.owner);
            if (slot.owner === "") {
                // 激活但无拥有者：显示 电影院/制片厂 图标 + "空"
                return (
                    <span key={idx} style={{display: 'inline-flex', alignItems: 'center'}}>
                        <TheatersIcon style={{fontSize: 16}}/>/<StudioIcon style={{fontSize: 16}}/>
                        {ownerName}
                    </span>
                );
            }
            // 激活且有拥有者：显示对应建筑图标 + 拥有者名
            return (
                <span key={idx} style={{display: 'inline-flex', alignItems: 'center'}}>
                    {slot.building === BuildingType.cinema ? <TheatersIcon style={{fontSize: 16}}/> : <StudioIcon style={{fontSize: 16}}/>}
                    {ownerName}
                </span>
            );
        });
        const buildingDisplay: React.ReactNode = buildingNodes.length > 0
            ? buildingNodes.map((node, i) =>
                <React.Fragment key={i}>{i > 0 && <span>, </span>}{node}</React.Fragment>
            )
            : <span>{i18n.pub.emptyBuildingSlot}</span>;

        // 卡牌信息
        const allCards: { name: string; affordable: boolean }[] = [];
        const addCard = (slot: ICardSlot) => {
            if (slot.card !== null) {
                const cardName = getCardName(slot.card);
                const afford = playerID !== null && canAfford(G, ctx, slot.card, playerID);
                allCards.push({ name: cardName, affordable: afford });
            }
        };
        addCard(regionInfo.legend);
        regionInfo.normal.forEach(addCard);

        // 卡牌分行（每行2个）
        const cardColor = (affordable: boolean): string => {
            if (selected) return '#fff';
            return affordable ? '#4caf50' : 'inherit';
        };
        const cardRows: React.ReactNode[] = [];
        for (let i = 0; i < allCards.length; i += 2) {
            const pair = allCards.slice(i, i + 2);
            cardRows.push(
                <span key={i} style={{lineHeight: 1.4}}>
                    {pair.map((c, j) =>
                        <React.Fragment key={j}>
                            {j > 0 && <span style={{color: selected ? '#fff' : 'inherit'}}> | </span>}
                            <span style={{color: cardColor(c.affordable)}}>{c.name}{c.affordable ? ' ✓' : ''}</span>
                        </React.Fragment>
                    )}
                </span>
            );
        }

        // 流派扩不显示份额和建筑
        if (isExtensionRegion(r)) {
            return (
                <span style={{display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', gap: 1}}>
                    <span style={{color: textColor}}>{i18n.region[r]}</span>
                    {cardRows}
                </span>
            );
        }

        return (
            <span style={{display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', gap: 1}}>
                <span style={{display: 'inline-flex', alignItems: 'center', gap: 2}}>
                    <span style={{color: textColor}}>{i18n.region[r]}{i18n.era[regionInfo.era as 0 | 1 | 2]}</span>
                    <span> (</span>
                    <DrawnShareIcon r={r}/>
                    <span>×{regionInfo.share}</span>
                    <span>, </span>
                    {buildingDisplay}
                    <span>)</span>
                </span>
                {cardRows}
            </span>
        );
    };

    const cardBoard = ctx.numPlayers === SimpleRuleNumPlayers ?
        <Grid item container xs={12} sm={7}>
            <Grid item xs={12} sm={6}>
                <Typography>
                    {valid_regions.map(r => {
                        const regionIdx: 0 | 1 | 2 | 3 | 4 | 5 | 6 = r;
                        const region = G.regions[regionIdx];
                        return <React.Fragment key={nanoid()}>
                            <DrawnShareIcon r={r}/>{region.share}
                        </React.Fragment>;
                    })}
                    <ChampionIcon champion={{
                        region: Region.NONE,
                        era: G.twoPlayer.era
                    }}/><DeckIcon/><LegendCardIcon/>{G.twoPlayer.schoolDeckLength}<NormalCardIcon/>{G.twoPlayer.filmDeckLength}
                </Typography>
            </Grid>
            <Grid item xs={12}>
                <BoardCardSlot slot={G.twoPlayer.school[0]} G={G} ctx={ctx} moves={moves} comment={comment}
                               playerID={playerID}/>
            </Grid>
            <Grid item xs={12}>
                <BoardCardSlot slot={G.twoPlayer.school[1]} G={G} ctx={ctx} moves={moves} comment={comment}
                               playerID={playerID}/>
            </Grid>
            <Grid item xs={12}>
                <BoardCardSlot slot={G.twoPlayer.film[0]} G={G} ctx={ctx} moves={moves} comment={comment}
                               playerID={playerID}/>
            </Grid>
            <Grid item xs={12}>
                <BoardCardSlot slot={G.twoPlayer.film[1]} G={G} ctx={ctx} moves={moves} comment={comment}
                               playerID={playerID}/>
            </Grid>
            <Grid item xs={12}>
                <BoardCardSlot slot={G.twoPlayer.film[2]} G={G} ctx={ctx} moves={moves} comment={comment}
                               playerID={playerID}/>
            </Grid>
            <Grid item xs={12}>
                <BoardCardSlot slot={G.twoPlayer.film[3]} G={G} ctx={ctx} moves={moves} comment={comment}
                               playerID={playerID}/>
            </Grid>
        </Grid> :

        <Grid item container xs={12} sm={7} style={{flexDirection: 'column', flexWrap: 'nowrap', alignContent: 'flex-start'}}>
            <Grid item id="regionFilter" style={{flexShrink: 0, width: '100%', scrollMarginTop: 80}}>
                <Grid container spacing={1} justifyContent="center" style={{padding: 4}}>
                    <Grid item>
                        <Button
                            size="small"
                            variant={filterRegion === null ? "contained" : "outlined"}
                            color={filterRegion === null ? "primary" : "default"}
                            onClick={() => setFilterRegion(null)}
                        >
                            {i18n._.getLocaleName() === 'en' ? 'All Regions' : '所有地区'}
                        </Button>
                    </Grid>
                    {visibleDisplayRegions.map(r => (
                        <Grid item key={r}>
                            <Button
                                size="small"
                                variant={filterRegion === r ? "contained" : "outlined"}
                                color={filterRegion === r ? "primary" : "default"}
                                onClick={() => setFilterRegion(r)}
                            >
                                {renderRegionButtonContent(r, filterRegion === r)}
                            </Button>
                        </Grid>
                    ))}
                </Grid>
            </Grid>
            <Grid item style={{flex: 1, overflowY: 'auto', width: '100%'}}>
                {(filterRegion === null || filterRegion === Region.NA) &&
                    <BoardRegion getPlayerName={getName} r={Region.NA} moves={moves} region={G.regions[Region.NA]} G={G} ctx={ctx}
                                 playerID={playerID}/>}
                {(filterRegion === null || filterRegion === Region.WE) &&
                    <BoardRegion getPlayerName={getName} r={Region.WE} moves={moves} region={G.regions[Region.WE]} G={G} ctx={ctx}
                                 playerID={playerID}/>}
                {(filterRegion === null || filterRegion === Region.EE) &&
                    <BoardRegion getPlayerName={getName} r={Region.EE} moves={moves} region={G.regions[Region.EE]} G={G} ctx={ctx}
                                 playerID={playerID}/>}
                {(filterRegion === null || filterRegion === Region.ASIA) &&
                    <BoardRegion getPlayerName={getName} r={Region.ASIA} moves={moves} region={G.regions[Region.ASIA]} G={G} ctx={ctx}
                                 playerID={playerID}/>}
                {(filterRegion === null || filterRegion === Region.EXTENSION) &&
                    <SchoolRegion getPlayerName={getName} r={Region.EXTENSION} moves={moves} region={G.regions[Region.EXTENSION]} G={G} ctx={ctx}
                                  playerID={playerID}/>}
                {(filterRegion === null || filterRegion === Region.EXTENSION1) &&
                    <SchoolRegion getPlayerName={getName} r={Region.EXTENSION1} moves={moves} region={G.regions[Region.EXTENSION1]} G={G} ctx={ctx}
                                  playerID={playerID}/>}
                {(filterRegion === null || filterRegion === Region.EXTENSION2) &&
                    <SchoolRegion getPlayerName={getName} r={Region.EXTENSION2} moves={moves} region={G.regions[Region.EXTENSION2]} G={G} ctx={ctx}
                                  playerID={playerID}/>}
            </Grid>
        </Grid>

    const disconnectNotice = isConnected ? <></> :
        <>
            <Button
                fullWidth
                style={{textTransform: 'none'}}
                onClick={handleOpen}
                color="secondary"
                variant={"outlined"}
            >
                <Typography>
                    {i18n.disconnected}
                </Typography>
            </Button>
            <Dialog open={open} onClose={handleClose}>
                <DialogTitle>
                    <Typography variant="h5" component="h1">
                        {i18n.disconnected}
                    </Typography>
                </DialogTitle>
                <DialogContent>
                    {i18n.disconnected}
                </DialogContent>
            </Dialog>
        </>

    const gameOverResult = ctx.gameover === undefined ? <></> :
        <>
            <Button
                fullWidth
                style={{textTransform: 'none'}}
                onClick={handleOpen}
                color="secondary"
                variant={"outlined"}
            >
                <Typography>
                    {i18n.gameOver.title}
                </Typography>
            </Button>
            <Dialog open={open} onClose={handleClose}>
                <DialogTitle>
                    <Typography variant="h5" component="h1">
                        {i18n.gameOver.title}
                    </Typography>
                </DialogTitle>
                <DialogContent>
                    <Paper variant="elevation">
                        <Typography variant="h6" component="h2">{
                            // @ts-ignore
                            i18n.gameOver.reason[ctx.gameover.reason]
                        }</Typography>
                        <Typography variant="h6" component="h2">{i18n.gameOver.winner}</Typography>
                        <Typography variant="h6" component="h2">{getName(ctx.gameover.winner)}</Typography>
                    </Paper>
                    <FinalScoreTable G={G} ctx={ctx} getName={getName}/>
                </DialogContent>
            </Dialog>
        </>

    const spectatorTrendPanel = playerID === null && ctx.gameover === undefined ?
        <Grid item xs={12}>
            <Paper variant="elevation">
                <div style={{padding: 8}}>
                    <Grid container justifyContent="space-between" alignItems="center">
                        <Grid item>
                            <Typography variant="h6" component="h2">对局趋势（观战）</Typography>
                        </Grid>
                        <Grid item>
                            <Button
                                size="small"
                                variant="outlined"
                                onClick={() => setShowSpectatorTrend(v => !v)}
                            >
                                {showSpectatorTrend ? "隐藏" : "显示"}
                            </Button>
                        </Grid>
                    </Grid>
                    {showSpectatorTrend ? <FinalScoreTable G={G} ctx={ctx} getName={getName} showFinalScoreTable={false}/> : <></>}
                </div>
            </Paper>
        </Grid> : <></>
    const upperPanel = playerID !== null ? <>
            {ctx.phase === "InitPhase" ?
                isActive ? <Grid item xs={12}>
                    <SetupPanel ctx={ctx} moves={moves}/>
                    <Button
                        fullWidth
                        autoFocus
                        variant="contained"
                        color={"primary"}
                        size="large"
                        disabled={!canMove}
                        onClick={showBoardStatus}>
                        {i18n.action.showBoardStatus}
                    </Button>
                    {G.pending.endPhase && canMoveCurrent ?
                        <Button
                            fullWidth
                            variant={"outlined"}
                            onClick={endPhase}
                        >
                            {i18n.action.endPhase}
                        </Button>
                        : <></>}
                </Grid> : <></>
                : <>
                    {cardBoard}
                    {ctx.gameover === undefined
                        ?
                        <OperationPanel
                            G={G} ctx={ctx}
                            moves={moves}
                            playerID={playerID}
                            events={events}
                            undo={undo} redo={redo}
                            getName={getName}
                            log={log}
                        />
                        : <></>}
                </>}
        </>
        : <></>

    return <ErrorBoundary>
        <Grid container justifyContent="flex-start" key={`film-centenary-board-player-${playerID}`}>
            {gameOverResult}
            {disconnectNotice}
            {G.pending.lastRoundOfGame && ctx.gameover === undefined ?
                <Grid item container xs={12} justifyContent="space-evenly">
                    <Paper variant="elevation">
                        <Typography variant="h4" component="h1">{i18n.pub.lastRoundOfGame}</Typography>
                    </Paper> </Grid> : <></>}
            {ctx.numPlayers !== SimpleRuleNumPlayers ? <Grid xs={12} spacing={2} container item>
                <Grid item xs={4}>
                    <Typography>{`${i18n.pub.events}(${G.eventDeckLength})`}</Typography
                    ></Grid>
                {G.events.map((e: EventCardID, idx: number) => <Grid key={idx} item xs={4}>
                    <Paper key={idx} elevation={5}>
                        <Typography>{getCardName(e)}</Typography>
                        <Typography>{i18n.eventName[e]}</Typography>
                    </Paper></Grid>)}
            </Grid> : <></>}
            {playerID === null ? cardBoard : <></>}
            {upperPanel}
            <Grid item container justifyContent="space-evenly">
                <Grid item><Typography>{i18n.card.B01} {G.basicCards.B01}</Typography></Grid>
                <Grid item><Typography>{i18n.card.B02} {G.basicCards.B02}</Typography></Grid>
                <Grid item><Typography>{i18n.card.B03} {G.basicCards.B03}</Typography></Grid>
                <Grid item><Typography>{i18n.card.B04} {G.basicCards.B04}</Typography></Grid>
                <Grid item><Typography>{i18n.card.B05} {G.basicCards.B05}</Typography></Grid>
            </Grid>
            {
                log === undefined ? <></> :
                    <LogView log={log} getPlayerName={getName} G={G}/>
            }
            {G.order.map((i: PlayerID) =>
                <Grid item sm={6} lg={3} key={`grid-pub-panel-${i}-${playerID}`}>
                    <ErrorBoundary>
                        <PubPanel log={log} ctx={ctx} i={G.pub[parseInt(i)]} key={nanoid()} G={G} idx={parseInt(i)}
                                  getName={getName}/>
                    </ErrorBoundary>
                </Grid>
            )}
            <Grid item xs={12}>
                <FinalScoreTable G={G} ctx={ctx} getName={getName} showStatsSection={false}/>
            </Grid>
            {spectatorTrendPanel}
        </Grid>
    </ErrorBoundary>
}
