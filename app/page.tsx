import { ChatWindow } from "@/components/ChatWindow";
import { GuideInfoBox } from "@/components/guide/GuideInfoBox";

export default function Home() {
  const InfoCard = (
    <GuideInfoBox>
      <ul>
        <li className="text-sm text-muted-foreground mb-2">
          🏪 <strong>Describe your business</strong> - Tell me about your products, target audience, and style preferences
        </li>
        <li className="text-sm text-muted-foreground mb-2">
          🎨 <strong>Get instant configuration</strong> - I'll generate a complete website configuration tailored to your needs
        </li>
        <li className="text-sm text-muted-foreground mb-2">
          🚀 <strong>Deploy automatically</strong> - Your website will be deployed to GitHub and Vercel automatically
        </li>
        <li className="text-sm text-muted-foreground">
          💼 Perfect for e-commerce stores, portfolios, and business websites
        </li>
      </ul>
    </GuideInfoBox>
  );
  return (
    <ChatWindow
      endpoint="api/chat"
      emoji="🏪"
      placeholder="Describe your business idea and I'll help you create a website or online store!"
      emptyStateComponent={InfoCard}
      enableSiteDeployment={true}
    />
  );
}
