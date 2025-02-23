export { sleep, parseHttpProxyAuth };

function sleep(ms: number) {
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
function parseHttpProxyAuth(proxy: string): string {
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
