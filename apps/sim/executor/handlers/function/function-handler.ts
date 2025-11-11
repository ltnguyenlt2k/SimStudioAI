import { templates } from '@sim/db/schema';
import { DEFAULT_EXECUTION_TIMEOUT_MS } from '@/lib/execution/constants'
import { DEFAULT_CODE_LANGUAGE } from '@/lib/execution/languages'
import { createLogger } from '@/lib/logs/console/logger'
import { BlockType } from '@/executor/consts'
import type { BlockHandler, ExecutionContext } from '@/executor/types'
import type { SerializedBlock } from '@/serializer/types'
import { executeTool } from '@/tools'
// 👇 IMPORT TEMPLATE
import { FUNCTION_CPP_TEMPLATE, renderTemplate } from '../templates/cpp_templates'

const logger = createLogger('FunctionBlockHandler')

/**
 * Helper function to collect runtime block outputs and name mappings
 * for tag resolution in function execution
 */
function collectBlockData(context: ExecutionContext): {
  blockData: Record<string, any>
  blockNameMapping: Record<string, string>
} {
  const blockData: Record<string, any> = {}
  const blockNameMapping: Record<string, string> = {}

  for (const [id, state] of context.blockStates.entries()) {
    if (state.output !== undefined) {
      blockData[id] = state.output
      const workflowBlock = context.workflow?.blocks?.find((b) => b.id === id)
      if (workflowBlock?.metadata?.name) {
        // Map both the display name and normalized form
        blockNameMapping[workflowBlock.metadata.name] = id
        const normalized = workflowBlock.metadata.name.replace(/\s+/g, '').toLowerCase()
        blockNameMapping[normalized] = id
      }
    }
  }

  return { blockData, blockNameMapping }
}

/**
 * Handler for Function blocks that execute custom code.
 */
export class FunctionBlockHandler implements BlockHandler {
  canHandle(block: SerializedBlock): boolean {
    return block.metadata?.id === BlockType.FUNCTION
  }

  async execute(
    block: SerializedBlock,
    inputs: Record<string, any>,
    context: ExecutionContext
  ): Promise<any> {
    // Ví dụ: gán cứng một input tên apiLabel
    inputs.apiLabel = {
      type: 'string',
      value: 'Get value API',
    }
    const codeContent = Array.isArray(inputs.code)
      ? inputs.code.map((c: { content: string }) => c.content).join('\n')
      : inputs.code

    // Extract block data for variable resolution
    const { blockData, blockNameMapping } = collectBlockData(context)

    // Directly use the function_execute tool which calls the API route
    const result = await executeTool(
      'function_execute',
      {
        code: codeContent,
        language: inputs.language || DEFAULT_CODE_LANGUAGE,
        useLocalVM: !inputs.remoteExecution,
        timeout: inputs.timeout || DEFAULT_EXECUTION_TIMEOUT_MS,
        envVars: context.environmentVariables || {},
        workflowVariables: context.workflowVariables || {},
        blockData: blockData, // Pass block data for variable resolution
        blockNameMapping: blockNameMapping, // Pass block name to ID mapping
        _context: {
          workflowId: context.workflowId,
          workspaceId: context.workspaceId,
        },
      },
      false, // skipProxy
      false, // skipPostProcess
      context // execution context for file processing
    )

    if (!result.success) {
      throw new Error(result.error || 'Function execution failed')
    }


    // ================== C++ EXPORT LOGIC ==================
    try {
      const functionName = block.metadata?.name || 'UnnamedFunction'

      // 1) Tìm tất cả block "kế tiếp" trong workflow (nối từ block hiện tại)
      const connectionsFromThis =
        context.workflow?.connections.filter((c) => c.source === block.id) ?? []

      // 2) Build childrenBlock:
      //    - nếu có block con: mỗi con 1 dòng <nextcode:childId>
      //    - nếu không có: childrenBlock = '' (KHÔNG sinh <nextcode:...>)
      let childrenBlock = ''

      if (connectionsFromThis.length > 0) {
        const placeholders = connectionsFromThis
          .map((conn) => `<nextcode:${conn.target}>`)
          // indent 4 spaces để match với phần thân hàm
          .join('\n    ')

        // Thêm newline + indent cho đẹp
        childrenBlock = '\n    ' + placeholders
      }

      // 3) Render template sẵn
      const cppSnippet = renderTemplate(FUNCTION_CPP_TEMPLATE, {
        functionName,
        childrenBlock,
      })

      if (context.customExportStore) {
        const prevCode = context.customExportStore.get<string>('cppCode') || ''
        const myPlaceholder = `<nextcode:${block.id}>`
        let newCode: string

        if (prevCode.includes(myPlaceholder)) {
          // Có placeholder cho block hiện tại → chèn vào đúng vị trí
          newCode = prevCode.replace(myPlaceholder, cppSnippet)
        } else {
          // Không có placeholder → append cuối file
          newCode = prevCode ? `${prevCode}\n\n${cppSnippet}` : cppSnippet
        }

        context.customExportStore.set('cppCode', newCode)
      } else {
        logger.warn('customExportStore is not available on context for function block')
      }
    } catch (e) {
      logger.error('Failed to build/append C++ snippet for function block', e)
    }
    // ======================================================



    // return result.output
    // cũng có thể post-process output
    return {
      // ...result.output,
      result: 'Get value API', // ép lại kết quả
    }

  }
}
