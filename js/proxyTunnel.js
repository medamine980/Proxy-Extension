export default class ProxyTunnel {
    constructor() {

    }
    /**
     * 
     * @param {String} ip 
     * @param {String | Number} port 
     * @param {String | null} rule 
     */
    connect(ip, port, rule) {
        const config = {
            mode: "pac_script",
            pacScript: {
                data:
                    "function FindProxyForURL(url, host) {\n" +
                    (rule ? rule :
                        `    return 'PROXY ${ip}:${port}';\n` +
                        "}"),
            },
        };
        chrome.proxy.settings.set(
            { value: config, scope: 'regular' },
            function () { }
        );
    }

    static disconnectFromActiveProxy() {
        chrome.proxy.settings.set(
            { value: { mode: "direct" }, scope: 'regular' }
        );
        // chrome.proxy.settings.clear({ scope: 'regular' }, () => console.log('Proxy Removed'));
    }

}