import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from 'prosemirror-state'

// Define a regular expression for identifying task reference patterns
const TASK_LINK_REGEX = /\[\[task:([a-zA-Z0-9-]+)\|([^\]]+)\]\]/g

// Task Link Extension that converts [[task:id|label]] into clickable links
const TaskLinkExtension = Extension.create({
  name: 'taskLink',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('taskLink'),
        props: {
          // Transform task links when rendering
          transformPastedHTML(html) {
            return html.replace(TASK_LINK_REGEX, (_, id, label) => {
              return `<a href="#" data-task-id="${id}" class="task-link">${label}</a>`
            })
          },
        },
      }),
    ]
  },
})

export default TaskLinkExtension 