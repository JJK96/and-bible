<!--
  - Copyright (c) 2021 Martin Denham, Tuomas Airaksinen and the And Bible contributors.
  -
  - This file is part of And Bible (http://github.com/AndBible/and-bible).
  -
  - And Bible is free software: you can redistribute it and/or modify it under the
  - terms of the GNU General Public License as published by the Free Software Foundation,
  - either version 3 of the License, or (at your option) any later version.
  -
  - And Bible is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
  - without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
  - See the GNU General Public License for more details.
  -
  - You should have received a copy of the GNU General Public License along with And Bible.
  - If not, see http://www.gnu.org/licenses/.
  -->

<template>
  <template v-if="bookmark.text">
    <span class="bookmark-text">
      <q v-if="isExpanded" @click.stop="isExpanded = false" class="bible-text"><span v-html="bookmark.fullText"/></q>
      <q v-if="!isExpanded" @click.stop="isExpanded = true" class="bible-text">{{abbreviated(bookmark.text, 80)}}</q>
    </span>
  </template>
</template>

<script>
import {ref} from "@vue/reactivity";
import {useCommon} from "@/composables";
import {stripTags} from "@/utils";

export default {
  name: "BookmarkText",
  props: {
    bookmark: {type: Object, required: true},
    expanded: {type: Boolean, default: false},
  },
  setup(props) {
    const isLong = stripTags(props.bookmark.fullText).length > 80;
    const isExpanded = ref(props.expanded || !isLong);
    return {isExpanded, ...useCommon()};
  }
}
</script>

<style scoped>
.bookmark-text {
  font-style: italic;
}
</style>
