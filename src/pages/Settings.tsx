import { useState } from 'react';
import { useDataStore } from '@/store/dataStore';
import { Settings as SettingsIcon, Save } from 'lucide-react';
import { toast } from 'sonner';

const Settings = () => {
  const { companyConfig, updateCompanyConfig } = useDataStore();
  const [form, setForm] = useState({ ...companyConfig });

  const handleSave = () => {
    updateCompanyConfig(form);
    toast.success('Configuración guardada');
  };

  const fields: { key: keyof typeof form; label: string; type?: string }[] = [
    { key: 'branchNumber', label: 'Número de Sucursal' },
    { key: 'fantasyName', label: 'Nombre de Fantasía' },
    { key: 'legalName', label: 'Razón Social' },
    { key: 'startDate', label: 'Fecha Inicio Actividad', type: 'date' },
    { key: 'cuit', label: 'CUIT' },
    { key: 'posNumber', label: 'Punto de Venta' },
    { key: 'address', label: 'Dirección' },
    { key: 'deliveryCost', label: 'Costo de Envío', type: 'number' },
    { key: 'serverIP', label: 'IP Servidor' },
  ];

  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <SettingsIcon className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-display font-bold text-foreground">Configuraciones</h1>
      </div>

      <div className="bg-card rounded-xl border border-border pos-shadow p-6 space-y-4">
        {fields.map(f => (
          <div key={f.key}>
            <label className="block text-sm font-medium text-foreground mb-1">{f.label}</label>
            <input
              type={f.type ?? 'text'}
              value={form[f.key] ?? ''}
              onChange={e => setForm(prev => ({ ...prev, [f.key]: f.type === 'number' ? Number(e.target.value) : e.target.value }))}
              className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        ))}

        {companyConfig.lastSyncDate && (
          <div className="pt-2 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Última sincronización: <span className="text-foreground font-medium">{new Date(companyConfig.lastSyncDate).toLocaleString()}</span>
            </p>
          </div>
        )}

        <button onClick={handleSave} className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity touch-target flex items-center justify-center gap-2">
          <Save className="w-4 h-4" />
          Guardar Configuración
        </button>
      </div>
    </div>
  );
};

export default Settings;
