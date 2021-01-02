/*
 * Copyright (c) 2020 Martin Denham, Tuomas Airaksinen and the And Bible contributors.
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
import {emit} from "@/eventbus";
import {Deferred, rangeInside, setupDocumentEventListener, stubsFor} from "@/utils";
import {onMounted} from "@vue/runtime-core";
import {calculateOffsetToVerse} from "@/dom";
import {isFunction, union} from "lodash";
import {reactive} from "@vue/reactivity";

let callId = 0;

const logEntries = reactive([])

function addLog(logEntry) {
    logEntries.push(logEntry);
}

export function patchAndroidConsole() {
    const origConsole = window.console;
    window.bibleViewDebug.logEntries = logEntries;
    // Override normal console, so that argument values also propagate to Android logcat
    const enableAndroidLogging = process.env.NODE_ENV !== "development";
    window.console = {
        _msg(s, args) {
            const printableArgs = args.map(v => isFunction(v) ? v : v ? JSON.stringify(v).slice(0, 500): v);
            return `${s} ${printableArgs}`
        },
        flog(s, ...args) {
            if(enableAndroidLogging) android.console('flog', this._msg(s, args))
            origConsole.log(this._msg(s, args))
        },
        log(s, ...args) {
            if(enableAndroidLogging) android.console('log', this._msg(s, args))
            origConsole.log(s, ...args)
        },
        error(s, ...args) {
            addLog({type: "ERROR", msg: this._msg(s, args)});
            if(enableAndroidLogging) android.console('error', this._msg(s, args))
            origConsole.error(s, ...args)
        },
        warn(s, ...args) {
            addLog({type: "WARN", msg: this._msg(s, args)});
            if(enableAndroidLogging) android.console('warn', this._msg(s, args))
            origConsole.warn(s, ...args)
        }
    }
}

export function useAndroid({allStyleRanges}, config) {
    const responsePromises = new Map();

    function response(callId, returnValue) {
        const val = responsePromises.get(callId);
        if(val) {
            const {promise, func} = val;
            responsePromises.delete(callId);
            console.log("Returning response from async android function: ", func, callId, returnValue);
            promise.resolve(returnValue);
        } else {
            console.error("Promise not found for callId", callId)
        }
    }

    function querySelection() {
        const selection = window.getSelection();
        if (selection.rangeCount < 1 || selection.collapsed) return null;
        const range = selection.getRangeAt(0);
        const {ordinal: startOrdinal, offset: startOffset} =
            calculateOffsetToVerse(range.startContainer, range.startOffset, true);
        const {ordinal: endOrdinal, offset: endOffset} =
            calculateOffsetToVerse(range.endContainer, range.endOffset);
        const fragmentId = range.startContainer.parentElement.closest(".fragment").id;
        const [bookInitials, bookOrdinals] = fragmentId.slice(2, fragmentId.length).split("--");
        const bookmarks = union(
            ...allStyleRanges.value.filter(
                s => rangeInside(s.ordinalAndOffsetRange,
                    [[startOrdinal, startOffset], [endOrdinal, endOffset]], {inclusive: true}))
                .map(s => s.bookmarks)
        );
        return {bookInitials, startOrdinal, startOffset, endOrdinal, endOffset, bookmarks};
    }

    window.bibleView.response = response;
    window.bibleView.emit = emit;
    window.bibleView.querySelection = querySelection

    async function deferredCall(func) {
        const promise = new Deferred();
        const thisCall = callId ++;
        responsePromises.set(thisCall, {func, promise});
        console.log("Calling async android function: ", func, thisCall);
        func(thisCall);
        const returnValue = await promise.wait();
        console.log("Response from async android function: ", thisCall, returnValue);
        return returnValue
    }

    async function requestMoreTextAtTop() {
        return await deferredCall((callId) => android.requestMoreTextAtTop(callId));
    }

    async function requestMoreTextAtEnd() {
        return await deferredCall((callId) => android.requestMoreTextAtEnd(callId));
    }

    function scrolledToVerse(ordinal) {
        android.scrolledToVerse(ordinal)
    }

    function saveBookmarkNote(bookmarkId, noteText) {
        android.saveBookmarkNote(bookmarkId, noteText);
    }

    function removeBookmark(bookmarkId) {
        android.removeBookmark(bookmarkId);
    }

    function assignLabels(bookmarkId) {
        android.assignLabels(bookmarkId);
    }

    function setClientReady() {
        android.setClientReady();
    }

    function reportInputFocus(value) {
        android.reportInputFocus(value);
    }


    const exposed = {
        reportInputFocus,
        saveBookmarkNote,
        logEntries,
        requestMoreTextAtTop,
        requestMoreTextAtEnd,
        scrolledToVerse,
        setClientReady,
        querySelection,
        removeBookmark,
        assignLabels
    }

    if(config.developmentMode) return {
        ...stubsFor(exposed),
        logEntries,
        querySelection
    }

    setupDocumentEventListener("selectionchange" , () => {
        if(window.getSelection().rangeCount > 0 && window.getSelection().getRangeAt(0).collapsed) {
            android.selectionCleared();
        }
    });

    onMounted(() => {
        setClientReady();
    });

    return exposed;
}
