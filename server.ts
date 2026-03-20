import path from 'path';
import fs from 'fs';
import * as Koa from "koa"
import serve from 'koa-static';
import {FilmCentenaryGame} from "./src/Game";
import {Server} from "boardgame.io/server";
import RedisStorage from "./ioredis-stroage";
import {PostgresStore} from "bgio-postgres"
import {SongJinnGameDef} from "./src/songJinn/game";

const server = process.env.REDIS_URL ? Server({
    games: [FilmCentenaryGame,SongJinnGameDef],
    db: new RedisStorage(process.env.REDIS_URL),
    origins: [
        // Allow any domain connect.
        '*'
    ]
}) : process.env.POSTGRES_URL ? Server({
    games: [FilmCentenaryGame,SongJinnGameDef],
    db: new PostgresStore(
        process.env.POSTGRES_URL,
        {
            logging: false,
            timezone: '+08:00'
        }
    ),
    origins: [
        // Allow any domain connect.
        '*'
    ]
}) : Server({
    games: [FilmCentenaryGame,SongJinnGameDef],
    origins: [
        // Allow any domain connect.
        '*'
    ]
});


const PORT = process.env.PORT || "3002";
const {app} = server;

const resolveStatsPath = (): string => {
    const configured = process.env.FILM_MATCH_STATS_PATH;
    if (configured && configured.trim().length > 0) {
        return configured;
    }
    const cwd = process.cwd();
    const cwdDataPath = path.resolve(cwd, 'data', 'film-match-stats.jsonl');
    const parentDataPath = path.resolve(cwd, '..', 'data', 'film-match-stats.jsonl');
    if (fs.existsSync(cwdDataPath)) {
        return cwdDataPath;
    }
    if (fs.existsSync(parentDataPath)) {
        return parentDataPath;
    }
    const cwdBaseName = path.basename(path.resolve(cwd));
    if (cwdBaseName.toLowerCase() === 'src') {
        return parentDataPath;
    }
    return cwdDataPath;
}

app.use(async (ctx: Koa.Context, next: Koa.Next) => {
    if (ctx.method === 'GET' && ctx.path === '/api/match-stats') {
        const statsPath = resolveStatsPath();
        if (!fs.existsSync(statsPath)) {
            ctx.status = 200;
            ctx.type = 'text/plain; charset=utf-8';
            ctx.body = '';
            return;
        }
        ctx.status = 200;
        ctx.type = 'text/plain; charset=utf-8';
        ctx.body = fs.readFileSync(statsPath, {encoding: 'utf8'});
        return;
    }
    await next();
});

const FRONTEND_PATH = path.join(__dirname);
app.use(
    serve(FRONTEND_PATH, {
        setHeaders: (res) => {
            res.setHeader('Access-Control-Allow-Origin', '*');
        },
    })
);

server.run(
    {
        port: parseInt(PORT),
    },
    () => {
        // rewrite rule for catching unresolved routes and redirecting to index.html
        // for client-side routing
        server.app.use(async (ctx: Koa.Context, next: Koa.Next) => {
            console.log(`${ctx.method}|${ctx.host}${ctx.url}|${ctx.ip}|${JSON.stringify(ctx.ips)}`)
            await serve("build")(
                Object.assign(ctx, {path: 'index.html'}),
                next
            );
        });
    }
).then(
    r => console.log(
        `boardgames server started|${JSON.stringify(r)}`
    )
)
