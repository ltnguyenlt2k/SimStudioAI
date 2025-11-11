// /executor/templates/cpp_templates.ts

// Template cho function – KHÔNG để indent đầu dòng
export const FUNCTION_CPP_TEMPLATE = `
void SampleApp::on{{name}}Changed(const velocitas::DataPointReply& reply) {
    // TODO: handle {{name}} event here
    {{next}}
}
`.trim();

// Template condition – cũng không indent đầu dòng
export const CONDITION_CPP_TEMPLATE = `
if ({{ifExpr}}) {
    // TODO: handle if event here
    {{next_if}}
}{{elseIfBlocks}}{{elseBlock}}
`.trim();

export const CONDITION_ELSEIF_TEMPLATE = `
else if ({{expr}}) {
    // TODO: handle else-if event here
    {{next}}
}
`.trim();

export const CONDITION_ELSE_TEMPLATE = `
else {
    // TODO: handle else event here
    {{next}}
}
`.trim();

/**
 * Thêm indent theo dòng chứa placeholder và thay thế luôn cả dòng đó.
 *
 * prevCode   : toàn bộ code hiện có
 * placeholder: chuỗi <nextcode:...>
 * rawSnippet : đoạn code chưa được căn trái / phải
 */
export function replacePlaceholderWithIndentedSnippet(
    prevCode: string,
    placeholder: string,
    rawSnippet: string
): string {
    const idx = prevCode.indexOf(placeholder);
    if (idx === -1) {
        // Không tìm thấy placeholder → append ở cuối
        return prevCode ? `${prevCode}\n\n${rawSnippet.trim()}` : rawSnippet.trim();
    }

    // Tìm đầu và cuối dòng chứa placeholder
    const lineStart = prevCode.lastIndexOf('\n', idx - 1) + 1; // nếu -1 thì +1 => 0
    const lineEnd = prevCode.indexOf('\n', idx);
    const endIndex = lineEnd === -1 ? prevCode.length : lineEnd;

    const linePrefix = prevCode.slice(lineStart, idx);
    const baseIndentMatch = linePrefix.match(/^[ \t]*/);
    const baseIndent = baseIndentMatch ? baseIndentMatch[0] : '';

    // Chuẩn hoá snippet (cắt trắng đầu/cuối, rồi áp indent cho từng dòng)
    const indentedSnippet = rawSnippet
        .trim()
        .split('\n')
        .map((line) => (line.length ? baseIndent + line : '')) // giữ indent tương đối bên trong
        .join('\n');

    // Ghép lại: trước dòng, snippet, sau dòng
    return (
        prevCode.slice(0, lineStart) +
        indentedSnippet +
        prevCode.slice(endIndex)
    );
}
