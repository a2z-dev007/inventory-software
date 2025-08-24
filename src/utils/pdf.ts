import jsPDF from "jspdf";
import { getBase64 } from "./constants";
import logo from '../assets/images/logo.png';
import { format } from "date-fns";
import headerImage from '../assets/images/pdf_header.jpg';
import autoTable from 'jspdf-autotable';

export const generatePDF = async (po) => {
  const doc = new jsPDF({ format: 'a4', unit: 'mm', compression: 'MEDIUM' });

  // Page dimensions and margins
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2);

  // Colors
  const primaryColor = [38, 0, 84];
  const secondaryColor = [102, 102, 102];
  const lightGray = [245, 245, 245];
  const darkText = [40, 40, 40];

  // Convert header to base64 and add
  const base64Header = await getBase64(headerImage);
  doc.addImage(
    base64Header,
    'JPEG',
    margin,
    10,
    contentWidth,
    30,
    undefined,
    'FAST'
  );

  let currentY = 50;

  // Main title
  doc.setFillColor(...primaryColor);
  doc.rect(margin, currentY, contentWidth, 12, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  // doc.text('PURCHASE ORDER (PO)', pageWidth / 2, currentY + 8, { align: 'center' });

  // currentY += 20;

  // Items Section - Move to top after header
  doc.setTextColor(...primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  // doc.text('ORDER ITEMS', margin, currentY);
  // currentY += 8;

  // Enhanced table styling - back to original clean style
  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [['Item Name', 'Unit Type', 'Quantity', 'Rate (INR)', 'Total Amount (INR)']],
    body: po.items.map((item, index) => [
      item.productName,
      item.unitType || '-',
      item.quantity.toString(),
      item.unitPrice.toLocaleString('en-IN'),
      item.total.toLocaleString('en-IN'),
    ]),
    styles: {
      fontSize: 10,
      halign: 'center',
      valign: 'middle',
      cellPadding: 3,
      font: 'helvetica'
    },
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      font: 'helvetica',
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245]
    },
    bodyStyles: {
      textColor: [40, 40, 40],
      font: 'helvetica'
    },
  });

  // Calculate totals and add subtotal right below table
  const subtotal = po.items.reduce((sum, item) => sum + item.total, 0);
  const tableEndY = doc.lastAutoTable.finalY;

  // Add subtotal section right below the table - positioned on the left
  const subtotalY = tableEndY + 5;
  const subtotalBoxWidth = 60;
  const subtotalBoxX = margin; // Position at left margin

  doc.setFillColor(...lightGray);
  doc.rect(subtotalBoxX, subtotalY, subtotalBoxWidth, 8, 'F');

  doc.setTextColor(...primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Subtotal:', subtotalBoxX + 5, subtotalY + 5.5);
  doc.text(`Rs ${subtotal.toLocaleString('en-IN')}`, subtotalBoxX + subtotalBoxWidth - 5, subtotalY + 5.5, { align: 'right' });

  currentY = subtotalY + 20;

  // Helper functions for consistent styling
  const addSectionTitle = (title, y) => {
    doc.setFillColor(...lightGray);
    doc.rect(margin, y, contentWidth, 8, 'F');
    doc.setTextColor(...primaryColor);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(title, margin + 3, y + 5.5);
    return y + 15;
  };

  const addFieldRow = (label, value, y, rightLabel = '', rightValue = '') => {
    // Left side
    doc.setTextColor(...darkText);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(label, margin, y);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...secondaryColor);
    const leftValue = value || '-';
    doc.text(leftValue, margin + 45, y, { maxWidth: 65 });

    // Right side (if provided)
    if (rightLabel) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...darkText);
      doc.text(rightLabel, margin + 115, y);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...secondaryColor);
      const rightVal = rightValue || '-';
      doc.text(rightVal, margin + 155, y, { maxWidth: 40 });
    }

    return y + 7;
  };

  // Order Information Section
  currentY = addSectionTitle('ORDER INFORMATION', currentY);

  currentY = addFieldRow(
    'PO Number:',
    po.poNumber,
    currentY,
    'Date:',
    format(new Date(po.orderDate), 'dd-MM-yyyy')
  );

  currentY = addFieldRow(
    'Status:',
    po.status.toUpperCase(),
    currentY,
    'DB No:',
    po.ref_num
  );

  currentY += 5;

  // Customer Information Section
  currentY = addSectionTitle('CUSTOMER INFORMATION', currentY);

  currentY = addFieldRow('Customer:', po.customerName, currentY);

  // Handle multi-line address
  if (po.customerAddress) {
    doc.setTextColor(...darkText);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Address:', margin, currentY);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...secondaryColor);
    const addressLines = doc.splitTextToSize(po.customerAddress, contentWidth - 50);
    doc.text(addressLines, margin + 45, currentY);
    currentY += addressLines.length * 5 + 2;
  } else {
    currentY = addFieldRow('Address:', po.customerAddress, currentY);
  }

  currentY += 5;

  // Project Information Section
  currentY = addSectionTitle('PROJECT INFORMATION', currentY);

  currentY = addFieldRow('Supplier Name:', po.vendor, currentY);
  currentY = addFieldRow(
    'Site Incharge:',
    po.site_incharge,
    currentY,
    'Contractor:',
    po.contractor
  );

  if (po.purpose) {
    currentY = addFieldRow('Purpose:', po.purpose, currentY);
  }

  currentY += 10;

  // Order Details Section
  let orderDetailsY = currentY;
  orderDetailsY = addSectionTitle('ORDER DETAILS', orderDetailsY);

  orderDetailsY = addFieldRow(
    'Ordered By:',
    po.orderedBy,
    orderDetailsY,
    'Delivery Date:',
    format(new Date(po.deliveryDate), 'dd-MM-yyyy')
  );

  // Remarks section (if exists)
  if (po.remarks) {
    orderDetailsY += 5;
    doc.setTextColor(...darkText);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Remarks:', margin, orderDetailsY);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...secondaryColor);
    doc.setFontSize(9);
    const remarksLines = doc.splitTextToSize(po.remarks, contentWidth - 30);
    doc.text(remarksLines, margin, orderDetailsY + 5);
    orderDetailsY += remarksLines.length * 4 + 10;
  }

  // Footer
  const footerY = pageHeight - 25;
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.5);
  doc.line(margin, footerY, pageWidth - margin, footerY);

  doc.setTextColor(...secondaryColor);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Generated on: ' + format(new Date(), 'dd-MM-yyyy HH:mm'), margin, footerY + 5);
  doc.text('Space Wings Pvt. Ltd.', pageWidth - margin, footerY + 5, { align: 'right' });

  // Save the PDF
  doc.save(`${po.poNumber}_Purchase_Order.pdf`);
};