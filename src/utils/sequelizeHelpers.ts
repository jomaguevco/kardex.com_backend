import { Model } from 'sequelize';

// Función helper para verificar si un modelo tiene asociaciones
export function hasAssociation<T extends Model>(model: T, associationName: string): boolean {
  return !!(model as any)[associationName];
}

// Función helper para obtener asociaciones de manera segura
export function getAssociation<T extends Model, R = any>(
  model: T, 
  associationName: string
): R[] | undefined {
  const association = (model as any)[associationName];
  return Array.isArray(association) ? association : undefined;
}

// Función helper para obtener una asociación única de manera segura
export function getSingleAssociation<T extends Model, R = any>(
  model: T, 
  associationName: string
): R | undefined {
  const association = (model as any)[associationName];
  return Array.isArray(association) ? undefined : association;
}

// Función helper para calcular totales de manera segura
export function calculateTotal<T extends Model>(
  items: T[], 
  totalField: string, 
  detailField: string, 
  detailCountField: string
): { total: number; count: number } {
  let total = 0;
  let count = 0;

  for (const item of items) {
    total += (item as any)[totalField] || 0;
    
    const details = getAssociation(item, detailField);
    if (details) {
      count += details.reduce((sum: number, detail: any) => 
        sum + (detail[detailCountField] || 0), 0
      );
    }
  }

  return { total, count };
}

// Función helper para manejar respuestas de manera consistente
export function createSuccessResponse<T>(data: T, message?: string) {
  return {
    success: true,
    ...(message && { message }),
    data
  };
}

export function createErrorResponse(message: string, statusCode: number = 500) {
  return {
    success: false,
    message,
    statusCode
  };
}
