export default class ChromeStorageWrapper {
    static async setValue(object) {
        await chrome.storage.local.set(object);
    }

    static async getValue(keys) {
        const result = await chrome.storage.local.get(keys);
        return result;
    }
    static async clearAll() {
        await chrome.storage.local.clear();
    }
}