"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useCommandPalette } from "../providers/CommandPaletteProvider";
import {
  CommandDialog,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem
} from "../ui/command";
import { useCommandPaletteData } from "@/hooks/useCommandPaletteData";
import { UnifiedSearchItem } from "@/config/command-registry";
import { Badge } from "@/components/ui";
import { ArrowRight, Search } from "lucide-react";
import { Command as CommandPrimitive } from "cmdk";
import { getSeverityCSS, getSeverityLabel } from "@/utils/severity";

const CATEGORY_ORDER: Record<string, number> = {
  "Pages": 1,
  "AI Intelligence": 2,
  "Hotspots": 3,
  "Patrol Recommendations": 4,
  "Reports": 5,
  "H3 Sectors": 6,
  "System Pages": 7
};

export function CommandPalette() {
  const router = useRouter();
  const { isOpen, setIsOpen } = useCommandPalette();
  const [searchQuery, setSearchQuery] = useState("");

  const { allItems, filteredItems, isSearching } = useCommandPaletteData(searchQuery);

  const handleNavigate = (route: string) => {
    router.push(route);
    setIsOpen(false);
    setSearchQuery("");
  };

  // Group and sort items by category
  const sortedGroupedItems = React.useMemo(() => {
    let items: UnifiedSearchItem[] = [];
    if (isSearching) {
      items = filteredItems;
    } else {
      // Operations Home layout: show Pages, AI Intelligence, Hotspots, Patrol Recommendations, Reports, System Pages
      items = allItems.filter(i => i.type !== "sector");
    }

    const groups: Record<string, UnifiedSearchItem[]> = {};
    items.forEach((item) => {
      if (!groups[item.category]) {
        groups[item.category] = [];
      }
      groups[item.category].push(item);
    });

    const entries = Object.entries(groups);
    entries.sort((a, b) => {
      const orderA = CATEGORY_ORDER[a[0]] || 99;
      const orderB = CATEGORY_ORDER[b[0]] || 99;
      return orderA - orderB;
    });

    return entries;
  }, [allItems, filteredItems, isSearching]);

  // Premium category headers mapping
  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "Pages": return "🧭 NAVIGATION";
      case "AI Intelligence": return "🤖 AI RECOMMENDATIONS";
      case "Hotspots": return "🔥 CRITICAL HOTSPOTS";
      case "Patrol Recommendations": return "🤖 AI RECOMMENDATIONS";
      case "Reports": return "📄 REPORTS";
      case "H3 Sectors": return "⬡ H3 GRID SECTORS";
      case "System Pages": return "🕒 RECENT PAGES";
      default: return category.toUpperCase();
    }
  };

  // Premium Category Badges styling
  const getBadgeStyles = (type: string) => {
    switch (type) {
      case "page":
        return "bg-blue-500/10 text-blue-400 border border-blue-500/20";
      case "hotspot":
        return "bg-red-500/10 text-red-400 border border-red-500/20";
      case "patrol":
        return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
      case "report":
        return "bg-orange-500/10 text-orange-400 border border-orange-500/20";
      case "sector":
        return "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20";
      case "ai":
        return "bg-purple-500/10 text-purple-400 border border-purple-500/20";
      case "system":
        return "bg-slate-500/10 text-slate-400 border border-slate-500/20";
      default:
        return "bg-slate-500/10 text-slate-400 border border-slate-500/20";
    }
  };

  // Color-coded icons based on category
  const getIconStyles = (item: UnifiedSearchItem) => {
    const id = item.id;
    const type = item.type;
    
    if (id === "page-dashboard") {
      return {
        bg: "bg-blue-500/10 border-blue-500/20 text-blue-400",
        selected: "group-data-[selected=true]:bg-blue-500/20 group-data-[selected=true]:border-blue-500/40 group-data-[selected=true]:text-blue-300 group-data-[selected=true]:shadow-[0_0_15px_rgba(59,130,246,0.2)]"
      };
    }
    if (id === "page-ai-intelligence" || type === "ai" || item.category === "AI Intelligence") {
      return {
        bg: "bg-purple-500/10 border-purple-500/20 text-purple-400",
        selected: "group-data-[selected=true]:bg-purple-500/20 group-data-[selected=true]:border-purple-500/40 group-data-[selected=true]:text-purple-300 group-data-[selected=true]:shadow-[0_0_15px_rgba(168,85,247,0.2)]"
      };
    }
    if (id === "page-map" || type === "sector" || item.category === "H3 Sectors") {
      return {
        bg: "bg-cyan-500/10 border-cyan-500/20 text-cyan-400",
        selected: "group-data-[selected=true]:bg-cyan-500/20 group-data-[selected=true]:border-cyan-500/40 group-data-[selected=true]:text-cyan-300 group-data-[selected=true]:shadow-[0_0_15px_rgba(6,182,212,0.2)]"
      };
    }
    if (id === "page-hotspots" || type === "hotspot" || item.category === "Hotspots") {
      return {
        bg: "bg-red-500/10 border-red-500/20 text-red-400",
        selected: "group-data-[selected=true]:bg-red-500/20 group-data-[selected=true]:border-red-500/40 group-data-[selected=true]:text-red-300 group-data-[selected=true]:shadow-[0_0_15px_rgba(239,68,68,0.2)]"
      };
    }
    if (id === "page-patrol-optimizer" || type === "patrol" || item.category === "Patrol Recommendations") {
      return {
        bg: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
        selected: "group-data-[selected=true]:bg-emerald-500/20 group-data-[selected=true]:border-emerald-500/40 group-data-[selected=true]:text-emerald-300 group-data-[selected=true]:shadow-[0_0_15px_rgba(16,185,129,0.2)]"
      };
    }
    if (id === "page-reports" || type === "report" || item.category === "Reports") {
      return {
        bg: "bg-orange-500/10 border-orange-500/20 text-orange-400",
        selected: "group-data-[selected=true]:bg-orange-500/20 group-data-[selected=true]:border-orange-500/40 group-data-[selected=true]:text-orange-300 group-data-[selected=true]:shadow-[0_0_15px_rgba(249,115,22,0.2)]"
      };
    }
    if (id === "page-explainability") {
      return {
        bg: "bg-indigo-500/10 border-indigo-500/20 text-indigo-400",
        selected: "group-data-[selected=true]:bg-indigo-500/20 group-data-[selected=true]:border-indigo-500/40 group-data-[selected=true]:text-indigo-300 group-data-[selected=true]:shadow-[0_0_15px_rgba(99,102,241,0.2)]"
      };
    }
    if (type === "system" || id === "page-system-health" || id === "page-settings") {
      return {
        bg: "bg-teal-500/10 border-teal-500/20 text-teal-400",
        selected: "group-data-[selected=true]:bg-teal-500/20 group-data-[selected=true]:border-teal-500/40 group-data-[selected=true]:text-teal-300 group-data-[selected=true]:shadow-[0_0_15px_rgba(20,184,166,0.2)]"
      };
    }

    return {
      bg: "bg-slate-500/10 border-slate-500/20 text-slate-400",
      selected: "group-data-[selected=true]:bg-slate-500/20 group-data-[selected=true]:border-slate-500/40 group-data-[selected=true]:text-slate-300 group-data-[selected=true]:shadow-[0_0_15px_rgba(148,163,184,0.2)]"
    };
  };

  // Render metadata on the right side of the card
  const renderMetadata = (item: UnifiedSearchItem) => {
    if (!item.metadata) return null;
    
    if (item.type === "hotspot") {
      const hs = item.metadata;
      return (
        <div className="flex flex-col items-end text-right gap-0.5 mr-4 shrink-0 text-[10px]">
          {hs.tdpi !== undefined && (
            <div className="flex items-center gap-1">
              <span className="text-slate-500 uppercase font-semibold">TDPI</span>
              <span className="font-bold text-red-400">{hs.tdpi}%</span>
            </div>
          )}
          {hs.visibilityGap !== undefined && (
            <div className="flex items-center gap-1">
              <span className="text-slate-500 uppercase font-semibold">Gap</span>
              <span className="font-bold text-slate-300">{hs.visibilityGap}%</span>
            </div>
          )}
        </div>
      );
    }
    
    if (item.type === "patrol") {
      const rec = item.metadata;
      return (
        <div className="flex flex-col items-end text-right gap-0.5 mr-4 shrink-0 text-[10px]">
          {rec.deployment_score !== undefined && (
            <div className="flex items-center gap-1">
              <span className="text-slate-500 uppercase font-semibold">Score</span>
              <span className="font-bold text-emerald-400">{(rec.deployment_score * 100).toFixed(1)}</span>
            </div>
          )}
          {rec.estimated_operational_risk_reduction !== undefined && (
            <div className="flex items-center gap-1">
              <span className="text-slate-500 uppercase font-semibold">Benefit</span>
              <span className="font-bold text-slate-300">-{rec.estimated_operational_risk_reduction}% Risk</span>
            </div>
          )}
        </div>
      );
    }
    
    if (item.type === "report") {
      const report = item.metadata;
      return (
        <div className="flex flex-col items-end text-right gap-0.5 mr-4 shrink-0 text-[10px]">
          {report.date && (
            <div className="flex items-center gap-1">
              <span className="text-slate-500 uppercase font-semibold">Date</span>
              <span className="font-bold text-slate-300">{report.date}</span>
            </div>
          )}
          {report.category && (
            <div className="flex items-center gap-1">
              <span className="text-slate-500 uppercase font-semibold">Type</span>
              <span className="font-bold text-orange-400 capitalize">{report.category}</span>
            </div>
          )}
        </div>
      );
    }
    
    if (item.type === "sector") {
      const cell = item.metadata;
      return (
        <div className="flex flex-col items-end text-right gap-0.5 mr-4 shrink-0 text-[10px]">
          <div className="flex items-center gap-1">
            <span className="text-slate-500 uppercase font-semibold">ID</span>
            <span className="font-mono font-bold text-slate-300">{cell.h3Index.substring(0, 8)}...</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-slate-500 uppercase font-semibold">Status</span>
            <span 
              className="font-bold"
              style={{ color: getSeverityCSS(cell.hotspotTier, cell.tdpiPercentile) }}
            >
              {getSeverityLabel(cell.hotspotTier)}
            </span>
          </div>
        </div>
      );
    }
    
    return null;
  };

  return (
    <CommandDialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) setSearchQuery("");
      }}
      title="Global Operations Command Palette"
      description="Navigate ParkOptic and search operational intelligence."
      className="max-w-[900px] xl:max-w-[1000px] h-[75vh] md:h-[80vh] border border-white/10 bg-[#06080f]/90 backdrop-blur-3xl text-white shadow-[0_0_80px_rgba(59,130,246,0.2),inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-2xl flex flex-col p-0 overflow-hidden duration-200 transition-all data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-open:slide-in-from-bottom-4 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 data-closed:slide-out-to-bottom-4"
      overlayClassName="bg-black/60 backdrop-blur-md"
    >
      <div className="relative border-b border-white/10 flex items-center px-6 py-5 gap-4 bg-white/[0.02]">
        <Search className="h-7 w-7 text-blue-400/80 shrink-0" />
        <CommandPrimitive.Input 
          placeholder="Search operations, hotspots, patrol recommendations, H3 sectors, reports, or jump to any module..." 
          className="flex-1 bg-transparent border-none text-white text-lg sm:text-xl outline-none placeholder:text-slate-500 font-sans focus:outline-none" 
          value={searchQuery}
          onValueChange={setSearchQuery}
        />
        <div className="flex items-center gap-1 px-2 py-0.5 bg-white/5 border border-white/10 rounded text-[10px] text-slate-400 font-semibold shadow-inner mr-2 shrink-0 select-none">
          <span>Ctrl</span>
          <span>K</span>
        </div>
      </div>
      
      <div className="relative flex-1 overflow-hidden">
        {/* Soft fading overlays for scroll depth */}
        <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-[#06080f] to-transparent z-10 pointer-events-none"></div>
        
        <CommandList className="flex-1 h-full overflow-y-auto overflow-x-hidden p-6 scroll-smooth scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          <CommandEmpty className="flex flex-col items-center justify-center py-20 text-slate-400">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/5 mb-4 border border-white/5 shadow-lg">
              <Search className="h-8 w-8 text-slate-500 opacity-50" />
            </div>
            <p className="text-sm font-medium text-slate-300 mb-1">No operational results found</p>
            <p className="text-xs text-slate-500 mb-6">We couldn't find anything matching "{searchQuery}"</p>
            
            <div className="flex flex-col items-center">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 mb-3 font-semibold">Try Searching For</span>
              <div className="flex flex-wrap justify-center gap-2 max-w-sm">
                <Badge variant="neutral" className="bg-white/5 hover:bg-white/10 cursor-pointer transition-colors px-3 h-7 text-xs border-white/10" onClick={() => setSearchQuery("Dashboard")}>Dashboard</Badge>
                <Badge variant="neutral" className="bg-white/5 hover:bg-white/10 cursor-pointer transition-colors px-3 h-7 text-xs border-white/10" onClick={() => setSearchQuery("Hotspots")}>Hotspots</Badge>
                <Badge variant="neutral" className="bg-white/5 hover:bg-white/10 cursor-pointer transition-colors px-3 h-7 text-xs border-white/10" onClick={() => setSearchQuery("Koramangala")}>Koramangala</Badge>
                <Badge variant="neutral" className="bg-white/5 hover:bg-white/10 cursor-pointer transition-colors px-3 h-7 text-xs border-white/10" onClick={() => setSearchQuery("Patrol")}>Patrol</Badge>
              </div>
            </div>
          </CommandEmpty>

          <div className="space-y-6 pb-2">
            {sortedGroupedItems.map(([category, items]) => (
              <CommandGroup 
                key={category}
                heading={
                  <div className="flex items-center gap-3 py-2 px-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap">
                      {getCategoryLabel(category)}
                    </span>
                    <div className="h-[1px] bg-gradient-to-r from-white/10 to-transparent flex-1"></div>
                  </div>
                }
                className="px-1"
              >
                <div className="mt-2 space-y-2">
                  {items.map((item) => {
                    const iconStyles = getIconStyles(item);
                    return (
                      <CommandItem
                        key={item.id}
                        onSelect={() => handleNavigate(item.route)}
                        className="group flex items-center justify-between gap-4 p-4 border border-white/[0.02] bg-white/[0.01] hover:bg-white/[0.04] data-[selected]:bg-gradient-to-r data-[selected]:from-blue-600/15 data-[selected]:to-transparent data-[selected]:border-l-blue-500 data-[selected]:shadow-[0_4px_20px_rgba(59,130,246,0.08)] data-[selected=true]:bg-gradient-to-r data-[selected=true]:from-blue-600/15 data-[selected=true]:to-transparent data-[selected=true]:border-l-blue-500 data-[selected=true]:shadow-[0_4px_20px_rgba(59,130,246,0.08)] border-l-[3px] border-l-transparent transition-all duration-150 cursor-pointer rounded-xl my-1"
                      >
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          {/* Left: Rounded icon container */}
                          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-900/50 border border-white/5 shadow-inner transition-all duration-200 ${iconStyles.bg} ${iconStyles.selected}`}>
                            <item.icon className="h-6 w-6 transition-colors" />
                          </div>
                          
                          {/* Center: Title, Subtitle, Description */}
                          <div className="flex flex-col flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-base font-bold text-slate-100 group-data-[selected=true]:text-white transition-colors">
                                {item.title}
                              </span>
                              {item.badge && (
                                <Badge variant={item.badge.variant} className="text-[9px] uppercase tracking-widest font-extrabold h-5 px-2">
                                  {item.badge.text}
                                </Badge>
                              )}
                            </div>
                            
                            {item.subtitle && (
                              <span className="text-xs font-semibold text-slate-300 group-data-[selected=true]:text-slate-100 truncate mt-0.5">
                                {item.subtitle}
                              </span>
                            )}
                            {item.description && (
                              <span className="text-[11px] text-slate-400 group-data-[selected=true]:text-slate-200 truncate mt-0.5">
                                {item.description}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Right: Rich Operational Metadata and Category Badge */}
                        <div className="flex items-center gap-4 shrink-0">
                          {renderMetadata(item)}
                          
                          <span className={`text-[9px] font-bold tracking-widest px-2 py-0.5 rounded-md uppercase select-none border shrink-0 ${getBadgeStyles(item.type)}`}>
                            {item.type === "sector" ? "H3" : item.type === "page" ? "PAGE" : item.type === "patrol" ? "PATROL" : item.type === "hotspot" ? "HOTSPOT" : item.type === "report" ? "REPORT" : item.type === "ai" ? "AI" : "SYSTEM"}
                          </span>

                          <ArrowRight className="h-4 w-4 text-slate-500 group-data-[selected=true]:text-blue-400 group-data-[selected=true]:translate-x-1 transition-all duration-150 shrink-0" />
                        </div>
                      </CommandItem>
                    );
                  })}
                </div>
              </CommandGroup>
            ))}
          </div>
        </CommandList>
        
        <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-[#06080f] to-transparent z-10 pointer-events-none"></div>
      </div>
      
      {/* Premium shortcut keys in footer */}
      <div className="flex items-center justify-between border-t border-white/10 bg-black/40 p-4 px-6 mt-auto shrink-0 text-slate-400 text-xs">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <kbd className="flex h-5 w-5 items-center justify-center rounded border border-white/15 bg-white/5 text-[10px] font-bold shadow-sm">↑</kbd>
              <kbd className="flex h-5 w-5 items-center justify-center rounded border border-white/15 bg-white/5 text-[10px] font-bold shadow-sm">↓</kbd>
            </div>
            <span>Navigate</span>
          </div>
          
          <div className="flex items-center gap-2">
            <kbd className="flex h-5 px-1.5 items-center justify-center rounded border border-white/15 bg-white/5 text-[9px] font-bold shadow-sm">⏎ Enter</kbd>
            <span>Open</span>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <kbd className="flex h-5 px-1.5 items-center justify-center rounded border border-white/15 bg-white/5 text-[9px] font-bold shadow-sm">Esc</kbd>
            <span>Close</span>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <kbd className="flex h-5 px-1.5 items-center justify-center rounded border border-white/15 bg-white/5 text-[9px] font-bold shadow-sm">Ctrl</kbd>
              <kbd className="flex h-5 w-5 items-center justify-center rounded border border-white/15 bg-white/5 text-[9px] font-bold shadow-sm">K</kbd>
            </div>
            <span>Toggle Search</span>
          </div>
        </div>
      </div>
    </CommandDialog>
  );
}
