import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import { aInput, ETIQUETA_ESTADO } from '../HooksE/useEventoForm';

const Err = ({ msg }) => (msg ? <p className="text-xs text-red-600 mt-1">{msg}</p> : null);

const inputCls = 'w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

const EventoFormModal = ({
    isOpen,
    onClose,
    onSubmit,
    isEditing,
    data,
    setData,
    processing,
    errors = {},
    visitadores = [],
    etiquetas = [], // Arreglo de objetos [{ id, nombre, color }, ...] enviado desde el controlador
}) => {
    const [busqueda, setBusqueda] = useState('');
    const [nuevaEtiquetaInput, setNuevaEtiquetaInput] = useState('');
    const [creandoEtiqueta, setCreandoEtiqueta] = useState(false);

    if (!isOpen) return null;

    const filtrados = visitadores.filter((v) =>
        (v.nombre || '').toLowerCase().includes(busqueda.toLowerCase())
    );

    const toggleVisitador = (id) => {
        const idsActuales = data.visitadores_ids || [];
        const nuevosIds = idsActuales.includes(id)
            ? idsActuales.filter((x) => x !== id)
            : [...idsActuales, id];

        setData('visitadores_ids', nuevosIds);
    };

    const seleccionarVisibles = () => {
        const idsActuales = data.visitadores_ids || [];
        const idsVisibles = filtrados.map((v) => v.id);
        const union = Array.from(new Set([...idsActuales, ...idsVisibles]));

        setData('visitadores_ids', union);
    };

    // Toggle por ID de etiqueta
    const toggleEtiqueta = (id) => {
        const seleccionadas = data.etiqueta_ids || [];
        const existe = seleccionadas.includes(id);
        const nuevas = existe
            ? seleccionadas.filter((item) => item !== id)
            : [...seleccionadas, id];

        setData('etiqueta_ids', nuevas);
    };

    // Crear una nueva etiqueta vía Inertia/API y seleccionarla
    const agregarNuevaEtiqueta = (e) => {
        e.preventDefault();
        const texto = nuevaEtiquetaInput.trim();
        if (!texto) return;

        // Si la etiqueta ya existe por nombre, la seleccionamos directamente
        const existe = etiquetas.find((e) => e.nombre.toLowerCase() === texto.toLowerCase());
        if (existe) {
            if (!(data.etiqueta_ids || []).includes(existe.id)) {
                setData('etiqueta_ids', [...(data.etiqueta_ids || []), existe.id]);
            }
            setNuevaEtiquetaInput('');
            return;
        }

        setCreandoEtiqueta(true);

        // Envía la creación de la etiqueta al servidor
        router.post('/administrador/etiquetas', { nombre: texto }, {
            preserveScroll: true,
            onSuccess: (page) => {
                // Se asume que el controlador actualiza las props con la nueva lista de etiquetas
                setNuevaEtiquetaInput('');
                setCreandoEtiqueta(false);
            },
            onError: () => setCreandoEtiqueta(false)
        });
    };

    // Si el inicio pasa del fin, el fin se corre automáticamente (+1 hora)
    const cambiarInicio = (valor) => {
        let fin = data.fecha_fin_programada;
        if (!fin || fin <= valor) {
            const d = new Date(valor);
            d.setHours(d.getHours() + 1);
            fin = aInput(d);
        }

        if (typeof setData === 'function' && setData.length === 2) {
            setData('fecha_programada', valor);
            setData('fecha_fin_programada', fin);
        } else {
            setData({ ...data, fecha_programada: valor, fecha_fin_programada: fin });
        }
    };

    const cantidadSeleccionados = (data.visitadores_ids || []).length;

    const textoBoton = processing
        ? 'Guardando...'
        : isEditing
        ? 'Guardar cambios'
        : data.todos
        ? 'Asignar a todos los visitadores'
        : `Asignar a ${cantidadSeleccionados} visitador${cantidadSeleccionados === 1 ? '' : 'es'}`;

    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <form onSubmit={onSubmit}>
                    <div className="flex items-center justify-between px-6 py-4 border-b">
                        <h3 className="text-lg font-semibold">{isEditing ? 'Editar evento' : 'Nuevo evento'}</h3>
                        <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-800 text-xl font-bold">
                            ×
                        </button>
                    </div>

                    <div className="px-6 py-4 space-y-4">
                        {/* Aviso de errores de fecha */}
                        {(errors.fecha_programada || errors.fecha_fin_programada) && (
                            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md p-3 space-y-1">
                                {errors.fecha_programada && <p>{errors.fecha_programada}</p>}
                                {errors.fecha_fin_programada && <p>{errors.fecha_fin_programada}</p>}
                            </div>
                        )}

                        {/* Nombre */}
                        <div>
                            <label className="block text-sm font-medium mb-1">Nombre del evento</label>
                            <input
                                type="text"
                                value={data.nombre_evento || ''}
                                onChange={(e) => setData('nombre_evento', e.target.value)}
                                className={inputCls}
                                placeholder="Ej: Capacitación de producto"
                            />
                            <Err msg={errors.nombre_evento} />
                        </div>

                        {/* ETIQUETAS / TAGS */}
                        <div>
                            <label className="block text-sm font-medium mb-1">Etiquetas</label>
                            
                            {/* Badges de etiquetas disponibles */}
                            <div className="flex flex-wrap gap-1.5 mb-2">
                                {etiquetas.map((tag) => {
                                    const activa = (data.etiqueta_ids || []).includes(tag.id);
                                    return (
                                        <button
                                            key={tag.id}
                                            type="button"
                                            onClick={() => toggleEtiqueta(tag.id)}
                                            style={tag.color && activa ? { backgroundColor: tag.color, color: '#fff' } : {}}
                                            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                                                activa
                                                    ? 'bg-blue-600 text-white shadow-sm'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                        >
                                            {activa ? `✓ ${tag.nombre}` : `+ ${tag.nombre}`}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Campo para agregar una nueva etiqueta global */}
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={nuevaEtiquetaInput}
                                    onChange={(e) => setNuevaEtiquetaInput(e.target.value)}
                                    placeholder="Crear nueva etiqueta (ej: Importante, Cliente VIP)..."
                                    className="flex-1 border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <button
                                    type="button"
                                    disabled={creandoEtiqueta}
                                    onClick={agregarNuevaEtiqueta}
                                    className="px-3 py-1.5 bg-gray-800 text-white rounded-md text-xs font-medium hover:bg-gray-900 disabled:opacity-50"
                                >
                                    {creandoEtiqueta ? 'Guardando...' : 'Agregar'}
                                </button>
                            </div>
                            <Err msg={errors.etiqueta_ids} />
                        </div>

                        {/* Visitadores */}
                        {isEditing ? (
                            <div>
                                <label className="block text-sm font-medium mb-1">Visitador</label>
                                <select
                                    value={data.visitador_id || ''}
                                    onChange={(e) => setData('visitador_id', e.target.value)}
                                    className={inputCls}
                                >
                                    <option value="">Selecciona un visitador</option>
                                    {visitadores.map((v) => (
                                        <option key={v.id} value={String(v.id)}>
                                            {v.nombre}
                                        </option>
                                    ))}
                                </select>
                                <Err msg={errors.visitador_id} />
                            </div>
                        ) : (
                            <div>
                                <label className="block text-sm font-medium mb-1">Asignar a</label>

                                <label className="flex items-center gap-2 text-sm mb-2 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={!!data.todos}
                                        onChange={(e) => setData('todos', e.target.checked)}
                                    />
                                    Todos los visitadores ({visitadores.length})
                                </label>

                                {!data.todos && (
                                    <div className="border rounded-md">
                                        <div className="flex items-center gap-2 p-2 border-b bg-gray-50">
                                            <input
                                                type="text"
                                                value={busqueda}
                                                onChange={(e) => setBusqueda(e.target.value)}
                                                placeholder="Buscar visitador..."
                                                className="flex-1 border rounded px-2 py-1 text-sm"
                                            />
                                            <button
                                                type="button"
                                                onClick={seleccionarVisibles}
                                                className="text-xs text-blue-600 hover:underline whitespace-nowrap"
                                            >
                                                Seleccionar visibles
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setData('visitadores_ids', [])}
                                                className="text-xs text-gray-600 hover:underline"
                                            >
                                                Limpiar
                                            </button>
                                        </div>
                                        <div className="max-h-44 overflow-y-auto p-2 space-y-1">
                                            {filtrados.length === 0 && (
                                                <p className="text-sm text-gray-500 px-1">Sin resultados.</p>
                                            )}
                                            {filtrados.map((v) => (
                                                <label
                                                    key={v.id}
                                                    className="flex items-center gap-2 text-sm px-1 py-0.5 rounded hover:bg-gray-50 cursor-pointer"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={(data.visitadores_ids || []).includes(v.id)}
                                                        onChange={() => toggleVisitador(v.id)}
                                                    />
                                                    {v.nombre}
                                                </label>
                                            ))}
                                        </div>
                                        <p className="text-xs text-gray-500 px-3 py-1.5 border-t bg-gray-50">
                                            {cantidadSeleccionados} seleccionado{cantidadSeleccionados === 1 ? '' : 's'}
                                        </p>
                                    </div>
                                )}

                                <p className="text-xs text-gray-500 mt-1">
                                    Se crea un evento por cada visitador. Si alguno tiene ese horario ocupado, no se
                                    crea ninguno y se indica quiénes están ocupados.
                                </p>
                                <Err msg={errors.visitadores_ids} />
                            </div>
                        )}

                        {/* Fechas */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Inicio</label>
                                <input
                                    type="datetime-local"
                                    value={data.fecha_programada || ''}
                                    onChange={(e) => cambiarInicio(e.target.value)}
                                    className={inputCls}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Fin</label>
                                <input
                                    type="datetime-local"
                                    value={data.fecha_fin_programada || ''}
                                    onChange={(e) => setData('fecha_fin_programada', e.target.value)}
                                    className={inputCls}
                                />
                            </div>
                        </div>

                        {isEditing && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Fecha realizada (opcional)</label>
                                    <input
                                        type="datetime-local"
                                        value={data.fecha_realizada || ''}
                                        onChange={(e) => setData('fecha_realizada', e.target.value)}
                                        className={inputCls}
                                    />
                                    <Err msg={errors.fecha_realizada} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Fin real (opcional)</label>
                                    <input
                                        type="datetime-local"
                                        value={data.fecha_fin_real || ''}
                                        onChange={(e) => setData('fecha_fin_real', e.target.value)}
                                        className={inputCls}
                                    />
                                    <Err msg={errors.fecha_fin_real} />
                                </div>
                            </div>
                        )}

                        {/* Estado */}
                        <div>
                            <label className="block text-sm font-medium mb-1">Estado</label>
                            <select
                                value={data.estado || ''}
                                onChange={(e) => setData('estado', e.target.value)}
                                className={inputCls}
                            >
                                {Object.entries(ETIQUETA_ESTADO || {}).map(([valor, etiqueta]) => (
                                    <option key={valor} value={valor}>
                                        {etiqueta}
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-500 mt-1">
                                Un evento cancelado libera el horario del visitador.
                            </p>
                            <Err msg={errors.estado} />
                        </div>

                        {/* Ubicación */}
                        <div>
                            <label className="block text-sm font-medium mb-1">Ubicación</label>
                            <input
                                type="text"
                                value={data.ubicacion || ''}
                                onChange={(e) => setData('ubicacion', e.target.value)}
                                className={inputCls}
                                placeholder="Dirección o lugar del evento"
                            />
                            <Err msg={errors.ubicacion} />
                            <div className="grid grid-cols-2 gap-4 mt-2">
                                <div>
                                    <input
                                        type="number"
                                        step="any"
                                        value={data.latitud || ''}
                                        onChange={(e) => setData('latitud', e.target.value)}
                                        className={inputCls}
                                        placeholder="Latitud (opcional)"
                                    />
                                    <Err msg={errors.latitud} />
                                </div>
                                <div>
                                    <input
                                        type="number"
                                        step="any"
                                        value={data.longitud || ''}
                                        onChange={(e) => setData('longitud', e.target.value)}
                                        className={inputCls}
                                        placeholder="Longitud (opcional)"
                                    />
                                    <Err msg={errors.longitud} />
                                </div>
                            </div>
                        </div>

                        {/* Comentario */}
                        <div>
                            <label className="block text-sm font-medium mb-1">Comentario</label>
                            <textarea
                                rows={3}
                                value={data.comentario || ''}
                                onChange={(e) => setData('comentario', e.target.value)}
                                className={inputCls}
                            />
                            <Err msg={errors.comentario} />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 px-6 py-4 border-t bg-gray-50">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm border bg-white rounded-md hover:bg-gray-100"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                        >
                            {textoBoton}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EventoFormModal;