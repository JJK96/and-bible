/*
 * Copyright (c) 2021 Martin Denham, Tuomas Airaksinen and the And Bible contributors.
 *
 * This file is part of And Bible (http://github.com/AndBible/and-bible).
 *
 * And Bible is free software: you can redistribute it and/or modify it under the
 * terms of the GNU General Public License as published by the Free Software Foundation,
 * either version 3 of the License, or (at your option) any later version.
 *
 * And Bible is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with And Bible.
 * If not, see http://www.gnu.org/licenses/.
 */

let cached

const untranslated = {
    chapterNum: "— %d —",
    verseNum: "%d",
}

export function useStrings() {
    const lang = new URLSearchParams(window.location.search).get("lang");
    if(!cached) {
        const defaults = require(`@/lang/default.yaml`);
        try {
            cached = require(`@/lang/${lang}.yaml`);
        } catch (e) {
            console.error(`Language ${lang} not found, falling back to English!`)
            cached = require(`@/lang/default.yaml`);
        }

        // Get untranslated strings from default
        for(const i in cached) {
            if(!cached[i]) {
                cached[i] = defaults[i]
            }
        }
        cached = {...cached, ...untranslated};
    }
    return cached;
}
