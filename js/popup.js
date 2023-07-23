import ProxyGenerator from './proxyGenerator.js';
import ChromeStorageWrapper from './chromeStorageWrapper.js';
import ProxyTunnel from './proxyTunnel.js';

const STORAGE_KEYS = {
    isConnected: "isConnected",
    inputValue: "inputValue",
    selectedProxies: "selectedProxies",
    selectedProxy: "selectedProxy"
};

const CSS_CLASSES = {
    disconnectBtn: "settings-form__connect-btn--disconnect",
    connectedFlagHidden: "settings-form__connected-flag--hidden"
}

const enableInput = document.querySelector("[data-enable-label]");
const loadingScreen = document.querySelector("[data-loading-screen]");
const mainContainer = document.querySelector("[data-main-container]");
const connectBtn = document.querySelector("[data-connect-btn]");
const selectedFlag = document.querySelector("[data-selected-flag]");
const connectedFlag = document.querySelector("[data-connected-flag]");

let proxies;
let proxiesCountry;
let selectedProxy;
let selectedProxies = [];


const autocompleteContainers = document.querySelectorAll("[data-autocomplete-container]");
autocompleteContainers.forEach((autocompleteContainer, index) => {
    const input = autocompleteContainer.querySelector("[data-autocomplete-input]");
    const optionsContainer = autocompleteContainer.querySelector("[data-autocomplete-options]");
    (["focus"]).forEach(event => {
        input.addEventListener(event, function (e) {
            optionsContainer.classList.remove("hidden");
        });
    });
    (["focus"]).forEach(event => {
        input.addEventListener(event, autoCompleteCallback(optionsContainer, index), { once: true });
    })
    window.addEventListener("click", e => {
        if (e.target !== input && !optionsContainer.classList.contains("hidden")) {
            optionsContainer.classList.add("hidden");
        }
    });
    (["input"]).forEach(event => {
        input.addEventListener(event, autoCompleteCallback(optionsContainer, index));
    });
    input.addEventListener("change", async e => {
        await matchInputToProxy(index, input.value);
    })
});

function getFlagFromCountry(country) {
    country = country.toLowerCase();
    const foundCountry = proxiesCountry.find(proxyCountry => proxyCountry.country.toLowerCase() === country);
    if (foundCountry && foundCountry.countryCode !== "Random") {
        return `https://www.countryflagicons.com/FLAT/64/${foundCountry.countryCode}.png`;
    } else {
        return "../images/countries/unknown.png";
    }
    switch (country) {
        case "united states":
            return "../images/countries/us.webp";
        case "south korea":
            return "../images/countries/southkorea.webp";
        case "china":
            return "../images/countries/china.png";
        case "indonesia":
            return "../images/countries/indonesia.webp";
        default:
            return "../images/countries/unknown.png";
    }
}

async function matchInputToProxy(inputIndex, country) {
    selectedProxies = [];
    country = country.toLowerCase();
    if (country !== "Random") {
        selectedProxies = [];
        for (let i = 0; i < proxies.length; i++) {
            const proxy = proxies[i];
            if (proxy.geolocation.country.toLowerCase() === country) {
                selectedProxies.push(proxy);
            }
        }
        await ChromeStorageWrapper.setValue({
            [STORAGE_KEYS.selectedProxies]: selectedProxies
        });
    }
    await saveInputValue(inputIndex, country);
}

function autoCompleteCallback(optionsContainer, inputIndex) {
    return e => {
        const input = e.currentTarget;
        const value = input.value.toLowerCase();
        const fragment = new DocumentFragment();
        optionsContainer.textContent = "";
        proxiesCountry.forEach(({ country, countryCode }) => {
            const index = country.toLowerCase().indexOf(value);
            if (index != -1) {
                const option = document.createElement("div");
                option.dataset["autocompleteOption"] = "";
                option.classList.add("settings-form__input-autocomplete-container__options__option");
                option.addEventListener("click", async () => {
                    input.value = country;
                    matchInputToProxy(inputIndex, country);
                    optionsContainer.classList.add("hidden");
                });
                const span = document.createElement("span");
                span.innerHTML =
                    `${country.substring(0, index)}<strong>${country.substring(index, index + value.length)}` +
                    `</strong>${country.substring(index + value.length)}`;
                const img = document.createElement("img");
                img.src = getFlagFromCountry(country);
                img.width = 24;
                option.appendChild(img);
                option.appendChild(span);
                fragment.appendChild(option);
            }
        });
        optionsContainer.appendChild(fragment);
    }
}

