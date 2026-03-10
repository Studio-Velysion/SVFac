import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Save } from 'lucide-react';
import { toast } from 'react-toastify';

export default function NotesEditor({ tasksApi, projectId }) {
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (tasksApi) loadNotes();
    else setIsLoading(false);
  }, [projectId, tasksApi]);

  const loadNotes = async () => {
    if (!tasksApi) return;
    try {
      const data = await tasksApi.getNotes(projectId);
      setContent(data?.content || '');
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!tasksApi) return;
    setIsSaving(true);
    try {
      await tasksApi.updateNotes(projectId, content);
      toast.success('Notes sauvegardées');
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-dark-textSecondary">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="bg-dark-surface rounded-lg border border-dark-border overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-dark-border">
        <h3 className="font-semibold text-dark-text">Notes du projet</h3>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-dark-surfaceHover text-white rounded-lg transition-colors"
        >
          <Save size={16} />
          {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
        </button>
      </div>
      <div className="grid grid-cols-2 h-[calc(100vh-400px)]">
        <div className="border-r border-dark-border">
          <div className="p-4 border-b border-dark-border bg-dark-surfaceHover">
            <span className="text-sm font-medium text-dark-textSecondary">Éditeur Markdown</span>
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Écrivez vos notes en Markdown ici..."
            className="w-full h-full p-4 bg-dark-bg text-dark-text resize-none focus:outline-none font-mono text-sm"
          />
        </div>
        <div className="overflow-y-auto">
          <div className="p-4 border-b border-dark-border bg-dark-surfaceHover">
            <span className="text-sm font-medium text-dark-textSecondary">Aperçu</span>
          </div>
          <div className="p-4 prose prose-invert prose-sm max-w-none">
            <ReactMarkdown
              components={{
                h1: ({ children }) => <h1 className="text-2xl font-bold text-dark-text mb-4">{children}</h1>,
                h2: ({ children }) => <h2 className="text-xl font-bold text-dark-text mb-3 mt-6">{children}</h2>,
                p: ({ children }) => <p className="text-dark-text mb-4">{children}</p>,
                ul: ({ children }) => <ul className="list-disc list-inside text-dark-text mb-4 space-y-1">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal list-inside text-dark-text mb-4 space-y-1">{children}</ol>,
                li: ({ children }) => <li className="text-dark-text">{children}</li>,
                strong: ({ children }) => <strong className="font-bold text-dark-text">{children}</strong>,
                em: ({ children }) => <em className="italic text-dark-textSecondary">{children}</em>,
                code: ({ children }) => <code className="bg-dark-surfaceHover px-1 py-0.5 rounded text-sm text-blue-400">{children}</code>,
                pre: ({ children }) => <pre className="bg-dark-surfaceHover p-4 rounded-lg overflow-x-auto mb-4">{children}</pre>,
              }}
            >
              {content || '*Aucune note pour le moment*'}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
}
