import { Moon, Search, Sun } from "lucide-react";
import { Link, useRouter } from "@tanstack/react-router";
import { useTheme } from "@/components/theme-provider";
import { NotificationDropdown } from "./NotificationDropdown";
import { useState, useMemo, useEffect, useRef } from "react";
import { authStore, searchStore, getSearchResults, type SearchResult } from "@/lib/store";
import { toast } from "sonner";

function defaultGreeting(userName: string = "User") {
  if (typeof window === "undefined") return `Welcome back, ${userName} 👋`;
  const h = new Date().getHours();
  if (h < 12) return `Good Morning, ${userName} 👋`;
  if (h < 17) return `Good Afternoon, ${userName} 👋`;
  return `Good Evening, ${userName} 👋`;
}

export function Topbar({
  greeting,
  subtitle = "Here's your health overview for today.",
}: {
  greeting?: string;
  subtitle?: string;
}) {
  const user = authStore.use();
  const firstName = user?.name ? user.name.split(" ")[0] : "User";
  const { theme, toggle } = useTheme();
  const router = useRouter();
  
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Ctrl/Cmd + K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const results = useMemo(() => getSearchResults(query), [query]);

  const groupedResults = useMemo(() => {
    const groups: Record<string, SearchResult[]> = {};
    results.forEach((r) => {
      if (!groups[r.category]) groups[r.category] = [];
      groups[r.category].push(r);
    });
    return groups;
  }, [results]);

  const handleClickResult = (result: SearchResult) => {
    searchStore.setQuery(query);
    searchStore.setHighlightedId(result.id);
    router.navigate({ to: result.route });
    setQuery("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && results.length > 0) {
      const categories = Array.from(new Set(results.map((r) => r.category)));
      if (categories.length === 1) {
        // Unique module containing all matches -> direct navigate to the first result
        handleClickResult(results[0]);
      } else {
        // Multiple modules matching -> navigate to the first result
        handleClickResult(results[0]);
      }
    }
  };

  return (
    <header className="flex items-center gap-6 mb-8">
      <div className="min-w-0">
        <h1 className="text-[26px] font-semibold tracking-tight truncate">
          {greeting ?? defaultGreeting(firstName)} <span className="inline-block">👋</span>
        </h1>
        <p className="text-[14px] text-muted-foreground mt-0.5">{subtitle}</p>
      </div>

      <div ref={containerRef} className="flex-1 max-w-xl mx-auto hidden md:block relative">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search appointments, medicines, notes…"
            className="w-full h-11 pl-11 pr-4 rounded-2xl bg-card border border-border text-[14px] placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>

        {query && (
          <div className="absolute left-0 right-0 top-full mt-2 bg-card border border-border rounded-2xl shadow-[var(--shadow-hover)] z-50 max-h-[400px] overflow-y-auto p-4 space-y-4">
            {results.length === 0 ? (
              <div className="text-[13px] text-muted-foreground text-center py-6">
                No results found for "{query}"
              </div>
            ) : (
              Object.entries(groupedResults).map(([category, items]) => (
                <div key={category} className="space-y-1.5">
                  <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-2">
                    {category} ({items.length})
                  </div>
                  <div className="space-y-0.5">
                    {items.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleClickResult(item)}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-hover transition flex flex-col gap-0.5 animate-fade-in"
                      >
                        <span className="text-[13.5px] font-medium text-foreground">
                          {item.title}
                        </span>
                        {item.subtitle && (
                          <span className="text-[11.5px] text-muted-foreground">
                            {item.subtitle}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2.5 shrink-0">
        <NotificationDropdown />
        <button
          onClick={toggle}
          className="h-10 w-10 grid place-items-center rounded-full hover:bg-hover transition"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? (
            <Sun className="h-[18px] w-[18px] text-foreground/80" />
          ) : (
            <Moon className="h-[18px] w-[18px] text-foreground/80" />
          )}
        </button>
        <Link
          to="/profile"
          className="flex items-center pl-1 pr-2 py-1 rounded-full hover:bg-hover transition"
          aria-label="Go to profile"
        >
          <img src={user?.avatar || "/images/default-avatar.png"} alt="user" className="h-8 w-8 rounded-full object-cover" />
        </Link>
      </div>
    </header>
  );
}

