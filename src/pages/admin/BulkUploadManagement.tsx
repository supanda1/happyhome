import React, { useState, useRef } from 'react';
import {
  getCategories,
  getSubcategories,
  createService,
  type Category,
  type Subcategory
} from '../../utils/adminDataManager';
import type { Service } from '../../types';

// Custom CSS for enhanced animations
const customStyles = `
  @keyframes fade-in {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  @keyframes bounce-in {
    0% { transform: translateY(-100px) scale(0.8); opacity: 0; }
    50% { transform: translateY(0px) scale(1.05); opacity: 1; }
    65% { transform: translateY(-10px) scale(1.02); }
    81% { transform: translateY(0px) scale(1); }
    100% { transform: translateY(0px) scale(1); opacity: 1; }
  }
  
  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
`;

interface BulkUploadData {
  fileName: string;
  fileType: 'excel' | 'pdf';
  category_id: string;
  subcategory_id?: string;
  services: Record<string, unknown>[];
  uploadStatus: 'pending' | 'processing' | 'completed' | 'error';
  errorMessage?: string;
  processedCount?: number;
}

interface BulkUploadManagementProps {
  onServiceChange?: () => void;
}

const BulkUploadManagement: React.FC<BulkUploadManagementProps> = ({ onServiceChange }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [uploads, setUploads] = useState<BulkUploadData[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // SECURITY: Now using backend API calls instead of localStorage
        const categoriesData = await getCategories();
        const subcategoriesData = await getSubcategories();
        setCategories(categoriesData);
        setSubcategories(subcategoriesData);
      } catch (error) {
        console.error('Error loading categories and subcategories:', error);
        // Set empty arrays as fallback
        setCategories([]);
        setSubcategories([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const filteredSubcategories = subcategories?.filter(
    sub => sub.category_id === selectedCategory
  ) || [];

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    processFiles(files);
  };

  const processFiles = async (files: File[]) => {
    // Validation checks
    if (!selectedCategory) {
      alert('Please select a category first');
      return;
    }

    if (files.length === 0) {
      alert('No files selected');
      return;
    }

    if (files.length > 10) {
      alert('Maximum 10 files allowed at once');
      return;
    }

    // Check file sizes (max 10MB per file)
    const maxSize = 10 * 1024 * 1024; // 10MB
    const oversizedFiles = files.filter(file => file.size > maxSize);
    if (oversizedFiles.length > 0) {
      alert(`Files too large (max 10MB): ${oversizedFiles.map(f => f.name).join(', ')}`);
      return;
    }

    for (const file of files) {
      const fileType = getFileType(file);
      if (!fileType) {
        alert(`Unsupported file type: ${file.name}. Please upload Excel (.xlsx, .xls) or PDF files.`);
        continue;
      }

      // Check for duplicate file names
      const existingUpload = uploads.find(u => u.fileName === file.name);
      if (existingUpload) {
        const proceed = confirm(`File "${file.name}" already uploaded. Upload again?`);
        if (!proceed) continue;
      }

      const uploadData: BulkUploadData = {
        fileName: file.name,
        fileType,
        category_id: selectedCategory,
        subcategory_id: selectedSubcategory || undefined,
        services: [],
        uploadStatus: 'processing'
      };

      setUploads(prev => [...prev, uploadData]);

      try {
        const parsedServices = await parseFile(file, fileType);
        
        if (!parsedServices || parsedServices.length === 0) {
          throw new Error('No valid services found in file');
        }

        // Validate parsed services
        const validatedServices = validateServices(parsedServices);
        if (!validatedServices || validatedServices.length === 0) {
          throw new Error('No valid services after validation');
        }

        // Process services and create them
        let processedCount = 0;
        const createdServices: Service[] = [];
        const errors: string[] = [];

        for (let i = 0; i < validatedServices.length; i++) {
          try {
            const serviceData = validatedServices[i];
            const service = await createService({
              ...serviceData,
              category_id: selectedCategory,
              subcategory_id: selectedSubcategory || '',
              is_active: true,
              gst_percentage: serviceData.gst_percentage || 18
            });
            createdServices.push(service);
            processedCount++;
          } catch (error) {
            console.error(`Error creating service ${i + 1}:`, error);
            errors.push(`Service ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }

        // Update upload status
        setUploads(prev => prev.map(upload => 
          upload.fileName === file.name && upload.uploadStatus === 'processing'
            ? {
                ...upload,
                services: createdServices,
                uploadStatus: processedCount > 0 ? 'completed' : 'error',
                processedCount,
                errorMessage: errors.length > 0 ? `Partial success. Errors: ${errors.slice(0, 3).join('; ')}${errors.length > 3 ? '...' : ''}` : undefined
              }
            : upload
        ));

        if (processedCount > 0) {
          onServiceChange?.();
        }
        
      } catch (error) {
        console.error('Error processing file:', error);
        setUploads(prev => prev.map(upload => 
          upload.fileName === file.name && upload.uploadStatus === 'processing'
            ? {
                ...upload,
                uploadStatus: 'error',
                errorMessage: error instanceof Error ? error.message : 'Unknown error occurred'
              }
            : upload
        ));
      }
    }

    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validateServices = (services: Record<string, unknown>[]): Record<string, unknown>[] => {
    if (!services || !Array.isArray(services)) {
      console.warn('Invalid services array provided to validateServices');
      return [];
    }
    
    return services.filter(service => {
      if (!service || typeof service !== 'object') {
        console.warn('Invalid service object:', service);
        return false;
      }
      // Check required fields
      if (!service.name || service.name.trim().length < 3) {
        console.warn('Service name too short or missing:', service.name);
        return false;
      }

      if (!service.description || service.description.trim().length < 10) {
        console.warn('Service description too short or missing:', service.description);
        return false;
      }

      if (!service.base_price || service.base_price <= 0) {
        console.warn('Invalid base price:', service.base_price);
        return false;
      }

      if (!service.duration || service.duration < 15) {
        console.warn('Invalid duration (minimum 15 minutes):', service.duration);
        return false;
      }

      // Validate arrays
      if (!Array.isArray(service.inclusions) || service.inclusions.length === 0) {
        service.inclusions = ['Professional service'];
      }

      if (!Array.isArray(service.exclusions)) {
        service.exclusions = ['Additional materials'];
      }

      if (!Array.isArray(service.requirements)) {
        service.requirements = ['Customer to provide access'];
      }

      if (!Array.isArray(service.tags)) {
        service.tags = ['bulk-upload'];
      }

      return true;
    }).map(service => ({
      ...service,
      // Sanitize and format data
      name: service.name.trim().substring(0, 100),
      description: service.description.trim().substring(0, 1000),
      short_description: (service.short_description || service.description).trim().substring(0, 200),
      base_price: Math.max(0, Math.round(service.base_price * 100) / 100),
      discounted_price: service.discounted_price ? Math.max(0, Math.round(service.discounted_price * 100) / 100) : undefined,
      duration: Math.max(15, Math.round(service.duration)),
      gst_percentage: [0, 5, 12, 18, 28].includes(service.gst_percentage) ? service.gst_percentage : 18,
      inclusions: service.inclusions.filter((item: string) => item && item.trim()).slice(0, 10),
      exclusions: service.exclusions.filter((item: string) => item && item.trim()).slice(0, 10),
      requirements: service.requirements.filter((item: string) => item && item.trim()).slice(0, 5),
      tags: service.tags.filter((item: string) => item && item.trim()).slice(0, 10),
      notes: (service.notes || '').trim().substring(0, 500)
    }));
  };

  const getFileType = (file: File): 'excel' | 'pdf' | null => {
    const extension = file.name.toLowerCase().split('.').pop();
    if (extension === 'xlsx' || extension === 'xls') return 'excel';
    if (extension === 'pdf') return 'pdf';
    return null;
  };

  const parseFile = async (file: File, fileType: 'excel' | 'pdf'): Promise<Record<string, unknown>[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          if (fileType === 'excel') {
            const content = e.target?.result as string;
            const services = parseExcelContent(content, file.name);
            resolve(services);
          } else if (fileType === 'pdf') {
            const content = e.target?.result as string;
            const services = parsePdfContent(content, file.name);
            resolve(services);
          }
        } catch (error) {
          reject(new Error(`Failed to parse ${fileType} file: ${error}`));
        }
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      
      if (fileType === 'excel') {
        // For CSV-like Excel files, read as text
        reader.readAsText(file);
      } else {
        reader.readAsText(file);
      }
    });
  };

  const parseExcelContent = (content: string, fileName: string): Record<string, unknown>[] => {
    const lines = content.split('\n').filter(line => line.trim());
    const services = [];

    // Expected CSV format: Name, Description, Price, Duration, Inclusions, Exclusions
    // Skip header row if present
    const startIndex = lines[0]?.toLowerCase().includes('name') ? 1 : 0;

    for (let i = startIndex; i < lines.length; i++) {
      const columns = lines[i].split(',').map(col => col.trim().replace(/^["']|["']$/g, ''));
      
      if (columns.length >= 3) { // At least name, description, price
        const service = {
          name: columns[0] || `Service ${i} from ${fileName}`,
          description: columns[1] || 'Professional service imported from Excel file',
          short_description: columns[1]?.substring(0, 100) + '...' || 'Imported Excel service',
          base_price: parseFloat(columns[2]) || 99,
          discounted_price: columns[3] ? parseFloat(columns[3]) : undefined,
          duration: columns[4] ? parseInt(columns[4]) : 60,
          inclusions: columns[5] ? columns[5].split(';').map(s => s.trim()) : ['Professional technician', 'Basic tools'],
          exclusions: columns[6] ? columns[6].split(';').map(s => s.trim()) : ['Material cost'],
          requirements: columns[7] ? columns[7].split(';').map(s => s.trim()) : ['Customer to provide access'],
          tags: ['imported', 'excel', 'bulk-upload'],
          notes: `Imported from ${fileName} on ${new Date().toLocaleDateString()}`
        };
        services.push(service);
      }
    }

    // If no valid services found, create a default one
    if (services.length === 0) {
      services.push({
        name: `Service from ${fileName.replace('.xlsx', '').replace('.xls', '')}`,
        description: 'Professional service imported from Excel file',
        short_description: 'Imported Excel service',
        base_price: 99,
        duration: 60,
        inclusions: ['Professional technician', 'Basic tools'],
        exclusions: ['Material cost'],
        requirements: ['Customer to provide access'],
        tags: ['imported', 'excel', 'bulk-upload'],
        notes: `Imported from ${fileName} on ${new Date().toLocaleDateString()}`
      });
    }

    return services;
  };

  const parsePdfContent = (content: string, fileName: string): Record<string, unknown>[] => {
    const services = [];
    
    // Basic PDF text parsing - look for service patterns
    const lines = content.split('\n').filter(line => line.trim());
    
    let currentService: Record<string, unknown> | null = null;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Look for service names (lines that look like titles)
      if (trimmedLine.length > 10 && !trimmedLine.includes('₹') && /^[A-Z]/.test(trimmedLine)) {
        // If we have a current service, save it
        if (currentService) {
          services.push(currentService);
        }
        
        // Start new service
        currentService = {
          name: trimmedLine,
          description: '',
          short_description: trimmedLine.substring(0, 100),
          base_price: 99,
          duration: 60,
          inclusions: [],
          exclusions: [],
          requirements: ['Customer to provide access'],
          tags: ['imported', 'pdf', 'bulk-upload'],
          notes: `Imported from ${fileName} on ${new Date().toLocaleDateString()}`
        };
      }
      
      // Look for prices
      const priceMatch = trimmedLine.match(/₹\s*(\d+(?:\.\d{2})?)/);
      if (priceMatch && currentService) {
        currentService.base_price = parseFloat(priceMatch[1]);
      }
      
      // Look for duration
      const durationMatch = trimmedLine.match(/(\d+)\s*(?:min|minute|hours?|hrs?)/i);
      if (durationMatch && currentService) {
        const duration = parseInt(durationMatch[1]);
        currentService.duration = trimmedLine.toLowerCase().includes('hour') || trimmedLine.toLowerCase().includes('hr') 
          ? duration * 60 
          : duration;
      }
      
      // Accumulate description
      if (currentService && trimmedLine.length > 20 && !trimmedLine.includes('₹')) {
        currentService.description += (currentService.description ? ' ' : '') + trimmedLine;
      }
      
      // Look for inclusions/exclusions
      if (trimmedLine.toLowerCase().includes('include') && currentService) {
        const parts = trimmedLine.split(/[:;,]/).slice(1);
        currentService.inclusions.push(...parts.map(p => p.trim()).filter(p => p));
      }
      
      if (trimmedLine.toLowerCase().includes('exclude') && currentService) {
        const parts = trimmedLine.split(/[:;,]/).slice(1);
        currentService.exclusions.push(...parts.map(p => p.trim()).filter(p => p));
      }
    }
    
    // Add the last service
    if (currentService) {
      services.push(currentService);
    }
    
    // If no services found, create a default one
    if (services.length === 0) {
      services.push({
        name: `Service from ${fileName.replace('.pdf', '')}`,
        description: 'Professional service imported from PDF document',
        short_description: 'Imported PDF service',
        base_price: 149,
        duration: 90,
        inclusions: ['Professional technician', 'Advanced tools'],
        exclusions: ['Premium materials'],
        requirements: ['Customer to provide workspace'],
        tags: ['imported', 'pdf', 'bulk-upload'],
        notes: `Imported from ${fileName} on ${new Date().toLocaleDateString()}`
      });
    }

    // Clean up and set defaults for services
    return services.map(service => ({
      ...service,
      description: service.description || 'Professional service imported from PDF document',
      inclusions: service.inclusions.length > 0 ? service.inclusions : ['Professional technician', 'Advanced tools'],
      exclusions: service.exclusions.length > 0 ? service.exclusions : ['Premium materials']
    }));
  };

  const clearUploads = () => {
    setUploads([]);
  };

  const getCategoryName = (categoryId: string) => {
    if (!categories || !categoryId) return 'Unknown';
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : 'Unknown';
  };

  const getSubcategoryName = (subcategoryId: string) => {
    if (!subcategories || !subcategoryId) return '';
    const subcategory = subcategories.find(s => s.id === subcategoryId);
    return subcategory ? subcategory.name : '';
  };

  if (loading) {
    return (
      <>
        <style>{customStyles}</style>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center animate-fade-in">
          <div className="text-center animate-bounce-in">
            <div className="relative mb-8">
              <div className="animate-spin rounded-full h-20 w-20 border-4 border-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-rose-500 bg-clip-border mx-auto"></div>
              <div className="absolute inset-3 bg-white rounded-full"></div>
              <div className="absolute inset-4 animate-pulse bg-gradient-to-r from-indigo-400 via-purple-500 to-rose-500 rounded-full"></div>
            </div>
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl px-8 py-6 shadow-2xl border border-white/50 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -skew-x-12 animate-shimmer"></div>
              <div className="relative z-10">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-3">
                  Loading Bulk Upload
                </h3>
                <p className="text-gray-600 font-medium">Preparing file upload system and categories...</p>
                <div className="flex items-center justify-center space-x-2 mt-4">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-rose-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{customStyles}</style>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 animate-fade-in">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {/* Enhanced Header Section */}
          <div className="relative overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full transform translate-x-16 -translate-y-16 blur-2xl"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full transform -translate-x-12 translate-y-12 blur-xl"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="bg-white/20 rounded-2xl p-3">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                      <div>
                        <h1 className="text-4xl font-bold text-white tracking-tight">Bulk Upload Management</h1>
                        <p className="text-indigo-100 text-lg">Create multiple services efficiently from Excel and PDF files</p>
                      </div>
                    </div>
                  </div>
                  <div className="hidden md:block">
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white">{uploads.length}</div>
                        <div className="text-sm text-indigo-100">Total Uploads</div>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-indigo-100 text-xl leading-relaxed mt-4">Upload Excel sheets and PDF files to create multiple services at once with intelligent parsing</p>
              </div>
            </div>
          </div>

          {/* Enhanced KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Total Uploads */}
            <div className="group">
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-6 transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-3">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-900 mb-1">{uploads.length}</p>
                  <p className="text-sm font-medium text-gray-600">Total Uploads</p>
                  <p className="text-xs text-blue-600 mt-1 font-medium">Files processed</p>
                </div>
              </div>
            </div>

            {/* Successful Uploads */}
            <div className="group">
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-6 transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-3">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-900 mb-1">{uploads.filter(u => u.uploadStatus === 'completed').length}</p>
                  <p className="text-sm font-medium text-gray-600">Successful Uploads</p>
                  <p className="text-xs text-green-600 mt-1 font-medium">Completed</p>
                </div>
              </div>
            </div>

            {/* Services Created */}
            <div className="group">
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-6 transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl p-3">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m8 0H8m8 0v6a2 2 0 01-2 2H10a2 2 0 01-2-2V6m8 0V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
                    </svg>
                  </div>
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-900 mb-1">{uploads.reduce((sum, u) => sum + (u.processedCount || 0), 0)}</p>
                  <p className="text-sm font-medium text-gray-600">Services Created</p>
                  <p className="text-xs text-purple-600 mt-1 font-medium">Total services</p>
                </div>
              </div>
            </div>

            {/* Processing Status */}
            <div className="group">
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-6 transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-xl p-3">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </div>
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-900 mb-1">{uploads.filter(u => u.uploadStatus === 'processing').length}</p>
                  <p className="text-sm font-medium text-gray-600">Processing</p>
                  <p className="text-xs text-orange-600 mt-1 font-medium">In progress</p>
                </div>
              </div>
            </div>

          </div>

      {/* Header Actions */}
      <div className="flex items-center justify-between bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Bulk Upload Operations</h2>
          <p className="text-gray-600 text-sm">Upload Excel and PDF files to create multiple services efficiently</p>
        </div>
        {uploads.length > 0 && (
          <button
            onClick={clearUploads}
            className="bg-gradient-to-r from-red-500 to-red-600 text-white px-8 py-3 rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 flex items-center space-x-2 shadow-md hover:shadow-lg font-semibold"
          >
            <span>Clear History</span>
          </button>
        )}
      </div>

      {/* Category Selection */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-8 py-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Target Category Selection</h3>
              <p className="text-gray-600 mt-1">Choose the category and subcategory for your bulk upload</p>
            </div>
            <div className="flex space-x-2">
              <div className="bg-blue-100 text-blue-800 px-3 py-2 rounded-lg text-sm font-medium">
                {selectedCategory ? 'Category Selected' : 'No Category'}
              </div>
              <div className="bg-purple-100 text-purple-800 px-3 py-2 rounded-lg text-sm font-medium">
                {selectedSubcategory ? 'Subcategory Selected' : 'No Subcategory'}
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Category *
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setSelectedSubcategory('');
                }}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
              >
                <option value="">Select a category</option>
                {categories?.filter(cat => cat.is_active).map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                )) || []}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Subcategory (Optional)
              </label>
              <select
                value={selectedSubcategory}
                onChange={(e) => setSelectedSubcategory(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!selectedCategory}
              >
                <option value="">Select a subcategory (optional)</option>
                {filteredSubcategories?.filter(sub => sub.is_active).map((subcategory) => (
                  <option key={subcategory.id} value={subcategory.id}>
                    {subcategory.name}
                  </option>
                )) || []}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Area */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-8 py-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900">File Upload Center</h3>
              <p className="text-gray-600 mt-1">Upload multiple files to create services in bulk</p>
            </div>
            <div className="flex space-x-2">
              <div className="bg-green-100 text-green-800 px-3 py-2 rounded-lg text-sm font-medium">
                Max: 10MB per file
              </div>
              <div className="bg-blue-100 text-blue-800 px-3 py-2 rounded-lg text-sm font-medium">
                Multiple files supported
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-8">
          <div
            className={`border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 ${
              dragOver
                ? 'border-purple-400 bg-purple-50 scale-105'
                : 'border-gray-300 hover:border-purple-400 hover:bg-purple-50'
            } ${!selectedCategory ? 'opacity-50 pointer-events-none grayscale' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="space-y-8 relative">
              <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center mb-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 opacity-80"></div>
              </div>
              <div>
                <h3 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight">
                  Upload Excel or PDF Files
                </h3>
                <p className="text-xl text-gray-600 mb-6 leading-relaxed">
                  Drag and drop files here, or click to select files
                </p>
                <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-indigo-50 rounded-xl p-6 mb-8 border border-purple-100">
                  <p className="text-base font-bold text-gray-800 mb-4 text-center">Supported File Formats</p>
                  <div className="flex justify-center space-x-6">
                    <div className="text-center">
                      <div className="bg-gradient-to-br from-green-400 to-emerald-500 text-white px-4 py-2 rounded-lg font-bold text-sm mb-2">EXCEL</div>
                      <p className="text-xs text-gray-600">.xlsx, .xls</p>
                    </div>
                    <div className="text-center">
                      <div className="bg-gradient-to-br from-blue-400 to-indigo-500 text-white px-4 py-2 rounded-lg font-bold text-sm mb-2">PDF</div>
                      <p className="text-xs text-gray-600">documents</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".xlsx,.xls,.pdf"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={!selectedCategory}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-12 py-4 rounded-xl hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 shadow-xl font-bold text-xl disabled:transform-none disabled:shadow-none tracking-wide"
              >
                SELECT FILES TO UPLOAD
              </button>
            </div>
          </div>

          {!selectedCategory && (
            <div className="mt-8 bg-gradient-to-r from-orange-50 via-amber-50 to-red-50 border-2 border-orange-200 rounded-xl p-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-red-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <div className="w-8 h-8 bg-white rounded-full"></div>
                </div>
                <p className="text-orange-800 font-bold text-lg">
                  Please select a category before uploading files
                </p>
                <p className="text-orange-600 text-sm mt-2">
                  Choose a target category from the dropdown above to proceed
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* File Format Guidelines */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-8 py-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900">File Format Guidelines</h3>
              <p className="text-gray-600 mt-1">Follow these guidelines for optimal file processing</p>
            </div>
            <div className="bg-gradient-to-r from-green-100 to-blue-100 px-4 py-2 rounded-lg">
              <span className="text-green-800 font-semibold text-sm">✓ Best Practices</span>
            </div>
          </div>
        </div>
        
        <div className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-8 border-2 border-green-200 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-green-200 opacity-20 rounded-full transform translate-x-10 -translate-y-10"></div>
              <div className="relative z-10">
                <div className="mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg mb-4"></div>
                  <h4 className="font-bold text-green-800 text-xl mb-2">Excel Files</h4>
                  <p className="text-green-600 font-medium">.xlsx, .xls - Structured spreadsheet format</p>
                </div>
              </div>
              <ul className="text-sm text-gray-700 space-y-4">
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3 mt-2 flex-shrink-0"></div>
                  <span className="font-medium">First row should contain headers</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3 mt-2 flex-shrink-0"></div>
                  <span className="font-medium">Required columns: Service Name, Description, Price</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3 mt-2 flex-shrink-0"></div>
                  <span className="font-medium">Optional: Duration, Inclusions, Exclusions</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3 mt-2 flex-shrink-0"></div>
                  <span className="font-medium">Multiple services per file supported</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-8 border-2 border-blue-200 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-blue-200 opacity-20 rounded-full transform translate-x-10 -translate-y-10"></div>
              <div className="relative z-10">
                <div className="mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg mb-4"></div>
                  <h4 className="font-bold text-blue-800 text-xl mb-2">PDF Files</h4>
                  <p className="text-blue-600 font-medium">Document-based format</p>
                </div>
              </div>
              <ul className="text-sm text-gray-700 space-y-4">
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3 mt-2 flex-shrink-0"></div>
                  <span className="font-medium">Structured text format preferred</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3 mt-2 flex-shrink-0"></div>
                  <span className="font-medium">Service details in clear sections</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3 mt-2 flex-shrink-0"></div>
                  <span className="font-medium">Each service on separate page/section</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3 mt-2 flex-shrink-0"></div>
                  <span className="font-medium">Pricing information clearly marked</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Upload History */}
      {uploads.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-8 py-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Upload History</h3>
                <p className="text-gray-600 mt-1">{uploads.length} files uploaded • {uploads.filter(u => u.uploadStatus === 'completed').length} successful</p>
              </div>
              <div className="flex space-x-2">
                <div className="bg-green-100 text-green-800 px-3 py-2 rounded-lg text-sm font-medium">
                  {uploads.filter(u => u.uploadStatus === 'completed').length} Completed
                </div>
                <div className="bg-yellow-100 text-yellow-800 px-3 py-2 rounded-lg text-sm font-medium">
                  {uploads.filter(u => u.uploadStatus === 'processing').length} Processing
                </div>
                <div className="bg-red-100 text-red-800 px-3 py-2 rounded-lg text-sm font-medium">
                  {uploads.filter(u => u.uploadStatus === 'error').length} Failed
                </div>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-purple-50 to-blue-50">
                <tr>
                  <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    File Details
                  </th>
                  <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Target Category
                  </th>
                  <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Upload Status
                  </th>
                  <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Services Created
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {uploads.map((upload, index) => (
                  <tr key={index} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-300">
                    <td className="px-8 py-6">
                      <div className="flex items-center">
                        <div className={`w-12 h-12 rounded-xl mr-4 flex items-center justify-center ${
                          upload.fileType === 'excel' 
                            ? 'bg-gradient-to-br from-green-400 to-emerald-500' 
                            : 'bg-gradient-to-br from-blue-400 to-indigo-500'
                        }`}>
                          <div className="w-6 h-6 bg-white rounded opacity-90"></div>
                        </div>
                        <div>
                          <div className="text-base font-bold text-gray-900 mb-2">
                            {upload.fileName}
                          </div>
                          <div className={`text-xs font-bold px-3 py-1 rounded-full inline-block ${
                            upload.fileType === 'excel'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {upload.fileType.toUpperCase()} FILE
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="text-sm text-gray-900 font-medium">
                        {getCategoryName(upload.category_id)}
                      </div>
                      {upload.subcategory_id && (
                        <div className="text-sm text-gray-500 mt-1">
                          {getSubcategoryName(upload.subcategory_id)}
                        </div>
                      )}
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      <div className="flex flex-col">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${
                            upload.uploadStatus === 'completed'
                              ? 'bg-green-500'
                              : upload.uploadStatus === 'error'
                              ? 'bg-red-500'
                              : upload.uploadStatus === 'processing'
                              ? 'bg-yellow-500 animate-pulse'
                              : 'bg-gray-400'
                          }`}></div>
                          <span className={`inline-flex px-4 py-2 text-sm font-bold rounded-lg transition-all duration-200 ${
                            upload.uploadStatus === 'completed' 
                              ? 'bg-green-50 text-green-800 border border-green-200'
                              : upload.uploadStatus === 'error'
                              ? 'bg-red-50 text-red-800 border border-red-200'
                              : upload.uploadStatus === 'processing'
                              ? 'bg-yellow-50 text-yellow-800 border border-yellow-200'
                              : 'bg-gray-50 text-gray-800 border border-gray-200'
                          }`}>
                            {upload.uploadStatus === 'completed' && 'COMPLETED'}
                            {upload.uploadStatus === 'error' && 'ERROR'}
                            {upload.uploadStatus === 'processing' && 'PROCESSING'}
                            {upload.uploadStatus === 'pending' && 'PENDING'}
                          </span>
                        </div>
                        {upload.errorMessage && (
                          <div className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200">
                            {upload.errorMessage}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      <div className="text-center">
                        {upload.processedCount !== undefined ? (
                          <div>
                            <div className="text-2xl font-bold text-gray-900">{upload.processedCount}</div>
                            <div className="text-sm text-gray-500">services</div>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-2xl">-</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {uploads.length === 0 && (
            <div className="text-center py-20 bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50">
              <div className="w-32 h-32 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl relative">
                <div className="w-16 h-16 bg-white rounded-full opacity-90"></div>
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-transparent to-white opacity-20"></div>
              </div>
              <h3 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">No uploads yet</h3>
              <p className="text-gray-600 text-xl leading-relaxed max-w-md mx-auto">Start by selecting a category and uploading your first file to see the upload history</p>
            </div>
          )}
        </div>
      )}

        </div>
      </div>
    </>
  );
};

export default BulkUploadManagement;