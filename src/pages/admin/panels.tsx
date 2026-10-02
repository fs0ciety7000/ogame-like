import { ResourceIcon } from "@/components/ui/game-icon";
import { useEffect, useMemo, useRef, useState } from "react";
import { Rocket, CloudDownload, Download, RefreshCw, RotateCcw, Save, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { currentGameContent, validateGameContent, type GameContent, type GameRules } from "@/game/content";
import { RESOURCE_LIST } from "@/game/resources";
import { formatNumber } from "@/lib/utils";
import { resetContentSection, saveContentSection, useContentStore } from "@/services/contentService";
import {
  adminDeploy,
  type DeployReport,
  adminClearQueues,
  adminListPlayers,
  adminResetAllXp,
  adminUpdateHooks,
  adminUpdatePlayer,
  type AdminPlayer,
} from "@/services/adminService";
import { NumberField, Section } from "@/pages/admin/fields";
import { EventsAndSeasonsSections } from "@/pages/admin/eventsFields";
import { HardResetCard } from "@/pages/admin/HardResetCard";
import { PirateTriggerCard } from "@/pages/admin/PirateTriggerCard";

const HOUR = 3600 * 1000;
const MIN = 60 * 1000;

/* ---------------- Règles ---------------- */

export function RulesPanel() {
  const customized = useContentStore((s) => s.customized.includes("rules"));
  const [rules, setRules] = useState<GameRules>(() => currentGameContent().rules);
  const [busy, setBusy] = useState(false);
  const pvp = rules.pvp;
  const setPvp = (patch: Partial<GameRules["pvp"]>) => setRules((r) => ({ ...r, pvp: { ...r.pvp, ...patch } }));

  const save = async () => {
    setBusy(true);
    try {
      await saveContentSection("rules", rules);
      toast.success("Règles enregistrées (appliquées aussi par le serveur).");
    } catch (err) {
      toast.error(`Enregistrement impossible : ${(err as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="font-display text-base text-white">Règles de combat</h2>
        <Badge variant={customized ? "warning" : "default"}>{customized ? "Personnalisé" : "Valeurs du code"}</Badge>
        <div className="ml-auto flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            disabled={busy || !customized}
            onClick={async () => {
              await resetContentSection("rules");
              setRules(currentGameContent().rules);
              toast.success("Règles par défaut restaurées.");
            }}
          >
            <RotateCcw className="mr-1 h-3.5 w-3.5" /> Valeurs par défaut
          </Button>
          <Button size="sm" disabled={busy} onClick={() => void save()}>
            <Save className="mr-1 h-3.5 w-3.5" /> Enregistrer
          </Button>
        </div>
      </div>
      <Card className="flex flex-col gap-3 p-4">
        <Section title="Protections">
          <NumberField label="Délai entre 2 attaques sur une même cible (h)" value={pvp.attackCooldownMs / HOUR} min={0} step={0.25} onChange={(v) => setPvp({ attackCooldownMs: (v ?? 0) * HOUR })} />
          <NumberField label="Bouclier après une défaite (min)" value={pvp.shieldAfterDefeatMs / MIN} min={0} step={5} onChange={(v) => setPvp({ shieldAfterDefeatMs: (v ?? 0) * MIN })} />
          <NumberField label="Protection débutant (h)" value={pvp.newbieProtectionMs / HOUR} min={0} step={1} onChange={(v) => setPvp({ newbieProtectionMs: (v ?? 0) * HOUR })} hint="Levée dès que le joueur attaque." />
          <NumberField label="Écart d'XP maximal (×)" value={pvp.maxXpRatio} min={1} step={0.5} onChange={(v) => setPvp({ maxXpRatio: v ?? 1 })} hint="Cible interdite si son XP × cette valeur < ton XP." />
          <NumberField label="…à partir de (XP de l'attaquant)" value={pvp.xpGapFloor} min={0} step={50} onChange={(v) => setPvp({ xpGapFloor: v ?? 0 })} />
        </Section>
        <Section title="XP et butin">
          <NumberField label="Perte d'XP max en défense / 24 h" value={pvp.defenseXpLossCapPer24h} min={0} step={5} onChange={(v) => setPvp({ defenseXpLossCapPer24h: v ?? 0 })} />
          <NumberField
            label="Butin : ressources communes (0,10 = 10 %)"
            value={rules.combat.lootPercentCommon}
            min={0}
            step={0.01}
            onChange={(v) => setRules((r) => ({ ...r, combat: { ...r.combat, lootPercentCommon: v ?? 0 } }))}
          />
          <NumberField
            label="Butin : ressources rares (0,08 = 8 %)"
            value={rules.combat.lootPercent}
            min={0}
            step={0.01}
            onChange={(v) => setRules((r) => ({ ...r, combat: { ...r.combat, lootPercent: v ?? 0 } }))}
            hint="Limité par la cargaison (stat CAP) des vaisseaux survivants."
          />
        </Section>
        <Section title="Équilibre attaque / défense">
          <NumberField
            label="Bonus à domicile du défenseur (0,15 = +15 %)"
            value={rules.combat.homeDefenseBonus}
            min={0}
            step={0.05}
            onChange={(v) => setRules((r) => ({ ...r, combat: { ...r.combat, homeDefenseBonus: v ?? 0 } }))}
          />
          <NumberField
            label="Vaisseaux à quai : part de leur puissance en défense"
            value={rules.combat.homeFleetDefenseFactor}
            min={0}
            step={0.05}
            hint="Ils subissent la même part des pertes. 0 = seules les défenses combattent."
            onChange={(v) => setRules((r) => ({ ...r, combat: { ...r.combat, homeFleetDefenseFactor: v ?? 0 } }))}
          />
          <NumberField
            label="Bouclier par niveau de Hangar de défense (0,0075 = 0,75 %)"
            value={rules.combat.shieldPerLevel}
            min={0}
            step={0.0025}
            onChange={(v) => setRules((r) => ({ ...r, combat: { ...r.combat, shieldPerLevel: v ?? 0 } }))}
          />
          <NumberField
            label="Bouclier maximal (0,15 = 15 %)"
            value={rules.combat.shieldMax}
            min={0}
            step={0.05}
            onChange={(v) => setRules((r) => ({ ...r, combat: { ...r.combat, shieldMax: v ?? 0 } }))}
          />
          <NumberField
            label="Défenses reconstruites après un combat (0,6 = 60 %)"
            value={rules.combat.defenseRebuildPct}
            min={0}
            step={0.05}
            onChange={(v) => setRules((r) => ({ ...r, combat: { ...r.combat, defenseRebuildPct: v ?? 0 } }))}
          />
        </Section>
        <Section title="Formations et postures">
          <NumberField
            label="Assaut : bonus d'attaque (0,10 = +10 %)"
            value={rules.combat.assaultAttack}
            step={0.05}
            onChange={(v) => setRules((r) => ({ ...r, combat: { ...r.combat, assaultAttack: v ?? 0 } }))}
          />
          <NumberField
            label="Assaut : pertes subies en plus (0,15 = +15 %)"
            value={rules.combat.assaultLosses}
            step={0.05}
            onChange={(v) => setRules((r) => ({ ...r, combat: { ...r.combat, assaultLosses: v ?? 0 } }))}
          />
          <NumberField
            label="Prudente : attaque (−0,10 = −10 %)"
            value={rules.combat.cautiousAttack}
            step={0.05}
            onChange={(v) => setRules((r) => ({ ...r, combat: { ...r.combat, cautiousAttack: v ?? 0 } }))}
          />
          <NumberField
            label="Prudente : pertes subies (−0,25 = −25 %)"
            value={rules.combat.cautiousLosses}
            step={0.05}
            onChange={(v) => setRules((r) => ({ ...r, combat: { ...r.combat, cautiousLosses: v ?? 0 } }))}
          />
          <NumberField
            label="Raid : attaque (−0,15 = −15 %)"
            value={rules.combat.raidAttack}
            step={0.05}
            onChange={(v) => setRules((r) => ({ ...r, combat: { ...r.combat, raidAttack: v ?? 0 } }))}
          />
          <NumberField
            label="Raid : cargaison en plus (0,30 = +30 %)"
            value={rules.combat.raidCargo}
            step={0.05}
            onChange={(v) => setRules((r) => ({ ...r, combat: { ...r.combat, raidCargo: v ?? 0 } }))}
          />
          <NumberField
            label="Bunker : bonus des défenses (0,08 = +8 %)"
            value={rules.combat.bunkerDefense}
            step={0.05}
            onChange={(v) => setRules((r) => ({ ...r, combat: { ...r.combat, bunkerDefense: v ?? 0 } }))}
          />
          <NumberField
            label="Riposte : part des vaisseaux à quai engagée (0,25 = 25 %)"
            value={rules.combat.riposteHomeFleet}
            step={0.05}
            onChange={(v) => setRules((r) => ({ ...r, combat: { ...r.combat, riposteHomeFleet: v ?? 0 } }))}
          />
          <NumberField
            label="Délai entre deux changements de posture (h)"
            value={rules.combat.postureCooldownHours}
            step={0.5}
            onChange={(v) => setRules((r) => ({ ...r, combat: { ...r.combat, postureCooldownHours: v ?? 0 } }))}
          />
        </Section>
        <Section title="Marché">
          <NumberField
            label="Taxe sur les ventes (0,05 = 5 %)"
            value={rules.market.taxPct}
            step={0.01}
            onChange={(v) => setRules((r) => ({ ...r, market: { ...r.market, taxPct: v ?? 0 } }))}
          />
          <NumberField
            label="Taxe entre alliés (0,02 = 2 %)"
            value={rules.market.allianceTaxPct}
            step={0.01}
            onChange={(v) => setRules((r) => ({ ...r, market: { ...r.market, allianceTaxPct: v ?? 0 } }))}
          />
          <NumberField
            label="Offres ouvertes par joueur"
            value={rules.market.maxOpenOffers}
            step={1}
            onChange={(v) => setRules((r) => ({ ...r, market: { ...r.market, maxOpenOffers: v ?? 0 } }))}
          />
          <NumberField
            label="Achats par joueur et par jour"
            value={rules.market.maxBuysPerDay}
            step={1}
            onChange={(v) => setRules((r) => ({ ...r, market: { ...r.market, maxBuysPerDay: v ?? 0 } }))}
          />
          <NumberField
            label="Durée de vie d'une offre (h)"
            value={rules.market.offerHours}
            step={1}
            onChange={(v) => setRules((r) => ({ ...r, market: { ...r.market, offerHours: v ?? 0 } }))}
          />
          <NumberField
            label="Écart max au taux du comptoir (×)"
            value={rules.market.priceBand}
            step={0.5}
            onChange={(v) => setRules((r) => ({ ...r, market: { ...r.market, priceBand: v ?? 0 } }))}
          />
        </Section>
        <Section title="Expéditions">
          <NumberField
            label="Vaisseaux minimum"
            value={rules.expeditions.minShips}
            step={1}
            onChange={(v) => setRules((r) => ({ ...r, expeditions: { ...r.expeditions, minShips: v ?? 0 } }))}
          />
          <NumberField
            label="Expéditions par jour"
            value={rules.expeditions.maxPerDay}
            step={1}
            onChange={(v) => setRules((r) => ({ ...r, expeditions: { ...r.expeditions, maxPerDay: v ?? 0 } }))}
          />
          <NumberField
            label="Délai de décision face à une faction (min)"
            value={rules.expeditions.choiceMinutes}
            step={5}
            onChange={(v) => setRules((r) => ({ ...r, expeditions: { ...r.expeditions, choiceMinutes: v ?? 0 } }))}
          />
          <NumberField
            label="XP par heure d'expédition"
            value={rules.expeditions.xpPerHour}
            step={5}
            onChange={(v) => setRules((r) => ({ ...r, expeditions: { ...r.expeditions, xpPerHour: v ?? 0 } }))}
          />
          <NumberField
            label="Gisement : heures de production min"
            value={rules.expeditions.depositMinHours}
            step={0.5}
            onChange={(v) => setRules((r) => ({ ...r, expeditions: { ...r.expeditions, depositMinHours: v ?? 0 } }))}
          />
          <NumberField
            label="Gisement : heures de production max"
            value={rules.expeditions.depositMaxHours}
            step={0.5}
            onChange={(v) => setRules((r) => ({ ...r, expeditions: { ...r.expeditions, depositMaxHours: v ?? 0 } }))}
          />
          <NumberField
            label="Trésor : heures de production min (converties en rares)"
            value={rules.expeditions.rareMinHours}
            step={0.25}
            onChange={(v) => setRules((r) => ({ ...r, expeditions: { ...r.expeditions, rareMinHours: v ?? 0 } }))}
          />
          <NumberField
            label="Trésor : heures de production max"
            value={rules.expeditions.rareMaxHours}
            step={0.25}
            onChange={(v) => setRules((r) => ({ ...r, expeditions: { ...r.expeditions, rareMaxHours: v ?? 0 } }))}
          />
          <NumberField
            label="Épave : part de la flotte récupérée min (0,02 = 2 %)"
            value={rules.expeditions.wreckMinPct}
            step={0.01}
            onChange={(v) => setRules((r) => ({ ...r, expeditions: { ...r.expeditions, wreckMinPct: v ?? 0 } }))}
          />
          <NumberField
            label="Épave : part max"
            value={rules.expeditions.wreckMaxPct}
            step={0.01}
            onChange={(v) => setRules((r) => ({ ...r, expeditions: { ...r.expeditions, wreckMaxPct: v ?? 0 } }))}
          />
          <NumberField
            label="Embuscade : puissance adverse min (part de la flotte)"
            value={rules.expeditions.ambushMinPower}
            step={0.05}
            onChange={(v) => setRules((r) => ({ ...r, expeditions: { ...r.expeditions, ambushMinPower: v ?? 0 } }))}
          />
          <NumberField
            label="Embuscade : puissance adverse max"
            value={rules.expeditions.ambushMaxPower}
            step={0.05}
            onChange={(v) => setRules((r) => ({ ...r, expeditions: { ...r.expeditions, ambushMaxPower: v ?? 0 } }))}
          />
          <NumberField
            label="Butin d'une victoire (heures de production)"
            value={rules.expeditions.victoryLootHours}
            step={0.5}
            onChange={(v) => setRules((r) => ({ ...r, expeditions: { ...r.expeditions, victoryLootHours: v ?? 0 } }))}
          />
          <NumberField
            label="Péage d'une faction (heures de production)"
            value={rules.expeditions.tollHours}
            step={0.5}
            onChange={(v) => setRules((r) => ({ ...r, expeditions: { ...r.expeditions, tollHours: v ?? 0 } }))}
          />
          <NumberField
            label="Probabilité relative : rien"
            value={rules.expeditions.weights.nothing}
            step={1}
            onChange={(v) => setRules((r) => ({ ...r, expeditions: { ...r.expeditions, weights: { ...r.expeditions.weights, nothing: v ?? 0 } } }))}
          />
          <NumberField
            label="Probabilité relative : gisement"
            value={rules.expeditions.weights.deposit}
            step={1}
            onChange={(v) => setRules((r) => ({ ...r, expeditions: { ...r.expeditions, weights: { ...r.expeditions.weights, deposit: v ?? 0 } } }))}
          />
          <NumberField
            label="Probabilité relative : trésor rare"
            value={rules.expeditions.weights.rare}
            step={1}
            onChange={(v) => setRules((r) => ({ ...r, expeditions: { ...r.expeditions, weights: { ...r.expeditions.weights, rare: v ?? 0 } } }))}
          />
          <NumberField
            label="Probabilité relative : épave"
            value={rules.expeditions.weights.wreck}
            step={1}
            onChange={(v) => setRules((r) => ({ ...r, expeditions: { ...r.expeditions, weights: { ...r.expeditions.weights, wreck: v ?? 0 } } }))}
          />
          <NumberField
            label="Probabilité relative : embuscade"
            value={rules.expeditions.weights.ambush}
            step={1}
            onChange={(v) => setRules((r) => ({ ...r, expeditions: { ...r.expeditions, weights: { ...r.expeditions.weights, ambush: v ?? 0 } } }))}
          />
          <NumberField
            label="Probabilité relative : rencontre de faction"
            value={rules.expeditions.weights.faction}
            step={1}
            onChange={(v) => setRules((r) => ({ ...r, expeditions: { ...r.expeditions, weights: { ...r.expeditions.weights, faction: v ?? 0 } } }))}
          />
        </Section>
        <Section title="Guerres d'alliance">
          <NumberField
            label="Membres minimum de l'alliance visée"
            value={rules.wars.minMembers}
            step={1}
            onChange={(v) => setRules((r) => ({ ...r, wars: { ...r.wars, minMembers: v ?? 0 } }))}
          />
          <NumberField
            label="Coût : ferraille du trésor"
            value={rules.wars.costScrap}
            step={1000000}
            onChange={(v) => setRules((r) => ({ ...r, wars: { ...r.wars, costScrap: v ?? 0 } }))}
          />
          <NumberField
            label="Coût : énergie du trésor"
            value={rules.wars.costEnergy}
            step={1000000}
            onChange={(v) => setRules((r) => ({ ...r, wars: { ...r.wars, costEnergy: v ?? 0 } }))}
          />
          <NumberField
            label="Préparation (h)"
            value={rules.wars.prepHours}
            step={1}
            onChange={(v) => setRules((r) => ({ ...r, wars: { ...r.wars, prepHours: v ?? 0 } }))}
          />
          <NumberField
            label="Durée de la guerre (h)"
            value={rules.wars.durationHours}
            step={1}
            onChange={(v) => setRules((r) => ({ ...r, wars: { ...r.wars, durationHours: v ?? 0 } }))}
          />
          <NumberField
            label="Délai avant de refaire la guerre au même adversaire (jours)"
            value={rules.wars.pairCooldownDays}
            step={1}
            onChange={(v) => setRules((r) => ({ ...r, wars: { ...r.wars, pairCooldownDays: v ?? 0 } }))}
          />
          <NumberField
            label="Délai entre deux attaques sur une même cible pendant la guerre (h)"
            value={rules.wars.attackCooldownHours}
            step={0.5}
            onChange={(v) => setRules((r) => ({ ...r, wars: { ...r.wars, attackCooldownHours: v ?? 0 } }))}
          />
          <NumberField
            label="Points par attaque gagnée"
            value={rules.wars.pointsAttackWin}
            step={1}
            onChange={(v) => setRules((r) => ({ ...r, wars: { ...r.wars, pointsAttackWin: v ?? 0 } }))}
          />
          <NumberField
            label="Points par défense gagnée"
            value={rules.wars.pointsDefenseWin}
            step={1}
            onChange={(v) => setRules((r) => ({ ...r, wars: { ...r.wars, pointsDefenseWin: v ?? 0 } }))}
          />
          <NumberField
            label="Butin pour 1 point supplémentaire"
            value={rules.wars.lootPerPoint}
            step={1000000}
            onChange={(v) => setRules((r) => ({ ...r, wars: { ...r.wars, lootPerPoint: v ?? 0 } }))}
          />
          <NumberField
            label="Récompense : ferraille au trésor du vainqueur"
            value={rules.wars.rewardScrap}
            step={1000000}
            onChange={(v) => setRules((r) => ({ ...r, wars: { ...r.wars, rewardScrap: v ?? 0 } }))}
          />
          <NumberField
            label="Récompense : énergie au trésor du vainqueur"
            value={rules.wars.rewardEnergy}
            step={1000000}
            onChange={(v) => setRules((r) => ({ ...r, wars: { ...r.wars, rewardEnergy: v ?? 0 } }))}
          />
          <NumberField
            label="Bonus de score de saison d'alliance (0,1 = +10 %)"
            value={rules.wars.seasonBonusPct}
            step={0.05}
            onChange={(v) => setRules((r) => ({ ...r, wars: { ...r.wars, seasonBonusPct: v ?? 0 } }))}
          />
          <NumberField
            label="Durée du titre des vainqueurs (jours)"
            value={rules.wars.titleDays}
            step={1}
            onChange={(v) => setRules((r) => ({ ...r, wars: { ...r.wars, titleDays: v ?? 0 } }))}
          />
        </Section>
        <Section title="Léviathan">
          <NumberField
            label="Structure : facteur × puissance d'attaque des actifs"
            value={rules.leviathan.hpFactor}
            step={0.5}
            onChange={(v) => setRules((r) => ({ ...r, leviathan: { ...r.leviathan, hpFactor: v ?? 0 } }))}
          />
          <NumberField
            label="Durée de présence (h)"
            value={rules.leviathan.durationHours}
            step={1}
            onChange={(v) => setRules((r) => ({ ...r, leviathan: { ...r.leviathan, durationHours: v ?? 0 } }))}
          />
          <NumberField
            label="Délai entre deux assauts d'un joueur (h)"
            value={rules.leviathan.cooldownHours}
            step={0.5}
            onChange={(v) => setRules((r) => ({ ...r, leviathan: { ...r.leviathan, cooldownHours: v ?? 0 } }))}
          />
          <NumberField
            label="Trajet aller (min)"
            value={rules.leviathan.flightMinutes}
            step={5}
            onChange={(v) => setRules((r) => ({ ...r, leviathan: { ...r.leviathan, flightMinutes: v ?? 0 } }))}
          />
          <NumberField
            label="Pertes par assaut (0,08 = 8 %)"
            value={rules.leviathan.lossPct}
            step={0.01}
            onChange={(v) => setRules((r) => ({ ...r, leviathan: { ...r.leviathan, lossPct: v ?? 0 } }))}
          />
          <NumberField
            label="Récompense de base (heures de production)"
            value={rules.leviathan.baseRewardHours}
            step={0.5}
            onChange={(v) => setRules((r) => ({ ...r, leviathan: { ...r.leviathan, baseRewardHours: v ?? 0 } }))}
          />
          <NumberField
            label="Bonus max selon les dégâts (heures)"
            value={rules.leviathan.bonusRewardHours}
            step={0.5}
            onChange={(v) => setRules((r) => ({ ...r, leviathan: { ...r.leviathan, bonusRewardHours: v ?? 0 } }))}
          />
          <NumberField
            label="Récompenses s'il survit (0,5 = moitié)"
            value={rules.leviathan.failedRewardFactor}
            step={0.1}
            onChange={(v) => setRules((r) => ({ ...r, leviathan: { ...r.leviathan, failedRewardFactor: v ?? 0 } }))}
          />
          <NumberField
            label="Durée du titre (jours)"
            value={rules.leviathan.titleDays}
            step={1}
            onChange={(v) => setRules((r) => ({ ...r, leviathan: { ...r.leviathan, titleDays: v ?? 0 } }))}
          />
        </Section>
        <Section title="Flottes en vol">
          <NumberField
            label="Durée fixe de tout trajet (min)"
            value={rules.fleets.baseMinutes}
            min={0}
            step={1}
            onChange={(v) => setRules((r) => ({ ...r, fleets: { ...r.fleets, baseMinutes: v ?? 0 } }))}
          />
          <NumberField
            label="Minutes par unité de distance (÷ vitesse)"
            value={rules.fleets.minutesPerDistance}
            min={0}
            step={0.5}
            hint="Temps de vol = durée fixe + distance × cette valeur ÷ vitesse du vaisseau le plus lent. Carte de 100 × 100."
            onChange={(v) => setRules((r) => ({ ...r, fleets: { ...r.fleets, minutesPerDistance: v ?? 0 } }))}
          />
          <NumberField
            label="Trajet maximal d'une attaque (min)"
            value={rules.fleets.maxAttackMinutes}
            min={0}
            step={5}
            hint="Plafond du trajet aller d'une attaque entre joueurs (le retour dure autant). 0 = pas de plafond."
            onChange={(v) => setRules((r) => ({ ...r, fleets: { ...r.fleets, maxAttackMinutes: v ?? 0 } }))}
          />
        </Section>
        <Section title="Espionnage">
          <NumberField
            label="Trajet des sondes : durée fixe (min)"
            value={rules.spy.baseMinutes}
            min={0}
            step={0.5}
            onChange={(v) => setRules((r) => ({ ...r, spy: { ...r.spy, baseMinutes: v ?? 0 } }))}
          />
          <NumberField
            label="Trajet des sondes : minutes par distance (÷ vitesse)"
            value={rules.spy.minutesPerDistance}
            min={0}
            step={0.1}
            onChange={(v) => setRules((r) => ({ ...r, spy: { ...r.spy, minutesPerDistance: v ?? 0 } }))}
          />
          <NumberField
            label="Sentinelles à quai pour +1 contre-espionnage"
            value={rules.spy.sentinelsPerCounterLevel}
            min={1}
            step={10}
            onChange={(v) => setRules((r) => ({ ...r, spy: { ...r.spy, sentinelsPerCounterLevel: v ?? 0 } }))}
          />
          <NumberField
            label="Détection de base (0,1 = 10 %)"
            value={rules.spy.detectionBase}
            min={0}
            step={0.05}
            hint="Score = Espionnage − contre-espionnage + log2(sondes)."
            onChange={(v) => setRules((r) => ({ ...r, spy: { ...r.spy, detectionBase: v ?? 0 } }))}
          />
          <NumberField
            label="Détection par point de contre-espionnage en plus"
            value={rules.spy.detectionPerPoint}
            min={0}
            step={0.05}
            onChange={(v) => setRules((r) => ({ ...r, spy: { ...r.spy, detectionPerPoint: v ?? 0 } }))}
          />
          <NumberField
            label="Détection minimale"
            value={rules.spy.detectionMin}
            min={0}
            step={0.05}
            onChange={(v) => setRules((r) => ({ ...r, spy: { ...r.spy, detectionMin: v ?? 0 } }))}
          />
          <NumberField
            label="Détection maximale"
            value={rules.spy.detectionMax}
            min={0}
            step={0.05}
            onChange={(v) => setRules((r) => ({ ...r, spy: { ...r.spy, detectionMax: v ?? 0 } }))}
          />
          <NumberField
            label="Score pour voir flotte et défenses"
            value={rules.spy.tierForces}
            min={0}
            step={0.5}
            onChange={(v) => setRules((r) => ({ ...r, spy: { ...r.spy, tierForces: v ?? 0 } }))}
          />
          <NumberField
            label="Score pour voir bâtiments et technologies"
            value={rules.spy.tierInfrastructure}
            min={0}
            step={0.5}
            onChange={(v) => setRules((r) => ({ ...r, spy: { ...r.spy, tierInfrastructure: v ?? 0 } }))}
          />
          <NumberField
            label="Score pour voir files et flottes en vol"
            value={rules.spy.tierActivity}
            min={0}
            step={0.5}
            onChange={(v) => setRules((r) => ({ ...r, spy: { ...r.spy, tierActivity: v ?? 0 } }))}
          />
        </Section>
        <Section title="Débris et patrouille">
          <NumberField
            label="Débris : part du coût des vaisseaux détruits (0,3 = 30 %)"
            value={rules.debris.percent}
            min={0}
            step={0.05}
            onChange={(v) => setRules((r) => ({ ...r, debris: { ...r.debris, percent: v ?? 0 } }))}
          />
          <NumberField
            label="Durée de vie d'un champ de débris (h)"
            value={rules.debris.lifetimeHours}
            min={0}
            step={1}
            onChange={(v) => setRules((r) => ({ ...r, debris: { ...r.debris, lifetimeHours: v ?? 0 } }))}
          />
          <NumberField
            label="Capacité d'un Drone récupérateur par niveau"
            value={rules.debris.capacityPerLevel}
            min={0}
            step={10}
            onChange={(v) => setRules((r) => ({ ...r, debris: { ...r.debris, capacityPerLevel: v ?? 0 } }))}
          />
          <NumberField
            label="Patrouille : durée minimale (min)"
            value={rules.patrol.minMinutes}
            min={0}
            step={5}
            onChange={(v) => setRules((r) => ({ ...r, patrol: { ...r.patrol, minMinutes: v ?? 0 } }))}
          />
          <NumberField
            label="Patrouille : durée maximale (min)"
            value={rules.patrol.maxMinutes}
            min={0}
            step={30}
            onChange={(v) => setRules((r) => ({ ...r, patrol: { ...r.patrol, maxMinutes: v ?? 0 } }))}
          />
        </Section>
        <Section title="Économie">
          <NumberField
            label="Entretien : énergie/s par place de hangar (attaque)"
            value={rules.economy.upkeepPerPlaceAttack}
            min={0}
            step={0.001}
            onChange={(v) => setRules((r) => ({ ...r, economy: { ...r.economy, upkeepPerPlaceAttack: v ?? 0 } }))}
          />
          <NumberField
            label="Entretien : énergie/s par place (défense)"
            value={rules.economy.upkeepPerPlaceDefense}
            min={0}
            step={0.001}
            onChange={(v) => setRules((r) => ({ ...r, economy: { ...r.economy, upkeepPerPlaceDefense: v ?? 0 } }))}
          />
          <NumberField
            label="Production pendant une panne d'énergie (0,5 = 50 %)"
            value={rules.economy.outageProductionFactor}
            min={0}
            step={0.05}
            onChange={(v) => setRules((r) => ({ ...r, economy: { ...r.economy, outageProductionFactor: v ?? 0 } }))}
          />
          <NumberField
            label="Part de l'entrepôt à l'abri du pillage (0,1 = 10 %)"
            value={rules.economy.protectedStoragePct}
            min={0}
            step={0.01}
            onChange={(v) => setRules((r) => ({ ...r, economy: { ...r.economy, protectedStoragePct: v ?? 0 } }))}
          />
          <NumberField
            label="Rares des missions et contrats : production horaire de référence (0 = désactivé)"
            value={rules.economy.missionRareProductionRef}
            min={0}
            step={50_000}
            onChange={(v) => setRules((r) => ({ ...r, economy: { ...r.economy, missionRareProductionRef: v ?? 0 } }))}
          />
        </Section>
        <EventsAndSeasonsSections rules={rules} setRules={setRules} />
      </Card>
    </div>
  );
}

/* ---------------- Joueurs ---------------- */

export function PlayersPanel() {
  const [players, setPlayers] = useState<AdminPlayer[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<AdminPlayer | null>(null);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [reason, setReason] = useState("");
  const content = useMemo(() => currentGameContent(), []);

  const reload = async () => {
    try {
      setPlayers(await adminListPlayers());
    } catch (err) {
      toast.error(`Lecture des joueurs impossible : ${(err as Error).message}`);
    }
  };
  useEffect(() => {
    void reload();
  }, []);
  useEffect(() => {
    const p = players.find((x) => x.id === selectedId);
    setDraft(p ? structuredClone(p) : null);
    setReason("");
  }, [selectedId, players]);
  // v3.5.1 : un motif est exigé dès que l'état de jeu du joueur change.
  const original = players.find((x) => x.id === selectedId);
  const gameStateChanged =
    !!draft && !!original && (["xp", "seasonXp", "resources", "buildings", "units", "techLevels"] as const).some((f) => JSON.stringify(draft[f] ?? null) !== JSON.stringify(original[f] ?? null));
  const reasonMissing = gameStateChanged && reason.trim().length < 5;

  const filtered = players.filter((p) => !search || p.pseudo?.toLowerCase().includes(search.toLowerCase()));
  const set = (patch: Partial<AdminPlayer>) => setDraft((d) => (d ? { ...d, ...patch } : d));

  const save = async () => {
    if (!draft) return;
    setBusy(true);
    try {
      await adminUpdatePlayer(draft.id, {
        xp: draft.xp,
        seasonXp: draft.seasonXp,
        resources: draft.resources,
        buildings: draft.buildings,
        units: draft.units,
        techLevels: draft.techLevels,
      }, reason.trim());
      toast.success(`${draft.pseudo} mis à jour.`);
      await reload();
    } catch (err) {
      toast.error(`Impossible : ${(err as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-3 lg:grid-cols-[280px_1fr]">
      <Card className="flex max-h-[75vh] flex-col gap-2 p-2">
        <div className="flex gap-2">
          <Input placeholder="Rechercher…" value={search} onChange={(e) => setSearch(e.target.value)} className="h-8" />
          <Button variant="ghost" size="icon" title="Recharger" onClick={() => void reload()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedId(p.id)}
              className={`flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-sm ${
                p.id === selectedId ? "bg-cyan-glow/10 text-cyan-glow" : "text-slate-300 hover:bg-white/5"
              }`}
            >
              <span className="truncate">{p.pseudo}</span>
              <span className="tabular-mono text-[11px] text-slate-500">{formatNumber(p.xp ?? 0)} XP</span>
            </button>
          ))}
        </div>
        <p className="px-1 text-[11px] text-slate-500">{players.length} joueur(s)</p>
      </Card>

      <Card className="flex flex-col gap-3 p-4">
        {!draft ? (
          <p className="text-sm text-slate-500">Sélectionne un joueur.</p>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-base text-white">{draft.pseudo}</h2>
              <span className="font-mono text-[11px] text-slate-500">{draft.id}</span>
              <div className="ml-auto flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    if (!confirm("Vider toutes les files (constructions, unités, recherches, missions) de ce joueur ?")) return;
                    await adminClearQueues(draft.id);
                    toast.success("Files vidées.");
                  }}
                >
                  <Trash2 className="mr-1 h-3.5 w-3.5" /> Vider les files
                </Button>
                <Button size="sm" disabled={busy || reasonMissing} onClick={() => void save()}>
                  <Save className="mr-1 h-3.5 w-3.5" /> Enregistrer
                </Button>
              </div>
            </div>
            {gameStateChanged && (
              <label className="flex flex-col gap-1 text-xs text-gold-glow">
                Motif de la modification (obligatoire, consigné au journal)
                <Input value={reason} maxLength={300} placeholder="Ex. : compensation du bug de flotte du 02/10" onChange={(e) => setReason(e.target.value)} className="h-8" />
              </label>
            )}

            <Section title="Expérience">
              <NumberField label="XP totale" value={draft.xp} min={0} step={1} onChange={(v) => set({ xp: v ?? 0 })} />
              <NumberField label="XP de la saison" value={draft.seasonXp} min={0} step={1} onChange={(v) => set({ seasonXp: v ?? 0 })} />
            </Section>

            <Section title="Ressources">
              {RESOURCE_LIST.map((r) => (
                <NumberField
                  key={r.id}
                  label={
                    <>
                      <ResourceIcon id={r.id} /> {r.name}
                    </>
                  }
                  value={Math.floor(draft.resources?.[r.id] ?? 0)}
                  min={0}
                  step={1}
                  onChange={(v) => set({ resources: { ...draft.resources, [r.id]: v ?? 0 } })}
                />
              ))}
            </Section>

            <Section title="Bâtiments (niveau, débloqué)">
              {content.buildings.map((b) => {
                const st = draft.buildings?.[b.id] ?? { level: 1, unlocked: false };
                return (
                  <div key={b.id} className="flex items-center gap-2 text-sm text-slate-200">
                    <span className="flex-1 truncate">{b.name}</span>
                    <Input
                      type="number"
                      min={0}
                      max={b.maxLevel}
                      value={st.level}
                      className="h-8 w-20"
                      onChange={(e) => set({ buildings: { ...draft.buildings, [b.id]: { ...st, level: Number(e.target.value) || 0 } } })}
                    />
                    <input
                      type="checkbox"
                      checked={st.unlocked}
                      title="Débloqué"
                      className="accent-cyan-400"
                      onChange={(e) => set({ buildings: { ...draft.buildings, [b.id]: { ...st, unlocked: e.target.checked } } })}
                    />
                  </div>
                );
              })}
            </Section>

            <Section title="Unités (niveau, quantité)">
              {content.units.map((u) => {
                const st = draft.units?.[u.id] ?? { level: 0, count: 0 };
                const setUnit = (patch: Partial<typeof st>) => set({ units: { ...draft.units, [u.id]: { ...st, ...patch } } });
                return (
                  <div key={u.id} className="flex items-center gap-2 text-sm text-slate-200">
                    <span className="flex-1 truncate">{u.name}</span>
                    <Input type="number" min={0} value={st.level} className="h-8 w-16" onChange={(e) => setUnit({ level: Number(e.target.value) || 0 })} />
                    <Input type="number" min={0} value={st.count} className="h-8 w-24" onChange={(e) => setUnit({ count: Number(e.target.value) || 0 })} />
                  </div>
                );
              })}
            </Section>

            <Section title="Technologies (niveau)">
              {content.technologies.map((t) => (
                <div key={t.id} className="flex items-center gap-2 text-sm text-slate-200">
                  <span className="flex-1 truncate">{t.nom}</span>
                  <Input
                    type="number"
                    min={0}
                    max={t.maxLevel}
                    value={draft.techLevels?.[t.id] ?? 0}
                    className="h-8 w-20"
                    onChange={(e) => set({ techLevels: { ...draft.techLevels, [t.id]: Number(e.target.value) || 0 } })}
                  />
                </div>
              ))}
            </Section>
            <p className="text-[11px] text-slate-500">
              Les bonus de technos (production, attaque…) se recalculent au prochain achèvement de recherche du joueur ; les
              niveaux d'unités sont pris en compte immédiatement.
            </p>
          </>
        )}
      </Card>
    </div>
  );
}

