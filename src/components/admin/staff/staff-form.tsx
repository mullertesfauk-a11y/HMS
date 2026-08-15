"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { createStaff } from "@/app/(admin)/admin/(protected)/staff/actions";

export function StaffForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("STAFF");

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    startTransition(async () => {
      const result = await createStaff({
        name: name.trim(),
        email: email.trim(),
        password,
        role: role as "ADMIN" | "STAFF",
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      router.push("/admin/staff");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
      <Input
        name="name"
        label="Full name"
        placeholder="e.g. Sara Tesfaye"
        value={name}
        onChange={(event) => setName(event.target.value)}
        required
      />
      <Input
        name="email"
        label="Email"
        type="email"
        autoComplete="off"
        placeholder="name@example.com"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        required
      />
      <Input
        name="password"
        label="Temporary password"
        type="password"
        autoComplete="new-password"
        hint="At least 8 characters. The staff member should change it on first login."
        placeholder="••••••••"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        required
      />
      <Select
        name="role"
        label="Role"
        value={role}
        onChange={(event) => setRole(event.target.value)}
      >
        <option value="STAFF">Staff</option>
        <option value="ADMIN">Admin</option>
      </Select>

      {error ? (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="flex gap-2 pt-2">
        <Button type="submit" loading={pending}>
          Create account
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.push("/admin/staff")}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
