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
  "site": {{
    "title": "ElectroHub",
    "description": "Your one-stop shop for the latest electronics.",
    "logoUrl": "/assets/logo-electrohub.svg",
    "faviconUrl": "/assets/favicon-electrohub.ico",
    "language": "en",
    "currency": "USD"
  }},
  "theme": {{
    "mode": "light",
    "primaryColor": "#0071e3",
    "secondaryColor": "#ff9500",
    "backgroundColor": "#f0f0f0",
    "textColor": "#333",
    "darkMode": {{
      "backgroundColor": "#121212",
      "textColor": "#f0f0f0",
      "primaryColor": "#0071e3",
      "secondaryColor": "#ff9500"
    }},
    "font": {{
      "family": "Roboto, sans-serif",
      "size": "14px",
      "headingWeight": 500,
      "bodyWeight": 400
    }},
    "layout": {{
      "productListView": "list",
      "productGridColumns": 4,
      "containerWidth": "1140px"
    }},
    "animations": {{
      "enableFadeIn": false,
      "transitionSpeed": "200ms"
    }}
  }},
  "navigation": {{
    "menu": [
      {{
        "label": "Home",
        "href": "/"
      }},
      {{
        "label": "Shop",
        "href": "/shop"
      }},
      {{
        "label": "New Arrivals",
        "href": "/new-arrivals"
      }},
      {{
        "label": "Deals",
        "href": "/deals"
      }},
      {{
        "label": "About",
        "href": "/about"
      }},
      {{
        "label": "Contact",
        "href": "/contact"
      }}
    ],
    "footerLinks": [
      {{
        "label": "Terms of Service",
        "href": "/terms"
      }},
      {{
        "label": "Privacy Policy",
        "href": "/privacy"
      }},
      {{
        "label": "Warranty Information",
        "href": "/warranty"
      }}
    ]
  }},
  "homepage": {{
    "heroSection": {{
      "enabled": true,
      "title": "Latest Tech Right at Your Fingertips",
      "subtitle": "Explore the newest electronics from top brands.",
      "backgroundImage": "/assets/hero-electronics.jpg",
      "ctaText": "Shop Now",
      "ctaLink": "/shop"
    }},
    "featuredProducts": {{
      "enabled": true,
      "title": "Featured Electronics",
      "productSlugs": [
        "smartphone-2023",
        "gaming-laptop-pro",
        "noise-cancelling-headphones"
      ]
    }},    
    "sections": {{
      "showTestimonials": true,
      "showInstagramGallery": false
    }}
  }},
  "footer": {{
    "text": "©️ 2023 ElectroHub. All rights reserved.",
    "backgroundColor": "#333",
    "textColor": "#f0f0f0",
    "showSocialMedia": true,
    "socialLinks": {{
      "facebook": "https://facebook.com/electrohub",
      "instagram": "https://instagram.com/electrohub",
      "twitter": "https://twitter.com/electrohub"
    }}
  }},
  "filters": {{
    "enablePriceRangeFilter": true,
    "enableCategoryFilter": true,
    "enableFeatureFilter": false,
    "defaultSort": "price-asc"
  }},
  "seo": {{
    "metaTitle": "ElectroHub - Latest Electronics Online",
    "metaDescription": "Find the best and latest in electronics. From smartphones to gaming laptops, ElectroHub has it all.",
    "metaImage": "/assets/seo-electronics.jpg",
    "keywords": [
      "electronics",
      "latest tech",
      "smartphones",
      "laptops",
      "headphones"
    ]
  }},
  "accessibility": {{
    "enableHighContrastMode": true,
    "ariaLabels": {{
      "mainNavigation": "Main electronics site navigation",
      "productGrid": "List of electronics products",
      "addToCartButton": "Add this electronic item to your shopping cart"
    }}
  }},
  "features": {{
    "enableCOD": false,
    "enableReviews": true,
    "enableWishlist": true,
    "enableProductZoom": true,
    "enableQuickAdd": false
  }},
  "products": [
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
    }},  
  "content": {{
    "about": {{
      "title": "About ElectroHub",
      "subtitle": "Your trusted destination for the latest electronics and technology",
      "sections": {{
        "ourStory": {{
          "title": "Our Story",
          "content": "Founded with a passion for technology, ElectroHub has been at the forefront of bringing the latest electronics to consumers worldwide. We believe technology should be accessible, reliable, and innovative."
        }},
        "qualityPromise": {{
          "title": "Quality Promise",
          "content": "Every product in our collection goes through rigorous quality testing to ensure you receive only the best. We partner with top manufacturers and brands to guarantee authenticity and performance."
        }},
        "whyChoose": {{
          "title": "Why Choose ElectroHub?",
          "features": [
            {{
              "icon": "check",
              "title": "Authentic Products",
              "description": "100% genuine electronics from verified manufacturers"
            }},
            {{
              "icon": "star",
              "title": "Expert Support",
              "description": "Technical support from our team of electronics experts"
            }},
            {{
              "icon": "clock",
              "title": "Fast Delivery",
              "description": "Quick and secure delivery to your doorstep"
            }},
            {{
              "icon": "heart",
              "title": "Customer First",
              "description": "Your satisfaction is our top priority"
            }}
          ]
        }},
        "community": {{
          "title": "Join Our Tech Community",
          "description": "Connect with fellow tech enthusiasts and stay updated with the latest trends, reviews, and exclusive offers."
        }}
      }}
    }},
    "contact": {{
      "title": "Get in Touch",
      "subtitle": "Have questions about our electronics? Need technical support? We're here to help!",
      "form": {{
        "title": "Send us a Message",
        "successMessage": {{
          "title": "Thank you!",
          "message": "Your message has been received. Our support team will get back to you within 24 hours."
        }},
        "fields": {{
          "name": {{
            "label": "Full Name",
            "placeholder": "Enter your full name"
          }},
          "email": {{
            "label": "Email Address",
            "placeholder": "Enter your email address"
          }},
          "subject": {{
            "label": "Subject",
            "placeholder": "What can we help you with?"
          }},
          "message": {{
            "label": "Message",
            "placeholder": "Tell us about your question or concern..."
          }}
        }},
        "submitButton": "Send Message"
      }},
      "contactInfo": {{
        "title": "Other Ways to Reach Us",
        "email": {{
          "label": "Email",
          "value": "support@electrohub.com",
          "description": "Send us an email anytime for support"
        }},
        "phone": {{
          "label": "Phone",
          "value": "+1 (555) 123-TECH",
          "description": "Mon-Fri from 9am to 7pm EST"
        }},
        "address": {{
          "label": "Address",
          "value": "123 Tech Street, Innovation City, IC 12345",
          "description": "Visit our electronics showroom"
        }}
      }}
    }},
    "shop": {{
      "title": "Shop Electronics",
      "subtitle": "Browse our extensive collection of the latest technology and electronics",
      "categories": [
        {{
          "value": "all",
          "label": "All Categories"
        }},
        {{
          "value": "smartphones",
          "label": "Smartphones"
        }},
        {{
          "value": "laptops",
          "label": "Laptops"
        }},
        {{
          "value": "headphones",
          "label": "Headphones"
        }},
        {{
          "value": "gaming",
          "label": "Gaming"
        }},
        {{
          "value": "accessories",
          "label": "Accessories"
        }}
      ],
      "sortOptions": [
        {{
          "value": "price-asc",
          "label": "Price: Low to High"
        }},
        {{
          "value": "price-desc",
          "label": "Price: High to Low"
        }},
        {{
          "value": "name-asc",
          "label": "Name: A to Z"
        }},
        {{
          "value": "name-desc",
          "label": "Name: Z to A"
        }},
        {{
          "value": "date-asc",
          "label": "Oldest First"
        }},
        {{
          "value": "date-desc",
          "label": "Newest First"
        }}
      ]
    }}
  }}
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
