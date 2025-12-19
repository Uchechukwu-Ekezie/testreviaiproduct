"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

// Custom image loader for handling external images
const imageLoader = ({ src }: { src: string }) => {
  return src;
};

export default function TestimoialSection() {
  const [articles, setArticles] = useState<
    { title: string; description: string; link: string; image: string }[]
  >([]);

  useEffect(() => {
    async function fetchMediumPosts() {
      try {
        const response = await fetch("/api/medium?limit=3");
        const data = await response.json();

        if (Array.isArray(data)) {
          setArticles(data);
        }
      } catch (error) {
        console.error("Error fetching Medium posts:", error);
      }
    }

    fetchMediumPosts();
  }, []);

  return (
    <section className="bg-[#0A0A0A] py-16 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Heading and Button */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
          <h2 className="text-3xl md:text-4xl font-bold text-white text-center md:text-left">
            Latest Insights from Our Blog
          </h2>
          <Link href="/blogs">
            <span className="text-white/80 hover:text-white transition text-lg cursor-pointer">
              View all
            </span>
          </Link>
        </div>

        {/* Blog Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {articles.length > 0 ? (
            articles.map((item, index) => (
              <motion.div
                key={index}
                className="bg-black/20 rounded-xl p-5 border border-white/10 shadow-lg transition-transform hover:scale-105"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.6,
                  ease: "easeOut",
                  delay: index * 0.3,
                }}
                viewport={{ once: true, amount: 0.2 }}
              >
                {/* Image Container */}
                <div className="relative w-full h-[250px] md:h-[200px] rounded-xl overflow-hidden">
                  <Image
                    src={item.image || "/Image/test.jpeg"}
                    alt={item.title}
                    fill
                    className="object-cover"
                    loader={imageLoader}
                    unoptimized={true}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "/Image/test.jpeg";
                    }}
                  />
                </div>

                {/* Text Content */}
                <div className="mt-4 text-center md:text-left">
                  <h3 className="text-2xl font-semibold text-white">
                    {item.title}
                  </h3>
                  <p className="text-lg italic text-[#C3C3C3] mt-2 line-clamp-3">
                    {item.description}
                  </p>
                  <Link
                    href={item.link}
                    target="_blank"
                    className="text-blue-400 hover:underline mt-3 block"
                  >
                    Read More
                  </Link>
                </div>
              </motion.div>
            ))
          ) : (
            <p className="text-white/60 text-center col-span-3">
              Loading articles...
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
