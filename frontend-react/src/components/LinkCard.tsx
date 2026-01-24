import React from 'react';
import type { Link } from '../types';

interface LinkCardProps {
  link: Link;
  onEdit: (link: Link) => void;
  onDelete: (id: number) => void;
}

const LinkCard: React.FC<LinkCardProps> = ({ link, onEdit, onDelete }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="bg-card p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-1 border-l-4 border-primary">
      <div className="mb-4">
        <h3 className="text-xl font-bold text-text-primary mb-2">{link.title}</h3>
        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline text-sm break-all"
        >
          {link.url}
        </a>
        {link.description && (
          <p className="text-text-secondary mt-3 leading-relaxed">{link.description}</p>
        )}
      </div>

      <div className="flex items-center gap-3 flex-wrap mb-4">
        {link.category && (
          <span className="px-3 py-1 bg-primary text-white rounded-full text-sm font-medium">
            {link.category}
          </span>
        )}
        <span className="text-text-secondary text-sm">
          Added: {formatDate(link.created_at)}
        </span>
      </div>

      <div className="flex gap-2">
        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition text-center"
        >
          Visit
        </a>
        <button
          onClick={() => onEdit(link)}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(link.id)}
          className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition"
        >
          Delete
        </button>
      </div>
    </div>
  );
};

export default LinkCard;
