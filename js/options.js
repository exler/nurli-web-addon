async function getExtensionConfig() {
    var items = await browser.storage.local.get();

    return {
        instance: items.instance || "",
        username: items.username || "",
        password: items.password || "",
    };
}

async function saveExtensionConfig(cfg) {
    return browser.storage.local.set(cfg);
}

// Define function for UI handler
var errorMessage = document.getElementById("error-message"),
    connectionInfo = document.getElementById("connection-info"),
    inputInstance = document.getElementById("input-instance"),
    inputUsername = document.getElementById("input-username"),
    inputPassword = document.getElementById("input-password"),
    btnLogin = document.getElementById("btn-login"),
    config = {};

function showError(msg) {
    errorMessage.style.display = "block";
    errorMessage.textContent = msg;
}

function hideError() {
    errorMessage.style.display = "none";
}

getExtensionConfig()
    .then(cfg => {
        config = cfg;

        if (cfg.instance === "") connectionInfo.textContent = "Not connected.";
        else connectionInfo.textContent = `Connected to: ${cfg.instance}`;

        inputInstance.value = cfg.instance;
        inputUsername.value = cfg.username;
        inputPassword.value = cfg.password;
    })
    .catch(err => showError(err));

async function healthCheck(instance, username, password) {
    var url = `${instance}/api/health`,
        headers = {
            "Content-Type": "application/json",
        },
        options = {
            method: "GET",
            headers: headers,
            credentials: "include",
        };

    if (username !== "" && password !== "") {
        headers["Authorization"] = "Basic " + btoa(`${username}:${password}`);
    }

    var response = await fetch(url, options);

    if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }

    return Promise.resolve();
}

// Register event listener
async function btnLoginClick() {
    // Get input value
    var instance = inputInstance.value,
        username = inputUsername.value,
        password = inputPassword.value;

    // Save input value and session to config
    config.instance = instance;
    config.username = username;
    config.password = password;

    // Check health
    await healthCheck(instance, username, password);

    await saveExtensionConfig(config);
    connectionInfo.textContent = `Connected to: ${instance}`;

    return Promise.resolve();
}

btnLogin.addEventListener("click", () => {
    hideError();

    btnLoginClick().catch(err => showError(err));
});
