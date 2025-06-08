"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LoaderCircle } from "lucide-react";

export default function ImageGeneratorPage() {
  const [prompt, setPrompt] = useState("");
  const [size, setSize] = useState("1024x1024");
  const [isLoading, setIsLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setImageUrl("");

    try {
      const response = await fetch("/api/image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt, size }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate image");
      }

      setImageUrl(data.data[0].url);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8 text-center">AI Image Generator</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6 mb-8">
        <div className="space-y-2">
          <label htmlFor="prompt" className="text-sm font-medium">
            Describe the image you want to generate
          </label>
          <Input
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="A surreal landscape with floating islands and waterfalls"
            required
            className="w-full"
          />
        </div>
        
        <div className="space-y-2">
          <label htmlFor="size" className="text-sm font-medium">
            Image Size
          </label>
          <Select value={size} onValueChange={setSize}>
            <SelectTrigger>
              <SelectValue placeholder="Select size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1024x1024">1024x1024 (Standard)</SelectItem>
              <SelectItem value="1024x1792">1024x1792 (Portrait)</SelectItem>
              <SelectItem value="1792x1024">1792x1024 (Landscape)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <span className="flex items-center justify-center">
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </span>
          ) : (
            "Generate Image"
          )}
        </Button>
      </form>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}
      
      {imageUrl && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Generated Image</h2>
          <div className="border rounded-lg overflow-hidden">
            <img 
              src={imageUrl} 
              alt={prompt} 
              className="w-full h-auto"
            />
          </div>
          <p className="text-sm text-gray-500">Prompt: {prompt}</p>
        </div>
      )}
    </div>
  );
} 