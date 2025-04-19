// components/CreateListingForm.tsx
import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function CreateListingForm({ onSuccess }: { onSuccess?: () => void }) {
  const [formData, setFormData] = useState({
    location: '',
    school: '',
    price: '',
    beds: '1',
    description: '',
    contact_info: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    if (formData.description.length > 252) {
      setError('La descrizione deve essere massimo 252 caratteri');
      setIsSubmitting(false);
      return;
    }

    const { error } = await supabase
      .from('listings')
      .insert({
        location: formData.location,
        school: formData.school || null,
        price: parseFloat(formData.price),
        beds: parseInt(formData.beds),
        description: formData.description.trim(),
        contact_info: formData.contact_info
      });
      
    setIsSubmitting(false);
    
    if (error) {
      setError('Errore durante la pubblicazione. Riprova più tardi.');
      console.error('Error submitting listing:', error);
    } else {
      // Reset form
      setFormData({
        location: '',
        school: '',
        price: '',
        beds: '1',
        description: '',
        contact_info: ''
      });
      
      if (onSuccess) onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-4 border rounded-lg shadow-sm">
      <h2 className="text-xl font-semibold mb-4">Pubblica un alloggio</h2>
      
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
            Località*
          </label>
          <input
            type="text"
            id="location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            required
            className="w-full border rounded px-3 py-2"
            placeholder="Es. Milano, Quartiere Navigli"
          />
        </div>
        
        <div>
          <label htmlFor="school" className="block text-sm font-medium text-gray-700 mb-1">
            Scuola (opzionale)
          </label>
          <input
            type="text"
            id="school"
            name="school"
            value={formData.school}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            placeholder="Es. Liceo Manzoni"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
            Prezzo mensile (€)*
          </label>
          <input
            type="number"
            id="price"
            name="price"
            value={formData.price}
            onChange={handleChange}
            required
            min="1"
            className="w-full border rounded px-3 py-2"
          />
        </div>
        
        <div>
          <label htmlFor="beds" className="block text-sm font-medium text-gray-700 mb-1">
            Posti letto*
          </label>
          <select
            id="beds"
            name="beds"
            value={formData.beds}
            onChange={handleChange}
            required
            className="w-full border rounded px-3 py-2"
          >
            <option value="1">1 posto</option>
            <option value="2">2 posti</option>
            <option value="3">3 posti</option>
            <option value="4">4+ posti</option>
          </select>
        </div>
      </div>
      
      <div className="mb-4">
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Descrizione* (max 252 caratteri)
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          required
          maxLength={252}
          rows={3}
          className="w-full border rounded px-3 py-2"
          placeholder="Breve descrizione dell'alloggio..."
        />
        <div className="text-xs text-right text-gray-500 mt-1">
          {formData.description.length}/252
        </div>
      </div>
      
      <div className="mb-4">
        <label htmlFor="contact_info" className="block text-sm font-medium text-gray-700 mb-1">
          Contatto*
        </label>
        <input
          type="text"
          id="contact_info"
          name="contact_info"
          value={formData.contact_info}
          onChange={handleChange}
          required
          className="w-full border rounded px-3 py-2"
          placeholder="Email, telefono o altro modo per essere contattati"
        />
      </div>
      
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-blue-600 text-white py-2 rounded font-medium hover:bg-blue-700 disabled:bg-blue-300"
      >
        {isSubmitting ? 'Pubblicazione in corso...' : 'Pubblica annuncio'}
      </button>
    </form>
  );
}
