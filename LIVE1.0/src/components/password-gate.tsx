import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface PasswordGateProps {
  onSuccess: () => void;
}

export const PasswordGate = ({ onSuccess }: PasswordGateProps) => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (password === "RichMadeit") {
      setError(null);
      onSuccess();
    } else {
      setError("Incorrect password");
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Vimeo Background */}
      <div className="absolute inset-0 -z-10">
        <div className="relative w-full h-full pt-[56.25%]">
          <iframe
            src="https://player.vimeo.com/video/1042701559?h=17366b94bb&background=1&autoplay=1&loop=1&byline=0&title=0&muted=1"
            className="absolute top-0 left-0 w-full h-full"
            allow="autoplay; fullscreen"
            allowFullScreen
          />
        </div>
      </div>

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Content */}
      <div className="relative z-10 flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8 rounded-lg bg-black/70 p-8 backdrop-blur-sm">
          <h1 className="text-3xl font-bold text-white text-center">Enter Password</h1>
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="bg-white/10 text-white placeholder:text-gray-400"
              autoComplete="off"
              autoFocus
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button
              type="submit"
              className="w-full bg-white/10 text-white hover:bg-white/20"
            >
              Enter
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};
