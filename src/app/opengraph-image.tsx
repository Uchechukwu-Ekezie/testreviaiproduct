import { ImageResponse } from "next/og";
import { siteConfig } from '@/lib/site-config';

export const runtime = "edge";

export const alt = siteConfig.title;
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #000000 0%, #1a1a1a 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          position: "relative",
        }}
      >
        {/* Background Pattern */}
        <div
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            background:
              "radial-gradient(circle at 25% 25%, #780991 0%, transparent 50%), radial-gradient(circle at 75% 75%, #FFD700 0%, transparent 50%)",
            opacity: 0.1,
          }}
        />

        {/* Main Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            color: "white",
            zIndex: 1,
          }}
        >
          <h1
            style={{
              fontSize: "72px",
              fontWeight: "bold",
              margin: "0 0 24px 0",
              background: "linear-gradient(135deg, #FFD700 0%, #780991 100%)",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            {siteConfig.name}
          </h1>
          <p
            style={{
              fontSize: "36px",
              margin: "0 0 16px 0",
              color: "#ffffff",
            }}
          >
            AI-Powered Real Estate Platform
          </p>
          <p
            style={{
              fontSize: "24px",
              margin: "0",
              color: "#cccccc",
              maxWidth: "800px",
            }}
          >
            Smart Property Booking • Intelligent Reviews • Automated Insights
          </p>
        </div>

        {/* Bottom Brand */}
        <div
          style={{
            position: "absolute",
            bottom: "40px",
            right: "40px",
            display: "flex",
            alignItems: "center",
            color: "#888888",
            fontSize: "18px",
          }}
        >
          {siteConfig.url.replace('https://', '')}
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
