import {Locale} from './en';
import {
    AllClassicCards,
    BasicCardID, EventCardID,
    IBuyInfo,
    IEra, ItrEffects,
    Region, SimpleEffectNames, ValidRegion, NoExecutorEffectNames, CardID
} from "../../types/core";
import {
    IChooseEventArg,
    IChooseHandArg,
    ICommentArg,
    IPayAdditionalCostArgs,
    IPeekArgs,
    IPlayCardInfo,
    IRegionChooseArg,
    IShowBoardStatusProps,
    IShowCompetitionResultArgs,
    ITargetChooseArgs, IUpdateSlotProps
} from "../../game/moves";
import {argChangePlayerSettingHOF, argSetupGameModeHOF, moveHOF} from "./common";

const era = {
    0: "Ⅰ",
    1: "Ⅱ",
    2: "Ⅲ",
};
const region = {
    [Region.NA] : "北美",
    [Region.WE] : "西欧",
    [Region.EE] : "东欧",
    [Region.ASIA] : "亚洲",
    [Region.EXTENSION] : "流派扩",
    [Region.EXTENSION1] : "流派扩",
    [Region.EXTENSION2] : "流派扩",
    [Region.NONE] : "中立",
};
const argRegion = {
    a: (value: Region = Region.NONE) => {
        return region[value]
    }
}
const cards = {
    "B01": "文艺片",
    "B02": "商业片",
    "B03": "B级片",
    "B04": "烂片",
    "B05": "传世经典",
    "B06": "血本无归的影片",
    "B07": "资金",
    'E01': '好莱坞的建立',
    'E02': '第一次世界大战',
    'E03': '先锋派运动',
    'E04': '奥斯卡奖',
    'E05': '派拉蒙判决',
    'E06': '戛纳电影节',
    'E07': '《电影手册》',
    'E08': '解冻时期',
    'E09': '宝菜坞的崛起',
    'E10': '《海斯法典》解体',
    'E11': '电影作者论',
    'E12': '世界电影新浪潮',
    'E13': '全球化',
    'E14': '新媒介',
    '1101': '大卫·格里菲斯',
    '1102': '托马斯·爱迪生',
    '1103': '党同伐异',
    '1104': '火车大劫案',
    '1105': '爵士歌王',
    '1106': '将军号',
    '1107': '淘金记',
    '1108': '北方的纳努克',
    '1109': '金刚',
    '1110': '贪婪',
    '1201': '乔治·梅里爱',
    '1202': '卢米埃尔兄弟',
    '1203': '表现主义',
    '1204': '瑞典学派',
    '1205': '诺斯费拉图',
    '1206': '圣女贞德蒙难记',
    '1207': '月球旅行记',
    '1208': '卡比利亚',
    '1209': '幽灵马车',
    '1210': '工厂大门',
    '1211': '吉斯公爵遇剌记',
    '1301': '蒙太奇学派',
    '1302': '谢尔盖·爱森斯坦',
    '1303': '电影眼睛派',
    '1304': '母亲',
    '1305': '战舰波将金号',
    '1306': '持摄影机的人',
    '1307': '谢尔盖神父',
    '1308': '大地',
    '2101': '古典好莱坞',
    '2102': '约翰·福特',
    '2103': '阿尔弗雷德·希区柯克',
    '2104': '黑色电影',
    '2105': '奥逊·威尔斯',
    '2106': '乱世佳人',
    '2107': '关山飞度',
    '2108': '雨中曲',
    '2109': '公民凯恩',
    '2110': '白热',
    '2111': '日落大道',
    '2112': '宾虚',
    '2113': '马耳他之鹰',
    '2114': '迷魂记',
    '2201': '新现实主义',
    '2202': '费德里科·费里尼',
    '2203': '大卫·里恩',
    '2204': '法国诗意现实主义',
    '2205': '让·雷诺阿',
    '2206': '游戏规则',
    '2207': '偷自行车的人',
    '2208': 'M就是凶手',
    '2209': '大路',
    '2210': '乡村牧师日记',
    '2211': '拿破仑',
    '2212': '天色破晓',
    '2213': '恐惧的代价',
    '2214': '阿拉伯的劳伦斯',
    '2301': '苏联社会现实主义',
    '2302': '米哈伊尔·卡拉托佐夫',
    '2303': '夏伯阳',
    '2304': '士兵之歌',
    '2305': '雁南飞',
    '2306': '下水道',
    '2307': '被遗忘的祖先的阴影',
    '2308': '青年近卫军',
    '2309': '亚历山大·涅夫斯基',
    '2401': '黑泽明',
    '2402': '萨蒂亚吉特·雷伊',
    '2403': '小城之春',
    '2404': '一江春水向东流',
    '2405': '阿拉姆·阿拉',
    '2406': '七武士',
    '2407': '大地之歌',
    '2408': '神女',
    '2409': '哥斯拉',
    '2410': '我这一辈子',
    '2411': '东京物语',
    '3101': '新好莱坞电影',
    '3102': '史蒂文·斯皮尔伯格',
    '3103': '教父',
    '3104': '星球大战',
    '3105': '纽约派',
    '3106': '马丁·斯科塞斯',
    '3107': '罗杰·科曼',
    '3108': '泰坦尼克号',
    '3109': '2001太空漫游',
    '3110': '驱魔人',
    '3111': '邦尼和克莱德',
    '3112': '出租车司机',
    '3113': '夺宝奇兵',
    '3114': '最长的一码',
    '3115': '虎豹小霸王',
    '3116': '闪灵',
    '3201': '法国新浪潮',
    '3202': '弗朗索瓦·特吕弗',
    '3203': '英格玛·伯格曼',
    '3204': '左岸派',
    '3205': '独行杀手',
    '3206': '陆上行舟',
    '3207': '去年在马里昂巴德',
    '3208': '八部半',
    '3209': '朱尔与吉姆',
    '3210': '007：黄金眼',
    '3211': '奇遇',
    '3212': '假面',
    '3213': '小孩与鹰',
    '3301': '安德烈·塔尔科夫斯基',
    '3302': '谢尔盖·邦达尔丘克',
    '3303': '蓝',
    '3304': '诗电影',
    '3305': '战争与和平',
    '3306': '地下',
    '3307': '办公室的故事',
    '3308': '红军与白军',
    '3309': '索拉里斯',
    '3310': '普通法西斯',
    '3311': '钻石胳膊',
    '3312': '乱世英豪',
    '3401': '张艺谋',
    '3402': '王家卫',
    '3403': '阿巴斯·基亚罗斯塔米',
    '3404': '霸王别姬',
    '3405': '重庆森林',
    '3406': '英雄本色',
    '3407': '怒焰骄阳',
    '3408': '红高粱',
    '3409': '芙蓉镇',
    '3410': '侠女',
    '3411': '西便制',
    '3412': '青木瓜之味',
    '3413': '风柜来的人',
    '3414': '樱桃的滋味',

    '4001': '法国印象派',
    '4002': '玛萨拉电影',
    '4003': '美国独立电影',
    '4004': '波兰学派',
    '4005': '现代主义电影',
    '4006': '第三电影',
    '4007': '英国厨房水槽电影',
    '4008': '高概念电影',
	
	'5001': '默剧',
	'5002': '西部电影',
	'5003': '布莱顿学派',
	'5004': '电影实验派',

    '5201': '布拉格电影学派',
    '5202': '通心粉西部电影',
    '5203': '巨片',
    '5204': '剧影派',
    '5205': '巧克力学派',

    '5206': '明星制',
    '5207': '室内剧电影',
    '5208': '黑浪潮',
    '5209': '武侠电影',

	'6001': '平行电影',
	'6002': '思想电影',
	'6003': '新思想电影',
	'6004': '作者电影',
};
const eventName = {
    'E01': '每个公司选择一项：①+1工业等级；②+1美学等级',
    'E02': '工业等级最高的公司-1牌，美学等级最高的公司-1牌，每个公司+2存款',
    'E03': '每个公司立刻获得第2个行动力(注意！并非行动力+1)  *若这张牌因为过时代而被弃掉，事件立刻触发',
    'E04': '声望最高的公司可以免费购买1张【商业片】并置入手牌 每个公司免费购买1张【传世经典】',
    'E05': '北美没有建筑的公司+1牌，工业等级美学等级总数最少的公司+3存款',
    'E06': '西欧没有建筑的公司免费购买一张烂片 每个公司免费购买1张【传世经典】',
    'E07': '流派时代最高的公司免费购买1张【烂片】。\n' +
        '所有规模小于5的公司将规模变为5',
    'E08': '"解冻建筑位可以修建建筑，工业等级和美学等级总和最少的公司选择1项：\n' +
        '①+1工业等级\n' +
        '②+1美学等级"\n',
    'E09': '【宝莱坞】建筑位可以修建建筑 美学等级最低的公司+1美学等级 工业等级最低的公司+1工业等级',
    'E10': '每有一个声望条数字比你高的公司 你额外获得5声望',
    'E11': '每个公司牌库里和档案馆里的每个人物获得4声望',
    'E12': '每个公司按照工业等级和美字等级的总和获得声望',
    'E13': '如果获得过4/3/2/1个不同地区的第一，则得到20/12/6/2声望',
    'E14': '你的每个I/II/III时代第一名标志物分别得到2/4/8声望。',
};

