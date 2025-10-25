import MarkdownIt from "markdown-it";
import mila from "markdown-it-link-attributes";

const md = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
}).use(mila, {
  pattern: /^https?:\/\//,
  attrs: { target: "_blank", rel: "noopener noreferrer" },
});

export function renderMarkdown(markdown) {
  return md.render(markdown || "");
}
