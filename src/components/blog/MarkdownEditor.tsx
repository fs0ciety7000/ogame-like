import { useRef, useState, type ClipboardEvent, type DragEvent, type KeyboardEvent, type ReactNode } from "react";
import { toast } from "sonner";
import {
  Bold,
  Braces,
  ChevronDown,
  Code2,
  EyeOff,
  Heading2,
  Heading3,
  Highlighter,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListChecks,
  ListOrdered,
  Loader2,
  Minus,
  Quote,
  Strikethrough,
  Table,
  Webhook,
} from "lucide-react";
import { EmojiPicker } from "@/components/ui/emoji-picker";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

/* v5.8 : éditeur markdown du devblog : barre d'outils, raccourcis (Ctrl+B,
   Ctrl+I, Ctrl+K, Ctrl+S), images collées ou glissées (envoyées puis
   insérées), emojis du jeu, encadrés, tableaux, blocs de code et d'API. */

const CALLOUTS: { type: string; label: string }[] = [
  { type: "NOTE", label: "Note (cyan)" },
  { type: "TIP", label: "Astuce (vert)" },
  { type: "WARNING", label: "Attention (or)" },
  { type: "DANGER", label: "Danger (rouge)" },
  { type: "LORE", label: "Archives (violet)" },
];

const SNIPPETS = {
  table: "| Colonne | Valeur |\n|:--|--:|\n| Frégate | 12 |\n| Croiseur | 48 |",
  code: "```js\nconst exemple = true;\n```",
  api: "```api\nGET /api/cosmic/blog/posts?limite=3\nDescription de la route.\n```",
  apiPrivate: "```api\nPOST /api/cosmic/action\nauth: player\nDescription de la route.\nbody:\n{ \"type\": \"trade\" }\n```",
  spoiler: ":::spoiler Afficher la réponse\nTexte caché.\n:::",
  grid: ":::grid\n![](/assets/story/varan.webp \"Légende 1\")\n![](/assets/story/gravhorn.webp \"Légende 2\")\n:::",
};

const HELP: [string, string][] = [
  ["## Titre", "section (### sous-section)"],
  ["**gras** *italique*", "~~barré~~ ==surligné== `code`"],
  ["[texte](https://…)", "lien (Ctrl+K)"],
  ["![légende](url \"titre\")", "image seule = figure + légende"],
  ["- puce / 1. / - [x]", "listes, numérotées, cases"],
  ["> citation", "> [!TIP] Titre : encadré"],
  ["| a | b | puis |--|--:|", "tableau (aligné à droite avec :)"],
  [":varan: :rocket:", "emojis du jeu et raccourcis"],
  ["```api", "GET /api/… + description : route testable"],
  [":::spoiler Titre", "bloc repliable, :::grid galerie"],
  ["[[Ctrl]]", "touche de clavier"],
  ["---", "séparateur"],
];

