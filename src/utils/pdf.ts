import jsPDF from "jspdf";
import { getBase64 } from "./constants";
import logo from '../assets/images/logo.png'; // static image import
import { format } from "date-fns";
import headerImage from '../assets/images/pdf_header.jpg'; // your new full header PNG

import autoTable from 'jspdf-autotable';
// export const generatePDF = async (po) => {
//   const doc = new jsPDF({ format: 'a4', unit: 'mm' });

//   const base64Logo = await getBase64(logo);

//   // === Styling ===
//   const labelStyle = () => doc.setTextColor(0, 0, 0).setFont('helvetica', 'bold').setFontSize(11);
//   const valueStyle = () => doc.setTextColor(80, 80, 80).setFont('helvetica', 'normal');

//   const marginLeft = 20;
//   const marginRight = 190;
//   let y = 20;

//   // === Header: Logo + Company Info ===
//   doc.addImage(base64Logo, 'PNG', marginLeft, y, 30, 20);

//   doc.setFontSize(14).setFont('helvetica', 'bold');
//   doc.text('SPACE WINGS PVT. LTD', marginLeft + 35, y + 8);
//   doc.text('PURCHASE ORDER (PO)', marginRight, y + 8, { align: 'right' });

//   doc.setFontSize(10).setFont('helvetica', 'normal');
//   doc.text('Contact - +91-7897391111  Email - Team@spacewings.com', 105, y + 18, { align: 'center' });
//   doc.text('1/7, Vishwas Khand, Gomti Nagar, Lucknow, Uttar Pradesh 226010', 105, y + 24, { align: 'center' });
//   // add devider with margin bottom
//   // doc.line(marginLeft, y + 20, marginRight, y + 20);
//   // add space below

//   y = y + 32;

//   // === Info Block ===
//   labelStyle(); doc.text('PO Number:', marginLeft, y);
//   valueStyle(); doc.text(po.poNumber, marginLeft + 35, y);

//   labelStyle(); doc.text('Date:', 140, y);
//   valueStyle(); doc.text(format(new Date(po.orderDate), 'yyyy-MM-dd'), 160, y);

//   y += 8;
//   labelStyle(); doc.text('Client Name:', marginLeft, y);
//   valueStyle(); doc.text(po.clientName || po.vendor || '-', marginLeft + 35, y);

 

//   y += 8;
//   labelStyle(); doc.text('Status:', marginLeft, y);
//   valueStyle(); doc.text(po.status.toUpperCase(), marginLeft + 35, y);

//   labelStyle(); doc.text('DB No:', 140, y);
//   valueStyle(); doc.text(po.ref_num || '-', 160, y);

//   y += 8;
//   labelStyle(); doc.text('Site Incharge:', marginLeft, y);
//   valueStyle(); doc.text(po.site_incharge || '-', marginLeft + 35, y);

//   labelStyle(); doc.text('Contractor :  ', 140, y);
//   valueStyle(); doc.text(po.contractor || '-',164, y);

//   // === Items Table ===
//   autoTable(doc, {
//     startY: y + 12,
//     margin: { left: marginLeft, right: 20 },
//     head: [['Item Name', 'Unit Type', 'Quantity', 'Rate (INR)', 'Total Amount (INR)']],
//     body: po.items.map((item) => [
//       item.productName,
//       item.unitType || '-',
//       item.quantity,
//       item.unitPrice.toLocaleString(),
//       item.total.toLocaleString(),
//     ]),
//     styles: {
//       fontSize: 10,
//       halign: 'center',
//       valign: 'middle',
//       cellPadding: 3,
//     },
//     headStyles: {
//       fillColor: [38, 0, 84],
//       textColor: [255, 255, 255],
//     },
//     alternateRowStyles: { fillColor: [245, 245, 245] },
//     bodyStyles: {
//       textColor: [40, 40, 40],
      
//     },
//   });

//   const finalY = doc.lastAutoTable.finalY || 120;

//   // === Totals Section ===
//   // labelStyle(); doc.text('Subtotal:', marginLeft + 30, finalY + 10);
//   // valueStyle(); doc.text(`₹ ${formatINRCurrency(po.subtotal, { withSymbol: false, fraction: false })}`, marginLeft + 30, finalY + 10, { align: 'right' });

//   // labelStyle(); doc.text('Total:', marginLeft + 30, finalY + 18);
//   // valueStyle(); doc.text(`₹ ${formatINRCurrency(po.total, { withSymbol: false, fraction: false })}`, marginLeft + 30, finalY + 18, { align: 'right' });

//   // === Footer Details ===
//   labelStyle(); doc.text('Ordered By:', marginLeft, finalY + 30);
//   valueStyle(); doc.text(po.orderedBy || '-', marginLeft + 30, finalY + 30);

