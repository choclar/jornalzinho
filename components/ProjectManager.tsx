
import React, { useState, useEffect, useRef } from 'react';
import { PostConfig, SavedProject } from '../types';
import { FolderOpen, Trash2, Download, RefreshCw, CheckCircle2, Upload } from 'lucide-react';
import * as storage from '../utils/storage';

interface ProjectManagerProps {
  currentConfig: PostConfig;
  onLoadConfig: (config: PostConfig) => void;
}

const ProjectManager: React.FC<ProjectManagerProps> = ({ currentConfig, onLoadConfig }) => {
  const [projects, setProjects] = useState<SavedProject[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadProjects = () => {
    setProjects(storage.getSavedProjects());
  };

  useEffect(() => {
    if (isOpen) loadProjects();
  }, [isOpen]);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Deseja excluir este projeto?")) {
        const updated = storage.deleteProjectFromStorage(id);
        setProjects(updated);
    }
  };

  const handleRestoreBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const content = ev.target?.result as string;
          const config = JSON.parse(content);
          
          // Validação básica se é um arquivo de configuração válido
          if (config && typeof config === 'object') {
             onLoadConfig(config);
             alert("Backup restaurado com sucesso!");
          } else {
             alert("O arquivo selecionado não parece ser um backup válido.");
          }
        } catch (error) {
          console.error(error);
          alert("Erro ao ler o arquivo. Certifique-se de que é um JSON válido.");
        }
      };
      reader.readAsText(file);
    }
    // Resetar o input para permitir selecionar o mesmo arquivo novamente se necessário
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  return (
    <div className="border-b border-gray-200 bg-gray-50">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 text-sm font-bold text-gray-700 hover:bg-gray-100 transition-colors"
      >
        <span className="flex items-center gap-2">
          <FolderOpen className="w-4 h-4" /> 
          Galeria Local {projects.length > 0 && <span className="bg-indigo-100 text-indigo-600 px-1.5 rounded-full text-[10px]">{projects.length}</span>}
        </span>
        <span className="text-xs text-gray-400">{isOpen ? 'Fechar' : 'Abrir'}</span>
      </button>

      {isOpen && (
        <div className="p-4 space-y-4 bg-white border-t border-gray-100">
            <div className="flex gap-2">
                <button 
                    onClick={() => storage.exportProjectToFile(currentConfig)}
                    className="flex-1 py-3 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-lg text-[10px] font-bold flex items-center justify-center gap-2 hover:bg-indigo-100 transition-all shadow-sm"
                >
                    <Download className="w-4 h-4" /> Baixar Backup
                </button>
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 py-3 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg text-[10px] font-bold flex items-center justify-center gap-2 hover:bg-emerald-100 transition-all shadow-sm"
                >
                    <Upload className="w-4 h-4" /> Restaurar Backup
                </button>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept=".json" 
                    onChange={handleRestoreBackup}
                />
            </div>

            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Projetos no Navegador</h4>
                    <button onClick={loadProjects} className="text-indigo-500 hover:rotate-180 transition-all">
                        <RefreshCw className="w-3 h-3" />
                    </button>
                </div>
                
                <div className="max-h-60 overflow-y-auto space-y-2 custom-scrollbar">
                    {projects.length === 0 ? (
                        <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                            <p className="text-xs text-gray-400 italic">Nenhum projeto salvo.</p>
                        </div>
                    ) : (
                        projects.map(p => (
                            <div 
                                key={p.id} 
                                onClick={() => onLoadConfig(p.config)}
                                className="flex items-center justify-between p-3 border border-gray-100 rounded-xl hover:border-indigo-300 hover:bg-indigo-50/30 cursor-pointer group transition-all"
                            >
                                <div className="flex-1 overflow-hidden">
                                    <p className="text-sm font-bold text-gray-800 truncate flex items-center gap-1">
                                        {p.name}
                                        <CheckCircle2 className="w-3 h-3 text-green-500" />
                                    </p>
                                    <p className="text-[10px] text-gray-400">
                                        {new Date(p.lastModified).toLocaleDateString()}
                                    </p>
                                </div>
                                <button 
                                    onClick={(e) => handleDelete(p.id, e)}
                                    className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default ProjectManager;
