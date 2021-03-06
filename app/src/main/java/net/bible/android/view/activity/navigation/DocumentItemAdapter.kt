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
 *
 */
package net.bible.android.view.activity.navigation

import android.content.Context
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ArrayAdapter
import kotlinx.android.synthetic.main.document_list_item.view.*
import net.bible.android.activity.R
import net.bible.android.view.activity.base.RecommendedDocuments
import net.bible.android.view.activity.download.DocumentListItem
import org.crosswire.jsword.book.Book
import org.crosswire.jsword.book.basic.AbstractPassageBook
import org.crosswire.jsword.versification.system.SystemKJV

/**
 * nice example here: http://shri.blog.kraya.co.uk/2010/04/19/android-multi-line-select-list/
 *
 * @author Martin Denham [mjdenham at gmail dot com]
 */

class DocumentItemAdapter(
    context: Context,
    private val recommendedDocuments: RecommendedDocuments? = null
) : ArrayAdapter<Book>(context, R.layout.list_item_2_highlighted, ArrayList<Book>()) {
    override fun getView(position: Int, convertView: View?, parent: ViewGroup): View {
        val document = getItem(position)!!

        // Pick up the TwoLineListItem defined in the xml file
        val view: DocumentListItem
        view = if (convertView == null) {
            val inflater = context.getSystemService(Context.LAYOUT_INFLATER_SERVICE) as LayoutInflater
            inflater.inflate(R.layout.document_list_item, parent, false) as DocumentListItem
        } else {
            convertView as DocumentListItem
        }
        view.document = document
        view.recommendedDocuments = recommendedDocuments
        view.setIcons()

        // Set value for the first text field
        if (view.documentAbbreviation != null) {
            // eBible repo uses abbreviation for initials and initials now contains the repo name!!!
            // but helpfully JSword uses initials if abbreviation does not exist, as will be the case for all other repos.
            view.documentAbbreviation.text = document.abbreviation
        }

        // set value for the second text field
        if (view.documentName != null) {
            var name = document.name
            if (document is AbstractPassageBook) {
                val bible = document
                // display v11n name if not KJV
                if (SystemKJV.V11N_NAME != bible.versification.name) {
                    name += " (" + bible.versification.name + ")"
                }
            }
            view.documentName.text = name
        }
        return view
    }
}