/* ---------------- Outils ---------------- */

export function ToolsPanel() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const [updatingHooks, setUpdatingHooks] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [deployReport, setDeployReport] = useState<DeployReport | null>(null);

  const deploy = async () => {
    if (!confirm("Déployer la dernière version de main ? Une sauvegarde est faite d'abord, puis le schéma et les hooks sont mis à jour (le serveur redémarre quelques secondes).")) return;
    setDeploying(true);
    try {
      const report = await adminDeploy();
      setDeployReport(report);
      if (report.errors.length > 0) toast.error(`Déploiement interrompu : ${report.errors.join(" · ")}`);
      else toast.success(`Déployé. Sauvegarde ${report.backup}.`);
    } catch (err) {
      toast.error(`Impossible : ${(err as Error).message}`);
    } finally {
      setDeploying(false);
    }
  };

  const updateHooks = async () => {
    setUpdatingHooks(true);
    try {
      const report = await adminUpdateHooks();
      if (report.errors.length > 0) toast.error(`Mise à jour annulée : ${report.errors.join(" · ")}`);
      else if (report.updated.length > 0) toast.success(`Hooks mis à jour (${report.updated.join(", ")}). Le serveur redémarre.`);
      else toast.success(`Les hooks sont déjà à jour (${report.branch}).`);
    } catch (err) {
      toast.error(`Impossible : ${(err as Error).message}`);
    } finally {
      setUpdatingHooks(false);
    }
  };

  const exportContent = () => {
    const blob = new Blob([JSON.stringify(currentGameContent(), null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `cosmic-empires-contenu-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const importContent = async (file: File) => {
    let data: GameContent;
    try {
      data = { ...currentGameContent(), ...JSON.parse(await file.text()) };
    } catch {
      toast.error("Fichier JSON illisible.");
      return;
    }
    const errors = validateGameContent(data);
    if (errors.length > 0) {
      toast.error(`Import refusé : ${errors.slice(0, 3).join(" · ")}`);
      return;
    }
    if (!confirm("Remplacer tout le contenu du jeu par ce fichier ?")) return;
    for (const section of ["buildings", "units", "technologies", "missions", "rules"] as const) {
      await saveContentSection(section, data[section] as never);
    }
    toast.success("Contenu importé.");
  };

  return (
    <div className="grid gap-3 md:grid-cols-2">
      <Card className="flex flex-col gap-2 p-4">
        <h3 className="hud-title text-sm text-white">Sauvegarde du contenu</h3>
        <p className="text-xs text-slate-400">
          Exporte bâtiments, unités, technos, missions et règles en JSON (à garder avant de gros changements), ou réimporte
          un fichier exporté.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportContent}>
            <Download className="mr-1 h-3.5 w-3.5" /> Exporter
          </Button>
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
            <Upload className="mr-1 h-3.5 w-3.5" /> Importer
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (f) void importContent(f);
            }}
          />
        </div>
      </Card>

      <Card className="flex flex-col gap-2 p-4">
        <h3 className="hud-title text-sm text-white">Code du serveur</h3>
        <p className="text-xs text-slate-400">
          Le serveur récupère ses hooks (règles du jeu côté serveur) depuis la branche main du dépôt à chaque démarrage. Ce
          bouton le fait tout de suite, par exemple juste après un déploiement.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" disabled={deploying || updatingHooks} onClick={() => void deploy()}>
            <Rocket className="mr-1 h-3.5 w-3.5" /> {deploying ? "Déploiement…" : "Déployer la mise à jour"}
          </Button>
          <Button variant="outline" size="sm" disabled={updatingHooks || deploying} onClick={() => void updateHooks()}>
            <CloudDownload className="mr-1 h-3.5 w-3.5" /> {updatingHooks ? "Mise à jour…" : "Hooks seulement"}
          </Button>
        </div>
        <p className="text-[11px] text-slate-500">« Déployer » : sauvegarde complète, puis schéma, fiches publiques et hooks depuis main. Fait aussi automatiquement par GitHub Actions après chaque merge, si les secrets sont configurés.</p>
        {deployReport && (
          <ul className="space-y-0.5 border-t border-white/5 pt-2 text-[11px] text-slate-400">
            <li>Version : <span className="font-mono text-slate-300">{deployReport.ref}</span></li>
            <li>Sauvegarde : {deployReport.backup ?? "—"}</li>
            <li>Schéma : {deployReport.schema !== null ? `${deployReport.schema} collections` : "—"}</li>
            <li>Fiches publiques : {deployReport.profiles ?? "—"}</li>
            <li>Hooks : {deployReport.hooks ? (deployReport.hooks.updated.length ? `mis à jour (${deployReport.hooks.updated.join(", ")})` : deployReport.hooks.errors[0] ?? "déjà à jour") : "—"}</li>
            {deployReport.errors.map((e) => (
              <li key={e} className="text-danger-glow">{e}</li>
            ))}
          </ul>
        )}
      </Card>

      <PirateTriggerCard />
      <HardResetCard />

      <Card className="flex flex-col gap-2 border-danger-glow/30 p-4">
        <h3 className="hud-title text-sm text-danger-glow">Remise à zéro de l'XP</h3>
        <p className="text-xs text-slate-400">
          Remet l'XP totale et de saison de tous les joueurs à 0 (ressources, bâtiments et unités conservés). Irréversible.
        </p>
        <Button
          variant="danger"
          size="sm"
          className="self-start"
          disabled={progress !== null}
          onClick={async () => {
            if (prompt("Tape RESET pour confirmer la remise à zéro de l'XP de tous les joueurs.") !== "RESET") return;
            try {
              const n = await adminResetAllXp((done, total) => setProgress(`${done} / ${total}`));
              toast.success(`XP remise à zéro pour ${n} joueurs.`);
            } catch (err) {
              toast.error(`Interrompu : ${(err as Error).message}`);
            } finally {
              setProgress(null);
            }
          }}
        >
          {progress ? `En cours… ${progress}` : "Remettre toute l'XP à zéro"}
        </Button>
      </Card>
    </div>
  );
}
