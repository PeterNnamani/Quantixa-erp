import { jsPDF } from 'jspdf'
import * as XLSX from 'xlsx'

export function downloadExcel(filename: string, data: unknown): void {
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.json_to_sheet(Array.isArray(data) ? data : [data])
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1')
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
}

export function downloadPdf(filename: string, title: string, data: Array<Record<string, unknown>>, companyName = 'QUANTIXA'): void {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' })
    const pageWidth = doc.internal.pageSize.getWidth()
    const margin = 40
    const contentWidth = pageWidth - margin * 2
    const sectionSpacing = 20
    let y = margin

    const drawWatermark = () => {
        const watermarkText = 'QUANTIXA'
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(72)
        doc.setTextColor(220, 220, 220)
        doc.text(watermarkText, pageWidth / 2, 420, {
            align: 'center',
            angle: 45,
        })
        doc.setTextColor(0, 0, 0)
    }

    const addPageHeader = () => {
        drawWatermark()
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(18)
        doc.text(companyName, pageWidth / 2, y, { align: 'center' })
        y += 24

        doc.setFont('helvetica', 'normal')
        doc.setFontSize(12)
        doc.text(title, pageWidth / 2, y, { align: 'center' })
        y += 16

        const now = new Date().toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' })
        doc.setFontSize(10)
        doc.text(`Generated on ${now}`, pageWidth / 2, y, { align: 'center' })
        y += sectionSpacing

        doc.setDrawColor(180, 180, 180)
        doc.setLineWidth(0.5)
        doc.line(margin, y - 10, pageWidth - margin, y - 10)
        y += 10
    }

    const renderTable = (items: Array<Record<string, unknown>>) => {
        if (items.length === 0) return

        const headers = Object.keys(items[0])
        const colWidth = contentWidth / headers.length
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(10)

        headers.forEach((header, index) => {
            const x = margin + index * colWidth
            doc.text(String(header).replace(/([A-Z])/g, ' $1').trim(), x + 4, y)
        })
        y += 18

        doc.setFont('helvetica', 'normal')
        items.forEach((row) => {
            if (y > doc.internal.pageSize.getHeight() - margin - 40) {
                doc.addPage()
                y = margin
                addPageHeader()
            }

            headers.forEach((header, index) => {
                const x = margin + index * colWidth
                const value = row[header]
                const text = value === null || value === undefined ? '' : String(value)
                doc.text(text, x + 4, y, { maxWidth: colWidth - 8 })
            })
            y += 16
        })
    }

    addPageHeader()
    renderTable(data)

    doc.save(filename)
}

export type FinancialReportSection = {
    title: string
    columns: string[]
    rows: Array<Array<string | number>>
    total?: Array<string | number>
}

export type FinancialReportOptions = {
    filename: string
    reportTitle: string
    periodLabel: string
    sections: FinancialReportSection[]
    highlights: Array<{ label: string; value: string }>
    notes?: string[]
    companyName?: string
}

