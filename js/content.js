async function getPageDetails() {
    var title = document.title;
    var description = document.head.querySelector('meta[name="description"]').content;

    return {
        title: title,
        description: description
    };
}

async function showError(msg) {
    alert(msg);
}

browser.runtime.onMessage.addListener(request => {
    switch (request.type) {
        case "page-content":
            return getPageContent();
        case "show-error":
            return showError(request.message);
    }
});
