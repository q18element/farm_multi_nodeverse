export { sleep, parseHttpProxyAuth, convertNameToDirName, checkProxyWorks, processProxy, groupArray };
import { HttpsProxyAgent } from "https-proxy-agent";
import fetch from "node-fetch";
import proxychain from "proxy-chain";
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
/**
 * Parses a proxy string and formats it into a standard HTTP proxy URL.
 * If the proxy string does not start with "http", it assumes the format
 * "host:port:user:password" or "user:password@host:port" and converts it to
 * "http://user:password@host:port". If the user part contains three dots and
 * the port is a valid number, it rearranges the format to "http://host:port@user:password".
 *
 * @param proxy - The proxy string to be parsed.
 * @returns - The proxy URL in the format http://user:password@host:port.
 */
function parseHttpProxyAuth(proxy) {
    if (!proxy.startsWith("http")) {
        if (!proxy.includes("@")) {
            let [host, port, user, password] = proxy.split(":");
            proxy = `${user}:${password}@${host}:${port}`;
            if (user.split(".").length == 3 && parseInt(port) > 0) {
                proxy = `${host}:${port}@${user}:${password}`;
            }
        }
        proxy = `http://${proxy}`;
    }
    return proxy;
}
/** convert a string to a valid directory name */
function convertNameToDirName(name) {
    return name.replace(/[^a-zA-Z0-9]/g, "_");
}
async function checkProxy(proxy, retries = 3) {
    while (retries > 0) {
        try {
            const agent = new HttpsProxyAgent(parseHttpProxyAuth(proxy));
            await fetch("https://google.com", { agent });
            return true;
        }
        catch (error) {
            retries--;
        }
    }
    return false;
}
/** check a list proxy and return list of working proxy */
async function checkProxyWorks(...proxies) {
    let workedProxies = [];
    let pm = [];
    for (let proxy of proxies) {
        try {
            pm.push(checkProxy(proxy)
                .then(() => {
                console.log("Check proxy", proxy, "OK");
                workedProxies.push(proxy);
            })
                .catch(() => {
                console.log("Check proxy", proxy, "FAIL");
            }));
        }
        catch (error) { }
    }
    await Promise.all(pm);
    return workedProxies;
}
async function processProxy(proxyUrl, maxRetries = 3) {
    let retries = 0;
    while (retries < maxRetries) {
        try {
            const anonymized = await proxychain.anonymizeProxy(proxyUrl);
            const parsed = new URL(anonymized);
            // logger.info(`[PROXY SUCCESS] Anonymized Proxy: ${anonymized}`);
            return {
                url: `${parsed.protocol}//${parsed.hostname}:${parsed.port}`,
                auth: parsed.username && parsed.password ? `${parsed.username}:${parsed.password}` : null,
            };
        }
        catch (error) {
            retries++;
            console.error(`[PROXY ERROR] Failed to anonymize proxy ${proxyUrl}. Attempt ${retries}/${maxRetries}: ${error.message}`);
            if (retries === maxRetries)
                throw new Error(`Failed to process proxy: ${proxyUrl}`);
            await sleep(2000);
        }
    }
}
function groupArray(arr, num) {
    const grouped = [];
    for (let i = 0; i < arr.length; i += num) {
        grouped.push(arr.slice(i, i + num));
    }
    return grouped;
}
