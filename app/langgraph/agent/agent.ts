import {
  StateGraph,
  MessagesAnnotation,
  START,
  Annotation,
} from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";

const llm = new ChatOpenAI({ model: "gpt-4o-mini", temperature: 0 });

const builder = new StateGraph(
  Annotation.Root({
    messages: MessagesAnnotation.spec["messages"],
    timestamp: Annotation<number>,
  })
)
  .addNode("agent", async (state, config) => {
    const message = await llm.invoke([
      {
        type: "system",
        content: `You are StoreGenius, an AI store configurator that updates data.tsx based on business descriptions.

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
}};`,
      },
      ...state.messages,
    ]);

    return { messages: message, timestamp: Date.now() };
  })
  .addEdge(START, "agent");

export const graph = builder.compile();
