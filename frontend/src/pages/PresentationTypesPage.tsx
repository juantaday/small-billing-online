import { useMemo, useState } from 'react';
import { Edit2, Plus, Search, Trash2, X } from 'lucide-react';
import { CreatePresentationTypeDto, PresentationTypeDto } from '@small-billing/shared';
import { usePresentationTypes } from '@/entities/presentation-type/api/usePresentationTypes';
import { Card, Loading } from '@/shared/ui';

interface FormState extends CreatePresentationTypeDto {
  id?: string;
}

export function PresentationTypesPage() {
  const {
    presentationTypes,
    loading,
    error,
    fetchPresentationTypes,
    createPresentationType,
    updatePresentationType,
    deletePresentationType,
  } = usePresentationTypes();

  const [query, setQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<PresentationTypeDto | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<FormState>({ name: '' });

  const filteredTypes = useMemo(
    () =>
      presentationTypes.filter((type) =>
        type.name.toLowerCase().includes(query.toLowerCase()),
      ),
    [presentationTypes, query],
  );

  const openCreateModal = () => {
    setEditingType(null);
    setForm({ name: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (type: PresentationTypeDto) => {
    setEditingType(type);
    setForm({ id: type.id, name: type.name, active: type.active });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (submitting) return;
    setIsModalOpen(false);
    setEditingType(null);
    setForm({ name: '' });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.name.trim()) return;

    setSubmitting(true);
    try {
      if (editingType) {
        await updatePresentationType(editingType.id, {
          id: editingType.id,
          name: form.name.trim(),
        });
      } else {
        await createPresentationType({ name: form.name.trim(), active: true });
      }
      await fetchPresentationTypes();
      closeModal();
    } catch (submitError) {
      console.error('Error al guardar tipo de presentación:', submitError);
      alert('No se pudo guardar el tipo de presentación');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const shouldDelete = window.confirm(
      '¿Seguro que deseas eliminar este tipo de presentación?',
    );
    if (!shouldDelete) return;

    try {
      await deletePresentationType(id);
      await fetchPresentationTypes();
    } catch (deleteError) {
      console.error('Error al eliminar tipo de presentación:', deleteError);
      alert('No se pudo eliminar el tipo de presentación');
    }
  };

  if (loading) {
    return <Loading size="lg" variant="pulse" message="Cargando tipos de presentación..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            Tipos de Presentación
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Administra unidad, docena, bulto, paquete y demás formatos.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo Tipo
        </button>
      </div>

      <Card className="p-4">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar tipo de presentación..."
            className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
          />
        </div>
      </Card>

      {error && (
        <Card className="p-4 border border-red-300 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300">
          {error}
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTypes.map((type) => (
          <Card key={type.id} className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{type.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Estado: {type.active ? 'Activo' : 'Inactivo'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEditModal(type)}
                  className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  title="Editar"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(type.id)}
                  className="p-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  title="Eliminar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredTypes.length === 0 && (
        <Card className="p-10 text-center text-gray-500 dark:text-gray-400">
          No hay tipos de presentación para mostrar.
        </Card>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingType ? 'Editar Tipo' : 'Nuevo Tipo'}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder="Ej: Unidad"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300"
                  disabled={submitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white"
                  disabled={submitting}
                >
                  {submitting ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
