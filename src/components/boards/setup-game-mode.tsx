import React from 'react';
import Checkbox from '@material-ui/core/Checkbox';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormControl from '@material-ui/core/FormControl';
import FormLabel from '@material-ui/core/FormLabel';
import Collapse from '@material-ui/core/Collapse';
import Typography from '@material-ui/core/Typography';
import {ExtensionMode, GameMode, GameTurnOrder} from "../../types/core";
import {Ctx} from "boardgame.io";
import Grid from "@material-ui/core/Grid";

import {useI18n} from "@i18n-chain/react";
import i18n from "../../constant/i18n";
import { getAllExtensions } from "../../extensions/registry";

export interface ISetupPanelProps {
    ctx: Ctx,
    moves: Record<string, (...args: any[]) => void>,
}

const LS_KEY = "film-centenary-game-options";

interface ISavedOptions {
    mode: GameMode;
    order: GameTurnOrder;
    extensionMode: ExtensionMode;
    enableSchoolExtension: boolean;
    enableSchoolExtensionMuki: boolean;
    enableSchoolExtensionMuki2: boolean;
    enableSchoolExtensionQM: boolean;
    enableExtensionChaosMedia: boolean;
    disableUndo: boolean;
    enabledExtensions: string[];
}

/** 从 localStorage 读取上次保存的选项 */
function loadOptions(): ISavedOptions | null {
    try {
        const raw = localStorage.getItem(LS_KEY);
        if (raw) return JSON.parse(raw) as ISavedOptions;
    } catch {}
    return null;
}

/** 保存选项到 localStorage */
function saveOptions(opts: ISavedOptions): void {
    try {
        localStorage.setItem(LS_KEY, JSON.stringify(opts));
    } catch {}
}

/** 检查保存的选项是否有任何扩展被启用 */
function hasAnySavedExtensionEnabled(saved: ISavedOptions | null): boolean {
    if (!saved) return false;
    return (
        saved.enableSchoolExtension ||
        saved.enableSchoolExtensionMuki ||
        saved.enableSchoolExtensionMuki2 ||
        saved.enableSchoolExtensionQM ||
        saved.enableExtensionChaosMedia ||
        (saved.enabledExtensions && saved.enabledExtensions.length > 0) ||
        saved.extensionMode !== ExtensionMode.NONE ||
        saved.disableUndo
    );
}

