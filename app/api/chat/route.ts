import { NextRequest, NextResponse } from "next/server";
import { Message as VercelChatMessage, StreamingTextResponse } from "ai";
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { HttpResponseOutputParser } from "langchain/output_parsers";

export const runtime = "edge";

const formatMessage = (message: VercelChatMessage) => {
  return `${message.role}: ${message.content}`;
};

const TEMPLATE = `You are StoreGenius, an AI store configurator that updates data.tsx based on business descriptions.

Your task is to analyze business descriptions and generate a structured store configuration.

When a user describes their business, respond ONLY with a valid TypeScript configuration object.
Do not include any other text or explanations.

Example input: "I sell handmade jewelry for young women, price range ₹500-3000, bohemian style, based in Jaipur"

Response should be a valid TypeScript object like:

const siteConfig = {{
  site: {{
    title: "Cap Central",
    description: "Premium & stylish caps delivered to your door.",
    logoUrl: "/assets/logo.svg",
    faviconUrl: "/assets/favicon.ico",
    language: "en",
    currency: "USD",
  }},
  theme: {{
    mode: "light",
    primaryColor: "#1E40AF",
    secondaryColor: "#FACC15",
    backgroundColor: "#ffffff",
    textColor: "#111827",
    font: {{
      family: "Poppins, sans-serif",
      size: "16px",
      headingWeight: 600,
      bodyWeight: 400,
    }},
    layout: {{
      productListView: "grid",
      productGridColumns: 3,
      containerWidth: "1200px",
    }},
    animations: {{
      enableFadeIn: true,
      transitionSpeed: "300ms",
    }},
  }},
  navigation: {{
    menu: [
      {{ label: "Home", href: "/" }},
      {{ label: "Shop", href: "/shop" }},
      {{ label: "About", href: "/about" }},
      {{ label: "Contact", href: "/contact" }},
    ],
    footerLinks: [
      {{ label: "Privacy Policy", href: "/privacy" }},
      {{ label: "Returns", href: "/returns" }},
      {{ label: "Support", href: "/support" }},
    ],
  }},
  homepage: {{
    heroSection: {{
      enabled: true,
      title: "Find Your Style with Our Premium Caps",
      subtitle: "Trendy, comfortable, and built to last",
      backgroundImage: "/assets/hero-banner.jpg",
      ctaText: "Shop Now",
      ctaLink: "/shop",
    }},
    featuredProducts: {{
      enabled: true,
      title: "Featured Caps",
      productSlugs: ["classic-snapback-cap", "premium-leather-cap"],
    }},
    sections: {{
      showTestimonials: true,
      showNewsletterSignup: true,
      showInstagramGallery: false,
    }},
  }},
  footer: {{
    text: "© 2025 Cap Central. All rights reserved.",
    backgroundColor: "#111827",
    textColor: "#F9FAFB",
    showSocialMedia: true,
    socialLinks: {{
      facebook: "https://facebook.com/capcentral",
      instagram: "https://instagram.com/capcentral",
      twitter: "https://twitter.com/capcentral",
    }},
  }},
  filters: {{
    enablePriceRangeFilter: true,
    enableCategoryFilter: true,
    enableFeatureFilter: true,
    defaultSort: "price-asc",
  }},
  seo: {{
    metaTitle: "Cap Central - Premium & Stylish Headwear",
    metaDescription: "Browse a wide range of premium caps tailored for every occasion and style.",
    metaImage: "/assets/seo-banner.jpg",
    keywords: ["caps", "headwear", "snapbacks", "premium hats", "buy caps online"],
  }},
  integrations: {{
    googleAnalyticsId: "G-XXXXXXXXXX",
    facebookPixelId: "1234567890",
    newsletter: {{
      provider: "mailchimp",
      formAction: "https://example.us1.list-manage.com/subscribe/post",
    }},
  }},
  accessibility: {{
    enableHighContrastMode: false,
    ariaLabels: {{
      mainNavigation: "Main site navigation",
      productGrid: "List of available products",
      addToCartButton: "Add this item to your shopping cart",
    }},
  }},
  features: {{
    enableCOD: true,
    enableReviews: false,
    enableWishlist: true,
    enableProductZoom: true,
    enableQuickAdd: true,
  }},
}};

Previous conversation:
{chat_history}

User: {input}
Assistant: Let me generate a store configuration based on your description.`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const messages = body.messages ?? [];
    const formattedPreviousMessages = messages.slice(0, -1).map(formatMessage);
    const currentMessageContent = messages[messages.length - 1].content;
    
    const model = new ChatOpenAI({
      temperature: 0.7,
      model: "gpt-4-turbo-preview", // Changed from invalid model name
    });
    
    const prompt = PromptTemplate.fromTemplate(TEMPLATE);
    const outputParser = new HttpResponseOutputParser();
    const chain = prompt.pipe(model).pipe(outputParser);

    const stream = await chain.stream({
      chat_history: formattedPreviousMessages.join("\n"),
      input: currentMessageContent,
    });

    return new StreamingTextResponse(stream);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status ?? 500 });
  }
}