const getCardName = (cardId: string): string => {
    if (cardId in BasicCardID) {
        // @ts-ignore
        return cards[cardId];
    }
    if (cardId in AllClassicCards) {
        // @ts-ignore
        return cards[cardId.slice(1)]
    }
    if (cardId in EventCardID) {
        // @ts-ignore
        return eventName[cardId]
    }
    if (cardId.startsWith('V')) {
        const cardEra = parseInt(cardId.slice(1, 2)) - 1;
        const cardRegion = parseInt(cardId.slice(2, 3)) - 1;
        const cardRank = parseInt(cardId.slice(3, 4));
        // @ts-ignore
        return `${era[cardEra]}时代：${region[cardRegion]}${rank[cardRank]}`
    }
    return `unknown card${cardId}`
}
const setting = {
    mode: "游戏模式",
    team: "2V2组队",
    normal: "完整",
    newbie: "新手",

    enableSchoolExtension: "启用杨-流派扩",
    enableSchoolExtensionMuki: "启用Muki流派扩 - Ⅰ时代流派",
    enableSchoolExtensionQM: "启用起名流派扩 - Ⅱ时代流派",
    enableSchoolExtensionMuki2: "启用Muki流派扩2 - Ⅱ & Ⅲ时代流派",

    randomFirst: "随机首位",
    fixedFirst: "固定首位",
    allRandom: "完全随机",
    order: "行动顺序",
    changeSetting: "更改设置",
    disableUndo: "禁止撤回"
};
const classicFilmAutoMoveMode = {
    MODE_NAME: "传世经典:",
    NO_AUTO: "选择效果",
    DRAW_CARD: "自动摸牌",
    AESTHETICS_AWARD: "自动美学奖励",
};
const argDrawnCards = {
    args: (cards:CardID[]): string => {
        return `摸了 ${cards.map(c=>getCardName(c))}`;
    }
}

