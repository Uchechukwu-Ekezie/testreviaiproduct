"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowLeft,
  Bed,
  Bath,
  Square,
  Home,
  Grid3X3,
  Star,
  Wifi,
  Car,
  Shield,
  Zap,
  Dumbbell,
  Waves,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useProperties } from "@/contexts/properties-context";
import { useReviews } from "@/contexts/reviews-context";
import PropertyChatWidget from "@/components/property/PropertyChatWidget";
import { PropertyReviewForm } from "@/components/property-review-form";
import { useAuth } from "@/contexts/auth-context";
import { followAPI } from "@/lib/api";

const amenityIcons: { [key: string]: React.ReactNode } = {
  "Swimming Pool": <Waves className="w-5 h-5" />,
  "Gym & Fitness": <Dumbbell className="w-5 h-5" />,
  "Parking Space": <Car className="w-5 h-5" />,
  "24/7 Security": <Shield className="w-5 h-5" />,
  "Backup Power": <Zap className="w-5 h-5" />,
  "High-Speed Wifi": <Wifi className="w-5 h-5" />,
};

export default function PropertyDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { getPropertyById } = useProperties();
  const { getReviewsByPropertyId } = useReviews();
  const { user, isAuthenticated } = useAuth();

  const [property, setProperty] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [selectedImage, setSelectedImage] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingReviews, setIsLoadingReviews] = useState(true);

  const id = params?.id as string;

  // Load property
  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    getPropertyById(id)
      .then(setProperty)
      .finally(() => setIsLoading(false));
  }, [id, getPropertyById]);

  // Load reviews - fetch directly by property ID
  const loadReviews = async () => {
    if (!id) return;
    
    setIsLoadingReviews(true);
    console.log("Loading reviews for property:", id);
    const loadedReviews = await getReviewsByPropertyId(id);
    console.log("Loaded reviews:", loadedReviews.length, loadedReviews);

    // Extract unique user IDs from reviews
    const userIds = new Set<string>();
    loadedReviews.forEach((r: any) => {
      if (r.user_id) userIds.add(r.user_id);
      if (r.user && typeof r.user === 'string') userIds.add(r.user);
      if (r.user && typeof r.user === 'object' && r.user.id) userIds.add(r.user.id);
    });

    // Fetch user data for all reviewers
    const userDataMap = new Map<string, any>();
    await Promise.all(
      Array.from(userIds).map(async (userId: string) => {
        try {
          const userStats = await followAPI.getUserFollowStats(userId);
          userDataMap.set(userId, {
            id: userStats.id,
            name: `${userStats.first_name || ""} ${userStats.last_name || ""}`.trim() || userStats.username || "Anonymous",
            email: userStats.email,
            avatar: userStats.avatar,
          });
        } catch (error) {
          console.error(`Failed to fetch user data for ${userId}:`, error);
          userDataMap.set(userId, {
            id: userId,
            name: "Anonymous",
            email: null,
            avatar: undefined,
          });
        }
      })
    );

    const validReviews = loadedReviews
      .filter((r: any) => {
        // Filter approved or pending reviews
        if (!r || (r.status !== "approved" && r.status !== "pending")) {
          console.log("Filtered out review:", r?.id, r?.status);
          return false;
        }
        return true;
      })
      .map((r: any) => {
        // Get user ID from various possible fields
        const userId = r.user_id || (typeof r.user === 'string' ? r.user : r.user?.id);
        
        // Get user data from map or use existing user object
        const userData = userId && userDataMap.has(userId)
          ? userDataMap.get(userId)
          : (r.user && typeof r.user === 'object' ? r.user : {
              id: userId || null,
              name: "Anonymous",
              email: null,
              avatar: undefined,
            });

        return {
          ...r,
          user: userData,
        };
      })
      .sort(
        (a: any, b: any) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

    console.log("Valid reviews after filtering and transformation:", validReviews.length);
    setReviews(validReviews);
    setIsLoadingReviews(false);
  };

  useEffect(() => {
    loadReviews();
  }, [id, getReviewsByPropertyId]);

  // Gallery
  const gallery = React.useMemo(() => {
    if (property?.images?.length > 0) {
      const images = property.images
        .sort(
          (a: any, b: any) => (a.display_order || 0) - (b.display_order || 0)
        )
        .map((img: any) => img.image_url || img.url)
        .filter((url: string) => url);
      console.log("Using images array:", images);
      return images.length > 0 ? images : ["/placeholder.svg"];
    }

    if (property?.image_urls?.length > 0) {
      const images = property.image_urls
        .sort(
          (a: any, b: any) => (a.display_order || 0) - (b.display_order || 0)
        )
        .map((img: any) => img.url || img.image_url)
        .filter((url: string) => url);
      console.log("Using image_urls array:", images);
      return images.length > 0 ? images : ["/placeholder.svg"];
    }

    if (property?.image_url) {
      console.log("Using singular image_url:", property.image_url);
      return [property.image_url];
    }

    console.log("No images found, using placeholder");
    return ["/placeholder.svg"];
  }, [property?.images, property?.image_urls, property?.image_url]);

  const mainImage = gallery[0];

  const allAmenities = property?.amenities
    ? [
        ...(property.amenities.indoor || []),
        ...(property.amenities.kitchen || []),
        ...(property.amenities.bathroom || []),
        ...(property.amenities.utility || []),
        ...(property.amenities.outdoor || []),
        ...(property.amenities.security || []),
      ]
    : [];

  const minSwipeDistance = 50;
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };
  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd || !gallery.length) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe)
      setSelectedImage((prev) => (prev < gallery.length - 1 ? prev + 1 : 0));
    if (isRightSwipe)
      setSelectedImage((prev) => (prev > 0 ? prev - 1 : gallery.length - 1));
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex">
          <div className="flex-1 pt-10">
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
              <div className="max-w-4xl mx-auto px-4 py-4">
                <Button
                  variant="ghost"
                  onClick={() => router.back()}
                  className="text-foreground hover:bg-secondary/50 p-2"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </div>
            </div>
            <div className="max-w-4xl mx-auto px-4 py-6">
              {/* Image Gallery Skeleton */}
              <div className="mb-8">
                <div className="w-full h-80 lg:h-96 bg-muted animate-pulse rounded-2xl"></div>
              </div>
              {/* Title Skeleton */}
              <div className="mb-8">
                <div className="h-8 bg-muted animate-pulse rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-muted animate-pulse rounded w-1/2 mb-4"></div>
                <div className="flex gap-6 mb-4">
                  <div className="h-6 bg-muted animate-pulse rounded w-20"></div>
                  <div className="h-6 bg-muted animate-pulse rounded w-20"></div>
                  <div className="h-6 bg-muted animate-pulse rounded w-20"></div>
                </div>
                <div className="h-10 bg-muted animate-pulse rounded w-40 mb-6"></div>
              </div>
              {/* Description Skeleton */}
              <div className="mb-8">
                <div className="h-6 bg-muted animate-pulse rounded w-48 mb-4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-muted animate-pulse rounded"></div>
                  <div className="h-4 bg-muted animate-pulse rounded"></div>
                  <div className="h-4 bg-muted animate-pulse rounded w-5/6"></div>
                </div>
              </div>
              {/* Amenities Skeleton */}
              <div className="mb-8">
                <div className="h-6 bg-muted animate-pulse rounded w-32 mb-6"></div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className="h-16 bg-muted animate-pulse rounded-lg"
                    ></div>
                  ))}
                </div>
              </div>
              {/* Reviews Skeleton */}
              <div className="mb-8 pb-24">
                <div className="h-6 bg-muted animate-pulse rounded w-32 mb-6"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className="bg-card rounded-lg p-4 border border-border"
                    >
                      <div className="flex gap-3 mb-3">
                        <div className="w-10 h-10 bg-muted animate-pulse rounded-full"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-muted animate-pulse rounded w-32 mb-2"></div>
                          <div className="h-3 bg-muted animate-pulse rounded w-24"></div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-3 bg-muted animate-pulse rounded"></div>
                        <div className="h-3 bg-muted animate-pulse rounded"></div>
                        <div className="h-3 bg-muted animate-pulse rounded w-4/5"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <div className="flex-1 pt-10">
          <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
            <div className="max-w-4xl mx-auto px-4 py-4">
              <Button
                variant="ghost"
                onClick={() => router.back()}
                className="text-foreground hover:bg-secondary/50 p-2"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </div>
          </div>

          <div className="max-w-4xl mx-auto px-4 py-6">
            {/* Image Gallery */}
            <div className="mb-8">
              <div className="lg:hidden">
                <div className="relative">
                  <div
                    className="overflow-hidden rounded-2xl"
                    onTouchStart={onTouchStart}
                    onTouchMove={onTouchMove}
                    onTouchEnd={onTouchEnd}
                  >
                    <div
                      className="flex transition-transform duration-300 ease-in-out"
                      style={{
                        transform: `translateX(-${selectedImage * 100}%)`,
                      }}
                    >
                      {gallery.map((image: string, index: number) => (
                        <div key={index} className="w-full flex-shrink-0">
                          <div className="relative h-80 w-full">
                            <Image
                              src={image}
                              alt={`${property?.title || "Property"} ${
                                index + 1
                              }`}
                              fill
                              className="object-cover"
                              unoptimized={image?.startsWith("http")}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {gallery.length > 1 && (
                    <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                      {selectedImage + 1} / {gallery.length}
                    </div>
                  )}
                  {gallery.length > 1 && (
                    <div className="flex justify-center gap-2 mt-4">
                      {gallery.map((_: any, index: number) => (
                        <button
                          key={index}
                          onClick={() => setSelectedImage(index)}
                          className={cn(
                            "w-2 h-2 rounded-full transition-colors",
                            selectedImage === index
                              ? "bg-primary"
                              : "bg-gray-300"
                          )}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="hidden lg:grid lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                  <div className="relative h-96 rounded-2xl overflow-hidden">
                    <Image
                      src={gallery[selectedImage] || mainImage}
                      alt={property?.title || "Property"}
                      fill
                      className="object-cover"
                      unoptimized={(
                        gallery[selectedImage] || mainImage
                      )?.startsWith("http")}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {gallery.map((image: string, index: number) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={cn(
                        "relative h-24 rounded-lg overflow-hidden transition-all duration-200",
                        selectedImage === index
                          ? "ring-2 ring-primary"
                          : "hover:opacity-80"
                      )}
                    >
                      <Image
                        src={image}
                        alt={`${property?.title || "Property"} ${index + 1}`}
                        fill
                        className="object-cover"
                        unoptimized={image?.startsWith("http")}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Property Overview */}
            <div className="mb-8">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-foreground mb-2">
                    {property?.title || "Loading..."}
                  </h1>
                  <p className="text-muted-foreground mb-4">
                    {property?.address || ""}
                    {property?.city && `, ${property.city}`}
                    {property?.state && `, ${property.state}`}
                  </p>
                  <div className="flex items-center gap-6 mb-4">
                    {property?.bedrooms && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Bed className="w-5 h-5" />
                        <span>{property.bedrooms} Beds</span>
                      </div>
                    )}
                    {property?.bathrooms && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Bath className="w-5 h-5" />
                        <span>{property.bathrooms} Baths</span>
                      </div>
                    )}
                    {property?.size && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Square className="w-5 h-5" />
                        <span>{property.size}</span>
                      </div>
                    )}
                  </div>
                  <div className="text-3xl font-bold text-primary mb-6">
                    {property?.price ? `${property.price}` : "Price on Request"}
                  </div>

                  {/* Contact Agent Button */}
                  <Button
                    size="lg"
                    className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground"
                    onClick={() => {
                      // Scroll to PropertyChatWidget at bottom
                      window.scrollTo({
                        top: document.documentElement.scrollHeight,
                        behavior: "smooth",
                      });
                    }}
                  >
                    Contact Agent
                  </Button>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    className="border-border"
                  >
                    <Grid3X3 className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>

            {/* About */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                About This Property
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {property?.ai_refined_description ||
                  property?.description ||
                  "No description available."}
              </p>
            </div>

            {/* Amenities */}
            {allAmenities.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-foreground mb-6">
                  Amenities
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {allAmenities.map((amenity: string, index: number) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 bg-card rounded-lg border border-border"
                    >
                      <div className="text-primary">
                        {amenityIcons[amenity] || <Home className="w-5 h-5" />}
                      </div>
                      <span className="text-foreground">{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* REVIEWS */}
            <div className="mb-8 pb-24">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-foreground">
                  Reviews
                </h2>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">
                    See all ({reviews.length})
                  </span>
                  <div className="flex -space-x-2">
                    {reviews.length > 0 ? (
                      reviews.slice(0, 2).map((r) => (
                        <Avatar
                          key={r.id}
                          className="w-8 h-8 border-2 border-background"
                        >
                          <AvatarImage src={r.user?.avatar || undefined} />
                          <AvatarFallback className="text-xs bg-muted">
                            {r.user?.name
                              ? r.user.name
                                  .split(" ")
                                  .map((n: string) => n[0])
                                  .join("")
                              : "A"}
                          </AvatarFallback>
                        </Avatar>
                      ))
                    ) : (
                      <>
                        <Avatar className="w-8 h-8 border-2 border-background">
                          <AvatarFallback className="text-xs bg-muted">
                            ?
                          </AvatarFallback>
                        </Avatar>
                        <Avatar className="w-8 h-8 border-2 border-background">
                          <AvatarFallback className="text-xs bg-muted">
                            ?
                          </AvatarFallback>
                        </Avatar>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {isLoadingReviews ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className="bg-card rounded-lg p-4 border border-border"
                    >
                      <div className="flex gap-3 mb-3">
                        <div className="w-10 h-10 bg-muted animate-pulse rounded-full"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-muted animate-pulse rounded w-32 mb-2"></div>
                          <div className="h-3 bg-muted animate-pulse rounded w-24"></div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-3 bg-muted animate-pulse rounded"></div>
                        <div className="h-3 bg-muted animate-pulse rounded"></div>
                        <div className="h-3 bg-muted animate-pulse rounded w-4/5"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : reviews.length === 0 ? (
                <div className="space-y-6">
                  <div className="bg-card rounded-lg p-6 border border-border text-center">
                    <p className="text-muted-foreground mb-4">No reviews yet. Be the first to review!</p>
                    {!isAuthenticated && (
                      <Button
                        variant="outline"
                        onClick={() => router.push("/signin")}
                        className="mt-4"
                      >
                        Sign in to write a review
                      </Button>
                    )}
                  </div>
                  {isAuthenticated && (
                    <PropertyReviewForm
                      propertyId={id}
                      propertyAddress={
                        property?.address
                          ? `${property.address}${property.city ? `, ${property.city}` : ""}${property.state ? `, ${property.state}` : ""}`
                          : undefined
                      }
                      onReviewSubmitted={loadReviews}
                    />
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {reviews.map((review) => (
                    <div
                      key={review.id}
                      className="bg-card rounded-lg p-4 border border-border"
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={review.user?.avatar || undefined} />
                          <AvatarFallback className="bg-muted text-foreground">
                            {review.user?.name
                              ? review.user.name
                                  .split(" ")
                                  .map((n: string) => n[0])
                                  .join("")
                              : "A"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-foreground">
                              {review.user?.name || "Anonymous"}
                            </h4>
                            <span className="text-sm text-muted-foreground">
                              Client
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={cn(
                                    "w-4 h-4",
                                    i < review.rating
                                      ? "fill-yellow-400 text-yellow-400"
                                      : "text-gray-300"
                                  )}
                                />
                              ))}
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {formatDate(review.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {review.review_text}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Property Chat Widget */}
      {property && (
        <PropertyChatWidget propertyId={id} propertyTitle={property.title} />
      )}
    </div>
  );
}
