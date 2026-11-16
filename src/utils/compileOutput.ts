import { OutputFormat, PipelineBlock } from '../types/pipeline';

export interface CompileOptions {
  includeEmpty: boolean;
}

export function compilePipelineOutput(
  title: string,
  blocks: PipelineBlock[],
  format: OutputFormat,
  options: CompileOptions = { includeEmpty: true }
): string {
  const safeTitle = title.trim() || 'Untitled Pipeline';

  if (format === 'json') {
    const payload = {
      pipeline: safeTitle,
      steps: blocks.map((block, index) => {
        const filteredFields = options.includeEmpty
          ? block.fields
          : block.fields.filter((f) => f.content.trim() || f.imageName);

        return {
          step: index + 1,
          title: block.title.trim() || block.type,
          type: block.type,
          fields: filteredFields.map((f) => {
            const base: Record<string, string> = {
              kind: f.kind,
              name: f.name.trim() || 'Field',
            };
            if (f.kind === 'image') {
              base.role = f.photoRole || 'Subject Ref';
              base.file = f.imageName || 'none';
            }
            base.content = f.content.trim();
            return base;
          }),
        };
      }),
    };
    return JSON.stringify(payload, null, 2);
  }

  if (format === 'yaml') {
    const lines: string[] = [];
    lines.push(`pipeline: ${yamlScalar(safeTitle)}`);
    lines.push('steps:');
    if (blocks.length === 0) {
      lines.push('  []');
      return lines.join('\n');
    }
    blocks.forEach((block, index) => {
      const filteredFields = options.includeEmpty
        ? block.fields
        : block.fields.filter((f) => f.content.trim() || f.imageName);

      lines.push(`  - step: ${index + 1}`);
      lines.push(`    title: ${yamlScalar(block.title.trim() || block.type)}`);
      lines.push(`    type: ${yamlScalar(block.type)}`);
      if (filteredFields.length === 0) {
        lines.push('    fields: []');
      } else {
        lines.push('    fields:');
        filteredFields.forEach((f) => {
          lines.push(`      - kind: ${f.kind}`);
          lines.push(`        name: ${yamlScalar(f.name.trim() || 'Field')}`);
          if (f.kind === 'image') {
            lines.push(`        role: ${yamlScalar(f.photoRole || 'Subject Ref')}`);
            lines.push(`        file: ${yamlScalar(f.imageName || 'none')}`);
          }
          const content = f.content.trim();
          if (content.includes('\n')) {
            lines.push('        content: |');
            content.split('\n').forEach((line) => {
              lines.push(`          ${line}`);
            });
          } else {
            lines.push(`        content: ${yamlScalar(content)}`);
          }
        });
      }
    });
    return lines.join('\n');
  }

  // Default: Markdown
  const lines: string[] = [];
  lines.push(`# ${safeTitle}`);
  lines.push('');

  blocks.forEach((block, idx) => {
    const filteredFields = options.includeEmpty
      ? block.fields
      : block.fields.filter((f) => f.content.trim() || f.imageName);

    lines.push(`## ${idx + 1}. ${block.title.trim() || block.type}`);
    if (filteredFields.length === 0) {
      lines.push('*(No populated fields)*');
    } else {
      filteredFields.forEach((f) => {
        const label = f.name.trim() || 'Field';
        const content = f.content.trim();
        if (f.kind === 'positive') {
          lines.push(`- **POSITIVE · ${label}:** ${content || '—'}`);
        } else if (f.kind === 'negative') {
          lines.push(`- **NEGATIVE · ${label}:** ${content || '—'}`);
        } else if (f.kind === 'image') {
          const roleTag = f.photoRole || 'Subject Ref';
          const imgTag = f.imageName ? `\`${f.imageName}\`` : '`No image attached`';
          lines.push(`- **${roleTag} · ${label}** (${imgTag}): ${content || '—'}`);
        } else if (content.includes('\n')) {
          lines.push(`- **${label}:**`);
          content.split('\n').forEach((line) => {
            lines.push(`  ${line}`);
          });
        } else {
          lines.push(`- **${label}:** ${content || '—'}`);
        }
      });
    }
    lines.push('');
  });

  return lines.join('\n').trim();
}

function yamlScalar(value: string): string {
  if (value === '') return '""';
  if (/[:#\-?\[\]{}&*!|>'"%@`\n]/.test(value) || /^\s|\s$/.test(value)) {
    return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
  }
  return value;
}