export function MarkdownEditor({
  value,
  onChange,
  onUploadImage,
  onSave,
  minHeight = 520,
}: {
  value: string;
  onChange: (v: string) => void;
  onUploadImage: (file: File) => Promise<string>;
  onSave?: () => void;
  minHeight?: number;
}) {
  const area = useRef<HTMLTextAreaElement>(null);
  const file = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(0);
  const [help, setHelp] = useState(false);
  // Valeur à jour même pendant un envoi d'image (insertion après coup).
  const latest = useRef(value);
  latest.current = value;

  /** Remplace la sélection, puis replace le curseur. */
  const apply = (fn: (sel: string, before: string, after: string) => { text: string; select?: [number, number] }) => {
    const el = area.current;
    if (!el) return;
    const cur = latest.current;
    const { selectionStart: a, selectionEnd: b } = el;
    const res = fn(cur.slice(a, b), cur.slice(0, a), cur.slice(b));
    const next = cur.slice(0, a) + res.text + cur.slice(b);
    latest.current = next;
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      const [s, e] = res.select ?? [res.text.length, res.text.length];
      el.setSelectionRange(a + s, a + e);
    });
  };

  const wrap = (left: string, right = left, placeholder = "texte") =>
    apply((sel) => {
      const inner = sel || placeholder;
      return { text: `${left}${inner}${right}`, select: [left.length, left.length + inner.length] };
    });

  /** Préfixe chaque ligne sélectionnée (titres, listes, citations). */
  const prefix = (make: (i: number) => string) =>
    apply((sel, before) => {
      const lines = (sel || "élément").split("\n");
      const text = lines.map((l, i) => make(i) + l.replace(/^(#{1,6}\s|[-*+]\s(\[[ x]\]\s)?|\d+\.\s|>\s?)/, "")).join("\n");
      const lead = before && !before.endsWith("\n") ? "\n" : "";
      return { text: lead + text, select: [lead.length, lead.length + text.length] };
    });

  /** Bloc sur ses propres lignes. */
  const block = (snippet: string) =>
    apply((_, before, after) => {
      const lead = before && !before.endsWith("\n\n") ? (before.endsWith("\n") ? "\n" : "\n\n") : "";
      const trail = after.startsWith("\n\n") ? "" : after.startsWith("\n") ? "\n" : "\n\n";
      return { text: lead + snippet + trail };
    });

  const link = () =>
    apply((sel) => {
      const label = sel || "texte du lien";
      const text = `[${label}](https://)`;
      return { text, select: [label.length + 3, label.length + 11] };
    });

  const insertText = (t: string) => apply(() => ({ text: t }));

  const upload = async (files: File[]) => {
    const images = files.filter((f) => f.type.startsWith("image/"));
    if (images.length === 0) return;
    for (const f of images) {
      if (f.size > 5 * 1024 * 1024) {
        toast.error(`${f.name} : 5 Mo au plus.`);
        continue;
      }
      setUploading((n) => n + 1);
      try {
        const url = await onUploadImage(f);
        const alt = f.name.replace(/\.[a-z0-9]+$/i, "").replace(/[-_]+/g, " ");
        block(`![${alt}](${url} "Légende")`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Envoi de l'image impossible.");
      } finally {
        setUploading((n) => n - 1);
      }
    }
  };

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    const mod = e.ctrlKey || e.metaKey;
    const shortcut: Record<string, () => void> = { b: () => wrap("**"), i: () => wrap("*"), k: link, s: () => onSave?.() };
    const action = mod ? shortcut[e.key.toLowerCase()] : undefined;
    if (action) {
      e.preventDefault();
      action();
    } else if (e.key === "Tab") {
      e.preventDefault();
      insertText("  ");
    } else if (e.key === "Enter" && !e.shiftKey) {
      // Continue la liste en cours.
      const el = e.currentTarget;
      const lineStart = value.lastIndexOf("\n", el.selectionStart - 1) + 1;
      const line = value.slice(lineStart, el.selectionStart);
      const m = /^(\s*)([-*+]\s(?:\[[ x]\]\s)?|(\d+)\.\s)/.exec(line);
      if (!m) return;
      e.preventDefault();
      if (line.trim() === m[2].trim()) {
        // Ligne vide : on sort de la liste.
        onChange(value.slice(0, lineStart) + value.slice(el.selectionStart));
        requestAnimationFrame(() => el.setSelectionRange(lineStart, lineStart));
        return;
      }
      const marker = m[3] ? `${Number(m[3]) + 1}. ` : m[2].replace("[x]", "[ ]");
      insertText(`\n${m[1]}${marker}`);
    }
  };

  const onPaste = (e: ClipboardEvent<HTMLTextAreaElement>) => {
    const files = [...e.clipboardData.files];
    if (files.some((f) => f.type.startsWith("image/"))) {
      e.preventDefault();
      void upload(files);
    }
  };

  const onDrop = (e: DragEvent<HTMLTextAreaElement>) => {
    const files = [...e.dataTransfer.files];
    if (files.length) {
      e.preventDefault();
      void upload(files);
    }
  };

  const B = ({ title, onClick, children }: { title: string; onClick: () => void; children: ReactNode }) => (
    <button type="button" title={title} aria-label={title} onClick={onClick} className="grid h-8 w-8 shrink-0 place-items-center text-slate-400 transition-colors hover:bg-cyan-glow/10 hover:text-cyan-glow">
      {children}
    </button>
  );
  const Sep = () => <span className="mx-0.5 h-5 w-px shrink-0 bg-white/10" />;
  const words = value.trim() ? value.trim().split(/\s+/).length : 0;

  return (
    <div className="flex min-w-0 flex-col border border-cyan-glow/20 bg-space-900/60 focus-within:border-cyan-glow/50">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-white/5 bg-black/20 px-1.5 py-1">
        <B title="Titre de section" onClick={() => prefix(() => "## ")}>
          <Heading2 className="h-4 w-4" />
        </B>
        <B title="Sous-titre" onClick={() => prefix(() => "### ")}>
          <Heading3 className="h-4 w-4" />
        </B>
        <Sep />
        <B title="Gras (Ctrl+B)" onClick={() => wrap("**")}>
          <Bold className="h-4 w-4" />
        </B>
        <B title="Italique (Ctrl+I)" onClick={() => wrap("*")}>
          <Italic className="h-4 w-4" />
        </B>
        <B title="Barré" onClick={() => wrap("~~")}>
          <Strikethrough className="h-4 w-4" />
        </B>
        <B title="Surligné" onClick={() => wrap("==")}>
          <Highlighter className="h-4 w-4" />
        </B>
        <B title="Code en ligne" onClick={() => wrap("`", "`", "code")}>
          <Code2 className="h-4 w-4" />
        </B>
        <B title="Lien (Ctrl+K)" onClick={link}>
          <Link2 className="h-4 w-4" />
        </B>
        <Sep />
        <B title="Liste à puces" onClick={() => prefix(() => "- ")}>
          <List className="h-4 w-4" />
        </B>
        <B title="Liste numérotée" onClick={() => prefix((i) => `${i + 1}. `)}>
          <ListOrdered className="h-4 w-4" />
        </B>
        <B title="Cases à cocher" onClick={() => prefix(() => "- [ ] ")}>
          <ListChecks className="h-4 w-4" />
        </B>
        <B title="Citation" onClick={() => prefix(() => "> ")}>
          <Quote className="h-4 w-4" />
        </B>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" title="Encadré" className="flex h-8 shrink-0 items-center gap-0.5 px-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-slate-400 hover:bg-cyan-glow/10 hover:text-cyan-glow">
              Encadré <ChevronDown className="h-3 w-3" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {CALLOUTS.map((c) => (
              <DropdownMenuItem key={c.type} onSelect={() => block(`> [!${c.type}] Titre facultatif\n> Texte de l'encadré.`)}>
                {c.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <Sep />
        <B title="Image (ou colle / glisse une image dans le texte)" onClick={() => file.current?.click()}>
          {uploading > 0 ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
        </B>
        <B title="Tableau" onClick={() => block(SNIPPETS.table)}>
          <Table className="h-4 w-4" />
        </B>
        <B title="Bloc de code" onClick={() => block(SNIPPETS.code)}>
          <Braces className="h-4 w-4" />
        </B>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" title="Route de l'API" className="flex h-8 shrink-0 items-center gap-1 px-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-slate-400 hover:bg-cyan-glow/10 hover:text-cyan-glow">
              <Webhook className="h-4 w-4" /> API <ChevronDown className="h-3 w-3" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onSelect={() => block(SNIPPETS.api)}>Route publique (testable)</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => block(SNIPPETS.apiPrivate)}>Route réservée (joueur, admin)</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <B title="Bloc repliable" onClick={() => block(SNIPPETS.spoiler)}>
          <EyeOff className="h-4 w-4" />
        </B>
        <B title="Galerie d'images" onClick={() => block(SNIPPETS.grid)}>
          <span className="font-mono text-[11px]">▦</span>
        </B>
        <B title="Séparateur" onClick={() => block("---")}>
          <Minus className="h-4 w-4" />
        </B>
        <EmojiPicker onPick={(t) => insertText(t)} className="h-8 w-8 border-0" />
        <input ref={file} type="file" accept="image/*" multiple hidden onChange={(e) => (void upload([...(e.target.files ?? [])]), (e.target.value = ""))} />
      </div>
      <textarea
        ref={area}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKey}
        onPaste={onPaste}
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        spellCheck
        lang="fr"
        placeholder={"Écris ton article en markdown…\n\n## Un titre de section\n\nDu **gras**, une [image] collée directement, :varan:, > [!TIP] un encadré…"}
        className={cn("w-full resize-y bg-transparent p-4 font-mono text-[13.5px] leading-relaxed text-slate-100 outline-none placeholder:text-slate-600")}
        style={{ minHeight }}
      />
      <div className="flex items-center gap-3 border-t border-white/5 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-slate-500">
        <span>{words} mots</span>
        <span>{Math.max(1, Math.round(words / 220))} min de lecture</span>
        {uploading > 0 && <span className="text-cyan-glow">Envoi de {uploading} image(s)…</span>}
        <span className="ml-auto hidden sm:inline">Ctrl+S enregistre · images : coller ou glisser</span>
        <button type="button" onClick={() => setHelp((h) => !h)} className={cn("ml-2 hover:text-cyan-glow", help && "text-cyan-glow")}>
          Aide
        </button>
      </div>
      {help && (
        <div className="grid gap-x-6 gap-y-1 border-t border-white/5 bg-black/30 px-4 py-3 font-mono text-[11px] text-slate-400 sm:grid-cols-2">
          {HELP.map(([code, what]) => (
            <p key={code} className="flex gap-3">
              <span className="w-44 shrink-0 text-cyan-glow">{code}</span>
              <span>{what}</span>
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
