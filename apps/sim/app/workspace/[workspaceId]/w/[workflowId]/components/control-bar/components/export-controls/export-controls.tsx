'use client'

import { useState } from 'react'
import { ArrowDownToLine } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { createLogger } from '@/lib/logs/console/logger'
import { useWorkflowJsonStore } from '@/stores/workflows/json/store'
import { useWorkflowRegistry } from '@/stores/workflows/registry/store'
import { useCustomExportStore } from '@/stores/custom/export/store'

const logger = createLogger('ExportControls')

interface ExportControlsProps {
  disabled?: boolean
}

export function ExportControls({ disabled = false }: ExportControlsProps) {
  const [isExporting, setIsExporting] = useState(false)
  const { workflows, activeWorkflowId } = useWorkflowRegistry()
  const { getJson } = useWorkflowJsonStore()

  // Data custom export được lưu trong store
  const customExportData = useCustomExportStore((s) => s.data)

  const currentWorkflow = activeWorkflowId ? workflows[activeWorkflowId] : null

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    try {
      const blob = new Blob([content], { type: mimeType })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      logger.error('Failed to download file:', error)
    }
  }

  const handleExportJson = async () => {
    if (!currentWorkflow || !activeWorkflowId) {
      logger.warn('No active workflow to export')
      return
    }

    setIsExporting(true)
    try {
      // 1) JSON workflow gốc
      const jsonContent = await getJson()

      if (!jsonContent) {
        throw new Error('Failed to generate JSON')
      }

      const baseName = currentWorkflow.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()

      // // File 1: workflow.json
      // const filename = `${baseName}.json`
      // downloadFile(jsonContent, filename, 'application/json')
      // logger.info('Workflow exported as JSON')

      // // 2) File 2: custom export data từ store
      // if (customExportData && Object.keys(customExportData).length > 0) {
      //   const customContent = JSON.stringify(customExportData, null, 2)
      //   const customFilename = `${baseName}-custom.json`

      //   downloadFile(customContent, customFilename, 'application/json')
      //   logger.info('Custom export data exported as JSON')
      // } else {
      //   logger.info('No custom export data to export')
      // }

      // File 3: C++ code
      const cppCode = customExportData.cppCode
      if (cppCode && cppCode.trim().length > 0) {
        const cppFilename = `${baseName}-generatedCPP.cpp`
        downloadFile(cppCode, cppFilename, 'text/plain')
        logger.info('Generated C++ code exported as .cpp')
      }

    } catch (error) {
      logger.error('Failed to export workflow as JSON:', error)
    } finally {
      setIsExporting(false)
    }
  }

  const isDisabled = disabled || isExporting || !currentWorkflow

  const getTooltipText = () => {
    if (disabled) return 'Export not available'
    if (!currentWorkflow) return 'No workflow to export'
    if (isExporting) return 'Exporting...'
    return 'Export workflow as JSON'
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant='outline'
          onClick={handleExportJson}
          disabled={isDisabled}
          className='h-12 w-12 rounded-[11px] border bg-card text-card-foreground shadow-xs hover:bg-secondary'
        >
          <ArrowDownToLine className='h-5 w-5' />
          <span className='sr-only'>Export</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>{getTooltipText()}</TooltipContent>
    </Tooltip>
  )
}
