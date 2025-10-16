import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  ArrowLeft, 
  Edit, 
  FileText, 
  Download, 
  Eye,
  Mail,
  Phone,
  Calendar,
  User,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { projectsAPI, offersAPI } from '../services/api';
import { useI18n } from '../contexts/I18nContext';
import toast from 'react-hot-toast';

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useI18n();

  const { data: project, isLoading } = useQuery(
    ['project', id],
    () => projectsAPI.getById(id)
  );

  const generateOfferMutation = useMutation(offersAPI.generate, {
    onSuccess: (data) => {
      toast.success('Oferta została wygenerowana pomyślnie!');
      queryClient.invalidateQueries(['project', id]);
    },
    onError: (error) => {
      toast.error('Błąd podczas generowania oferty');
    }
  });

  const getStatusConfig = (status) => {
    const configs = {
      draft: { 
        label: 'Szkic', 
        color: 'bg-gray-100 text-gray-800',
        icon: Clock
      },
      active: { 
        label: 'Aktywny', 
        color: 'bg-green-100 text-green-800',
        icon: CheckCircle
      },
      completed: { 
        label: 'Zakończony', 
        color: 'bg-blue-100 text-blue-800',
        icon: CheckCircle
      },
      cancelled: { 
        label: 'Anulowany', 
        color: 'bg-red-100 text-red-800',
        icon: AlertCircle
      },
    };
    return configs[status] || configs.draft;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Projekt nie został znaleziony</h3>
        <p className="mt-1 text-sm text-gray-500">Sprawdź czy link jest poprawny.</p>
      </div>
    );
  }

  const statusConfig = getStatusConfig(project.status);
  const StatusIcon = statusConfig.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/projects')}
            className="p-2 text-gray-400 hover:text-gray-600"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
            <p className="mt-1 text-sm text-gray-500">Client: {project.clientName}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusConfig.color}`}>
            <StatusIcon className="h-4 w-4 mr-1" />
            {statusConfig.label}
          </span>
          
          <Link
            to={`/projects/${id}/edit`}
            className="btn-secondary flex items-center"
          >
            <Edit className="h-4 w-4 mr-2" />{t('buttons.edit')}
          </Link>
          
          <button
            onClick={() => window.open(`/api/offers/preview/${id}?lang=${project.language || 'pl'}`, '_blank')}
            className="btn-secondary flex items-center"
          >
            <Eye className="h-4 w-4 mr-2" />{t('buttons.view')}
          </button>
          
          <button
            onClick={() => generateOfferMutation.mutate(id)}
            disabled={generateOfferMutation.isLoading}
            className="btn-primary flex items-center"
          >
            <FileText className="h-4 w-4 mr-2" />{t('buttons.generateOffer')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Project Overview */}
          <div className="card">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Project overview</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Description</h3>
                <p className="mt-1 text-sm text-gray-900">{project.description}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Main business benefit</h3>
                <p className="mt-1 text-sm text-gray-900">{project.mainBenefit}</p>
              </div>
              
              {Array.isArray(project.notes) && project.notes.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Notatki</h3>
                  <ul className="mt-2 space-y-3">
                    {project.notes.map((n, idx) => (
                      <li key={idx} className="border border-gray-200 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-500">{new Date(n.createdAt).toLocaleString('pl-PL')}</span>
                          <span className="text-xs text-gray-600">{n.author?.firstName || ''} {n.author?.lastName || ''}</span>
                        </div>
                        <p className="text-sm text-gray-900 whitespace-pre-wrap">{n.text}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Modules */}
          {project.modules && project.modules.length > 0 && (
            <div className="card">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Project modules</h2>
              <div className="space-y-4">
                {project.modules.map((module, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900">{module.name}</h3>
                    <p className="mt-1 text-sm text-gray-600">{module.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="card">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Timeline</h2>
            <div className="space-y-4">
              {Object.entries(project.timeline).map(([phase, data]) => (
                <div key={phase} className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">{data.name}</h3>
                    <p className="text-sm text-gray-500">{data.duration}</p>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {formatCurrency(project.pricing[phase] || 0)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Client Information */}
          <div className="card">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Client info</h2>
            <div className="space-y-3">
              <div className="flex items-center">
                <User className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-sm text-gray-900">{project.clientContact}</span>
              </div>
              <div className="flex items-center">
                <Mail className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-sm text-gray-900">{project.clientEmail}</span>
              </div>
              {project.clientPhone && (
                <div className="flex items-center">
                  <Phone className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-900">{project.clientPhone}</span>
                </div>
              )}
            </div>
          </div>

        {/* Team Members */}
        <div className="card">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Zespół projektowy</h2>
          <div className="space-y-2">
            {(project.teamMembers || []).map((m, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="text-sm">
                  <div className="font-medium">{m.user?.firstName} {m.user?.lastName}</div>
                  <div className="text-gray-500">{m.user?.email}</div>
                </div>
                <span className="text-xs px-2 py-1 rounded bg-slate-100 text-slate-700">{m.role || 'member'}</span>
              </div>
            ))}
            {(!project.teamMembers || project.teamMembers.length === 0) && (
              <p className="text-sm text-gray-500">Brak przypisanych członków zespołu.</p>
            )}
          </div>
        </div>

          {/* Project Manager */}
          <div className="card">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Project manager</h2>
            <div className="space-y-3">
              <div>
                <h3 className="font-medium text-gray-900">{project.projectManager.name}</h3>
                <p className="text-sm text-gray-500">{project.projectManager.position}</p>
              </div>
              <div className="flex items-center">
                <Mail className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-sm text-gray-900">{project.projectManager.email}</span>
              </div>
              <div className="flex items-center">
                <Phone className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-sm text-gray-900">{project.projectManager.phone}</span>
              </div>
            </div>
          </div>

          {/* Pricing Summary */}
          <div className="card">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Financial summary</h2>
            <div className="space-y-3">
              {Object.entries(project.pricing).map(([phase, amount]) => {
                if (phase === 'total') return null;
                const phaseName = project.timeline[phase]?.name || phase;
                return (
                  <div key={phase} className="flex justify-between">
                    <span className="text-sm text-gray-600">{phaseName}</span>
                    <span className="text-sm font-medium text-gray-900">
                      {formatCurrency(amount)}
                    </span>
                  </div>
                );
              })}
              <div className="border-t pt-3">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-900">Total (net)</span>
                  <span className="font-bold text-lg text-primary-600">
                    {formatCurrency(project.pricing.total)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Project Details */}
          <div className="card">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Project details</h2>
            <div className="space-y-3">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-sm text-gray-900">Created: {new Date(project.createdAt).toLocaleDateString('pl-PL')}</span>
              </div>
              <div className="flex items-center">
                <User className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-sm text-gray-900">Created by: {project.createdBy?.fullName}</span>
              </div>
              {project.offerNumber && (
                <div className="flex items-center">
                  <FileText className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-900">
                    Offer number: {project.offerNumber}
                  </span>
                </div>
              )}
              {project.generatedOfferUrl && (
                <div className="pt-3">
                  <a
                    href={`https:///oferty.soft-synergy.com${project.generatedOfferUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary w-full flex items-center justify-center"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Pobierz ofertę
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Changelog */}
        <div className="card">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Changelog</h2>
          <div className="space-y-3">
            {(project.changelog || []).map((c, idx) => (
              <div key={idx} className="border rounded p-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">{c.action}</div>
                  <div className="text-xs text-gray-500">{new Date(c.createdAt).toLocaleString('pl-PL')}</div>
                </div>
                <div className="text-xs text-gray-500 mt-1">{c.author?.firstName} {c.author?.lastName}</div>
                {Array.isArray(c.fields) && c.fields.length > 0 && (
                  <div className="text-xs text-gray-600 mt-1">Fields: {c.fields.join(', ')}</div>
                )}
              </div>
            ))}
            {(!project.changelog || project.changelog.length === 0) && (
              <p className="text-sm text-gray-500">No changes.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail; 