const reportMoney = (value: string | number): string => {
    if (typeof value === 'string') return value
    return `₦${value.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export async function downloadFinancialReportPdf(options: FinancialReportOptions): Promise<void> {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' })
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 44
    const companyName = options.companyName || 'QUANTIXA'
    let pageNumber = 0

    const addLogo = async (x: number, y: number, size: number) => {
        try {
            const response = await fetch('/quantixa.png')
            const blob = await response.blob()
            const dataUrl = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader()
                reader.onload = () => resolve(String(reader.result))
                reader.onerror = reject
                reader.readAsDataURL(blob)
            })
            doc.addImage(dataUrl, 'PNG', x, y, size, size)
        } catch {
            doc.setDrawColor(25, 110, 92)
            doc.setLineWidth(5)
            doc.circle(x + size / 2, y + size / 2, size / 2 - 5)
        }
    }

    const footer = () => {
        doc.setDrawColor(215, 221, 218)
        doc.setLineWidth(0.5)
        doc.line(margin, pageHeight - 38, pageWidth - margin, pageHeight - 38)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)
        doc.setTextColor(105, 115, 110)
        doc.text(`${companyName} | Confidential management accounts`, margin, pageHeight - 22)
        doc.text(`Page ${pageNumber}`, pageWidth - margin, pageHeight - 22, { align: 'right' })
        doc.setTextColor(30, 35, 32)
    }

    const newPage = (heading?: string) => {
        doc.addPage()
        pageNumber += 1
        doc.setFillColor(25, 110, 92)
        doc.rect(0, 0, pageWidth, 7, 'F')
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(10)
        doc.setTextColor(25, 110, 92)
        doc.text(companyName.toUpperCase(), margin, 30)
        doc.setTextColor(30, 35, 32)
        if (heading) {
            doc.setFontSize(17)
            doc.text(heading, margin, 68)
        }
        footer()
        return heading ? 94 : 48
    }

    const drawTable = (section: FinancialReportSection, startY: number) => {
        const usableWidth = pageWidth - margin * 2
        const labelWidth = usableWidth * 0.52
        const valueWidth = (usableWidth - labelWidth) / Math.max(1, section.columns.length - 1)
        let y = startY
        doc.setFillColor(235, 242, 239)
        doc.rect(margin, y - 14, usableWidth, 25, 'F')
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(9)
        section.columns.forEach((column, index) => {
            const x = index === 0 ? margin + 8 : margin + labelWidth + (index - 1) * valueWidth + valueWidth - 8
            doc.text(column, x, y + 2, { align: index === 0 ? 'left' : 'right' })
        })
        y += 30
        doc.setFont('helvetica', 'normal')
        section.rows.forEach((row) => {
            if (y > pageHeight - 70) {
                y = newPage(section.title)
                doc.setFont('helvetica', 'normal')
                doc.setFontSize(9)
            }
            row.forEach((value, index) => {
                const x = index === 0 ? margin + 8 : margin + labelWidth + (index - 1) * valueWidth + valueWidth - 8
                const text = typeof value === 'number'
                    ? section.columns[index] === 'Count' ? value.toLocaleString('en-NG') : reportMoney(value)
                    : value
                doc.text(text, x, y, { align: index === 0 ? 'left' : 'right', maxWidth: index === 0 ? labelWidth - 16 : valueWidth - 12 })
            })
            doc.setDrawColor(230, 234, 231)
            doc.line(margin, y + 7, pageWidth - margin, y + 7)
            y += 21
        })
        if (section.total) {
            doc.setFillColor(25, 110, 92)
            doc.rect(margin, y - 7, usableWidth, 25, 'F')
            doc.setTextColor(255, 255, 255)
            doc.setFont('helvetica', 'bold')
            section.total.forEach((value, index) => {
                const x = index === 0 ? margin + 8 : margin + labelWidth + (index - 1) * valueWidth + valueWidth - 8
                const text = typeof value === 'number'
                    ? section.columns[index] === 'Count' ? value.toLocaleString('en-NG') : reportMoney(value)
                    : value
                doc.text(text, x, y + 9, { align: index === 0 ? 'left' : 'right' })
            })
            doc.setTextColor(30, 35, 32)
            y += 35
        }
        return y
    }

    doc.setFillColor(247, 250, 248)
    doc.rect(0, 0, pageWidth, pageHeight, 'F')
    doc.setFillColor(25, 110, 92)
    doc.rect(0, 0, pageWidth, 14, 'F')
    await addLogo(pageWidth / 2 - 52, 180, 104)
    doc.setTextColor(25, 110, 92)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(30)
    doc.text(companyName, pageWidth / 2, 330, { align: 'center' })
    doc.setTextColor(30, 35, 32)
    doc.setFontSize(22)
    doc.text(options.reportTitle, pageWidth / 2, 380, { align: 'center' })
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(12)
    doc.setTextColor(105, 115, 110)
    doc.text('Management Accounts', pageWidth / 2, 408, { align: 'center' })
    doc.text(options.periodLabel, pageWidth / 2, 445, { align: 'center' })
    doc.setFontSize(9)
    doc.text(`Prepared on ${new Date().toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })}`, pageWidth / 2, 490, { align: 'center' })
    pageNumber = 1
    footer()

    let y = newPage('Contents')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)
    options.sections.forEach((section, index) => {
        doc.text(`${String(index + 1).padStart(2, '0')}   ${section.title}`, margin + 8, y)
        y += 28
    })
    y = newPage('Executive Summary')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text('Key results for the reporting period', margin, y)
    y += 28
    options.highlights.forEach((highlight) => {
        doc.setFillColor(247, 250, 248)
        doc.setDrawColor(215, 221, 218)
        doc.roundedRect(margin, y - 16, pageWidth - margin * 2, 32, 3, 3, 'FD')
        doc.setFont('helvetica', 'normal')
        doc.text(highlight.label, margin + 12, y + 4)
        doc.setFont('helvetica', 'bold')
        doc.text(highlight.value, pageWidth - margin - 12, y + 4, { align: 'right' })
        y += 43
    })
    for (const section of options.sections) {
        y = newPage(section.title)
        y = drawTable(section, y)
    }
    if (options.notes && options.notes.length > 0) {
        y = newPage('Notes and Basis')
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(10)
        options.notes.forEach((note) => {
            const lines = doc.splitTextToSize(`- ${note}`, pageWidth - margin * 2 - 12)
            doc.text(lines, margin + 6, y)
            y += lines.length * 15 + 10
        })
    }
    doc.save(options.filename)
}
