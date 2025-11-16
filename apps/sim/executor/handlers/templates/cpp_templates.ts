// /executor/templates/cpp_templates.ts

// --- Các placeholder chuẩn trong file C++ gốc ---
export const PLACEHOLDERS = {
    INCLUDE: '{{include}}',
    DECLARE: '{{declare}}',
    FUNCTION: '{{function}}',
    ROOT: '<nextcode:ROOT>', // nếu bạn còn dùng kiểu lồng <nextcode:...>
};

// --- File C++ gốc (bạn có thể tách riêng ra file .txt cũng được) ---
export const BASE_APP_CPP_TEMPLATE = `/**
 * Copyright ...
 */

#include "SampleApp.h"
#include "sdk/IPubSubClient.h"
#include "sdk/Logger.h"
#include "sdk/QueryBuilder.h"
#include "sdk/vdb/IVehicleDataBrokerClient.h"

${PLACEHOLDERS.INCLUDE}

namespace {{NAMESPACE}} {

${PLACEHOLDERS.DECLARE}

SampleApp::SampleApp()
    : VehicleApp(velocitas::IVehicleDataBrokerClient::createInstance("vehicledatabroker"),
                 velocitas::IPubSubClient::createInstance("SampleApp")) {}

void SampleApp::onStart() {
    subscribeDataPoints(velocitas::QueryBuilder::select(Vehicle.Speed).build())
        ->onItem([this](auto&& item) { onSpeedChanged(std::forward<decltype(item)>(item)); })
        ->onError([this](auto&& status) { onError(std::forward<decltype(status)>(status)); });

    subscribeToTopic(GET_SPEED_REQUEST_TOPIC)
        ->onItem(
            [this](auto&& data) { onGetSpeedRequestReceived(std::forward<decltype(data)>(data)); })
        ->onError([this](auto&& status) { onError(std::forward<decltype(status)>(status)); });
}

${PLACEHOLDERS.FUNCTION}

} // namespace {{NAMESPACE}}
`

// Template cho format file
export const ROOT_CPP_TEMPLATE = `
namespace example {
    <nextcode:ROOT>
}
`

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

// --- Helper: chèn snippet vào chỗ placeholder, giữ indent & giữ lại placeholder cho lần sau ---
export function insertSnippetAtPlaceholderKeepToken(
    source: string,
    token: string,
    snippet: string
): string {
    const idx = source.indexOf(token);
    if (idx === -1) return source; // không có token thì trả nguyên
    // Tìm indent của dòng chứa token
    const lineStart = source.lastIndexOf('\n', idx) + 1;
    const lineEnd = source.indexOf('\n', idx);
    const tokenLine = source.slice(lineStart, lineEnd === -1 ? source.length : lineEnd);
    const indentMatch = tokenLine.match(/^(\s*)/);
    const indent = indentMatch ? indentMatch[1] : '';

    // Indent snippet theo indent của dòng placeholder
    const indentedSnippet = snippet
        .split('\n')
        .map((l) => (l.length ? indent + l : l))
        .join('\n');

    // Chèn: [trước token] + snippet + \n + indent + token + [sau token]
    // (giữ lại token để các function sau tiếp tục “nhét” đúng chỗ)
    const before = source.slice(0, lineStart);
    const after = source.slice(lineStart);
    // thay MỘT lần duy nhất
    const replacedOnce = after.replace(token, `${indentedSnippet}\n${indent}${token}`);
    return before + replacedOnce;
}

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
