// ==UserScript==
// @name         EV2 Link
// @description  Adds EV2 links to a build page.
// @version      0.2
// @homepage     https://github.com/specialforest/tampermonkey-scripts
// @author       Igor Shishkin (igshishk@microsoft.com)
// @namespace    http://tampermonkey.net/
// @match        https://*.visualstudio.com/*/_build/results*
// @match        https://dev.azure.com/*/_build/results*
// @grant        none
// @icon         https://specialforest.github.io/tampermonkey-scripts/ev2-link.ico
// @downloadURL  https://specialforest.github.io/tampermonkey-scripts/ev2-link-build.user.js
// @updateURL    https://specialforest.github.io/tampermonkey-scripts/ev2-link-build.user.js
// @supportURL   https://github.com/specialforest/tampermonkey-scripts/issues/new
//
// ==/UserScript==

(function() {
    'use strict';

    let currentUser;
    let azdoApiBaseUrl;

    function debug(msg, ...args) {
        // eslint-disable-next-line no-console
        console.log(`[ev2-link] ${msg}`, args);
    }

    function error(msg, ...args) {
        // eslint-disable-next-line no-console
        console.error(`[ev2-link] ${msg}`, args);
    }

    debug('started! waiting for jQuery to load...');
    var intervalId = setInterval(function() {
        if (window.dataProviders !== undefined) {
            clearInterval(intervalId);
            onReady();
        }
    }, 1000);

    async function onReady() {
        debug('ready!');

        const build = window.dataProviders.data['ms.vss-build-web.run-details-data-provider'];

        const timeline = await (await fetch(`https://msazure.visualstudio.com/One/_apis/build/builds/${build.id}/timeline?api-version=7.1-preview.2`)).json();
        const ev2Tasks = [
          "Ev2RARollout",
          "ExpressV2Internal"
        ];
        const tasks = timeline.records.filter(item => ev2Tasks.includes(item.task?.name));
        const tasksByJob = Object.groupBy(tasks, item => item.parentId);

        for (const job of build.jobs) {
            if (job.name.endsWith("_AgentRolloutJob")) {
                const stageDiv = document.getElementById(job.stageId);
                const stageExpandButton = stageDiv.querySelector('.stageExpandButton');

                for (const task of tasksByJob[job.id] ?? []) {
                    if (task.log?.url) {

                        const button = htmlToElement(`
                          <div class="flex-row fontWeightNormal fontSize">
                            <button aria-label="EV2 link" class="bolt-button bolt-icon-button enabled subtle icon-only bolt-focus-treatment" role="button" tabindex="-1" type="button">
                              <span class="fluent-icons-enabled">
                                <span aria-hidden="true" class="left-icon flex-noshrink fabric-icon ms-Icon--Deploy medium"></span>
                              </span>
                            </button>
                          </div>
                        `);

                        button.setAttribute('jobId', job.id);
                        button.setAttribute('logUrl', task.log.url);
                        button.onclick = openEV2;
                        stageExpandButton.parentNode.insertBefore(button, stageExpandButton);
                    }
                }
            }
        }
    }

    async function openEV2(e) {
        e.stopPropagation();

        const button = event.currentTarget;
        const logUrl = button.getAttribute('logUrl');
        const log = await (await fetch(logUrl)).text();
        const m = log.match(/Ev2 portal link - (.+)/);
        window.open(m[1]);
    }

    function htmlToElement(html) {
        var template = document.createElement('template');
        template.innerHTML = html.trim();
        return template.content.firstChild;
    }

})();
