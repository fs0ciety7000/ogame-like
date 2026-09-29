import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { confirmPasswordReset, validatePassword } from "@/services/authService";
import { toast } from "sonner";

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Si le joueur arrive sur la page sans token dans l'URL, on le renvoie à l'accueil
  if (!token) {
    navigate("/");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const error = validatePassword(password);
    if (error) {
      toast.error(error);
      return;
    }

    setLoading(true);
    try {
      await confirmPasswordReset(token, password);
      toast.success("Mot de passe mis à jour. Tu peux maintenant te connecter.");
      navigate("/login");
    } catch (err) {
      toast.error("Le lien est invalide ou a expiré.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="bg-slate-900 p-6 rounded-xl border border-slate-700 w-full max-w-md">
        <h2 className="text-xl font-bold text-white mb-4">Nouveau mot de passe</h2>
        
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Nouveau mot de passe"
          className="w-full p-2 mb-4 bg-slate-800 border border-slate-600 rounded text-white"
          required
        />
        
        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-500 disabled:opacity-50"
        >
          {loading ? "Mise à jour..." : "Valider"}
        </button>
      </form>
    </div>
  );
}