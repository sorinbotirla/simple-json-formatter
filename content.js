(function () {
    const JSON_VIEWER_CSS = `
    body, html {
        width: 100%;
        height: 100%;
        margin: 0;
        padding: 0;
        box-sizing: border-box;
        background: #fafbfc;
        line-height: 20px;
        font-size: 16px;
    }
    #json-collapsible-root {
        box-sizing: border-box;
        width: 100vw;
        min-height: 100vh;
        padding: 0;
        font-family: "JetBrains Mono", "Fira Mono", "Consolas", monospace;
        font-size: 16px;
    }
    .json-node {
        white-space: pre;
        margin-bottom: 2px;
    }
    .json-key {
        color: #1750a1;
        font-weight: bold;
    }
    .json-value.string { color: #018901; }
    .json-value.number { color: #c45500; }
    .json-value.boolean { color: #aa5d00; }
    .json-value.null { color: #b7313b; }
    .json-toggle {
        cursor: pointer;
        user-select: none;
        color: #bbb;
        margin-right: 6px;
    }
    .json-info {
        color: #888;
        font-style: italic;
        margin-left: 6px;
    }
    .json-line {
        display: inline-block;
    }
    .json-children {
        margin-left: 13px;
        border-left: 1.5px dashed #ddd;
        padding-left: 12px;
    }
    .expanded > .json-children {
        display: block;
    }
    #json-collapsible-root > div {
        white-space: pre-wrap;
        overflow-x: auto;
        color: #c00;
        background: #fff;
        font-family: "JetBrains Mono", "Fira Mono", "Consolas", monospace;
        font-size: 15px;
        padding: 16px;
        margin: 0;
    }
    `;
    const SIZE_LIMIT = 200 * 1024; // 200 KB
    const bodyText = document.body.innerText.trim();
    const isOnlyPre = document.body.children.length === 1 && document.body.firstElementChild.tagName === 'PRE';
    const isLikelyJson = /^[\{\[]/.test(bodyText);
    if (!(isOnlyPre || (isLikelyJson && document.body.children.length === 0))) return;

    let rawJson = isOnlyPre ? document.body.firstElementChild.innerText.trim() : bodyText;

    function injectJsonViewerStyles() {
        if (!document.getElementById('json-viewer-style')) {
            const style = document.createElement('style');
            style.id = 'json-viewer-style';
            style.textContent = JSON_VIEWER_CSS;
            document.head.appendChild(style);
        }
    }

    function showRaw() {
        let container = document.createElement('div');
        container.id = 'json-collapsible-root';

        // Use a div instead of pre for huge content, and force wrap/scroll
        let rawDiv = document.createElement('div');
        rawDiv.textContent = rawJson;
        rawDiv.style.color = "#c00";
        rawDiv.style.background = "#fff8f8";
        rawDiv.style.whiteSpace = "pre-wrap"; // allows wrapping
        rawDiv.style.overflowX = "auto"; // horizontal scroll for long lines
        rawDiv.style.fontFamily = '"JetBrains Mono", "Fira Mono", "Consolas", monospace';
        rawDiv.style.fontSize = "15px";
        rawDiv.style.padding = "16px";
        rawDiv.style.borderRadius = "8px";
        rawDiv.style.marginTop = "16px";
        container.appendChild(rawDiv);

        document.body.innerHTML = "";
        document.body.appendChild(container);
        document.body.style.margin = "0";
        document.body.style.padding = "0";
        document.body.style.background = "#fafbfc";
    }

    function showTree(collapsedAll) {
        injectJsonViewerStyles();
        let container = document.createElement('div');
        container.id = 'json-collapsible-root';

        try {
            let parsed = JSON.parse(rawJson);

            function createNode(key, value, level = 0, collapsed = false) {
                const isObject = typeof value === "object" && value !== null;
                const wrapper = document.createElement('div');
                wrapper.className = "json-node";
                wrapper.style.marginLeft = `${level * 18}px`;

                if (Array.isArray(value)) {
                    let label = document.createElement('span');
                    label.className = 'json-key';
                    label.innerHTML = key !== undefined ? `"${key}": ` : '';
                    let toggle = document.createElement('span');
                    toggle.className = 'json-toggle';
                    toggle.textContent = collapsed ? '[+]' : '[-]';
                    label.prepend(toggle);

                    wrapper.appendChild(label);
                    let arrayLen = document.createElement('span');
                    arrayLen.className = "json-info";
                    arrayLen.textContent = `Array(${value.length})`;
                    wrapper.appendChild(arrayLen);

                    let inner = document.createElement('div');
                    inner.className = 'json-children';
                    value.forEach((item, i) => {
                        inner.appendChild(createNode(i, item, level + 1, collapsed));
                    });
                    wrapper.appendChild(inner);

                    if (collapsed) {
                        wrapper.classList.remove('expanded');
                        inner.style.display = "none";
                        toggle.textContent = '[+]';
                    } else {
                        wrapper.classList.add('expanded');
                        inner.style.display = "block";
                        toggle.textContent = '[-]';
                    }
                    toggle.onclick = function () {
                        const expanded = wrapper.classList.toggle('expanded');
                        if (expanded) {
                            inner.style.display = "block";
                            toggle.textContent = '[-]';
                        } else {
                            inner.style.display = "none";
                            toggle.textContent = '[+]';
                        }
                    };
                } else if (isObject) {
                    let label = document.createElement('span');
                    label.className = 'json-key';
                    label.innerHTML = key !== undefined ? `"${key}": ` : '';
                    let toggle = document.createElement('span');
                    toggle.className = 'json-toggle';
                    toggle.textContent = collapsed ? '{+}' : '{-}';
                    label.prepend(toggle);

                    wrapper.appendChild(label);

                    let inner = document.createElement('div');
                    inner.className = 'json-children';
                    Object.entries(value).forEach(([k, v]) => {
                        inner.appendChild(createNode(k, v, level + 1, collapsed));
                    });
                    wrapper.appendChild(inner);

                    if (collapsed) {
                        wrapper.classList.remove('expanded');
                        inner.style.display = "none";
                        toggle.textContent = '{+}';
                    } else {
                        wrapper.classList.add('expanded');
                        inner.style.display = "block";
                        toggle.textContent = '{-}';
                    }
                    toggle.onclick = function () {
                        const expanded = wrapper.classList.toggle('expanded');
                        if (expanded) {
                            inner.style.display = "block";
                            toggle.textContent = '{-}';
                        } else {
                            inner.style.display = "none";
                            toggle.textContent = '{+}';
                        }
                    };
                } else {
                    let line = document.createElement('span');
                    line.className = 'json-line';
                    if (key !== undefined) {
                        let keySpan = document.createElement('span');
                        keySpan.className = 'json-key';
                        keySpan.textContent = `"${key}": `;
                        line.appendChild(keySpan);
                    }
                    let valueSpan = document.createElement('span');
                    valueSpan.className = 'json-value ' + (typeof value);
                    valueSpan.textContent = typeof value === "string" ? `"${value}"` : value;
                    line.appendChild(valueSpan);
                    wrapper.appendChild(line);
                }
                return wrapper;
            }

            let rootNode = createNode(undefined, parsed, 0, collapsedAll);
            container.appendChild(rootNode);

        } catch (e) {
            showRaw();
            return;
        }

        document.body.innerHTML = "";
        document.body.appendChild(container);
        document.body.style.margin = "0";
        document.body.style.padding = "0";
        document.body.style.background = "#fafbfc";
    }

    // Big JSON logic
    if (rawJson.length > SIZE_LIMIT) {
        // Show prompt to user
        let kb = Math.round(rawJson.length / 1024);
        let promptDiv = document.createElement('div');
        promptDiv.style.padding = "32px";
        promptDiv.style.fontFamily = '"Segoe UI",sans-serif';
        promptDiv.style.fontSize = "18px";
        promptDiv.innerHTML =
            `<b>This JSON is large (${kb} KB). What would you like to do?</b><br/><br/>
            <button id="jsonfmt-format" style="font-size:16px;margin-right:18px;padding:6px 18px;cursor: pointer;">Format (collapsible)</button>
            <button id="jsonfmt-raw" style="font-size:16px;padding:6px 18px;cursor: pointer;">Show as raw text</button>`;

        document.body.innerHTML = "";
        document.body.appendChild(promptDiv);

        document.getElementById('jsonfmt-format').onclick = () => showTree(true);
        document.getElementById('jsonfmt-raw').onclick = () => showRaw();
    } else {
        showTree(false); // normal: expanded
    }
})();
