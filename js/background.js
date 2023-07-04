async function getExtensionConfig() {
    var items = await browser.storage.local.get(),
        instance = items.instance || "",
        username = items.username || "",
        password = items.password || "";

    if (instance === "") {
        throw new Error("Not connected to any instance");
    }

    return {
        instance: instance,
        username: username,
        password: password,
    };
}

async function getCurrentTab() {
    // Get active tabs in current window
    var tabs = await browser.tabs.query({
        currentWindow: true,
        active: true,
    });

    if (tabs.length < 1) {
        throw new Error("No tab available");
    }

    return tabs[0];
}

async function getPageContent(tab) {
    try {
        var content = await browser.tabs.sendMessage(tab.id, { type: "page-content" });
        return content;
    } catch {
        return {};
    }
}

async function checkIfURLExists(url) {
    var config = await getExtensionConfig(),
        apiURL = `${config.instance}/api/url?url=${encodeURIComponent(url)}`;

    var response = await fetch(apiURL, {
        method: "get",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Basic " + btoa(`${config.username}:${config.password}`),
        },
        credentials: "include",
    });

    if (response.status == 404) {
        return false;
    } else if (!response.ok) {
        var err = await response.text();
        throw new Error(err);
    }

    return true;
}

async function updateIcon() {
    // Set initial icon
    var icon = {
        path: {
            16: "icons/action-default-16.png",
            32: "icons/action-default-32.png",
            64: "icons/action-default-64.png"
        }
    };

    // Get current active tab
    var tab = await getCurrentTab();
    var exists = await checkIfURLExists(tab.url);

    if (exists) icon.path = {
        16: "icons/action-bookmarked-16.png",
        32: "icons/action-bookmarked-32.png",
        64: "icons/action-bookmarked-64.png"
    }

    return browser.browserAction.setIcon(icon);
}

function updateActiveTab() {
    updateIcon().catch(err => console.error(err.message));
}

browser.tabs.onUpdated.addListener(updateActiveTab);
browser.tabs.onActivated.addListener(updateActiveTab);
browser.windows.onFocusChanged.addListener(updateActiveTab);
updateActiveTab();
