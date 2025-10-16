import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { authAPI } from '../services/api';

const Employees = () => {
  const queryClient = useQueryClient();
  const { data: users, isLoading } = useQuery(['users'], authAPI.listUsers);
  const [form, setForm] = useState({ email: '', password: '', firstName: '', lastName: '', role: 'employee' });

  const createMutation = useMutation((payload) => authAPI.register(payload), {
    onSuccess: () => {
      setForm({ email: '', password: '', firstName: '', lastName: '', role: 'employee' });
      queryClient.invalidateQueries(['users']);
      alert('Użytkownik dodany');
    },
    onError: (e) => alert(e?.response?.data?.message || 'Błąd podczas dodawania użytkownika')
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pracownicy</h1>
        <p className="mt-1 text-sm text-gray-500">Lista użytkowników i dodawanie nowych (tylko admin)</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Lista</h2>
          <div className="divide-y">
            {(users || []).map((u) => (
              <div key={u._id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">{u.fullName}</div>
                  <div className="text-sm text-gray-500">{u.email}</div>
                </div>
                <span className="text-xs px-2 py-1 rounded bg-slate-100 text-slate-700">{u.role}</span>
              </div>
            ))}
            {(!users || users.length === 0) && (
              <div className="text-sm text-gray-500">Brak użytkowników.</div>
            )}
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Dodaj użytkownika (admin)</h2>
          <div className="space-y-3">
            <div>
              <label className="form-label">Imię</label>
              <input className="input-field" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
            </div>
            <div>
              <label className="form-label">Nazwisko</label>
              <input className="input-field" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
            </div>
            <div>
              <label className="form-label">Email</label>
              <input type="email" className="input-field" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="form-label">Hasło</label>
              <input type="password" className="input-field" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
            <div>
              <label className="form-label">Rola</label>
              <select className="input-field" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <option value="employee">Pracownik</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="flex justify-end">
              <button
                className="btn-primary"
                onClick={() => createMutation.mutate(form)}
                disabled={createMutation.isLoading}
              >
                Dodaj
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Employees;


