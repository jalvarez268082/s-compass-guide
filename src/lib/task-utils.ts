/**
 * Utility functions for task content processing
 */

/**
 * Processes content to transform task links from [[task:id|label]] format to clickable links
 */
export const processTaskLinks = (content: string): string => {
  const TASK_LINK_REGEX = /\[\[task:([a-zA-Z0-9-]+)\|([^\]]+)\]\]/g;
  
  return content.replace(TASK_LINK_REGEX, (_, id, label) => {
    return `<a href="#" data-task-id="${id}" class="task-link">${label}</a>`;
  });
}; 