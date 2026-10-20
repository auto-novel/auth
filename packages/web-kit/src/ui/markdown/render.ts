import { container } from '@mdit/plugin-container';
import { spoiler } from '@mdit/plugin-spoiler';
import DOMPurify, { type Config } from 'dompurify';
import MarkdownIt, {
  type MarkdownIt as MarkdownItInstance,
  type RendererRule,
  type Token,
} from 'markdown-it';

/** 可渲染 Markdown 的解析器；MarkdownIt 实例及自定义包装均适用。 */
export interface MarkdownParser {
  render(source: string): string;
}

const STAR_COUNT = 5;
const sanitizeConfig = {
  USE_PROFILES: { html: true },
  ADD_ATTR: ['target'],
  FORBID_TAGS: ['style'],
  FORBID_ATTR: ['style'],
} satisfies Config;

function containerParams(token: Token, name: string) {
  return token.info.trim().slice(name.length).trim();
}

function renderStarRating(info: string) {
  const value = /^\d+(?:\.\d+)?$/.test(info)
    ? Math.min(STAR_COUNT, Number(info))
    : 0;
  const rating = Math.round(value * 2) / 2;
  const stars = Array.from({ length: STAR_COUNT }, (_, index) => {
    const active = index + 1 <= rating;
    const halfActive = !active && index + 0.5 <= rating;
    return `<span class="markdown-star${active ? ' markdown-star--active' : ''}"><span class="markdown-star__half${halfActive ? ' markdown-star__half--active' : ''}"></span></span>`;
  }).join('');
  return `<div class="markdown-star-rating" role="img" aria-label="评分 ${rating} / ${STAR_COUNT}">${stars}</div>\n`;
}

/** 创建配置好的 MarkdownIt 实例；可继续 use 子网站插件。原始 HTML 始终禁用。 */
export function createMarkdown(): MarkdownItInstance {
  const markdown = new MarkdownIt({ html: false, linkify: true, breaks: true });
  markdown.use(spoiler, {
    tag: 'span',
    attrs: [
      ['data-markdown-spoiler', ''],
      ['data-hide', 'true'],
      ['role', 'button'],
      ['tabindex', '0'],
      ['aria-expanded', 'false'],
    ],
  });
  markdown.use(container, {
    name: 'details',
    openRenderer: (tokens: Token[], index: number): string => {
      const summary = markdown.utils.escapeHtml(
        containerParams(tokens[index], 'details') || '点击展开',
      );
      return `<details><summary>${summary}</summary>\n`;
    },
    closeRenderer: () => '</details>\n',
  });
  markdown.use(container, {
    name: 'star',
    openRenderer: (tokens: Token[], index: number): string =>
      renderStarRating(containerParams(tokens[index], 'star')),
    closeRenderer: () => '',
  });

  const defaultLinkOpen: RendererRule =
    markdown.renderer.rules.link_open ??
    ((tokens, index, renderOptions, _env, renderer) =>
      renderer.renderToken(tokens, index, renderOptions));
  markdown.renderer.rules.link_open = (
    tokens,
    index,
    renderOptions,
    env,
    renderer,
  ) => {
    const href = tokens[index].attrGet('href');
    if (typeof href === 'string' && !href.startsWith('#')) {
      tokens[index].attrSet('target', '_blank');
      tokens[index].attrSet('rel', 'noopener noreferrer');
    }
    return defaultLinkOpen(tokens, index, renderOptions, env, renderer);
  };
  return markdown;
}

let defaultMarkdown: MarkdownItInstance | undefined;

/** 渲染并净化为 HTML，需浏览器 DOM 环境；不传解析器时复用共享默认实例。 */
export function renderMarkdown(
  source: string,
  markdown?: MarkdownParser,
): string {
  const parser = markdown ?? (defaultMarkdown ??= createMarkdown());
  return DOMPurify.sanitize(parser.render(source), sanitizeConfig);
}