const argConcede = {
    args: (): string => {
        return `投降`
    }
}


const argCardName = {
    a: (value: string = "E02") => {
        return getCardName(value)
    }
};
const bracketCardName = (id: string = "E02") => {
    return `【${getCardName(id)}】`
};
const argValue = {a: (value: number = 1): string => value.toString()};
const chose = "选择了";
const argSetupGameMode = argSetupGameModeHOF(chose, setting);
const argChangePlayerSetting = argChangePlayerSettingHOF(chose, classicFilmAutoMoveMode);

const argShowBoardStatus = {
    args: (arg: IShowBoardStatusProps[]): string => {
        let t = "牌列中有";
        if (arg[0].regions.length > 0) {
            arg[0].regions.forEach((r, idx) => {
                const cardRegion: ValidRegion = idx;
                t += region[cardRegion];
                t += '：';
                if (r.legend.card !== null) {
                    t += "传奇："
                    t += bracketCardName(r.legend.card)
                }
                if (r.normal.filter(s => s.card !== null).length > 0) {
                    t += "普通："
                    r.normal.forEach(c => {
                        if (c.card !== null) {
                            t += bracketCardName(c.card)
                        }
                    })
                }
            })
        } else {
            t += "流派："
            arg[0].film.forEach(c => {
                if (c.card !== null) {
                    t += bracketCardName(c.card)
                }
            })
            t += "影片："
            arg[0].school.forEach(c => {
                if (c.card !== null) {
                    t += bracketCardName(c.card)
                }
            })
        }
        return t;
    }
}
const argConfirmRespond = {
    args: (arg: string[]): string => {
        let a = arg[0]
        if (a === "yes") {
            return "选择执行可选效果"
        } else {
            return "选择不执行可选效果"
        }
    }
}

const argChooseEvent = {
    args: (arg: IChooseEventArg[]): string => {
        let a = arg[0]
        let t = chose
        t += cards[a.event]
        t += eventName[a.event]
        return t
    }
}
const argBuyCard = {
    args: (arg: IBuyInfo[]): string => {
        let a = arg[0]
        let t = "花费";
        if (a.resource > 0) {
            t += a.resource.toString() + "资源,"
        }
        if (a.deposit > 0) {
            t += a.deposit.toString() + "存款,"
        }
        if (a.helper.length > 0) {
            t += "用"
            a.helper.forEach(h => t += bracketCardName(h))
            t += "补标"
        }
        t += "购买了"
        t += bracketCardName(a.target)
        return t
    }
}
const argPlayCard = {
    args: (arg: IPlayCardInfo[]): string => {
        let a = arg[0]
        let t = "打出了"
        t += bracketCardName(a.card)
        return t
    }
}

const argBreakthrough = {
    args: (arg: IPlayCardInfo[]): string => {
        let a = arg[0]
        let t = "花费"
        if (a.res === 2) t += "2资源"
        if (a.res === 1) t += "1资源1存款"
        if (a.res === 0) t += "2存款"
        t += "突破"
        t += bracketCardName(a.card)
        return t
    }
}
const argShowCompetitionResult = {
    args: (arg: IShowCompetitionResultArgs[]): string => {
        let i = arg[0].info;
        let t = "争夺情况："
        // if (i.atkCard === null) {
        //     t += "发起方没有出牌，"
        // } else {
        //     t += `发起方打出${bracketCardName(i.atkCard)}，`
        // }
        // if (i.defCard === null) {
        //     t += "应对方没有出牌，"
        // } else {
        //     t += `应对方打出${bracketCardName(i.defCard)}，`
        // }
        // if (i.defShownCards.length !== 0) {
        //     t += "应对方没有展示手牌"
        // } else {
        //     t += `应对方展示`;
        //     for (const defShownCard of i.defShownCards) {
        //         t += `${bracketCardName(defShownCard)} `
        //     }
        // }
        let progress = i.progress;
        // if (progress > 5) progress = 5;
        // if (progress < -5) progress = -5;
        t += `竞争力差值：${progress}，`
        // if (i.progress >= 3) {
        //     t += "发起方获胜"
        // } else {
        //     t += "无人获胜"
        //     //
        //     // if (i.progress <= -3) {
        //     //     t += "应对方获胜"
        //     // } else {
        //     //     t += "无人获胜"
        //     // }
        // }
        return t;
    }
}
const argPeek = {
    args: (arg: IPeekArgs[]) => {
        const a = arg[0];
        let t = "展示牌堆顶端";
        a.shownCards.forEach(c => t += bracketCardName(c));
        if (a.card !== null) {
            t += `选择了${bracketCardName(a.card)}加入手牌`
        }
        return t;
    }
}
const argDrawCard = {
    args: (): string => {
        return "用行动力额外抽取了一张牌"
    }
}
const argChooseRegion = {
    args: (arg: IRegionChooseArg[]): string => {
        let a = arg[0]
        let t = chose
        t += region[a.r]
        return t
    }
}
const argChooseTarget = {
    args: (arg: ITargetChooseArgs[]): string => {
        let a = arg[0]
        let t = chose
        t += a.targetName
        return t
    }
}
const argRequestEndTurn = {
    args: (): string => {
        return "行动结束"
    }
}
const argChooseHand = {
    args: (arg: IChooseHandArg[]): string => {
        let a = arg[0]
        let t = chose
        t += bracketCardName(a.hand)
        return t
    }
}
const argPayAdditionalCost = {
    args: (arg: IPayAdditionalCostArgs[]) => {
        let t = "用"
        const a = arg[0];
        if (a.res > 0) {
            t += `${a.res}资源`
        }
        if (a.deposit > 0) {
            t += `${a.deposit}存款`
        }
        t += "支付了额外费用"
        return t
    }
}
const argCompetitionCard = {
    args: (): string => {
        return "打出了一张牌用于争夺"
    }
}
const argUpdateSlot = {
    args: (arg: IUpdateSlotProps[]): string => {
        return `更新了：${bracketCardName(arg[0].cardId)} 翻出：`
    }
}
const argComment = {
    args: (arg: ICommentArg[]): string => {
        let a = arg[0]
        let t = chose
        if (a.comment === null) {
            t += "移除了"
            t += bracketCardName(a.target)
            t += "的评论"
        } else {
            t += "评论"
            t += bracketCardName(a.target)
            t += "为"
            t += bracketCardName(a.comment)
        }
        return t
    }
}
const rank = {
    1: "第一",
    2: "第二",
    3: "第三",
}

