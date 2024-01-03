// ==UserScript==
// @name         Go to Classic EV2
// @namespace    http://tampermonkey.net/
// @version      2024-01-03
// @description  Adds a link to classic EV2 rollout
// @author       Igor Shishkin (igshishk@microsoft.com)
// @match        https://ra.ev2portal.azure.net/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=azure.net
// @grant        none
// @downloadURL  https://specialforest.github.io/tampermonkey-scripts/go-to-classic-ev2.user.js
// @updateURL    https://specialforest.github.io/tampermonkey-scripts/go-to-classic-ev2.user.js
// @supportURL   https://github.com/specialforest/tampermonkey-scripts/issues/new
// ==/UserScript==

(function() {
    'use strict';

    window.addEventListener('load', function() {
        onPageLoaded();
    }, false);

    function onPageLoaded() {
        var intervalId = setInterval(function() {
            const parent = document.querySelector("div.breadcrumb");
            if (parent) {
                clearInterval(intervalId);
                onReady(parent);
            }
        }, 1000);
    }

    function onReady(parent) {
        const input = new URL(window.location.href);
        const segments = input.hash.split("/");
        let target = new URL(`https://ev2portal.azure.net/#/Rollout/${segments[4]}/${segments[5]}?RolloutInfra=${segments[2]}`);

        const classicLink = htmlToElement(`
            <div class="ms-OverflowSet-item" role="none">
                <span>&nbsp;</span>
                <span><a href="${target.toString()}">(Go to Classic EV2)</a></span>
            </div>
           `);
        parent.appendChild(classicLink);
    }

    function htmlToElement(html) {
        var template = document.createElement('template');
        template.innerHTML = html.trim();
        return template.content.firstChild;
    }

})();