async function saveInputValue(index, value) {
    await ChromeStorageWrapper.setValue({ [STORAGE_KEYS.inputValue + index]: value });
    selectedFlag.src = getFlagFromCountry(value);
}

function connectView() {
    connectBtn.textContent = "Disconnect";
    connectBtn.dataset.connected = "connected";
    connectBtn.classList.add(CSS_CLASSES.disconnectBtn);
    connectedFlag.classList.remove(CSS_CLASSES.connectedFlagHidden);
    connectedFlag.src = getFlagFromCountry(selectedProxy?.geolocation.country ?? "Random");
}

async function connect() {
    if (selectedProxies.length === 0) selectedProxy = await ProxyGenerator.generateRandomProxy(proxies);
    else {
        selectedProxy = await ProxyGenerator.generateRandomProxy(selectedProxies);
    }
    const proxy = new ProxyTunnel();

    proxy.connect(selectedProxy["ip"], selectedProxy["port"]);
    await ChromeStorageWrapper.setValue({ [STORAGE_KEYS.selectedProxy]: selectedProxy });
    connectView();

}

async function fetchProxies() {
    try {
        proxies = await ProxyGenerator.getAllProxies();
        proxiesCountry = new Set(proxies.map(proxy => JSON.stringify({
            country: proxy.geolocation.country,
            countryCode: proxy.geolocation.countryCode
        })
        ));
        proxiesCountry = Array.from(proxiesCountry);
        proxiesCountry = proxiesCountry.map(proxyCountry => JSON.parse(proxyCountry));
        proxiesCountry.push({ "country": "Random", "countryCode": "Random" });
    } catch (e) {
        proxies = null;
    }
}

function disconnectView() {
    connectBtn.textContent = "Connect";
    delete connectBtn.dataset.connected;
    connectBtn.classList.remove(CSS_CLASSES.disconnectBtn);
    connectedFlag.classList.add(CSS_CLASSES.connectedFlagHidden);
}

async function disconnect() {
    ProxyTunnel.disconnectFromActiveProxy();
    await fetchProxies();
    disconnectView();
}

function addEventListeners() {
    connectBtn.addEventListener("click", async e => {
        e.preventDefault();
        const isConnected = Boolean(connectBtn.dataset.connected);
        if (isConnected) {
            await disconnect();
        } else {
            await connect();
        }
        await ChromeStorageWrapper.setValue({
            [STORAGE_KEYS.isConnected]: !isConnected
        });
    });
}

async function initiate() {
    await fetchProxies();
    const isConnected = (await ChromeStorageWrapper.getValue(STORAGE_KEYS.isConnected)
    )[STORAGE_KEYS.isConnected];
    selectedProxy = (await ChromeStorageWrapper.getValue(STORAGE_KEYS.selectedProxy))[
        STORAGE_KEYS.selectedProxy];
    if (isConnected) {
        selectedProxies = (await ChromeStorageWrapper.getValue(STORAGE_KEYS.selectedProxies))[
            STORAGE_KEYS.selectedProxies
        ];
    }
    for (let index = 0; index < autocompleteContainers.length; index++) {
        const autocompleteContainer = autocompleteContainers[index];
        const input = autocompleteContainer.querySelector("[data-autocomplete-input]");
        const inputValue = (await ChromeStorageWrapper.getValue(STORAGE_KEYS.inputValue + index))[
            STORAGE_KEYS.inputValue + index] ?? "";
        if (isConnected) {
            if (!selectedProxies || selectedProxies.length === 0) {
                selectedFlag.src = getFlagFromCountry("Random");
            } else {
                selectedFlag.src = getFlagFromCountry(selectedProxies[0].geolocation.country);
            }
        } else {
            selectedFlag.src = getFlagFromCountry(inputValue);
        }
        input.value = inputValue;
        await matchInputToProxy(index, inputValue);
    }
    if (isConnected) {
        connectView();

    } else {
        disconnectView();
    }
    loadingScreen.remove();
    mainContainer.classList.remove("hidden");
    addEventListeners();
    // ChromeStorageWrapper.clearAll();
    // await fetchProxies();
    // console.log(proxies);
}

async function main() {
    initiate();
}

main();