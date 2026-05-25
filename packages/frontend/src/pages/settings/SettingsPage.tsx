import { useState, useEffect } from 'react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { getServices } from '../../api/services';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../../api/categories';
import type { BusinessHours, Service, ServiceCategory } from '../../types';
import BrandingSection from './sections/BrandingSection';
import CompanyProfileSection from './sections/CompanyProfileSection';
import BillingSection from './sections/BillingSection';

type Tab = 'profile' | 'branding' | 'hours' | 'categories' | 'services' | 'billing';

const TABS: { id: Tab; label: string }[] = [
  { id: 'profile', label: 'Perfil da Empresa' },
  { id: 'branding', label: 'Identidade Visual' },
  { id: 'hours', label: 'Horário de Funcionamento' },
  { id: 'categories', label: 'Categorias' },
  { id: 'services', label: 'Serviços e Preços' },
  { id: 'billing', label: 'Plano e Cobrança' },
];

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
type Day = (typeof DAYS)[number];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('profile');

  return (
    <div>
      <h1 className="text-2xl font-bold text-text-primary mb-6">Configurações</h1>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar tabs */}
        <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:w-48 shrink-0" aria-label="Settings sections">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center px-3 py-2 rounded text-sm font-medium whitespace-nowrap transition-all duration-200
                ${activeTab === tab.id
                  ? 'bg-primary/20 text-primary'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-alt'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {activeTab === 'profile' && <CompanyProfileSection />}
          {activeTab === 'branding' && <BrandingSection />}
          {activeTab === 'hours' && <BusinessHoursSection />}
          {activeTab === 'categories' && <CategoriesSection />}
          {activeTab === 'services' && <ServicesSection />}
          {activeTab === 'billing' && <BillingSection />}
        </div>
      </div>
    </div>
  );
}

function BusinessHoursSection() {
  const [hours, setHours] = useState<BusinessHours>(
    Object.fromEntries(
      DAYS.map((d) => [d, { open: '09:00', close: '17:00', closed: false }])
    ) as BusinessHours
  );

  function updateDay(day: Day, field: 'open' | 'close' | 'closed', value: string | boolean) {
    setHours((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  }

  return (
    <Card title="Horário de Funcionamento">
      <div className="space-y-2">
        {DAYS.map((day) => {
          const dayHours = hours[day];
          return (
            <div key={day} className="flex flex-col sm:flex-row sm:items-center gap-2 py-2 border-b border-border last:border-0">
              <span className="w-28 text-sm font-medium text-text-primary capitalize">{day}</span>
              <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
                <input
                  type="checkbox"
                  checked={dayHours?.closed ?? false}
                  onChange={(e) => updateDay(day, 'closed', e.target.checked)}
                  className="rounded border-border"
                />
                Fechado
              </label>
              {!dayHours?.closed && (
                <div className="flex items-center gap-2 text-sm">
                  <input
                    type="time"
                    value={dayHours?.open ?? '09:00'}
                    onChange={(e) => updateDay(day, 'open', e.target.value)}
                    className="h-8 px-2 rounded bg-surface-alt border border-border text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <span className="text-text-muted">–</span>
                  <input
                    type="time"
                    value={dayHours?.close ?? '17:00'}
                    onChange={(e) => updateDay(day, 'close', e.target.value)}
                    className="h-8 px-2 rounded bg-surface-alt border border-border text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-4">
        <Button type="button">Salvar Horários</Button>
      </div>
    </Card>
  );
}

function CategoriesSection() {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [newName, setNewName] = useState('');
  const [addingNew, setAddingNew] = useState(false);
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    getCategories()
      .then(setCategories)
      .catch(() => setError('Erro ao carregar categorias.'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleCreate() {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      await createCategory(newName.trim());
      setNewName('');
      setAddingNew(false);
      load();
    } catch { setError('Erro ao criar categoria.'); }
    finally { setSaving(false); }
  }

  async function handleUpdate(id: string) {
    if (!editName.trim()) return;
    setSaving(true);
    try {
      await updateCategory(id, editName.trim());
      setEditingId(null);
      load();
    } catch { setError('Erro ao atualizar categoria.'); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string, name: string) {
    if (!window.confirm(`Excluir a categoria "${name}"?`)) return;
    try {
      await deleteCategory(id);
      load();
    } catch { setError('Erro ao excluir categoria.'); }
  }

  if (loading) return <p className="text-text-muted text-sm">Carregando…</p>;

  return (
    <Card title="Categorias de Serviço">
      {error && <p className="text-error text-sm mb-3" role="alert">{error}</p>}

      <div className="mb-4">
        {addingNew ? (
          <div className="flex gap-2 items-center">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nome da categoria"
              autoFocus
              className="flex-1 h-9 px-3 rounded bg-surface-alt border border-border text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              onKeyDown={(e) => { if (e.key === 'Enter') void handleCreate(); if (e.key === 'Escape') setAddingNew(false); }}
            />
            <Button size="sm" loading={saving} onClick={handleCreate}>Salvar</Button>
            <Button size="sm" variant="ghost" onClick={() => { setAddingNew(false); setNewName(''); }}>Cancelar</Button>
          </div>
        ) : (
          <Button size="sm" onClick={() => setAddingNew(true)}>+ Nova Categoria</Button>
        )}
      </div>

      {categories.length === 0 ? (
        <p className="text-text-muted text-sm">Nenhuma categoria cadastrada.</p>
      ) : (
        <div className="space-y-1">
          {categories.map((cat) => (
            <div key={cat.id} className="flex items-center gap-2 py-2 border-b border-border last:border-0">
              {editingId === cat.id ? (
                <>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    autoFocus
                    className="flex-1 h-8 px-2 rounded bg-surface-alt border border-border text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    onKeyDown={(e) => { if (e.key === 'Enter') void handleUpdate(cat.id); if (e.key === 'Escape') setEditingId(null); }}
                  />
                  <Button size="sm" loading={saving} onClick={() => handleUpdate(cat.id)}>Salvar</Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancelar</Button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm text-text-primary">{cat.name}</span>
                  <Button size="sm" variant="ghost" onClick={() => { setEditingId(cat.id); setEditName(cat.name); }}>Editar</Button>
                  <Button size="sm" variant="danger" onClick={() => handleDelete(cat.id, cat.name)}>Excluir</Button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function ServicesSection() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getServices()
      .then((result) => {
        const raw = result as unknown;
        const items: Service[] = Array.isArray(raw)
          ? (raw as Service[])
          : Array.isArray((raw as { data?: Service[] }).data)
          ? (raw as { data: Service[] }).data
          : [];
        setServices(items);
      })
      .catch(() => setError('Erro ao carregar serviços.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-text-muted text-sm">Carregando…</p>;
  if (error) return <p className="text-error text-sm">{error}</p>;

  return (
    <Card title="Serviços e Preços">
      <p className="text-xs text-text-secondary mb-4">
        Os serviços são gerenciados no módulo de Serviços. Esta é uma visualização somente leitura.
      </p>
      {services.length === 0 ? (
        <p className="text-text-muted text-sm">Nenhum serviço configurado.</p>
      ) : (
        <div className="space-y-2">
          {services.map((service) => (
            <div key={service.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <div>
                <p className="text-sm font-medium text-text-primary">{service.name}</p>
                {service.description && (
                  <p className="text-xs text-text-secondary">{service.description}</p>
                )}
              </div>
              <Badge variant="neutral">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                  (service.base_rate_cents ?? Math.round((service.baseRate ?? 0) * 100)) / 100
                )}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

