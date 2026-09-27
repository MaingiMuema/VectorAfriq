'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { FaEdit, FaTrash, FaPlus, FaCloudUploadAlt } from 'react-icons/fa';
import toast from 'react-hot-toast';

interface Partner {
  id: number;
  name: string;
  logo: string;
  link: string;
}

function normalizePartnerLink(link: string): string {
  if (!link) return "#";
  if (link.startsWith("http://") || link.startsWith("https://")) return link;
  return `https://${link}`;
}

export default function PartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    logo: '',
    link: ''
  });

  const fetchPartners = async () => {
    try {
      const response = await fetch('/api/admin/partners');
      if (!response.ok) throw new Error('Failed to fetch partners');
      const data = await response.json();
      
      const partnersList = Array.isArray(data.partners) ? data.partners.map((partner: Partner) => {
        const logo = partner.logo;
        if (!logo) return { ...partner, logo: '/images/placeholder.png' };
        
        if (logo.startsWith('/api/images/serve/')) return partner;
        
        if (logo.startsWith('/api/images/partners/')) {
          const filename = logo.split('/api/images/partners/')[1];
          return { ...partner, logo: `/api/images/serve/partners/${filename}` };
        }
        
        const filename = logo.includes('/') ? logo.split('/')[logo.split('/').length - 1] : logo;
        return { ...partner, logo: `/api/images/serve/partners/${filename}` };
      }) : [];
      
      setPartners(partnersList);
    } catch (error) {
      console.error('Error fetching partners:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  const handleImageUpload = async (file: File) => {
    const uploadToast = toast.loading('Uploading image...');
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/admin/partners/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      const data = await response.json();
      toast.success('Image uploaded successfully', { id: uploadToast });
      return data.path;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image', { id: uploadToast });
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const submitToast = toast.loading(editingPartner ? 'Updating partner...' : 'Creating partner...');
    try {
      // Upload image if provided
      const fileInput = document.querySelector<HTMLInputElement>('#logo-upload');
      const logo = fileInput?.files?.length
        ? await handleImageUpload(fileInput.files[0])
        : formData.logo;

      let url = '/api/admin/partners';
      let method = 'POST';

      if (editingPartner?.id) {
        url = `/api/admin/partners/${editingPartner.id}`;
        method = 'PUT';
      }
      
      console.log('Sending request:', { url, method, logo });
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, logo }),
      });

      if (!response.ok) throw new Error('Failed to save partner');
      
      await fetchPartners();
      toast.success(
        editingPartner ? 'Partner updated successfully' : 'Partner created successfully',
        { id: submitToast }
      );
      setShowForm(false);
      setEditingPartner(null);
      setFormData({ name: '', logo: '', link: '' });
    } catch (error) {
      console.error('Error saving partner:', error);
      toast.error('Failed to save partner', { id: submitToast });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this partner?')) return;
    
    const deleteToast = toast.loading('Deleting partner...');
    try {
      const response = await fetch(`/api/admin/partners/${id}`, {
        headers: { 'Content-Type': 'application/json' },
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete partner');
      
      toast.success('Partner deleted successfully', { id: deleteToast });
      await fetchPartners();
    } catch (error) {
      console.error('Error deleting partner:', error);
      toast.error('Failed to delete partner', { id: deleteToast });
    }
  };

  const handleEdit = (partner: Partner) => {
    setEditingPartner(partner);
    setFormData({
      name: partner.name,
      logo: partner.logo,
      link: partner.link,
    });
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Partners Management</h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-[#468AD1] text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-[#468AD1]/90"
        >
          <FaPlus /> Add Partner
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-4">
            {editingPartner ? 'Edit Partner' : 'Add New Partner'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Partner Name
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#468AD1] focus:ring-[#468AD1]"
                  required
                />
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Logo
                <div className="mt-1 flex items-center gap-4">
                  {formData.logo && (
                    <div className="relative w-24 h-24 border rounded-lg overflow-hidden">
                      <Image
                        src={formData.logo?.startsWith('data:') ? formData.logo : (formData.logo || '/images/placeholder.png')}
                        alt="Partner logo preview"
                        fill
                        className="object-contain"
                        unoptimized
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <input
                      id="logo-upload"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setFormData({ ...formData, logo: reader.result as string });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => document.getElementById('logo-upload')?.click()}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#468AD1]"
                    >
                      <FaCloudUploadAlt className="w-5 h-5 mr-2" />
                      Upload Logo
                    </button>
                  </div>
                </div>
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Partner Link
                <input
                  type="text"
                  value={formData.link}
                  onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#468AD1] focus:ring-[#468AD1]"
                  required
                />
              </label>
            </div>
            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingPartner(null);
                  setFormData({ name: '', logo: '', link: '' });
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#468AD1] text-white rounded-md hover:bg-[#468AD1]/90"
              >
                {editingPartner ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {partners.map((partner) => (
            <div key={partner.id} className="bg-white p-6 rounded-lg shadow">
              <div className="relative h-32 w-full mb-4">
                <Image
                  src={partner.logo}
                  alt={partner.name}
                  fill
                  className="object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/images/placeholder.png';
                  }}
                />
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold">{partner.name}</h3>
                  <a
                    href={normalizePartnerLink(partner.link)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-[#468AD1] hover:underline"
                  >
                    View Partner
                  </a>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(partner)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => handleDelete(partner.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}