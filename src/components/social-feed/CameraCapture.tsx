"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Camera, Video, X, RotateCcw, Check } from "lucide-react";
import { toast } from "react-toastify";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onClose: () => void;
  mode?: "photo" | "video" | "both";
  isOpen?: boolean;
}

export default function CameraCapture({
  onCapture,
  onClose,
  mode = "both",
  isOpen = true,
}: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const [isRecording, setIsRecording] = useState(false);
  const [captureMode, setCaptureMode] = useState<"photo" | "video">(
    mode === "photo" ? "photo" : mode === "video" ? "video" : "photo"
  );
  const [facingMode, setFacingMode] = useState<"user" | "environment">(
    "environment"
  );
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isInitializingRef = useRef(false);

  // Request camera access when modal opens or facing mode changes
  useEffect(() => {
    if (!isOpen) {
      // Clean up camera when modal closes
      stopCamera();
      isInitializingRef.current = false;
      return;
    }

    let mounted = true;
    
    // Prevent double initialization (React Strict Mode)
    if (isInitializingRef.current) {
      return () => {};
    }
    
    isInitializingRef.current = true;
    
    const initCamera = async () => {
      if (mounted && !streamRef.current && isOpen) {
        await startCamera();
      }
    };
    
    // Small delay to prevent conflicts
    const timeoutId = setTimeout(() => {
      initCamera();
    }, 100);
    
    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      if (!isOpen) {
        stopCamera();
        isInitializingRef.current = false;
      }
    };
  }, [isOpen, facingMode]);

  const startCamera = async () => {
    // Prevent concurrent initialization
    if (isInitializingRef.current && streamRef.current) {
      return;
    }
    
    // Don't start if modal is closed
    if (!isOpen) {
      return;
    }
    
    try {
      // Stop existing stream if any
      stopCamera();

      // Wait a bit to ensure previous stream is fully stopped
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Check again if modal is still open
      if (!isOpen) {
        return;
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: captureMode === "video",
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Check if modal is still open before assigning stream
      if (!isOpen) {
        stream.getTracks().forEach(track => track.stop());
        return;
      }
      
      // Assign stream first
      streamRef.current = stream;

      // Then connect to video element
      if (videoRef.current) {
        const video = videoRef.current;
        video.srcObject = stream;
        
        // Force video to be visible
        video.style.display = "block";
        
        // Add event listener to ensure video plays
        const handleCanPlay = async () => {
          try {
            if (video.paused) {
              await video.play();
              console.log("Camera stream started successfully via canplay");
              setIsLoading(false);
            }
          } catch (playError) {
            console.error("Error playing video in canplay:", playError);
            setIsLoading(false);
          }
        };
        
        video.addEventListener("canplay", handleCanPlay, { once: true });
        
        // Try to play immediately
        try {
          await video.play();
          console.log("Camera stream started successfully");
          setIsLoading(false);
        } catch (playError) {
          console.log("Waiting for video to be ready...", playError);
          // Video will play when canplay event fires
          setIsLoading(true);
        }
      } else {
        console.warn("Video ref is not available");
        setIsLoading(false);
      }

      setHasPermission(true);
    } catch (error: any) {
      console.error("Error accessing camera:", error);
      setHasPermission(false);
      
      // Stop any partial streams
      stopCamera();
      
      if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
        toast.error("Camera permission denied. Please enable camera access in your browser settings.");
      } else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
        toast.error("No camera found on your device.");
      } else if (error.name === "NotReadableError" || error.name === "TrackStartError") {
        toast.error("Camera is already in use by another application. Please close other apps using the camera and try again.");
      } else if (error.name === "OverconstrainedError") {
        toast.error("Camera doesn't support the requested settings. Trying with default settings...");
        // Try with simpler constraints
        try {
          const simpleStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: facingMode },
            audio: captureMode === "video",
          });
          streamRef.current = simpleStream;
          if (videoRef.current) {
            videoRef.current.srcObject = simpleStream;
            await videoRef.current.play();
          }
          setHasPermission(true);
        } catch (retryError) {
          toast.error("Failed to access camera. Please try again.");
        }
      } else {
        toast.error(`Failed to access camera: ${error.message || "Unknown error"}`);
      }
    }
  };

  const stopCamera = () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => {
          track.stop();
          track.enabled = false;
        });
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
        videoRef.current.pause();
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        try {
          mediaRecorderRef.current.stop();
        } catch (e) {
          console.warn("Error stopping media recorder:", e);
        }
        mediaRecorderRef.current = null;
      }
      recordedChunksRef.current = [];
    } catch (error) {
      console.warn("Error stopping camera:", error);
    }
  };

  const switchCamera = () => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0);

    // Convert canvas to blob
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          toast.error("Failed to capture photo");
          return;
        }

        // Create File from blob
        const file = new File([blob], `photo-${Date.now()}.jpg`, {
          type: "image/jpeg",
        });

        onCapture(file);
        stopCamera();
        onClose();
      },
      "image/jpeg",
      0.95
    );
  };

  const startVideoRecording = () => {
    if (!streamRef.current || !videoRef.current) return;

    try {
      recordedChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(streamRef.current, {
        mimeType: "video/webm;codecs=vp8,opus",
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, {
          type: "video/webm",
        });

        // Convert webm to mp4 if needed (or keep webm)
        const file = new File([blob], `video-${Date.now()}.webm`, {
          type: "video/webm",
        });

        onCapture(file);
        stopCamera();
        onClose();
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error: any) {
      console.error("Error starting video recording:", error);
      toast.error("Failed to start video recording");
    }
  };

  const stopVideoRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleCapture = () => {
    if (captureMode === "photo") {
      // Countdown for photo
      setCountdown(3);
      const countdownInterval = setInterval(() => {
        setCountdown((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(countdownInterval);
            capturePhoto();
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      // Video recording
      if (!isRecording) {
        startVideoRecording();
      } else {
        stopVideoRecording();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full p-0 bg-black border-gray-800 z-[70] overflow-hidden max-h-[90vh]">
        <DialogHeader className="sr-only">
          <DialogTitle>Camera Capture</DialogTitle>
        </DialogHeader>
        
        {hasPermission === false ? (
          <div className="p-6 text-center">
            <h3 className="text-white text-xl font-semibold mb-2">
              Camera Access Required
            </h3>
            <p className="text-gray-400 mb-4">
              Please enable camera access in your browser settings to use this feature.
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              Close
            </button>
          </div>
        ) : (
          <div className="relative w-full h-[80vh] min-h-[600px] bg-black">
            {/* Loading indicator */}
            {isLoading && hasPermission === null && (
              <div className="absolute inset-0 flex items-center justify-center z-20">
                <div className="text-white text-lg">Initializing camera...</div>
              </div>
            )}
            
            {/* Video preview */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ 
                display: streamRef.current && hasPermission === true ? "block" : "none",
                backgroundColor: "#000"
              }}
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* Countdown overlay */}
            {countdown !== null && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                <div className="text-white text-8xl font-bold">{countdown}</div>
              </div>
            )}

            {/* Recording indicator */}
            {isRecording && (
              <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600 px-4 py-2 rounded-full z-10">
                <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
                <span className="text-white font-semibold">Recording</span>
              </div>
            )}

            {/* Top controls */}
            <div className="absolute top-4 right-4 flex gap-2 z-10">
              <button
                onClick={switchCamera}
                className="p-3 bg-black/60 rounded-full hover:bg-black/80 transition-colors"
                title="Switch camera"
              >
                <RotateCcw className="w-6 h-6 text-white" />
              </button>
              <button
                onClick={onClose}
                className="p-3 bg-black/60 rounded-full hover:bg-black/80 transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>

            {/* Mode selector */}
            {mode === "both" && (
              <div className="absolute top-20 left-1/2 transform -translate-x-1/2 flex gap-2 bg-black/60 rounded-full p-1 z-10">
                <button
                  onClick={() => {
                    if (isRecording) stopVideoRecording();
                    setCaptureMode("photo");
                  }}
                  className={`px-4 py-2 rounded-full transition-colors ${
                    captureMode === "photo"
                      ? "bg-white text-black"
                      : "text-white hover:bg-white/20"
                  }`}
                >
                  Photo
                </button>
                <button
                  onClick={() => {
                    setCaptureMode("video");
                  }}
                  className={`px-4 py-2 rounded-full transition-colors ${
                    captureMode === "video"
                      ? "bg-white text-black"
                      : "text-white hover:bg-white/20"
                  }`}
                >
                  Video
                </button>
              </div>
            )}

            {/* Bottom controls */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-4 z-10">
              {/* Capture button */}
              <button
                onClick={handleCapture}
                disabled={hasPermission === null || countdown !== null}
                className={`w-20 h-20 rounded-full border-4 border-white flex items-center justify-center transition-all ${
                  isRecording
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-white/20 hover:bg-white/30"
                } disabled:opacity-50`}
              >
                {isRecording ? (
                  <div className="w-8 h-8 bg-white rounded-sm" />
                ) : captureMode === "photo" ? (
                  <Camera className="w-10 h-10 text-white" />
                ) : (
                  <Video className="w-10 h-10 text-white" />
                )}
              </button>

              {/* Instructions */}
              <p className="text-white text-sm text-center px-4">
                {captureMode === "photo"
                  ? "Tap to take a photo"
                  : isRecording
                  ? "Tap to stop recording"
                  : "Tap to start recording"}
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