const movesI18n = moveHOF(
    argBreakthrough,
    argBuyCard,
    argChangePlayerSetting,
    argChooseEvent,
    argChooseHand,
    argChooseRegion,
    argChooseTarget,
    argComment,
    argCompetitionCard,
    argConcede,
    argConfirmRespond,
    argDrawCard,
    argPayAdditionalCost,
    argPeek,
    argPlayCard,
    argRequestEndTurn,
    argSetupGameMode,
    argShowBoardStatus,
    argShowCompetitionResult,
    argUpdateSlot
)

const zh_CN: Locale = {
    setting: setting,
    drawer: {
        singlePlayer: "单人对战AI(2玩家)",
        singlePlayer3p: "单人对战AI(3玩家)",
        singlePlayer4p: "单人对战AI(4玩家)",
        twoPlayer: "本地2人",
        threePlayer: "本地3人",
        fourPlayer: "本地4人",
        pleaseTry: "请尝试",
        lobby: "多人大厅",
        cards: "卡表",
        about: "规则和帮助",
    },
    eventName: eventName,
    region: region,
    action: {
        concede: "投降",
        adjustInSlider: "用下面的滑块调整支付额外费用的存款或资源",
        payAdditionalCost: "支付额外花费",
        comment: "评论",
        updateSlot: "更新",
        showBoardStatus: "展示牌列",
        draw: "使用行动力摸牌",
        play: "出牌",
        breakthrough2Res: "花费2资源突破",
        breakthrough1Res: "花费1资源1存款突破",
        breakthrough0Res: "花费2存款突破",
        studio: "建造制片厂",
        cinema: "建造电影院",
        aestheticsLevelUp: "提升美学等级",
        industryLevelUp: "提升工业等级",
        endStage: "结束行动",
        showCompetitionResult: "展示争夺结果",
        endTurn: "结束回合",
        turnEnd: ["第{{a}}回合结束", argValue],
        endPhase: "结束阶段",
        undo: "撤销",
        redo: "恢复",
    },
    title: "电影百年 - Muki Server",
    lobby: {
        player: "起手玩家",
        copyPrompt: "复制",
        numPlayers: "玩家数",
        title: "大厅",
        join: "加入",
        play: "开始",
        leave: "离开",
        exitMatch: "退出游戏",
        exitLobby: "退出大厅",
        cannotJoin: "无法加入，已经在其他游戏中",
        createPublicMatch: "创建公开游戏",
        createPrivateMatch: "创建游戏",
        spectate: "旁观",
        shareLink: "其他玩家用下面的链接加入游戏：",
        publicGame: "公开",
        privateGame: "隐藏",
    },
    gameOver: {
        title: "游戏结束",
        winner: "胜利：",
        table: {
            board: "面板",
            card: "牌库分数",
            building: "建筑",
            industryAward: "工业大奖",
            aesAward: "美学大奖",
            archive: "档案馆",
            events: "计分效果",
            total: "总分",
        },
        reason: {
            othersConceded: "其他玩家投降",
            threeNAChampionAutoWin: "三个北美第一",
            championCountAutoWin: "满足自动胜利要求的第一数量",
            finalScoring: "终局计分",
        },
        rank: {
            0: "第一:",
            1: "第二:",
            2: "第三",
            3: "第四",
        },
    },
    classicFilmAutoMove: classicFilmAutoMoveMode,
    moves: movesI18n,
    effect: {
        industryOrAestheticsBreakthrough:"只执行工业突破 / 美学突破",
        CompetitionPowerToVp:["按照竞争力获得声望",argValue],
        addCompetitionPower: ["+{{a}}竞争力", argValue],
        loseCompetitionPower: ["-{{a}}竞争力", argValue],
        noCompetitionFee: "无需支付【争夺】发起的费用",
        minHandCountPlayers: "当前手牌数最少的公司",
        chose: chose,
        archiveToEEBuildingVP: "每个公司将1张手牌置入档案馆，如果该公司在东欧地区有建筑，则该公司获得这张牌的声望",
        payAdditionalCost: ["额外支付{{res}}{{deposit}}", {
            deposit: (value: number = 1): string => {
                if (value > 0) {
                    return `${value}存款`
                } else {
                    return ""
                }
            },
            res: (value: number = 1): string => {
                if (value > 0) {
                    return `${value}资源`
                } else {
                    return ""
                }
            },
        }],
        industryAndAestheticsBreakthrough: "工业和美学突破",
        industryOrAestheticsLevelUp: "选择一项：①+1工业等级；②+1美学等级",
        industryOrAestheticsLevelDown: "选择一项：①-1工业等级；②-1美学等级",
        era: {
            0: " 1时代：",
            1: " 2时代：",
            2: " 3时代：",
        },
        optional: "[可选]",
        loseVpForEachHand: "按照他当前的手牌数失去声望",
        discardLegend: ["-{{a}}传奇牌", argValue],
        onYourComment: "你评论后，",
        playedCardInTurnEffect: "执行你出牌区的另一张带有美学标志的牌的【出牌】效果",
        everyOtherCompany: "每个其他公司",
        everyPlayer: "每个公司",
        doNotLoseVpAfterCompetition: "被争夺后，不会失去声望",
        discardInSettle: "你【评论】或【更新】之后，",
        onAnyOneComment: "任何公司【评论】后，",
        onAnyInTurnAesAward: "在你的行动阶段内：当你执行1次美学奖励时，立即",
        industryToVp: "按照你的工业等级获得声望",
        aestheticsToVp: "按照你的美学等级获得声望",
        threeCards: "你的每张基础额外获得1声望",
        northAmericaFilm: "你的每张北美卡牌额外获得2声望",
        asiaFilm: "你的每张亚洲卡牌额外获得2声望",
        industryNormalOrLegend: "每张有工业标志的普通牌和传奇牌额外获得2声望",
        westEuropeCard: "你的每张西欧卡牌额外获得2声望",
        eastEuropeFilm: ["你的每张东欧卡牌额外获得{{a}}声望", argValue],
        industryLevel: ["+{{a}}声望/工业等级", argValue],
        aestheticsLevel: ["+{{a}}声望/美学等级", argValue],
        personCard: "你的每张人物牌额外获得4声望",
        aesClassic: "每张有美学标志的普通牌和传奇牌额外获得2声望",
        NewYorkSchool: "若你的美学等级不低于工业等级，美学奖励一次，若你的工业等级不低于美学等级，工业奖励一次",
        obtainNormalOrLegendFilm: "每次获得普通影片或传奇影片时",

        French_Imp_buy: "没有流派的公司可以购买",
        Samara_buy: "你每有1个第一名标志物，额外花费2资源",
        American_Independent_Film_buy: "若你有1个完成建造的建筑，额外花费3资源。若你有2个完成建造的建筑，不能购买这个流派",
        Polish_School_buy: "额外支付等于工业等级和美学等级差值的资源",
        Modernist_Film_buy: "你每有1级工业等级，额外花费1资源",
        Third_Cinema_buy: "符合如下条件时，你可以失去所有存款并免费购买这个流派:你没有手牌，没有已消耗的行动力，且资源小于等于7",
        kitchen_sink_buy: "额外支付等于你本回合开始时手牌数的资源",
        High_Concept_Film_buy: "你每有1级美学等级，额外花费1资源",
        schoolExtNonePre: "",

        French_Imp_turnstart: "如果你的工业等级和美学等级相等，+1行动力。每当你在1个行动结算或整个检查阶段至少+3声望后：+1资源",
        Samara: "你的电影院效果改为：+1牌，+1声望。当你突破1张没有标志的影片时，选择1项：①工业突破1次；②美学突破1次",
        American_Independent_Film_turnstart: "你每有1个完成建造的建筑，-1牌。每当你-1牌后：+1存款，+1声望",
        Polish_School: "每当你将1张牌置入档案馆(包括突破)或其他玩家的手牌时:+1牌。每当你得到1张基础牌后:+2声望",
        Modernist_Film: "被争夺后：美学奖励1次。若你打出的1张牌有X个美学标志：    X=1:+1资源，+2声望  X=2:+1资源，+2声望，+1牌    X=3:+1资源，+4声望，+2牌",
        Third_Cinema: "被争夺后：+1牌，争夺方-5声望。回合开始时，若你的美学等级高于你的工业等级：+1牌，+2存款",
        kitchen_sink_turnstart: "你每有1张手牌就-1声望，每有一个手牌数比你多的公司，你就+1牌。回合结束时：你的出牌区每有1张牌，你就+1声望",
        High_Concept_Film: "你打出的牌每有1个工业标志：+1资源，+1声望。争夺后：+1竞争力，+1牌",

		West_Film: "建造建筑时，额外获得对应地区的一个份额",
		Brighton_School: "美学等级为2的美学奖励效果改为【+1资源】",
		Experimental_Film: "购买等级需求比你的等级高的影片后，+1存款，+1声望。购买东欧地区流派后，+1工业等级，+1存款，+1声望",


        '5201_effect': "购买影片时，忽略较低的等级需求（之一）",
        '5202_effect': "你+1牌后，+1声望。被争夺后，不会失去声望",
        '5203_effect': "购买影片时，多获得一个份额",
        '5204_effect': "你+1牌前，如果牌库为空，+2资源，+4声望。被争夺后，不会失去声望",
        '5205_effect': "如果【最后一轮】已被触发，购买对应牌获得对应奖励：\n" +
            "传奇牌：+1行动力；\n" +
            "普通牌：+4资源；\n" +
            "基础牌：+6声望；\n" +
            "影片牌：+1牌；\n" +
            "人物牌：根据人物牌的等级需求获得声望",
        
        '5206_effect': "在你的回合中，每当你增加声望并超过其他公司(从小于到大于等于)后，+1牌。你打出或突破一张基础牌后，支付1声望，+1资源",
        '5207_effect': "每回合开始时，如果手牌数≤工业等级，+1行动力。每回合结束时，如果出牌区牌数≥工业等级，+1存款，+1声望",
        '5208_buy': "任意地区进入2时代后可以购买。如果东欧处于1/2时代，获得所有/1个东欧份额",
        '5208_effect': "每当你将过时的影片或烂片置入档案馆(包括突破)时，免费购买1张传世经典，+1牌。你的传世经典还可以选择③+1存款，+2声望",
        '5209_effect': "仅剩1点行动力时，参考影片的最早时代执行【出牌】效果",

		Czechoslovakian_Film: "不能触发工业/美学等级为8的奖励效果。如果你的工业等级和美学等级差值小于等于2：每当你触发工业奖励或美学奖励，额外触发一次",
		Czechoslovakian_Film_2: "如果你的工业等级和美学等级差值小于等于2：回合结束时额外触发一次工业奖励和美学奖励，并且所有人物牌对你的制片厂效果额外触发一次",
		Auteur_film: "购买人物牌后，+1行动力，+1存款，+1声望。你的人物牌的【指定一个本地区没有制片厂的公司】，改为【指定所有本地区没有制片厂的公司（除你以外）。】",

        none: "",
        breakthroughResDeduct: ["免费突破一次", argValue],
        handToAnyPlayer: ["把{{a}}张手牌交给任意公司", argValue],
        buyNoneEEFilm: "每当你购买东欧影片后，+1竞争力，+1声望",
        extraVp: ["额外支付{{a}}声望", argValue],
        inventionEraBreakthroughPrevent: "1时代不能突破",
        breakthroughPrevent: "然后才能执行突破效果",
        alternative: "可以放弃本次突破，改为",
        pay: "支付",
        update: ["【更新】{{a}}次", argValue],
        noBuildingEE: "东欧地区没有建筑的公司",
        highestVpPlayer: "声望最高的公司",
        vpNotHighestPlayer: "声望不是最高的公司",
        aesLowest: "美学等级最低的公司",
        industryLowest: "工业等级最低的公司",
        peek: ["展示牌堆顶{{count}}张牌，{{filter}}{{target}}，然后弃掉其他的", {
            count: (value: number = 1) => {
                return value.toString()
            },
            target: (e: string) => {
                if (e === "hand") {
                    return "加入手牌"
                } else {
                    return "";
                }
            },
            filter: (e: any) => {
                switch (e.e) {
                    case "choice":
                        return `选择其中${e.a}张`
                    case "industry":
                        return "把其中有工业标志的"
                    case "era":
                        // @ts-ignore
                        return `把其中${era[e.a]}时代的`
                    case "region":
                        // @ts-ignore
                        return `把其中${region[e.a]}地区的`
                    case "aesthetics":
                        return "把其中有美学标志的"
                    default:
                        return ""
                }
            }
        }],
        competition: ["争夺一次{{bonus}}{{onWin}}", {
            bonus: (value: number = 0) => {
                if (value > 0) {
                    return "，+" + value.toString() + "竞争力"
                } else {
                    return "";
                }
            },
            onWin: (e: any) => {
                if (e.e !== "none") {
                    switch (e.e) {
                        case SimpleEffectNames.industryToVp:
                            return `，然后按照你的工业等级获得声望`;
                        case SimpleEffectNames.draw:
                            return `，然后+${e.a}牌`;
                        case ItrEffects.peek:
                            return `，然后展示牌堆顶3张牌，把带有工业标志的加入手牌，然后弃掉其他的`;
                        case SimpleEffectNames.competitionLoserBuy:
                            // @ts-ignore
                            return `，然后对方免费购买1张${cards[e.a]}`;
                        case SimpleEffectNames.vp:
                        case SimpleEffectNames.addVp:
                            return `，然后+${e.a}声望`;
                        case ItrEffects.anyRegionShareCentral:
                            return "，然后额外从中央牌列获得1个任意地区的份额";
                        case ItrEffects.comment:
                            return `，然后评论${e.a}次,`;
                        case ItrEffects.anyRegionShare:
                            return "，然后额外获得一个" + region[e.r as Region] + "地区份额"
                        case SimpleEffectNames.shareNA:
                            return `，然后获得${e.a}个北美份额`
                        case SimpleEffectNames.addCompetitionPower:
                            return `，然后+${e.a}竞争力`;
                        case ItrEffects.step:
                            let onWin = "，然后";
                            let onWinEffs : string[] = [];
                            // @ts-ignore
                            e.a.forEach((subEff)=>{
                                switch (subEff.e) {
                                    case SimpleEffectNames.shareNA:
                                        onWinEffs.push(`获得${subEff.a}北美份额`);
                                        break;
                                    case SimpleEffectNames.addCompetitionPower:
                                        onWinEffs.push(`+${subEff.a}竞争力`);
                                        break;
                                    case SimpleEffectNames.draw:
                                        onWinEffs.push(`+${subEff.a}牌`);
                                        break;
                                    case ItrEffects.anyRegionShareCentral:
                                        onWinEffs.push(`从中央牌列获得${subEff.a}个任意地区的份额`);
                                        break;
                                    case SimpleEffectNames.deposit:
                                        onWinEffs.push(`+${subEff.a}存款`);
                                        break;
                                    case SimpleEffectNames.vp:
                                        onWinEffs.push(`+${subEff.a}声望`);
                                        break;
                                    default:
                                        onWinEffs.push(JSON.stringify(subEff));
                                        break;
                                }
                            })
                            onWin += onWinEffs.join("，");
                            return onWin;
                        default:
                            return JSON.stringify(e);
                    }


                } else {
                    return "";
                }
            }
        }],
        loseVp: ["-{{a}}声望", argValue],
        loseDeposit: ["-{{a}}存款", argValue],
        beforeCompetition: "争夺开始前，",
        competitionStart: "争夺开始时，",
        competitionWon: "你发起争夺后，",
        competitionBonus: ["+{{a}}竞争力", argValue],
        archive: ["将{{a}}张手牌置入档案馆", argValue],
        resFromIndustry: "按照你的工业等级获得资源",
        resFromAesthetics: "按照你的美学等级获得资源",
        afterBreakthrough: "你突破后，",
        aesAward: ["美学奖励{{a}}次", argValue],
        industryAward: ["工业奖励{{a}}次", argValue],
        draw: ["+{{a}}牌", argValue],
        discard: ["-{{a}}牌", argValue],
        searchAndArchive: ["检索【{{a}}】并置入档案馆", argCardName],
        discardNormalOrLegend: ["-{{a}}普通或传奇牌", argValue],
        discardIndustry: ["-{{a}}带有工业标志的手牌", argValue],
        discardBasic: ["-{{a}}基础牌", argValue],
        discardAesthetics: ["-{{a}}带有美学标志的手牌", argValue],
        allNoStudioPlayer: ["所有{{a}}地区没有制片厂的公司，", argRegion],
        vp: ["{{a}}声望", {a: (value: number = 1): string => value <= 0 ? value.toString() : "+" + value.toString()}],
        addVp: ["+{{a}}声望", argValue],
        addExtraVp: ["额外+{{a}}声望", argValue],
        res: ["{{a}}资源", {a: (value: number = 1): string => value <= 0 ? value.toString() : "+" + value.toString()}],
        addRes: ["+{{a}}资源", argValue],
        deposit: ["{{a}}存款", {a: (value: number = 1): string => value <= 0 ? value.toString() : "+" + value.toString()}],
        loseAnyRegionShare: ["归还{{a}}个任意地区的份额，并-1竞争力", argValue],
        shareToVp: ["按照你当前持有的{{a}}份额获得声望", argRegion],
        share: ["获得{{a}}个{{r}}地区的份额", argValue],
        shareNA: ["获得{{a}}个北美地区的份额", argValue],
        shareWE: ["获得{{a}}个西欧地区的份额", argValue],
        shareEE: ["获得{{a}}个东欧地区的份额", argValue],
        shareASIA: ["获得{{a}}个亚洲地区的份额", argValue],
        loseShareNA: ["失去{{a}}个北美地区的份额", argValue],
        loseShareWE: ["失去{{a}}个西欧地区的份额", argValue],
        loseShareEE: ["失去{{a}}个东欧地区的份额", argValue],
        loseShareASIA: ["失去{{a}}个亚洲地区的份额", argValue],
        anyRegionShare: ["获得{{a}}个任意地区的份额", argValue],
        anyRegionShareCompetition: ["从被争夺方获得{{a}}个任意地区的份额", argValue],
        newHollyWoodEff: "每回合仅限一次,获得1个任意地区的份额",
        anyRegionShareCentral: ["从中央牌列获得{{a}}个任意地区的份额", argValue],
        deductRes: ["少花费{{a}}资源", argValue],
        buyAesthetics: "购买有美学标志的影片时，",
        extraEffect: "【流派】",
        loseVpRespond: "任何时候，当你在你的回合内失去1声望时，",
        othersBuySchool: "其他公司购买【流派】时，",
        turnStart: "每回合开始时，",
        turnEnd: "每回合结束时，",
        studio: "本地区有制片厂的公司，",
        building: "本地区有建筑的公司，",
        noStudio: "指定一个本地区没有制片厂的公司，",
        LES_CHAIERS_DU_CINEMA: "将公司规模变为5",
        noBuilding: "指定一个本地区没有建筑的公司，",
        lose: ["失去{{a}}时，", argCardName],
        event: ["当{{a}}发生后", argCardName],
        school: ["公司规模：{{hand}}\n行动力：{{action}}", {
            hand: undefined,
            action: undefined
        }],
        scoringHeader: "【计分】",
        continuous: "【持续】",
        playCardHeader: "【出牌】",
        buyCardHeader: "【购买】",
        breakthroughHeader: "【突破】",
        schoolHeader: "【流派】",
        responseHeader: "【响应】",
        choice: "选择一项：",
        comment: ["评论{{a}}次", argValue],
        industryBreakthrough: ["工业突破{{a}}次", argValue],
        aestheticsBreakthrough: ["美学突破{{a}}次", argValue],
        buy: ["免费购买【 {{a}} 】", argCardName],
        competitionLoserBuy: ["被争夺方免费购买【 {{a}} 】", argCardName],
        buyCardToHand: ["免费购买【{{a}}】并加入手牌", argCardName],
        industryLevelUp: ["+{{a}}工业等级", argValue],
        industryLevelDown: ["-{{a}}工业等级", argValue],
        industryLevelUpCost: ["+{{a}}工业等级（根据目标等级支付额外费用）", argValue],
        aestheticsLevelUp: ["+{{a}}美学等级", argValue],
        aestheticsLevelDown: ["-{{a}}美学等级", argValue],
        aestheticsLevelUpCost: ["+{{a}}美学等级（根据目标等级支付额外费用）", argValue],
        buildCinema: "建造电影院",
        buildStudioInRegion: ["在{{a}}建造制片厂", argRegion],
        buildCinemaInRegion: ["在{{a}}建造电影院", argRegion],
        buildStudio: "建造制片厂",
        refactor: "重构",
        skipBreakthrough: "跳过本次突破",
    },
    cancel: "取消",
    cardTable: {
        cardId: "编号",
        cardName: "名称",
        cost: "费用",
        prestige: "声望",
        effectText: "效果文本",
        effectIcon: "效果图标",
    },
    era: era,
    setup: "补充初始排列",
    dialog: {
        concede: {
            title: "确认投降?",
        },
        competitionCard: {
            title: "请选择一张手牌参与争夺",
            toggleText: "争夺",
        },
        chooseHand: {
            title: "请选择一张牌执行效果",
            toggleText: "选择卡牌",
        },
        peek: {
            choice: "请选择一张加入手牌",
            title: "查看牌堆顶",
        },
        chooseRegion: {
            title: "请选择效果目标区域",
            toggleText: "选择区域",
        },
        chooseTarget: {
            title: "请选择效果目标玩家",
            toggleText: "选择目标"
        },
        chooseEvent: {
            title: "请选择事件牌",
            toggleText: "选择事件牌",
        },
        buyCard: {
            basic: "购买基础牌",
            board: "购买",
            cost: "费用",
            refresh: "刷新",
        },
        comment: {
            title: "评论",
            removeCommentCard: "移除评论",
        },
        chooseEffect: {
            title: "请选择一项效果执行",
            toggleText: "选择效果",
        },
        confirmRespond: {
            title: "请选择是否执行可选效果",
            toggleText: "确认",
            yes: "是",
            no: "否"
        },
    },
    playerName: {
        spectator: "旁观",
        player: "玩家",
    },
    confirm: "确认",
    disconnected: "已掉线请刷新",
    hand: {
        title: "手牌"
    },
    rank: rank,
    pub: {
        region: "地区",
        legend: "传奇",
        lastRoundOfGame: "最后一轮",
        revealedHand: "展示手牌",
        deck: "牌堆",
        champion: "第一：",
        gameLog: "战报",
        emptyBuildingSlot: "空",
        cinemaORStudio: "电影院/制片厂",
        studio: "制片厂",
        cinema: "电影院",
        bollywood: "宝莱坞",
        hollywood: "好莱坞",
        unfreeze: "解冻",
        twoToFourPlayer: "2-4 玩家",
        threeToFourPlayer: "3-4 玩家",
        fourPlayerOnly: "4 玩家",
        handSize: "手牌数",
        estimatedFinalScore: "终局分数",
        events: "事件牌区：",
        res: "资源：",
        competitionPower: "竞争力：",
        deposit: "存款：",
        action: "行动力：",
        industry: "工业等级：",
        industryRequirement: "工业需求：",
        industryMarker: "工业标志：",
        aesthetics: "美学等级：",
        aestheticsRequirement: "美学需求：",
        aestheticsMarker: "美学标志：",
        vp: "声望：",
        share: "份额：",
        shareLegend: "份额/传奇：",
        era: "时代：",
        school: "流派：",
        discard: "查看弃牌堆",
        allCards: "查看所有卡牌",
        inferredHands: "推测手牌",
        archive: "查看档案馆",
        playedCards: "查看出牌区",
    },
    score: {
        cardName: ['{{era}}：{{region}}{{rank}}', {
            era: (e: IEra): string => ("时代" + era[e]),
            rank: (rankNum: 1 | 2 | 3): string => rank[rankNum],
            region: (r: Region): string => region[r],
        }],
    },
    card: cards,
};

export default zh_CN;
