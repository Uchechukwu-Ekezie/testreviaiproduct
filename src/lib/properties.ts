// types/property.ts
export interface Property {
  id: string;
  images: string[];
  title: string;
  description: string;
  ai_refined_description: string;
  price: string;
  address: string;
  coordinate: {
    lat: number;
    lng: number;
  } | null;
  property_type: string;
  status: string;
  visibility_status: string;
  bedrooms: string;
  bathrooms: string;
  size: string;
  year_built: string | null;
  review_count: string;
  lot_size: string | null;
  is_added_by_agent: boolean;
  square_footage: string | null;
  state: string | null;
  city: string | null;
  zip_code: string | null;
  image_url: string;
  property_url: string;
  phone: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  embeddings: string;
  environmental_report: unknown | null;
  environmental_score: number | null;
  neighborhood_data: unknown | null;
  neighborhood_score: number | null;
  rental_grade: string | null;
  amenities: string[];
  scrape_status: string;
  scrape_error_message: string | null;
  listed_by: string;
}

// Transform backend property to component format
export const transformProperty = (backendProperty: Property) => {
  // Generate mock coordinates if not available
  const coordinates = backendProperty.coordinate || {
    lat: 6.5244 + (Math.random() - 0.5) * 0.1, // Lagos area with some variance
    lng: 3.3792 + (Math.random() - 0.5) * 0.1,
  };

  // Generate mock rating and reviews
  const rating = 4.0 + Math.random() * 1.0; // 4.0 to 5.0
  const reviews = Math.floor(Math.random() * 50) + 5; // 5 to 55 reviews

  return {
    id: backendProperty.id,
    title: backendProperty.title,
    location: backendProperty.address,
    coordinates,
    rating: Math.round(rating * 10) / 10, // Round to 1 decimal
    reviews,
    price: backendProperty.price,
    bedrooms: parseInt(backendProperty.bedrooms) || 0,
    propertyType: backendProperty.property_type,
    images: backendProperty.image_url || "/Image/house.jpeg", // fallback to default image
    badge:
      backendProperty.status === "just_listing" ? "New Listing" : "Best Value",
    description: backendProperty.description,
    ai_refined_description: backendProperty.ai_refined_description,
    bathrooms: backendProperty.bathrooms,
    size: backendProperty.size,
    phone: backendProperty.phone,
    created_by: backendProperty.created_by,
    amenities: backendProperty.amenities,
    property_url: backendProperty.property_url,
  };
};

// Fetch properties from backend
export const fetchProperties = async (): Promise<Property[]> => {
  try {
    const response = await fetch("https://backend.reviai.ai/property/");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching properties:", error);
    // Return empty array or throw error based on your preference
    throw error;
  }
};
