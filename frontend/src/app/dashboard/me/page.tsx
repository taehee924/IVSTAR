"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Header from "@/components/layout/Header";

interface Report {
  id: number;
  report_type: string;
  created_at: string;
  is_unlocked: boolean;
}

interface BirthProfile {
  id: number;
  birth_date: string;
  birth_time: string | null;
  birth_place: string | null;
  gender: string | null;
}

const AVATAR_KEY = "ivstar_avatar";
const NAME_KEY = "ivstar_display_name";

const REPORT_LABELS: Record<string, string> = {
  general: "About Me",
  life_cycle: "Life Cycles",
  year_ahead: "Your Year Ahead",
  daily: "2026 Horoscope",
  love: "Couple Reading",
  crush: "Crush Reading",
  ex: "Ex Reading",
  situationship: "Situationship Reading",
  career: "Career Reading",
  wealth: "Wealth Reading",
  health: "Health Reading",
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatBirthDate(birth_date: string, birth_time: string | null) {
  // "2005-09-02" → "09-02-2005"
  const [y, m, d] = birth_date.split("-");
  const datePart = `${m}-${d}-${y}`;
  const timePart = birth_time ? " " + birth_time.slice(0, 5) : "";
  return datePart + timePart;
}

export default function MePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingReportId, setDeletingReportId] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [profile, setProfile] = useState<BirthProfile | null>(null);

  useEffect(() => {
    const avatar = localStorage.getItem(AVATAR_KEY);
    if (avatar) setSelectedAvatar(avatar);
    const name = localStorage.getItem(NAME_KEY);
    if (name) setDisplayName(name);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [reportsRes, profileRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/reports/`, {
            headers: { Authorization: `Bearer ${(session as any)?.id_token}` },
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/birth-profiles/`, {
            headers: { Authorization: `Bearer ${(session as any)?.id_token}` },
          }),
        ]);
        if (reportsRes.ok) {
          const data = await reportsRes.json();
          setReports(data);
        }
        if (profileRes.ok) {
          const data = await profileRes.json();
          if (data.length > 0) setProfile(data[0]);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    if (session) fetchData();
    else setLoading(false);
  }, [session]);

  const handleDeleteReport = async (reportId: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Delete this reading?")) return;
    setDeletingReportId(reportId);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/reports/${reportId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${(session as any)?.id_token}` },
        }
      );
      if (!res.ok) throw new Error("Failed to delete report");
      setReports((prev) => prev.filter((r) => r.id !== reportId));
    } catch (e) {
      console.error(e);
      alert("Error deleting report. Please try again.");
    } finally {
      setDeletingReportId(null);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm("Are you sure you want to leave? All data will be deleted.")) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/me`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${(session as any)?.id_token}` },
      });
      if (!res.ok) throw new Error("Failed to delete account");
      localStorage.removeItem(AVATAR_KEY);
      localStorage.removeItem(NAME_KEY);
      await signOut({ callbackUrl: "/" });
    } catch (e) {
      console.error(e);
      alert("Error deleting account. Please try again.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const name = displayName ?? session?.user?.name ?? "";

  if (status !== "loading" && !session) {
    router.replace("/login");
    return null;
  }

  return (
    <main className="min-h-screen bg-[#FFFBF5] pt-14 pb-8">
      <Header />
      <div className="w-full max-w-2xl lg:max-w-3xl mx-auto px-4 lg:px-8 pt-8 space-y-6">

        {/* My Profile */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-700">My Profile</h2>
            <Link
              href="/dashboard/me/edit"
              className="text-xs text-gray-500 hover:text-gray-700 border border-[#DDD8CE] rounded-lg px-3 py-1.5 transition-colors"
            >
              Edit
            </Link>
          </div>
          <div className="rounded-2xl border border-[#DDD8CE] bg-[#EDE8DC] p-3 flex items-center gap-5">
            <div className="relative w-[104px] h-[104px] rounded-full overflow-hidden shrink-0">
              <Image src={selectedAvatar ?? "/avatars/dragon.png"} alt={name} fill style={{ objectFit: "cover" }} />
            </div>
            <div className="space-y-1.5">
              <p className="font-semibold text-base text-gray-800">{name}</p>
              {profile?.birth_date && (
                <p className="text-xs text-gray-600">
                  {formatBirthDate(profile.birth_date, profile.birth_time)}
                </p>
              )}
              {profile?.birth_place && (
                <p className="text-xs text-gray-500">{profile.birth_place}</p>
              )}
            </div>
          </div>
        </div>

        {/* My Readings */}
        <div className="space-y-2">
          <h2 className="text-sm font-bold text-gray-700">My Readings ({reports.length})</h2>
          <div className="rounded-2xl border border-gray-200 overflow-hidden divide-y divide-gray-100">
            {loading ? (
              <div className="p-4 text-sm text-gray-400">Loading...</div>
            ) : reports.length === 0 ? (
              <div className="p-4 text-sm text-gray-400">No readings yet.</div>
            ) : (
              reports.map((r) => (
                <div key={r.id} className="flex items-center justify-between px-4 py-3 hover:bg-[#EDE8DC] transition-colors">
                  <Link href={`/dashboard/report/${r.id}`} className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-700">
                      {REPORT_LABELS[r.report_type] ?? r.report_type}
                    </p>
                    <p className="text-xs text-gray-400">{formatDate(r.created_at)}</p>
                  </Link>
                  <button
                    onClick={(e) => handleDeleteReport(r.id, e)}
                    disabled={deletingReportId === r.id}
                    className="ml-3 text-gray-300 hover:text-red-400 transition-colors text-lg leading-none disabled:opacity-30"
                    aria-label="Delete reading"
                  >
                    {deletingReportId === r.id ? "..." : "×"}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* My Credits */}
        <div className="space-y-2">
          <h2 className="text-sm font-bold text-gray-700">My Credits</h2>
          <div className="rounded-2xl border border-[#DDD8CE] bg-[#EDE8DC] px-4 py-3 flex items-center justify-between">
            <p className="text-sm text-gray-600">0 readings remaining</p>
            <Link
              href="/dashboard/categories"
              className="text-xs font-medium border border-[#DDD8CE] rounded-lg px-3 py-1.5 hover:bg-[#FFFBF5] transition-colors text-gray-600"
            >
              Get more →
            </Link>
          </div>
        </div>

        {/* Support */}
        <div className="space-y-2">
          <h2 className="text-sm font-bold text-gray-700">Support</h2>
          <div className="rounded-2xl border border-[#DDD8CE] bg-[#EDE8DC] px-4 py-3 flex items-center justify-between">
            <p className="text-sm text-gray-600">Questions or issues?</p>
            <a
              href="mailto:sajuju0401@gmail.com"
              className="text-xs font-medium border border-[#DDD8CE] rounded-lg px-3 py-1.5 hover:bg-[#FFFBF5] transition-colors text-gray-600"
            >
              Contact us →
            </a>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          ↪ Logout
        </button>

        {/* Delete Account */}
        <button
          onClick={handleDeleteAccount}
          disabled={deleteLoading}
          className="flex items-center gap-2 text-sm text-red-400 hover:text-red-600 transition-colors disabled:opacity-50"
        >
          {deleteLoading ? "Processing..." : "↪ Delete Account"}
        </button>

      </div>
    </main>
  );
}
