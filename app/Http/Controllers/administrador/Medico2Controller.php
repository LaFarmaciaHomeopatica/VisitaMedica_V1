<?php

namespace App\Http\Controllers\Administrador;

use App\Http\Controllers\Controller;
use App\Models\Medico;
use App\Models\Visitador; 
use App\Models\TipoDocumento;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Log; // Añadido para registrar errores
use App\Exports\MedicosExport;
use App\Imports\MedicosImport;
use Maatwebsite\Excel\Facades\Excel;

class Medico2Controller extends Controller
{
    /**
     * Mostrar listado de médicos.
     */
    public function index()
    {
        return Inertia::render('ADMINISTRADOR/Gmedicos', [
            'medicos' => Medico::with(['visitador', 'tipoDocumento'])->get(), 
            'visitadores' => Visitador::all(['id', 'nombre', 'apellido']),
            'tiposDocumento' => TipoDocumento::all(['id', 'nombre']) 
        ]);
    }

    /**
     * Almacenar un nuevo médico.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'documento' => 'required|numeric|unique:medicos,documento',
            'nombre' => 'required|string|max:100',
            'apellido' => 'required|string|max:100',
            'tipo_documento_id' => 'required|integer',
            'especialidad' => 'required|string|max:100',
            'geolocalizacion' => 'nullable|string|max:300',
            'direccion_detalles' => 'nullable|string',
            'telefono_contacto' => 'nullable|string|max:50',
            'horario_atencion' => 'nullable|string|max:100',
            'visitador_id' => 'nullable|exists:visitadores,id', 
            'fecha_inicio_relacion' => 'nullable|date',
        ], [
            'required' => 'El campo :attribute es obligatorio.',
            'unique'   => 'Este :attribute ya se encuentra registrado.',
            'numeric'  => 'El campo :attribute debe ser numérico.',
            'exists'   => 'El :attribute seleccionado no existe.',
            'date'     => 'La :attribute no tiene un formato válido.',
        ], [
            'documento' => 'Número de Documento',
            'nombre' => 'Nombre',
            'apellido' => 'Apellido',
            'tipo_documento_id' => 'Tipo de Documento',
            'visitador_id' => 'Visitador Asignado',
            'fecha_inicio_relacion' => 'Fecha de Inicio',
        ]);

        Medico::create($validated);

        return Redirect::route('Gmedicos.index')->with('message', 'Médico creado con éxito.');
    }

    /**
     * Actualizar el médico.
     */
    public function update(Request $request, Medico $medico)
    {
        $validated = $request->validate([
            'documento' => 'required|numeric|unique:medicos,documento,' . $medico->id,
            'nombre' => 'required|string|max:100',
            'apellido' => 'required|string|max:100',
            'tipo_documento_id' => 'required|integer',
            'especialidad' => 'required|string|max:100',
            'geolocalizacion' => 'nullable|string|max:300',
            'direccion_detalles' => 'nullable|string',
            'telefono_contacto' => 'nullable|string|max:50',
            'horario_atencion' => 'nullable|string|max:100',
            'visitador_id' => 'nullable|exists:visitadores,id', 
            'fecha_inicio_relacion' => 'nullable|date',
        ], [
            'required' => 'El campo :attribute es necesario.',
            'unique'   => 'Este :attribute ya pertenece a otro médico.',
            'numeric'  => 'El campo :attribute debe ser solo números.',
        ], [
            'documento' => 'Número de Documento',
            'nombre' => 'Nombre',
            'apellido' => 'Apellido',
            'tipo_documento_id' => 'Tipo de Documento',
        ]);

        $medico->update($validated);

        return Redirect::route('Gmedicos.index')->with('message', 'Médico actualizado con éxito.');
    }

    /**
     * Eliminar el médico.
     */
    public function destroy(Medico $medico)
    {
        $medico->delete();
        return Redirect::route('Gmedicos.index')->with('message', 'Médico eliminado correctamente.');
    }

    /**
     * Exportar a Excel.
     */
    public function exportar() 
    {
        return Excel::download(new MedicosExport, 'Medicos_LFH_' . date('d-m-Y') . '.xlsx');
    }

    /**
     * Importar desde Excel.
     */
    public function importar(Request $request) 
    {
        // 1. Validamos el archivo
        $request->validate([
            'archivo' => 'required|mimes:xlsx,xls,csv'
        ], [
            'archivo.required' => 'Debes seleccionar un archivo Excel.',
            'archivo.mimes' => 'El archivo debe ser formato .xlsx, .xls o .csv'
        ]);

        try {
            // 2. Procesamos la importación
            Excel::import(new MedicosImport, $request->file('archivo'));
            
            return Redirect::route('Gmedicos.index')->with('message', 'Importación completada con éxito.');
        } catch (\Exception $e) {
            // 3. Si falla, guardamos el error en storage/logs/laravel.log para revisarlo
            Log::error("Error en importación de Médicos: " . $e->getMessage());
            
            return Redirect::route('Gmedicos.index')->with('error', 'Error en la importación: ' . $e->getMessage());
        }
    }
}