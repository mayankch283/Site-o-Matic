import { NextRequest, NextResponse } from "next/server";
import { Message as VercelChatMessage, StreamingTextResponse } from "ai";
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { HttpResponseOutputParser } from "langchain/output_parsers";

export const runtime = "edge";

const formatMessage = (message: VercelChatMessage) => {
  return `${message.role}: ${message.content}`;
};

const TEMPLATE = `You are StoreGenius, an AI store configurator that updates siteConfig.ts based on business descriptions.

Your task is to analyze business descriptions and generate a structured store configuration.

When a user describes their business, respond ONLY with a valid TypeScript configuration object.
Do not include any other text or explanations.

Example input: "I sell handmade jewelry for young women, price range ₹500-3000, bohemian style, based in Jaipur"

Response should be a valid TypeScript object like:

const siteConfig: SiteConfig = {{
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
    darkMode: {{
      backgroundColor: "#1F2937",
      textColor: "#F9FAFB",
      primaryColor: "#3B82F6",
      secondaryColor: "#FCD34D",
    }},
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
  products: [
    {{
      id: "1",
      name: "Classic Snapback Cap",
      price: 29.99,
      image: "/assets/cap-1.jpg",
      images: ["/assets/cap-1.jpg", "/assets/cap-1-2.jpg", "/assets/cap-1-3.jpg"],
      slug: "classic-snapback-cap",
      description: "Timeless style meets comfort in this classic snapback design. Made with premium materials and featuring an adjustable snapback closure for the perfect fit.",
      category: "snapbacks",
      features: ["100% Cotton", "Adjustable Snapback", "Structured Crown", "Flat Brim"],
      sizes: ["One Size"],
      colors: ["Black", "Navy", "Gray", "White"],
      inStock: true,
    }},
    {{
      id: "2",
      name: "Premium Leather Cap",
      price: 59.99,
      image: "/assets/cap-2.jpg",
      images: ["/assets/cap-2.jpg", "/assets/cap-2-2.jpg"],
      slug: "premium-leather-cap",
      description: "Luxurious leather construction for the discerning cap enthusiast. This premium piece combines style and durability.",
      category: "premium",
      features: ["Genuine Leather", "Adjustable Strap", "Premium Lining", "Water Resistant"],
      sizes: ["S/M", "L/XL"],
      colors: ["Brown", "Black"],
      inStock: true,
    }}
  ],
  content: {{
    about: {{
      title: "About Our Brand",
      subtitle: "Discover the story behind our premium headwear collection",
      sections: {{
        ourStory: {{
          title: "Our Story",
          content: "Founded with a simple mission: to provide high-quality, stylish headwear that combines comfort, durability, and fashion. We believe that the right cap isn't just an accessory—it's an expression of your personality and style.",
        }},
        qualityPromise: {{
          title: "Quality Promise",
          content: "Every cap in our collection is carefully selected and tested to meet our high standards. We use premium materials and work with trusted manufacturers to ensure that each piece delivers exceptional quality and longevity.",
        }},
        whyChoose: {{
          title: "Why Choose Us?",
          features: [
            {{
              icon: "check",
              title: "Premium Quality",
              description: "Hand-selected materials and rigorous quality control",
            }},
            {{
              icon: "clock",
              title: "Fast Shipping",
              description: "Quick and reliable delivery to your doorstep",
            }},
            {{
              icon: "heart",
              title: "Customer Care",
              description: "Dedicated support team ready to help",
            }},
          ],
        }},
        community: {{
          title: "Join Our Community",
          description: "Follow us on social media to stay updated with the latest trends, new arrivals, and exclusive offers.",
        }},
      }},
    }},
    contact: {{
      title: "Get in Touch",
      subtitle: "Have a question or need help? We'd love to hear from you.",
      form: {{
        title: "Send us a Message",
        successMessage: {{
          title: "Thank you!",
          message: "Your message has been sent successfully. We'll get back to you within 24 hours.",
        }},
        fields: {{
          name: {{
            label: "Full Name",
            placeholder: "Enter your full name",
          }},
          email: {{
            label: "Email Address",
            placeholder: "Enter your email address",
          }},
          subject: {{
            label: "Subject",
            placeholder: "What is this about?",
          }},
          message: {{
            label: "Message",
            placeholder: "Tell us how we can help you...",
          }},
        }},
        submitButton: "Send Message",
      }},
      contactInfo: {{
        title: "Other Ways to Reach Us",
        email: {{
          label: "Email",
          value: "hello@capcentral.com",
          description: "Send us an email anytime",
        }},
        phone: {{
          label: "Phone",
          value: "+1 (555) 123-4567",
          description: "Mon-Fri from 9am to 6pm EST",
        }},
        address: {{
          label: "Address",
          value: "123 Fashion Street, Style City, SC 12345",
          description: "Visit our flagship store",
        }},
      }},
    }},
    shop: {{
      title: "Our Collection",
      subtitle: "Discover our complete range of premium caps and headwear",
      categories: [
        {{ value: "all", label: "All Categories" }},
        {{ value: "snapbacks", label: "Snapbacks" }},
        {{ value: "premium", label: "Premium" }},
        {{ value: "athletic", label: "Athletic" }},
        {{ value: "trucker", label: "Trucker" }},
        {{ value: "baseball", label: "Baseball" }},
        {{ value: "bucket", label: "Bucket" }},
      ],
      sortOptions: [
        {{ value: "price-asc", label: "Price: Low to High" }},
        {{ value: "price-desc", label: "Price: High to Low" }},
        {{ value: "name-asc", label: "Name: A to Z" }},
        {{ value: "name-desc", label: "Name: Z to A" }},
      ],
    }},
    newsletter: {{
      title: "Stay Updated",
      subtitle: "Subscribe to our newsletter and be the first to know about new arrivals, exclusive offers, and style tips.",
      successMessage: {{
        title: "Thank you!",
        message: "You've successfully subscribed to our newsletter.",
      }},
      placeholder: "Enter your email address",
      buttonText: "Subscribe",
    }},
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
