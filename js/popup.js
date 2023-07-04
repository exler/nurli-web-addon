// Get DOM
var inputTags = document.getElementById("input-tags"),
    inputRead = document.getElementById("input-read"),
    inputFavorite = document.getElementById("input-favorite"),
    btnSave = document.getElementById("btn-save"),
    btnDelete = document.getElementById("btn-delete"),
    linkOpenApp = document.getElementById("link-app");

async function showError(err) {
    var tabs = await browser.tabs.query({
        currentWindow: true,
        active: true,
    });

    if (tabs.length < 1) {
        throw new Error("No tab available");
    }

    if (err instanceof Error) {
        err = err.message;
    }

    return browser.tabs.sendMessage(tabs[0].id, {
        type: "show-error",
        message: err,
    });
}

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

async function getBookmarkForURL(url) {
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
        return null;
    } else if (!response.ok) {
        var err = await response.text();
        throw new Error(err);
    }

    return response.json();
}

async function saveBookmarkForURL(url, tags, read, favorite) {
    var config = await getExtensionConfig(),
        apiURL = `${config.instance}/api/bookmark`;

    var response = await fetch(apiURL, {
        method: "put",
        body: JSON.stringify({ url: url, tags: tags, read: read, favorite: favorite }),
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Basic " + btoa(`${config.username}:${config.password}`),
        },
        credentials: "include",
    });

    if (!response.ok && response.status !== 201) {
        var err = await response.text();
        throw new Error(err);
    }

    return Promise.resolve();
}

async function deleteBookmarkForURL(url) {
    var config = await getExtensionConfig(),
        apiURL = `${config.instance}/api/bookmark`;

    var response = await fetch(apiURL, {
        method: "delete",
        body: JSON.stringify({ url: url }),
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Basic " + btoa(`${config.username}:${config.password}`),
        },
        credentials: "include",
    });

    if (!response.ok) {
        var err = await response.text();
        throw new Error(err);
    }

    return Promise.resolve();
}


async function fillFormWithInitialData() {
    var tabs = await browser.tabs.query({
        currentWindow: true,
        active: true,
    });

    if (tabs.length < 1) {
        throw new Error("No tab available");
    }

    var tab = tabs[0],
        local = await getBookmarkForURL(tab.url);

    if (local) {
        inputTags.value = local.Tags.map(tag => tag.Name).join(", ");
        inputRead.checked = local.Read;
        inputFavorite.checked = local.Favorite;
        btnDelete.style.display = "inline-block";
    }
}

fillFormWithInitialData().catch(err => showError(err));

async function replaceOpenAppLink() {
    var config = await getExtensionConfig();

    linkOpenApp.href = config.instance;
}

replaceOpenAppLink().catch(err => showError(err));

btnDelete.addEventListener("click", (e) => {
    browser.tabs.query({
        currentWindow: true,
        active: true,
    }).then((tabs) => {
        // Send data
        deleteBookmarkForURL(tabs[0].url)
            .catch(err => showError(err))
            .finally(() => window.close());
    });
});

btnSave.addEventListener("click", (e) => {
    browser.tabs.query({
        currentWindow: true,
        active: true,
    }).then((tabs) => {
        var tags = inputTags.value
            .toLowerCase()
            .replace(/\s+/g, " ")
            .split(/\s*,\s*/g)
            .filter(tag => tag.trim() !== "");

        // Send data
        saveBookmarkForURL(tabs[0].url, tags, inputRead.checked, inputFavorite.checked)
            .catch(err => showError(err))
            .finally(() => window.close());
    });


});

inputTags.addEventListener("keyup", (e) => {
    // KeyboardEvent.code 13 === "Enter" key
    if (e.code === 13) {
        e.preventDefault()
        btnSave.click()
    }
})
