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
