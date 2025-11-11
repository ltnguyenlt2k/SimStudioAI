// /workspace/apps/sim/templates/cpp-templates.ts

// Template function block C++
export const FUNCTION_CPP_TEMPLATE = `
void SampleApp::on{{functionName}}Changed(const velocitas::DataPointReply& reply) {
    // TODO: handle {{functionName}} event here
{{childrenBlock}}
}
`.trimStart()

// Template 1 nhánh IF
export const CONDITION_IF_BRANCH_TEMPLATE = `
if({{expression}}) {
    // TODO: handle {{title}} event here
{{childrenBlock}}
}
`.trimStart()

// Template 1 nhánh ELSE IF
export const CONDITION_ELSE_IF_BRANCH_TEMPLATE = `
else if({{expression}}) {
    // TODO: handle {{title}} event here
{{childrenBlock}}
}
`.trimStart()

// Template nhánh ELSE
export const CONDITION_ELSE_BRANCH_TEMPLATE = `
else {
    // TODO: handle {{title}} event here
{{childrenBlock}}
}
`.trimStart()

// Helper render template: replace {{key}} bằng value
export function renderTemplate(
    template: string,
    vars: Record<string, string>
): string {
    let result = template
    for (const [key, value] of Object.entries(vars)) {
        const re = new RegExp(`{{${key}}}`, 'g')
        result = result.replace(re, value)
    }
    return result
}
