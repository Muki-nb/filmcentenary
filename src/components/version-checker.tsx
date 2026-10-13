import {useCallback, useEffect, useRef} from "react";

const VERSION_KEY = "__film_app_version__";
const POLL_INTERVAL = 60 * 1000; // 60 秒轮询一次

async function fetchServerVersion(): Promise<string> {
    try {
        const res = await fetch(`/version.json?t=${Date.now()}`);
        if (!res.ok) return "";
        const data = await res.json();
        return String(data.version || "");
    } catch {
        return "";
    }
}

function readLocalVersion(): string {
    try {
        return localStorage.getItem(VERSION_KEY) || "";
    } catch {
        return "";
    }
}

function saveLocalVersion(version: string) {
    try {
        localStorage.setItem(VERSION_KEY, version);
    } catch {
        // localStorage 不可用时忽略
    }
}

const VersionChecker = () => {
    const loadedRef = useRef(false);

    const check = useCallback(async () => {
        const current = await fetchServerVersion();
        if (!current) return;
        if (!loadedRef.current) {
            // 首次加载：记录当前版本
            saveLocalVersion(current);
            loadedRef.current = true;
            return;
        }
        if (readLocalVersion() !== current) {
            // 检测到新版本：自动刷新一次，让网页版本同步
            saveLocalVersion(current);
            window.location.reload();
        }
    }, []);

    useEffect(() => {
        check();
        const timer = setInterval(check, POLL_INTERVAL);
        // 回到前台/切回标签页时立即检查
        const onVisible = () => {
            if (document.visibilityState === "visible") check();
        };
        document.addEventListener("visibilitychange", onVisible);
        window.addEventListener("focus", check);
        return () => {
            clearInterval(timer);
            document.removeEventListener("visibilitychange", onVisible);
            window.removeEventListener("focus", check);
        };
    }, [check]);

    return null;
};

export default VersionChecker;
