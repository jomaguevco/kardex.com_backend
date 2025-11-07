import MonitoreoTransaccion, { EstadoMonitoreo } from '../models/MonitoreoTransaccion';
import eventBus from '../utils/eventBus';

interface MonitorParams {
  modulo: string;
  accion: string;
  referencia?: string;
  requestId?: string;
  payload?: Record<string, unknown>;
}

export const iniciarMonitoreo = async (params: MonitorParams) => {
  const registro = await MonitoreoTransaccion.create({
    modulo: params.modulo,
    accion: params.accion,
    referencia: params.referencia,
    request_id: params.requestId,
    payload: params.payload ?? null,
    iniciado_en: new Date()
  });

  eventBus.emit('monitor:transaction-started', {
    id: registro.id,
    modulo: registro.modulo,
    accion: registro.accion,
    requestId: registro.request_id
  });

  return registro;
};

export const finalizarMonitoreo = async (
  id: number,
  estado: EstadoMonitoreo,
  mensaje?: string
) => {
  const registro = await MonitoreoTransaccion.findByPk(id);

  if (!registro) {
    return;
  }

  const completadoEn = new Date();
  const duracion = registro.iniciado_en ? completadoEn.getTime() - registro.iniciado_en.getTime() : null;

  await registro.update({
    estado,
    mensaje,
    completado_en: completadoEn,
    duracion_ms: duracion
  });

  eventBus.emit('monitor:transaction-finished', {
    id: registro.id,
    modulo: registro.modulo,
    accion: registro.accion,
    estado,
    mensaje,
    duracion_ms: duracion
  });
};

