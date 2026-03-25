/**
 * 轻量级 Markdown → HTML 渲染器
 * 支持基础语法：标题、加粗、斜体、行内代码、链接、无序列表、表格、水平线、换行
 */

/**
 * 将 Markdown 文本转换为 HTML 字符串
 * @param md 原始 Markdown 文本
 * @returns HTML 字符串
 */
export function renderMarkdown(md: string): string {
  if (!md) return '';

  // 先对 HTML 特殊字符做转义，防止 XSS
  let html = md
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // 按行处理
  const lines = html.split('\n');
  const result: string[] = [];
  let inList = false;
  let i = 0;

  while (i < lines.length) {
    const trimmed = lines[i].trim();

    // 水平线 ---
    if (/^-{3,}$/.test(trimmed) || /^\*{3,}$/.test(trimmed)) {
      if (inList) {
        result.push('</ul>');
        inList = false;
      }
      result.push('<hr>');
      i++;
      continue;
    }

    // 标题 h1~h3
    const headingMatch = trimmed.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      if (inList) {
        result.push('</ul>');
        inList = false;
      }
      const level = headingMatch[1].length;
      result.push(`<h${level}>${inlineFormat(headingMatch[2])}</h${level}>`);
      i++;
      continue;
    }

    // 表格检测：当前行和下一行符合表格格式
    if (isTableRow(trimmed) && i + 1 < lines.length && isTableSeparator(lines[i + 1].trim())) {
      if (inList) {
        result.push('</ul>');
        inList = false;
      }
      // 解析表格
      const tableLines: string[] = [];
      while (i < lines.length && isTableRow(lines[i].trim())) {
        tableLines.push(lines[i].trim());
        // 跳过分隔行
        if (
          i + 1 < lines.length &&
          isTableSeparator(lines[i + 1].trim())
        ) {
          i++; // 跳过 | :--- | :--- | 行
        }
        i++;
      }
      result.push(renderTable(tableLines));
      continue;
    }

    // 无序列表项 (- 或 *)
    const listMatch = trimmed.match(/^[-*]\s+(.+)$/);
    if (listMatch) {
      if (!inList) {
        result.push('<ul>');
        inList = true;
      }
      result.push(`<li>${inlineFormat(listMatch[1])}</li>`);
      i++;
      continue;
    }

    // 普通行
    if (inList) {
      result.push('</ul>');
      inList = false;
    }

    if (trimmed === '') {
      result.push('<br>');
    } else {
      result.push(inlineFormat(trimmed));
    }
    i++;
  }

  if (inList) {
    result.push('</ul>');
  }

  return result.join('\n');
}

/**
 * 处理行内 Markdown 格式
 */
function inlineFormat(text: string): string {
  return (
    text
      // 行内代码 `code`
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      // 加粗 **text**
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      // 斜体 *text*
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      // 链接 [text](url)
      .replace(
        /\[([^\]]+)\]\(([^)]+)\)/g,
        '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>',
      )
  );
}

/**
 * 判断是否为表格行（包含 | 分隔）
 */
function isTableRow(line: string): boolean {
  return /^\|(.+)\|$/.test(line.trim());
}

/**
 * 判断是否为表格分隔行（| :--- | :--- | 等）
 */
function isTableSeparator(line: string): boolean {
  return /^\|[\s:]*-{2,}[\s:]*(\|[\s:]*-{2,}[\s:]*)*\|$/.test(line.trim());
}

/**
 * 渲染表格
 */
function renderTable(rows: string[]): string {
  if (rows.length === 0) return '';

  const parseRow = (row: string): string[] =>
    row
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split('|')
      .map(cell => cell.trim());

  const headerCells = parseRow(rows[0]);
  let html = '<table><thead><tr>';
  for (const cell of headerCells) {
    html += `<th>${inlineFormat(cell)}</th>`;
  }
  html += '</tr></thead><tbody>';

  for (let i = 1; i < rows.length; i++) {
    const cells = parseRow(rows[i]);
    html += '<tr>';
    for (const cell of cells) {
      html += `<td>${inlineFormat(cell)}</td>`;
    }
    html += '</tr>';
  }

  html += '</tbody></table>';
  return html;
}
