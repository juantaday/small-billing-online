import { useState, useEffect } from 'react';
import { PeopleDto, CreatePeopleDto, PersonType, IdentityType } from '@small-billing/shared';

function App() {
  const [people, setPeople] = useState<PeopleDto[]>([]);
  const [loading, setLoading] = useState(true);

  const API_URL = 'http://localhost:3001';

  useEffect(() => {
    fetchPeople();
  }, []);

  const fetchPeople = async () => {
    try {
      const response = await fetch(`${API_URL}/people`);
      const data = await response.json();
      setPeople(data);
      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const newPerson: CreatePeopleDto = {
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string || undefined,
      rucCi: formData.get('rucCi') as string,
      birthDate: formData.get('birthDate') ? new Date(formData.get('birthDate') as string) : undefined,
      mainEmail: formData.get('mainEmail') as string || undefined,
      phone: formData.get('phone') as string || undefined,
      address: formData.get('address') as string || undefined,
      personType: Number(formData.get('personType')) as PersonType,
      identityType: Number(formData.get('identityType')) as IdentityType,
    };

    try {
      const response = await fetch(`${API_URL}/people`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPerson),
      });

      if (response.ok) {
        await fetchPeople();
        e.currentTarget.reset();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-xl">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">
          Sistema de Facturación
        </h1>

        {/* Formulario */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Nueva Persona</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                name="firstName"
                placeholder="Nombre *"
                required
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                name="lastName"
                placeholder="Apellido"
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <input
              type="text"
              name="rucCi"
              placeholder="RUC/CI *"
              required
              maxLength={13}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <input
              type="email"
              name="mainEmail"
              placeholder="Email"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <input
              type="tel"
              name="phone"
              placeholder="Teléfono"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <input
              type="date"
              name="birthDate"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <textarea
              name="address"
              placeholder="Dirección"
              rows={2}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <div className="grid grid-cols-2 gap-4">
              <select
                name="personType"
                required
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tipo de Persona *</option>
                <option value={PersonType.NATURAL}>Natural</option>
                <option value={PersonType.JURIDICA}>Jurídica</option>
              </select>

              <select
                name="identityType"
                required
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tipo de Identificación *</option>
                <option value={IdentityType.CEDULA}>Cédula</option>
                <option value={IdentityType.RUC}>RUC</option>
                <option value={IdentityType.PASAPORTE}>Pasaporte</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Agregar Persona
            </button>
          </form>
        </div>

        {/* Lista */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Personas Registradas</h2>
          <div className="space-y-3">
            {people.map((person) => (
              <div key={person.id} className="border-b pb-3">
                <p className="font-semibold">
                  {person.firstName} {person.lastName}
                </p>
                <p className="text-sm text-gray-600">
                  {person.rucCi} | {person.mainEmail || 'Sin email'}
                </p>
                <p className="text-xs text-gray-500">
                  Tipo: {person.personType === PersonType.NATURAL ? 'Natural' : 'Jurídica'}
                </p>
              </div>
            ))}
            {people.length === 0 && (
              <p className="text-gray-500">No hay personas registradas</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;