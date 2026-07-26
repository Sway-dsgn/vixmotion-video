import { useState } from "react";
import { useAuthStore } from "../../stores/auth-store";
import { ToolcraftButton as Button } from "@vixmotion/ui";
import { ToolcraftTextInputControl as Input } from "@vixmotion/ui";
import { ToolcraftText as Text } from "@vixmotion/ui";

export function LoginPage({ onLogin }: { onLogin?: () => void }) {
  const login = useAuthStore((s) => s.login);
  const [username, setUsername] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    login(username.trim());
    onLogin?.();
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex items-center justify-center">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(34,197,94,0.05),transparent_60%)]" />
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-sm mx-auto px-6"
      >
        <div className="flex flex-col items-center text-center mb-10">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
            <Text type="body" color="primary" weight="bold" className="text-xl text-primary">V</Text>
          </div>
          <Text type="body" color="primary" weight="bold" className="text-2xl text-text-primary tracking-tight mb-2">
            Welcome to VixMotion
          </Text>
          <Text type="supporting" color="secondary" className="text-sm text-text-muted">
            Enter your username to get started
          </Text>
        </div>

        <div className="space-y-4">
          <Input
            label="Username"
            placeholder="Your username"
            value={username}
            onChange={setUsername}
          />
          <Button
            label="Sign in"
            variant="primary"
            type="submit"
            className="w-full mt-2"
            isDisabled={!username.trim()}
          />
        </div>
      </form>
    </div>
  );
}
