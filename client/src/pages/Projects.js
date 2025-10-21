import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2,
  FileText,
  Calendar,
  User,
  FolderOpen,
  Download
} from 'lucide-react';
import { projectsAPI, offersAPI } from '../services/api';
import { useI18n } from '../contexts/I18nContext';
import toast from 'react-hot-toast';

const Projects = () => {
  const { t } = useI18n();
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    offerType: '',
    owner: '',
    page: 1,
  });

  const { data, isLoading, refetch } = useQuery(
    ['projects', filters],
    () => projectsAPI.getAll(filters),
    { keepPreviousData: true }
  );

  const handleDelete = async (projectId) => {
    if (window.confirm('Czy na pewno chcesz usunąć ten projekt?')) {
      try {
        await projectsAPI.delete(projectId);
        toast.success('Projekt został usunięty');
        refetch();
      } catch (error) {
        toast.error('Błąd podczas usuwania projektu');
      }
    }
  };

  const generateOffer = async (projectId) => {
    try {
      await offersAPI.generate(projectId);
      toast.success('Oferta została wygenerowana pomyślnie!');
      refetch();
    } catch (error) {
      toast.error('Błąd podczas generowania oferty');
    }
  };

  const generateContract = async (projectId) => {
    try {
      await offersAPI.generateContract(projectId);
      toast.success('Umowa została wygenerowana, status ustawiono na zaakceptowany!');
      refetch();
    } catch (error) {
      toast.error('Błąd podczas generowania umowy');
    }
  };

  const generatePdf = async (projectId) => {
    try {
      const response = await offersAPI.generatePdf(projectId);
      toast.success('PDF oferty został wygenerowany pomyślnie!');
      
      // Automatycznie pobierz PDF
      if (response.pdfUrl) {
        const link = document.createElement('a');
        link.href = `https:///oferty.soft-synergy.com${response.pdfUrl}`;
        link.download = response.fileName || 'oferta.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      
      refetch();
    } catch (error) {
      toast.error('Błąd podczas generowania PDF');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: { label: 'Szkic', color: 'bg-gray-100 text-gray-800' },
      active: { label: 'Aktywny', color: 'bg-green-100 text-green-800' },
      accepted: { label: 'Zaakceptowany', color: 'bg-emerald-100 text-emerald-800' },
      completed: { label: 'Zakończony', color: 'bg-blue-100 text-blue-800' },
      cancelled: { label: 'Anulowany', color: 'bg-red-100 text-red-800' },
    };
    
    const config = statusConfig[status] || statusConfig.draft;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('projects.header')}</h1>
          <p className="mt-1 text-sm text-gray-500">{t('projects.subheader')}</p>
        </div>
        <Link
          to="/projects/new"
          className="btn-primary flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          {t('projects.newProject')}
        </Link>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-5">
          <div>
            <label className="form-label">{t('projects.searchLabel')}</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder={t('projects.searchPlaceholder')}
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
                className="input-field pl-10"
              />
            </div>
          </div>
          
          <div>
            <label className="form-label">{t('projects.statusLabel')}</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
              className="input-field"
            >
              <option value="">{t('projects.allOption')}</option>
              <option value="draft">{t('projects.status.draft')}</option>
              <option value="active">{t('projects.status.active')}</option>
              <option value="accepted">{t('projects.status.accepted')}</option>
              <option value="completed">{t('projects.status.completed')}</option>
              <option value="cancelled">{t('projects.status.cancelled')}</option>
            </select>
          </div>

          <div>
            <label className="form-label">{t('projects.offerTypeLabel')}</label>
            <select
              value={filters.offerType}
              onChange={(e) => setFilters({ ...filters, offerType: e.target.value, page: 1 })}
              className="input-field"
            >
              <option value="">{t('projects.allOption')}</option>
              <option value="final">Final</option>
              <option value="preliminary">Preliminary</option>
            </select>
          </div>

          <div>
            <label className="form-label">Owner</label>
            <select
              value={filters.owner}
              onChange={(e) => setFilters({ ...filters, owner: e.target.value, page: 1 })}
              className="input-field"
            >
              <option value="">{t('projects.allOption')}</option>
              <option value="me">Only mine</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={() => setFilters({ search: '', status: '', offerType: '', owner: '', page: 1 })}
              className="btn-secondary w-full"
            >
              <Filter className="h-4 w-4 mr-2" />
              {t('projects.clearFilters')}
            </button>
          </div>
        </div>
      </div>

      {/* Projects List */}
      <div className="space-y-4">
        {data?.projects?.map((project) => {
          const hasPendingFollowUp = project.nextFollowUpDueAt && project.status !== 'accepted' && project.status !== 'cancelled' && (!project.followUps || project.followUps.length < 3);
          const isOverdue = hasPendingFollowUp && new Date(project.nextFollowUpDueAt) <= new Date();
          return (
          <div key={project._id} className={`card hover:shadow-md transition-shadow duration-200 ${isOverdue ? 'ring-2 ring-red-500' : ''}`}>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {project.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Klient: {project.clientName}
                    </p>
                    {hasPendingFollowUp && (
                      <p className={`text-xs mt-1 ${isOverdue ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                        {isOverdue ? 'Termin follow-up minął' : 'Zaplanowany follow-up'}: {new Date(project.nextFollowUpDueAt).toLocaleDateString('pl-PL')}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(project.status)}
                    {project.priority && (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        project.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                        project.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                        project.priority === 'low' ? 'bg-gray-100 text-gray-800' :
                        'bg-sky-100 text-sky-800'
                      }`}>
                        {project.priority === 'urgent' ? 'Pilny' :
                         project.priority === 'high' ? 'Wysoki' :
                         project.priority === 'low' ? 'Niski' : 'Normalny'}
                      </span>
                    )}
                    <span className="text-sm font-medium text-gray-900">
                      {formatCurrency(project.pricing?.total || 0)}
                    </span>
                  </div>
                </div>
                
                <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-1" />
                    {project.owner?.firstName ? `${project.owner.firstName} ${project.owner.lastName}` : project.createdBy?.fullName}
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {new Date(project.createdAt).toLocaleDateString('pl-PL')}
                  </div>
                  {project.offerNumber && (
                    <div className="flex items-center">
                      <FileText className="h-4 w-4 mr-1" />
                      {project.offerNumber}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-2 ml-4">
                {project.generatedOfferUrl ? (
                  <a
                    href={`https:///oferty.soft-synergy.com${project.generatedOfferUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-gray-400 hover:text-green-600 group relative"
                    title="Pobierz ofertę HTML"
                  >
                    <Download className="h-4 w-4" />
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                      Pobierz ofertę HTML
                    </div>
                  </a>
                ) : (
                  <button
                    onClick={() => generateOffer(project._id)}
                    className="p-2 text-gray-400 hover:text-blue-600 group relative"
                    title="Generuj ofertę"
                  >
                    <FileText className="h-4 w-4" />
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                      Generuj ofertę
                    </div>
                  </button>
                )}
                {project.pdfUrl ? (
                  <a
                    href={`https:///oferty.soft-synergy.com${project.pdfUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-gray-400 hover:text-red-600 group relative"
                    title="Pobierz ofertę PDF"
                  >
                    <Download className="h-4 w-4" />
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                      Pobierz ofertę PDF
                    </div>
                  </a>
                ) : project.generatedOfferUrl ? (
                  <button
                    onClick={() => generatePdf(project._id)}
                    className="p-2 text-gray-400 hover:text-red-600 group relative"
                    title="Generuj i pobierz PDF"
                  >
                    <FileText className="h-4 w-4" />
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                      Generuj i pobierz PDF
                    </div>
                  </button>
                ) : null}
                {project.contractPdfUrl ? (
                  <a
                    href={`https:///oferty.soft-synergy.com${project.contractPdfUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-gray-400 hover:text-emerald-600 group relative"
                    title="Pobierz umowę PDF"
                  >
                    <Download className="h-4 w-4" />
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                      Pobierz umowę PDF
                    </div>
                  </a>
                ) : (
                  <button
                    onClick={() => generateContract(project._id)}
                    className="p-2 text-gray-400 hover:text-emerald-600 group relative"
                    title="Wygeneruj umowę"
                  >
                    <FileText className="h-4 w-4" />
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                      Wygeneruj umowę
                    </div>
                  </button>
                )}
                <Link
                  to={`/projects/${project._id}`}
                  className="p-2 text-gray-400 hover:text-gray-600 group relative"
                  title="Zobacz szczegóły"
                >
                  <Eye className="h-4 w-4" />
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                    Zobacz szczegóły
                  </div>
                </Link>
                <Link
                  to={`/projects/${project._id}/edit`}
                  className="p-2 text-gray-400 hover:text-blue-600 group relative"
                  title="Edytuj"
                >
                  <Edit className="h-4 w-4" />
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                    Edytuj
                  </div>
                </Link>
                <button
                  onClick={() => handleDelete(project._id)}
                  className="p-2 text-gray-400 hover:text-red-600 group relative"
                  title="Usuń"
                >
                  <Trash2 className="h-4 w-4" />
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                    Usuń
                  </div>
                </button>
              </div>
            </div>
          </div>
        );})}
        
        {data?.projects?.length === 0 && (
          <div className="text-center py-12">
            <FolderOpen className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">{t('projects.emptyTitle')}</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filters.search || filters.status 
                ? t('projects.emptyHintFiltered')
                : t('projects.emptyHint')
              }
            </p>
            {!filters.search && !filters.status && (
              <div className="mt-6">
                <Link to="/projects/new" className="btn-primary">
                  <Plus className="h-4 w-4 mr-2" />
                  {t('projects.createFirst')}
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pagination */}
      {data?.totalPages > 1 && (
        <div className="flex items-center justify-between">
          {(() => {
            const currentPage = Number(data.currentPage || 1);
            const totalPages = Number(data.totalPages || 1);
            const total = Number(data.total || 0);
            const start = ((currentPage - 1) * 10) + 1;
            const end = Math.min(currentPage * 10, total);
            return (
              <div className="text-sm text-gray-700">
                {t('projects.shownCount')
                  .replace('{{start}}', start)
                  .replace('{{end}}', end)
                  .replace('{{total}}', total)}
              </div>
            );
          })()}
          <div className="flex space-x-2">
            {(() => {
              const currentPage = Number(data.currentPage || 1);
              const totalPages = Number(data.totalPages || 1);
              return (
                <>
                  <button
                    onClick={() => setFilters({ ...filters, page: Math.max(1, currentPage - 1) })}
                    disabled={currentPage <= 1}
                    className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t('projects.prev')}
                  </button>
                  <button
                    onClick={() => setFilters({ ...filters, page: Math.min(totalPages, currentPage + 1) })}
                    disabled={currentPage >= totalPages}
                    className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t('projects.next')}
                  </button>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects; 