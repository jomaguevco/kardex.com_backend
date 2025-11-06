import PDFDocument from 'pdfkit';
import { Venta, DetalleVenta, Cliente, Producto } from '../models';

export const generateFacturaPDF = async (venta: any): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });
      doc.on('error', reject);

      // Encabezado
      doc.fontSize(20).text('FACTURA DE VENTA', { align: 'center' });
      doc.moveDown();

      // Información de la empresa (ajustar según necesidad)
      doc.fontSize(12).text('Sistema de Ventas KARDEX', { align: 'center' });
      doc.fontSize(10).text('NIT: 123456789-0', { align: 'center' });
      doc.fontSize(10).text('Dirección: Calle Principal #123', { align: 'center' });
      doc.moveDown();

      // Información de la factura
      doc.fontSize(10);
      doc.text(`Factura N°: ${venta.numero_factura}`, 50, doc.y);
      doc.text(`Fecha: ${new Date(venta.fecha_venta).toLocaleDateString('es-ES')}`, 350, doc.y - 15);
      doc.moveDown();

      // Información del cliente
      if (venta.cliente) {
        doc.fontSize(12).text('Cliente:', 50, doc.y);
        doc.fontSize(10);
        doc.text(`Nombre: ${venta.cliente.nombre}`, 50, doc.y + 15);
        if (venta.cliente.numero_documento) {
          doc.text(`Documento: ${venta.cliente.tipo_documento} ${venta.cliente.numero_documento}`, 50, doc.y + 15);
        }
        if (venta.cliente.direccion) {
          doc.text(`Dirección: ${venta.cliente.direccion}`, 50, doc.y + 15);
        }
        doc.moveDown();
      }

      // Tabla de productos
      doc.moveDown();
      const tableTop = doc.y;
      const itemHeight = 20;
      let currentY = tableTop;

      // Encabezados de tabla
      doc.fontSize(10).font('Helvetica-Bold');
      doc.text('Producto', 50, currentY);
      doc.text('Cant.', 250, currentY);
      doc.text('Precio Unit.', 300, currentY);
      doc.text('Subtotal', 400, currentY, { width: 100, align: 'right' });

      currentY += itemHeight;
      doc.moveTo(50, currentY).lineTo(550, currentY).stroke();

      // Detalles
      doc.font('Helvetica');
      if (venta.detalles && venta.detalles.length > 0) {
        venta.detalles.forEach((detalle: any) => {
          const productoNombre = detalle.producto?.nombre || 'Producto';
          const cantidad = detalle.cantidad || 0;
          const precioUnitario = Number(detalle.precio_unitario || 0);
          const subtotal = Number(detalle.subtotal || 0);

          doc.fontSize(9).text(productoNombre.substring(0, 30), 50, currentY, { width: 200 });
          doc.text(cantidad.toString(), 250, currentY);
          doc.text(`$${precioUnitario.toFixed(2)}`, 300, currentY);
          doc.text(`$${subtotal.toFixed(2)}`, 400, currentY, { width: 100, align: 'right' });

          currentY += itemHeight;
          if (currentY > 700) {
            doc.addPage();
            currentY = 50;
          }
        });
      }

      doc.moveDown(2);

      // Totales
      const totalsY = doc.y;
      doc.fontSize(10);
      doc.text('Subtotal:', 400, totalsY, { width: 100, align: 'right' });
      doc.text(`$${Number(venta.subtotal || 0).toFixed(2)}`, 400, totalsY, { width: 100, align: 'right' });

      if (venta.descuento > 0) {
        doc.text('Descuento:', 400, doc.y + 15, { width: 100, align: 'right' });
        doc.text(`-$${Number(venta.descuento || 0).toFixed(2)}`, 400, doc.y - 15, { width: 100, align: 'right' });
      }

      if (venta.impuestos > 0) {
        doc.text('Impuestos:', 400, doc.y + 15, { width: 100, align: 'right' });
        doc.text(`$${Number(venta.impuestos || 0).toFixed(2)}`, 400, doc.y - 15, { width: 100, align: 'right' });
      }

      doc.fontSize(12).font('Helvetica-Bold');
      doc.text('TOTAL:', 400, doc.y + 20, { width: 100, align: 'right' });
      doc.text(`$${Number(venta.total || 0).toFixed(2)}`, 400, doc.y - 20, { width: 100, align: 'right' });

      // Pie de página
      doc.fontSize(8).font('Helvetica');
      doc.text('Gracias por su compra', 50, doc.page.height - 50, { align: 'center', width: 500 });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

