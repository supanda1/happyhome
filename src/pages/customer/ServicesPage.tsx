import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useServices } from '../../contexts/ServiceContext';
import { Card, CardContent, Button, Input, Select } from '../../components/ui';
import { formatPriceWithDiscount } from '../../utils/priceFormatter';

const ServicesPage: React.FC = () => {
  const { 
    categories, 
    filteredServices, 
    filters,
    loadCategories, 
    loadServices, 
    applyFilters,
    clearFilters,
    loading 
  } = useServices();

  const [searchParams, setSearchParams] = useSearchParams();
  const [localSearchQuery, setLocalSearchQuery] = useState(filters.searchQuery);

  useEffect(() => {
    loadCategories();
    loadServices();
  }, [loadCategories, loadServices]);

  // Handle URL search params
  useEffect(() => {
    const categoryId = searchParams.get('category');
    if (categoryId) {
      applyFilters({ categoryIds: [categoryId] });
    }
  }, [searchParams, applyFilters]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSearchQuery(e.target.value);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters({ searchQuery: localSearchQuery });
  };

  const handleCategoryFilter = (categoryId: string) => {
    const newCategoryIds = filters.categoryIds.includes(categoryId)
      ? filters.categoryIds.filter(id => id !== categoryId)
      : [...filters.categoryIds, categoryId];
    
    applyFilters({ categoryIds: newCategoryIds });
    
    // Update URL params
    if (newCategoryIds.length === 1) {
      setSearchParams({ category: newCategoryIds[0] });
    } else {
      setSearchParams({});
    }
  };

  const handleSortChange = (value: string) => {
    const [sortBy, sortOrder] = value.split('-') as [typeof filters.sortBy, typeof filters.sortOrder];
    applyFilters({ sortBy, sortOrder });
  };

  const handlePriceRangeChange = (min: number, max: number) => {
    applyFilters({ priceRange: { min, max } });
  };

  const handleRatingFilter = (rating: number) => {
    applyFilters({ rating: filters.rating === rating ? 0 : rating });
  };

  const handleClearFilters = () => {
    clearFilters();
    setLocalSearchQuery('');
    setSearchParams({});
  };

  const sortOptions = [
    { value: 'name-asc', label: 'Name (A-Z)' },
    { value: 'name-desc', label: 'Name (Z-A)' },
    { value: 'price-asc', label: 'Price (Low to High)' },
    { value: 'price-desc', label: 'Price (High to Low)' },
    { value: 'rating-desc', label: 'Rating (High to Low)' },
    { value: 'newest-desc', label: 'Newest First' },
  ];

  const priceRanges = [
    { label: 'Under ₹500', min: 0, max: 500 },
    { label: '₹500 - ₹1,000', min: 500, max: 1000 },
    { label: '₹1,000 - ₹2,000', min: 1000, max: 2000 },
    { label: '₹2,000+', min: 2000, max: 10000 },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            All Services
          </h1>
          <p className="text-lg text-gray-600">
            Find the perfect professional service for your home
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <form onSubmit={handleSearchSubmit} className="max-w-2xl">
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Search services..."
                value={localSearchQuery}
                onChange={handleSearchChange}
                className="flex-1"
                startIcon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                }
              />
              <Button type="submit">Search</Button>
            </div>
          </form>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-80 flex-shrink-0">
            <Card className="sticky top-4">
              <CardContent>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleClearFilters}
                    className="text-orange-600"
                  >
                    Clear All
                  </Button>
                </div>

                {/* Sort */}
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">Sort By</h4>
                  <Select
                    options={sortOptions}
                    value={`${filters.sortBy}-${filters.sortOrder}`}
                    onChange={(e) => handleSortChange(e.target.value)}
                    className="w-full"
                  />
                </div>

                {/* Categories */}
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">Categories</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {categories.map((category) => (
                      <label key={category.id} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={filters.categoryIds.includes(category.id)}
                          onChange={() => handleCategoryFilter(category.id)}
                          className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                        />
                        <span className="ml-2 text-sm text-gray-700 flex items-center">
                          <span className="mr-2">{category.icon}</span>
                          {category.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Price Range */}
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">Price Range</h4>
                  <div className="space-y-2">
                    {priceRanges.map((range) => (
                      <label key={range.label} className="flex items-center">
                        <input
                          type="radio"
                          name="priceRange"
                          checked={filters.priceRange.min === range.min && filters.priceRange.max === range.max}
                          onChange={() => handlePriceRangeChange(range.min, range.max)}
                          className="border-gray-300 text-orange-600 focus:ring-orange-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">{range.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Rating */}
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">Minimum Rating</h4>
                  <div className="space-y-2">
                    {[4, 3, 2, 1].map((rating) => (
                      <label key={rating} className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="rating"
                          checked={filters.rating === rating}
                          onChange={() => handleRatingFilter(rating)}
                          className="border-gray-300 text-orange-600 focus:ring-orange-500"
                        />
                        <span className="ml-2 flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <span
                              key={i}
                              className={i < rating ? 'text-yellow-400' : 'text-gray-300'}
                            >
                              ⭐
                            </span>
                          ))}
                          <span className="ml-1 text-sm text-gray-600">& up</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Services Grid */}
          <div className="flex-1">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-600">
                {loading ? 'Loading...' : `${filteredServices.length} services found`}
              </p>
            </div>

            {/* Services List */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <div className="w-full h-48 bg-gray-200 animate-pulse" />
                    <CardContent>
                      <div className="h-4 bg-gray-200 rounded animate-pulse mb-2" />
                      <div className="h-6 bg-gray-200 rounded animate-pulse mb-2" />
                      <div className="h-4 bg-gray-200 rounded animate-pulse mb-4" />
                      <div className="flex justify-between">
                        <div className="h-6 w-16 bg-gray-200 rounded animate-pulse" />
                        <div className="h-8 w-20 bg-gray-200 rounded animate-pulse" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredServices.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No services found
                </h3>
                <p className="text-gray-600 mb-4">
                  Try adjusting your filters or search terms
                </p>
                <Button onClick={handleClearFilters} variant="outline">
                  Clear Filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredServices.map((service) => (
                  <Card key={service.id} hover className="overflow-hidden">
                    <div className="aspect-w-16 aspect-h-9 bg-gray-200">
                      {service.photos[0] ? (
                        <img
                          src={service.photos[0].url}
                          alt={service.photos[0].altText}
                          className="w-full h-48 object-cover"
                        />
                      ) : (
                        <div className="w-full h-48 bg-gradient-to-br from-orange-100 to-purple-200 flex items-center justify-center">
                          <span className="text-4xl">{service.category.icon}</span>
                        </div>
                      )}
                    </div>
                    
                    <CardContent>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-orange-600 font-medium">
                          {service.category.name}
                        </span>
                        {service.rating > 0 && (
                          <div className="flex items-center">
                            <span className="text-yellow-400 mr-1">⭐</span>
                            <span className="text-sm text-gray-600">
                              {service.rating} ({service.reviewCount})
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {service.name}
                      </h3>
                      
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {service.shortDescription}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {service.discountedPrice ? (
                            <>
                              <span className="text-lg font-bold text-orange-600">
                                {formatPriceWithDiscount(service.basePrice, service.discountedPrice).discountedPrice}
                              </span>
                              <span className="text-sm text-gray-500 line-through">
                                {formatPriceWithDiscount(service.basePrice, service.discountedPrice).originalPrice}
                              </span>
                              <span className="text-xs text-green-600 font-medium">
                                {formatPriceWithDiscount(service.basePrice, service.discountedPrice).discountPercentage}
                              </span>
                            </>
                          ) : (
                            <span className="text-lg font-bold text-orange-600">
                              {formatPriceWithDiscount(service.basePrice).displayPrice}
                            </span>
                          )}
                        </div>
                        <Link to={`/services/${service.id}`}>
                          <Button size="sm">
                            View Details
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServicesPage;