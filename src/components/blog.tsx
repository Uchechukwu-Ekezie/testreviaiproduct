import Link from "next/link";
import type { MediumPost } from "../lib/medium";
import Image from "next/image";

interface BlogSectionProps {
  posts: MediumPost[];
  isLoading: boolean;
  error: string | null;
}

export default function BlogSection({
  posts = [],
  isLoading,
  error,
}: BlogSectionProps) {
  return (
    <section className="bg-[#0A0A0A] min-h-screen py-16 px-6 flex flex-col">
      <div className="max-w-7xl mx-auto flex-grow">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white">Blog Posts</h2>
          <Link href="https://medium.com/@ekezie">
            <span className="text-white/80 hover:text-white transition text-lg cursor-pointer">
              View all
            </span>
          </Link>
        </div>

        {/* Show Skeleton UI when loading */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="bg-black/20 border border-white/10 p-6 rounded-xl shadow-md">
                {/* Skeleton Image */}
                <div className="w-[300px] h-[140px] rounded-xl bg-gray-700 animate-pulse mb-4"></div>

                {/* Skeleton Title */}
                <div className="h-6 bg-gray-700 rounded w-3/4 animate-pulse mb-2"></div>

                {/* Skeleton Description */}
                <div className="h-4 bg-gray-700 rounded w-full animate-pulse mb-2"></div>
                <div className="h-4 bg-gray-700 rounded w-5/6 animate-pulse mb-4"></div>

                {/* Skeleton Metadata */}
                <div className="flex items-center space-x-2">
                  <div className="h-4 bg-gray-700 rounded w-1/4 animate-pulse"></div>
                  <div className="h-4 bg-gray-700 rounded w-1/4 animate-pulse"></div>
                  <div className="h-4 bg-gray-700 rounded w-1/4 animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-white text-center py-16">Error: {error}</div>
        ) : posts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-8">
            {posts.map((blog, index) => (
              <a
                key={index}
                href={blog.link}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-black/20 border border-white/10 p-6 rounded-xl shadow-md transition-transform hover:scale-105 cursor-pointer flex flex-col lg:flex-row"
              >
                {/* Blog Image - On sm & md it's on top, on lg it's on the left */}
                <div className="w-full h-[200px] rounded-xl mb-4 lg:w-[180px] lg:h-[180px] lg:mb-0 lg:mr-6 relative">
                  <Image
                    src={blog.image || "/fallback-image.jpg"}
                    alt={blog.title}
                    layout="fill"
                    objectFit="cover"
                    className="rounded-xl"
                  />
                </div>

                {/* Blog Details - Added flex & justify-between to push metadata to bottom */}
                <div className="flex-1 flex flex-col">
                  <h3 className="text-xl font-semibold text-white">{blog.title}</h3>
                  <p className="text-gray-400 text-sm mt-2">{blog.description}</p>

                  {/* Metadata - This is now pushed to the bottom */}
                  <div className="flex items-center text-gray-500 text-sm mt-auto pt-4">
                    <span>{blog.category}</span>
                    <span className="mx-2">•</span>
                    <span>{blog.pubDate}</span>
                    <span className="mx-2">•</span>
                    <span>{blog.readTime}</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div className="text-white text-center py-16">
            No housing-related blog posts found.
          </div>
        )}
      </div>
    </section>
  );
}