export default function SetupPanel({moves, ctx}: ISetupPanelProps) {
    useI18n(i18n);

    // 尝试从 localStorage 恢复上次选项
    const saved = React.useMemo(() => loadOptions(), []);

    const [mode, setMode] = React.useState<GameMode>(saved?.mode ?? GameMode.NORMAL);
    const [order, setOrder] = React.useState<GameTurnOrder>(saved?.order ?? GameTurnOrder.FIXED);
    const [extensionMode, setExtensionMode] = React.useState<ExtensionMode>(saved?.extensionMode ?? ExtensionMode.NONE);
    const [enableSchoolExtension, setEnableSchoolExtension] = React.useState(saved?.enableSchoolExtension ?? false);
    const [enableSchoolExtensionMuki, setEnableSchoolExtensionMuki] = React.useState(saved?.enableSchoolExtensionMuki ?? false);
    const [enableSchoolExtensionMuki2, setEnableSchoolExtensionMuki2] = React.useState(saved?.enableSchoolExtensionMuki2 ?? false);
    const [enableSchoolExtensionQM, setEnableSchoolExtensionQM] = React.useState(saved?.enableSchoolExtensionQM ?? false);
    const [enableExtensionChaosMedia, setEnableExtensionChaosMedia] = React.useState(saved?.enableExtensionChaosMedia ?? false);
    const [disableUndo, setDisableUndo] = React.useState(saved?.disableUndo ?? false);
    const [enabledExtensions, setEnabledExtensions] = React.useState<string[]>(saved?.enabledExtensions ?? []);
    // 如果有保存的扩展选项，默认展开自定义选项面板
    const [showCustomOptions, setShowCustomOptions] = React.useState(
        hasAnySavedExtensionEnabled(saved)
    );

    // 是否有任何扩展选项被启用
    const hasAnyExtensionEnabled =
        enableSchoolExtension ||
        enableSchoolExtensionMuki ||
        enableSchoolExtensionMuki2 ||
        enableSchoolExtensionQM ||
        enableExtensionChaosMedia ||
        enabledExtensions.length > 0 ||
        extensionMode !== ExtensionMode.NONE ||
        disableUndo;

    // 已注册的 DIY 扩展列表（安全加载，失败时返回空数组）
    const registeredExtensions = React.useMemo(() => {
        try {
            return getAllExtensions();
        } catch (e) {
            console.warn("[SetupPanel] Failed to load extensions:", e);
            return [];
        }
    }, []);

    // 清理 localStorage 中可能已失效的扩展 ID（扩展已被移除）
    const validEnabledExtensions = React.useMemo(() => {
        const registeredIds = new Set(registeredExtensions.map(e => e.id));
        return enabledExtensions.filter(id => registeredIds.has(id));
    }, [enabledExtensions, registeredExtensions]);

    // 同步：如果清理后有变化，更新状态
    React.useEffect(() => {
        if (validEnabledExtensions.length !== enabledExtensions.length) {
            setEnabledExtensions(validEnabledExtensions);
        }
    }, [validEnabledExtensions, enabledExtensions.length]);

    /** 统一切换扩展选项后调用 moves.setupGameMode */
    const applyOptions = React.useCallback((
        overrides: Partial<ISavedOptions>
    ) => {
        const current = {
            mode, order, extensionMode,
            enableSchoolExtension, enableSchoolExtensionMuki,
            enableSchoolExtensionMuki2, enableSchoolExtensionQM,
            enableExtensionChaosMedia, disableUndo,
            enabledExtensions,
            ...overrides,
        };
        moves.setupGameMode(current);
        saveOptions(current);
    }, [mode, order, extensionMode, enableSchoolExtension, enableSchoolExtensionMuki,
        enableSchoolExtensionMuki2, enableSchoolExtensionQM, enableExtensionChaosMedia,
        disableUndo, enabledExtensions, moves]);

    // 组件挂载时，如果有保存的选项，应用一次
    React.useEffect(() => {
        if (saved) {
            moves.setupGameMode(saved);
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newMode: GameMode = event.target.value as GameMode;
        setMode(newMode);
        applyOptions({ mode: newMode });
    };

    const handleFirstPlayerChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newOrder: GameTurnOrder = event.target.value as GameTurnOrder;
        setOrder(newOrder);
        applyOptions({ order: newOrder });
    };

    const handleExtensionModeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newExtensionMode: ExtensionMode = event.target.value as ExtensionMode;
        setExtensionMode(newExtensionMode);
        applyOptions({ extensionMode: newExtensionMode });
    };

    // --- 扩展 checkbox handlers ---
    const makeExtHandler = (
        setter: (v: boolean) => void,
        key: keyof ISavedOptions
    ) => (_event: React.ChangeEvent<{}>, checked: boolean) => {
        setter(checked);
        applyOptions({ [key]: checked } as Partial<ISavedOptions>);
    };

    // --- DIY 扩展 checkbox handler ---
    const handleDiyExtToggle = (extId: string, checked: boolean) => {
        const next = checked
            ? [...enabledExtensions, extId]
            : enabledExtensions.filter(id => id !== extId);
        setEnabledExtensions(next);
        applyOptions({ enabledExtensions: next });
    };

    return (
        <Grid container>
            {/* ====== 游戏模式 ====== */}
            <FormControl component="fieldset">
                <FormLabel component="legend">{i18n.setting.mode}</FormLabel>
                <RadioGroup row aria-label={i18n.setting.mode} name="mode" value={mode} onChange={handleChange}>
                    <FormControlLabel value={GameMode.NORMAL} control={<Radio/>} label={i18n.setting.normal}/>
                    <FormControlLabel value={GameMode.NEWBIE} control={<Radio/>} label={i18n.setting.newbie}/>
                    <FormControlLabel
                        disabled={ctx.numPlayers < 4}
                        value={GameMode.TEAM2V2} control={<Radio/>} label={i18n.setting.team}/>
                </RadioGroup>
            </FormControl>

            {/* ====== 行动顺序 ====== */}
            <FormControl component="fieldset">
                <FormLabel component="legend">{i18n.setting.order}</FormLabel>
                <RadioGroup row aria-label={i18n.setting.order} name="order" value={order}
                            onChange={handleFirstPlayerChange}>
                    <FormControlLabel value={GameTurnOrder.FIXED} control={<Radio/>} label={i18n.setting.fixedFirst}/>
                    <FormControlLabel value={GameTurnOrder.FIRST_RANDOM} control={<Radio/>} label={i18n.setting.randomFirst}/>
                    <FormControlLabel
                        disabled={ctx.numPlayers === 2}
                        value={GameTurnOrder.ALL_RANDOM} control={<Radio/>} label={i18n.setting.allRandom}/>
                    <FormControlLabel value={GameTurnOrder.ANONYMOUS_RANDOM} control={<Radio/>} label={i18n.setting.anonymousRandom}/>
                </RadioGroup>
            </FormControl>

            {/* ====== 自定义选项（可折叠） ====== */}
            <div style={{ width: '100%', marginTop: 8 }}>
                <div
                    onClick={() => setShowCustomOptions(!showCustomOptions)}
                    style={{
                        display: 'flex', alignItems: 'center', cursor: 'pointer',
                        userSelect: 'none', padding: '4px 0',
                    }}
                >
                    <span style={{ fontSize: 16, marginRight: 6, transition: 'transform 0.2s', display: 'inline-block', transform: showCustomOptions ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                        ▶
                    </span>
                    <Typography variant="subtitle2" style={{ fontWeight: 500 }}>
                        {i18n.setting.customOptions}
                    </Typography>
                    {hasAnyExtensionEnabled && (
                        <Typography variant="caption" style={{ marginLeft: 8, color: '#4caf50' }}>
                            ●
                        </Typography>
                    )}
                </div>

                <Collapse in={showCustomOptions}>
                    <div style={{ paddingLeft: 32, paddingTop: 4 }}>
                        <FormControl component="fieldset">
                            <FormControlLabel
                                checked={enableSchoolExtension}
                                onChange={makeExtHandler(setEnableSchoolExtension, 'enableSchoolExtension')}
                                disabled={ctx.numPlayers < 3}
                                control={<Checkbox/>} label={i18n.setting.enableSchoolExtension}/>
                            <FormControlLabel
                                checked={enableSchoolExtensionMuki}
                                onChange={makeExtHandler(setEnableSchoolExtensionMuki, 'enableSchoolExtensionMuki')}
                                disabled={ctx.numPlayers < 3}
                                control={<Checkbox/>} label={i18n.setting.enableSchoolExtensionMuki}/>
                            <FormControlLabel
                                checked={enableSchoolExtensionMuki2}
                                onChange={makeExtHandler(setEnableSchoolExtensionMuki2, 'enableSchoolExtensionMuki2')}
                                disabled={ctx.numPlayers < 3}
                                control={<Checkbox/>} label={i18n.setting.enableSchoolExtensionMuki2}/>
                            <FormControlLabel
                                checked={enableSchoolExtensionQM}
                                onChange={makeExtHandler(setEnableSchoolExtensionQM, 'enableSchoolExtensionQM')}
                                disabled={ctx.numPlayers < 3}
                                control={<Checkbox/>} label={i18n.setting.enableSchoolExtensionQM}/>
                            <FormControlLabel
                                checked={enableExtensionChaosMedia}
                                onChange={makeExtHandler(setEnableExtensionChaosMedia, 'enableExtensionChaosMedia')}
                                disabled={ctx.numPlayers < 3}
                                control={<Checkbox/>} label={i18n.setting.enableExtensionChaosMedia}/>
                            <FormControlLabel
                                checked={disableUndo}
                                onChange={makeExtHandler(setDisableUndo, 'disableUndo')}
                                control={<Checkbox/>} label={i18n.setting.disableUndo}/>

                            {/* ====== DIY 扩展（从注册中心自动生成） ====== */}
                            {registeredExtensions.length > 0 && (
                                <>
                                    {registeredExtensions.map(ext => (
                                        <FormControlLabel
                                            key={ext.id}
                                            checked={enabledExtensions.includes(ext.id)}
                                            onChange={(_e, checked) => handleDiyExtToggle(ext.id, checked)}
                                            disabled={ctx.numPlayers < 3}
                                            control={<Checkbox/>}
                                            label={`${ext.name}`}
                                        />
                                    ))}
                                </>
                            )}
                        </FormControl>

                        <FormControl component="fieldset" style={{ marginTop: 8 }}>
                            <FormLabel component="legend">{i18n.setting.extensionMode}</FormLabel>
                            <RadioGroup row aria-label={i18n.setting.extensionMode} name="extension" value={extensionMode}
                                        onChange={handleExtensionModeChange}>
                                <FormControlLabel value={ExtensionMode.NONE} control={<Radio/>} label={i18n.setting.extensionMode_none}/>
                                <FormControlLabel
                                    disabled={ctx.numPlayers < 3}
                                    value={ExtensionMode.FOUR} control={<Radio/>} label={i18n.setting.extensionMode_four}/>
                            </RadioGroup>
                        </FormControl>
                    </div>
                </Collapse>
            </div>
        </Grid>
    );
}
