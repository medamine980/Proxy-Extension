export default class ProxyGenerator {
    static async getAllProxies() {
        const request = new Request("https://raw.githubusercontent.com/mertguvencli/http-proxy-list/main/proxy-list/data-with-geolocation.json",
            {
                method: "GET",
            }
        );
        const res = await fetch(request);
        const json = await res.json();
        return json.filter(proxy => proxy.geolocation.status && proxy.geolocation.status === 'success');
    }
    /**
     * @param {Array} proxies 
     * @returns {Promise<Object[]>}
     */
    static async generateRandomProxy(proxies) {
        if (!proxies) proxies = await this.getAllProxies();
        const proxiesLength = Object.keys(proxies).length;
        const randomIndex = Math.floor(Math.random() * proxiesLength);
        return proxies[randomIndex];
    }


}