//   labelStyle(); doc.text('Delivery Date:', marginLeft, finalY + 38);
//   valueStyle(); doc.text(format(new Date(po.deliveryDate), 'yyyy-MM-dd'), marginLeft + 30, finalY + 38);
  
//   labelStyle(); doc.text('Purpose:', marginLeft, finalY + 48);
//   valueStyle(); doc.text(po.purpose || '-', marginLeft + 30, finalY + 48);
//   if (po.remarks) {
//     labelStyle(); doc.text('Remarks:', marginLeft, finalY + 60);
//     valueStyle(); doc.text(po.remarks, marginLeft, finalY + 70, { maxWidth: 170 });
//   }

//   // === Save File ===
//   doc.save(`${po.poNumber}_Purchase_Order.pdf`);
// };





export const generatePDF = async (po) => {
  const doc = new jsPDF({ format: 'a4', unit: 'mm', compression: 'MEDIUM' });

  // Convert header to base64 JPG
  const base64Header = await getBase64(headerImage);
  const marginX = 10;  // left/right margin in mm
  const marginTop = 10; // top margin before header
  const headerHeight = 35;
  const headerBottomMargin = 15;
  // Add header image (JPEG)
  // doc.addImage(base64Header, 'JPEG', 0, 0, 210, 35, undefined, 'FAST'); 
  // Add header image inside margins
doc.addImage(
  base64Header,
  'JPEG',
  marginX,                  // left margin
  marginTop,                // top margin
  210 - marginX * 2,        // width with left/right margin
  headerHeight,
  undefined,
  'FAST'
);

// Start content after header
let y = marginTop + headerHeight + headerBottomMargin;

// Update all text drawing with marginX instead of fixed 20mm
const labelX = marginX;;

  const labelStyle = () => doc.setTextColor(0, 0, 0).setFont('helvetica', 'bold').setFontSize(11);
  const valueStyle = () => doc.setTextColor(80, 80, 80).setFont('helvetica', 'normal');
  const marginLeft = 20;

  labelStyle(); doc.text('PO Number:', marginLeft, y);
  valueStyle(); doc.text(po.poNumber, marginLeft + 35, y);

  labelStyle(); doc.text('Date:', 140, y);
  valueStyle(); doc.text(format(new Date(po.orderDate), 'yyyy-MM-dd'), 160, y);

  y += 8;
  labelStyle(); doc.text('Supplier Name:', marginLeft, y);
  valueStyle(); doc.text(po.vendor || '-', marginLeft + 35, y);

  y += 8;
  labelStyle(); doc.text('Status:', marginLeft, y);
  valueStyle(); doc.text(po.status.toUpperCase(), marginLeft + 35, y);

  labelStyle(); doc.text('DB No:', 140, y);
  valueStyle(); doc.text(po.ref_num || '-', 160, y);

  y += 8;
  labelStyle(); doc.text('Site Incharge:', marginLeft, y);
  valueStyle(); doc.text(po.site_incharge || '-', marginLeft + 35, y);

  labelStyle(); doc.text('Contractor :', 140, y);
  valueStyle(); doc.text(po.contractor || '-', 164, y);

  autoTable(doc, {
    startY: y + 12,
    margin: { left: marginLeft, right: 20 },
    head: [['Item Name', 'Unit Type', 'Quantity', 'Rate (INR)', 'Total Amount (INR)']],
    body: po.items.map((item) => [
      item.productName,
      item.unitType || '-',
      item.quantity,
      item.unitPrice.toLocaleString(),
      item.total.toLocaleString(),
    ]),
    styles: { fontSize: 10, halign: 'center', valign: 'middle', cellPadding: 3 },
    headStyles: { fillColor: [38, 0, 84], textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    bodyStyles: { textColor: [40, 40, 40] },
  });

  const finalY = doc.lastAutoTable.finalY || 120;

  labelStyle(); doc.text('Ordered By:', marginLeft, finalY + 30);
  valueStyle(); doc.text(po.orderedBy || '-', marginLeft + 30, finalY + 30);

  labelStyle(); doc.text('Delivery Date:', marginLeft, finalY + 38);
  valueStyle(); doc.text(format(new Date(po.deliveryDate), 'yyyy-MM-dd'), marginLeft + 30, finalY + 38);

  labelStyle(); doc.text('Purpose:', marginLeft, finalY + 48);
  valueStyle(); doc.text(po.purpose || '-', marginLeft + 30, finalY + 48);

  if (po.remarks) {
    labelStyle(); doc.text('Remarks:', marginLeft, finalY + 60);
    valueStyle(); doc.text(po.remarks, marginLeft, finalY + 70, { maxWidth: 170 });
  }

  doc.save(`${po.poNumber}_Purchase_Order.pdf`);
};
