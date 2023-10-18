// ==UserScript==
// @name         EV2 Link
// @description  Adds EV2 links to a release page.
// @version      0.4
// @homepage     https://github.com/specialforest/tampermonkey-scripts
// @author       Igor Shishkin (igshishk@microsoft.com)
// @namespace    http://tampermonkey.net/
// @match        https://*.visualstudio.com/DefaultCollection/*/_releaseProgress*
// @match        https://*.visualstudio.com/*/_releaseProgress*
// @grant        none
// @icon         https://specialforest.github.io/tampermonkey-scripts/ev2-link.ico
// @downloadURL  https://specialforest.github.io/tampermonkey-scripts/ev2-link.user.js
// @updateURL    https://specialforest.github.io/tampermonkey-scripts/ev2-link.user.js
// @supportURL   https://github.com/specialforest/tampermonkey-scripts/issues/new
// 
// ==/UserScript==

(function() {
    'use strict';

    let currentUser;
    let azdoApiBaseUrl;

    function debug(...args) {
        // eslint-disable-next-line no-console
        console.log('[ev2-link]', args);
    }

    function error(...args) {
        // eslint-disable-next-line no-console
        console.error('[ev2-link]', args);
    }

    debug('started!');
    var intervalId = setInterval(function() {
        if (window.TFS?.ReleaseManagement?.Manager !== undefined) {
            clearInterval(intervalId);
            onReady();
        }
    }, 1000);

    async function onReady() {
        debug('ready!');
        const pageData = JSON.parse(document.getElementById('dataProviders').innerHTML).data;
        const release = pageData['ms.vss-releaseManagement-web.releaseview.webpage.data-provider'].release;
        let releaseDef;
        try {
            window.TFS.ReleaseManagement.Manager.ReleaseManager();
            releaseDef = await window.TFS.ReleaseManagement.Manager.ReleaseManager.releaseManagementClient.beginGetRelease(release.id);
        } catch (err) {
          debug('Could not fetch known issues file from DevOps', err);
          return;
        }

        for (const env of releaseDef.environments) {
            for (const step of env.deploySteps) {
                for (const phase of step.releaseDeployPhases) {
                    for (const job of phase.deploymentJobs) {
                        for (const task of job.tasks) {
                            if (task.task?.name === 'Ev2RARollout' || task.task?.name === 'ExpressV2Internal') {
                                const envNodeParent = document.querySelector(`div.cd-environment-node-parent:has(> div.dtc-inner-focus-zone[aria-label="${env.name} stage"])`);
                                const actions = envNodeParent.querySelector('div.cd-environment-actions');
                                const sampleButton = actions.querySelector('.cd-environment-action-button');
                                const extraButtonClasses = Array.from(sampleButton?.classList ?? []).filter(i => /root-.*/.test(i));
                                const sampleContainer = actions.querySelector('.ms-Button-flexContainer');
                                const extraContainerClasses = Array.from(sampleContainer?.classList ?? []).filter(i => /flexContainer-.*/.test(i));
                                const sampleIcon = actions.querySelector('.ms-Button-icon');
                                const extraIconClasses = Array.from(sampleIcon?.classList ?? []).filter(i => /icon-.*/.test(i));
                                const text = `EV2: ${task.name}`;
                                const button = htmlToElement(`
                                    <button type="button" aria-hidden="true" tabindex="-1" class="ms-Button cd-environment-action-button ms-Button--default ${extraButtonClasses.join(' ')}" data-is-focusable="true">
                                        <div class="ms-Button-flexContainer ${extraContainerClasses.join(' ')}">
                                           <i data-icon-name="RawSource" role="presentation" aria-hidden="true" class="ms-Button-icon cd-environment-action-button-icon ${extraIconClasses.join(' ')}">&#xe71b</i>
                                            <div class="cd-environment-action-button-content">
                                                <div style="display:inline">${text}</div>
                                            </div>
                                        </div>
                                    </button>`);

                                button.setAttribute('releaseId', release.id);
                                button.setAttribute('environmentId', env.id);
                                button.setAttribute('releaseDeployPhaseId', phase.id);
                                button.setAttribute('taskId', task.id);
                                button.setAttribute('logUrl', task.logUrl);
                                button.onclick = openEV2;
                                actions.appendChild(button);
                                actions.style['flex-wrap'] = 'wrap';
                            }
                        }
                    }
                }
            }
        }
    }

    async function openEV2(event) {
        const button = event.currentTarget;
        const releaseId = button.getAttribute('releaseId');
        const environmentId = button.getAttribute('environmentId');
        const releaseDeployPhaseId = button.getAttribute('releaseDeployPhaseId');
        const taskId = button.getAttribute('taskId');
        const logs = await window.TFS.ReleaseManagement.Manager.ReleaseManager.releaseManagementClient.beginDownloadLog(releaseId, environmentId, releaseDeployPhaseId, taskId);
        const m = logs.match(/Ev2 portal link - (.+)/);
        window.open(m[1]);
    }

    function htmlToElement(html) {
        var template = document.createElement('template');
        template.innerHTML = html.trim();
        return template.content.firstChild;
    }
})();
