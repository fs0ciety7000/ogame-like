import type { ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { Coins, FileSignature, Gavel, Store } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ServerPotCard } from "@/components/game/ServerPotCard";
import { MarketSection } from "@/components/game/MarketSection";
import { AuctionSection } from "@/components/game/AuctionSection";
import { TradeContractsPanel } from "@/components/game/TradeContractsPanel";
import { MARKET_RULES } from "@/game/market";
import { PotDashboard } from "@/components/game/PotDashboard";
import { useServerPot } from "@/services/serverPotService";

/* 5.26 : Commerce = Marché (offres et ordres d'achat), Contrats entre
   joueurs et Hôtel des enchères, sur une seule page à onglets (?onglet=). */

const TABS: { id: string; label: string; icon: ReactNode }[] = [
  { id: "marche", label: "Marché", icon: <Store className="h-3.5 w-3.5" /> },
  { id: "contrats", label: "Contrats", icon: <FileSignature className="h-3.5 w-3.5" /> },
  { id: "encheres", label: "Enchères", icon: <Gavel className="h-3.5 w-3.5" /> },
  { id: "pot", label: "Pot commun", icon: <Coins className="h-3.5 w-3.5" /> },
];

export function CommercePage() {
  const [params, setParams] = useSearchParams();
  const tab = TABS.some((t) => t.id === params.get("onglet")) ? params.get("onglet")! : "marche";
  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        eyebrow="Cosmic Empires / Social"
        title="Commerce"
        description={`Échange tes surplus, passe des contrats de livraison et vends reliques et plans aux enchères. Taxes du marché (${Math.round(MARKET_RULES.taxPct * 100)} %), des enchères (5 %) et du comptoir d'échange (5 %) versées au pot commun du serveur.`}
      />
      <ServerPotCard />
      <Tabs value={tab} onValueChange={(v) => setParams((p) => (p.set("onglet", v), p), { replace: true })}>
        <TabsList>
          {TABS.map((t) => (
            <TabsTrigger key={t.id} value={t.id} className="inline-flex items-center gap-1.5" title={t.label} aria-label={t.label}>
              {t.icon} <span className={t.id === tab ? undefined : "hidden sm:inline"}>{t.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="marche" className="mt-4">
          <MarketSection />
        </TabsContent>
        <TabsContent value="contrats" className="mt-4">
          <TradeContractsPanel />
        </TabsContent>
        <TabsContent value="encheres" className="mt-4">
          <AuctionSection />
        </TabsContent>
        <TabsContent value="pot" className="mt-4">
          <PotTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PotTab() {
  const pot = useServerPot();
  return pot ? <PotDashboard pot={pot} /> : null;
}
