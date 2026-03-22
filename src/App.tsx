import React, { useState, useRef, useEffect } from "react";
import { 
  ArrowLeft,
  Search, 
  BarChart3, 
  PieChart as PieChartIcon, 
  AlertTriangle, 
  Quote, 
  Lightbulb, 
  ListChecks, 
  Download, 
  Loader2,
  ChevronRight,
  ExternalLink,
  Zap,
  ShieldAlert,
  TrendingUp,
  Award,
  Target,
  Link as LinkIcon,
  Users,
  Map,
  Activity,
  CheckCircle2,
  Clock,
  Rocket,
  Layers,
  History,
  Trash2
} from "lucide-react";
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend 
} from "recharts";
import { motion, AnimatePresence } from "motion/react";
import { Review, AnalysisResult } from "./types";
import { analyzeReviews } from "./services/gemini";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316", "#64748b"];

interface RecentAnalysis {
  app: any;
  analysis: AnalysisResult;
  timestamp: number;
}

export default function App() {
  const [searchTerm, setSearchTerm] = useState("");
  const [urlTerm, setUrlTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [recentAnalyses, setRecentAnalyses] = useState<RecentAnalysis[]>([]);
  const [error, setError] = useState<string | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("voltbay_recent_analyses");
    if (saved) {
      try {
        setRecentAnalyses(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse recent analyses", e);
      }
    }
  }, []);

  const saveToRecent = (app: any, result: AnalysisResult) => {
    const newRecent: RecentAnalysis = {
      app,
      analysis: result,
      timestamp: Date.now()
    };

    setRecentAnalyses(prev => {
      // Remove duplicates of the same app
      const filtered = prev.filter(item => item.app.appId !== app.appId);
      const updated = [newRecent, ...filtered].slice(0, 10); // Keep last 10
      localStorage.setItem("voltbay_recent_analyses", JSON.stringify(updated));
      return updated;
    });
  };

  const clearRecent = () => {
    setRecentAnalyses([]);
    localStorage.removeItem("voltbay_recent_analyses");
  };

  const loadRecent = (item: RecentAnalysis) => {
    setSelectedApp(item.app);
    setAnalysis(item.analysis);
    setSearchResults([]);
    setError(null);
  };

  const handleBack = () => {
    setAnalysis(null);
    setSelectedApp(null);
    setSearchResults([]);
    setSearchTerm("");
    setUrlTerm("");
    setError(null);
  };

  const handleSearch = async (e: React.FormEvent, termOverride?: string) => {
    e.preventDefault();
    const term = termOverride || searchTerm || urlTerm;
    if (!term.trim()) return;

    setIsSearching(true);
    setError(null);
    try {
      const res = await fetch(`/api/search?term=${encodeURIComponent(term)}`);
      const data = await res.json();
      setSearchResults(data);
      if (data.length === 1 && term.includes("id=")) {
        handleSelectApp(data[0]);
      }
    } catch (err) {
      setError("Failed to search for apps. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectApp = async (app: any) => {
    setSelectedApp(app);
    setSearchResults([]);
    setIsAnalyzing(true);
    setError(null);

    try {
      // 1. Fetch reviews
      const reviewsRes = await fetch(`/api/reviews?appId=${app.appId}`);
      const reviews: Review[] = await reviewsRes.json();

      if (reviews.length === 0) {
        throw new Error("No reviews found for this app.");
      }

      // 2. Analyze with Gemini
      const result = await analyzeReviews(app.title, app.appId, reviews);
      setAnalysis(result);
      saveToRecent(app, result);
    } catch (err: any) {
      setError(err.message || "Failed to analyze reviews. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const downloadPDF = async () => {
    if (!reportRef.current) return;
    
    const element = reportRef.current;
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#F8F9FA",
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight
    });
    
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    
    // Handle multi-page if needed, but for now just one long page or scaled
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`VoltBay_Report_${analysis?.appName.replace(/\s+/g, "_")}.pdf`);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans selection:bg-emerald-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            {(analysis || isAnalyzing || selectedApp || error) && (
              <button 
                onClick={handleBack}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                title="Back to Search"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
            )}
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
                <Zap className="text-white w-6 h-6 fill-current" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">VoltBay Intelligence</h1>
                <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold">Internal Research Tool</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {!analysis && (
              <form onSubmit={handleSearch} className="relative w-full max-w-md hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search app name..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-100 border-transparent focus:bg-white focus:border-emerald-500 rounded-full text-sm transition-all outline-none border-2"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {isSearching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600 w-4 h-4 animate-spin" />}
              </form>
            )}

            {analysis && (
              <button 
                onClick={downloadPDF}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-full text-sm font-medium hover:bg-emerald-700 transition-colors shadow-md shadow-emerald-100"
              >
                <Download className="w-4 h-4" />
                Export Report
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Search Results Overlay */}
        <AnimatePresence>
          {searchResults.length > 0 && !analysis && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute top-20 left-1/2 -translate-x-1/2 w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-[60]"
            >
              <div className="p-2">
                {searchResults.map((app) => (
                  <button
                    key={app.appId}
                    onClick={() => handleSelectApp(app)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors text-left group"
                  >
                    <img src={app.icon} alt={app.title} className="w-10 h-10 rounded-lg shadow-sm" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{app.title}</p>
                      <p className="text-xs text-gray-500 truncate">{app.developer}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-emerald-500 transition-colors" />
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Initial State / Loading */}
        {!analysis && !isAnalyzing && (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center mb-6">
              <Search className="w-10 h-10 text-emerald-600" />
            </div>
            <h2 className="text-3xl font-bold mb-4">Analyze EV Driver Sentiment</h2>
            <p className="text-gray-500 max-w-md mb-8">
              Generate a comprehensive intelligence report based on real user reviews.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl mb-12">
              {/* Search Column */}
              <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm text-left">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                    <Search className="w-5 h-5 text-emerald-600" />
                  </div>
                  <h3 className="font-bold text-lg">Search by Name</h3>
                </div>
                <form onSubmit={handleSearch} className="space-y-4">
                  <input
                    type="text"
                    placeholder="e.g. Tata Power EZ Charge"
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-emerald-500 rounded-2xl text-sm transition-all outline-none"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <button 
                    type="submit"
                    disabled={isSearching}
                    className="w-full py-3 bg-emerald-600 text-white rounded-2xl font-bold text-sm hover:bg-emerald-700 transition-colors disabled:opacity-50"
                  >
                    {isSearching ? "Searching..." : "Search Apps"}
                  </button>
                </form>
              </div>

              {/* URL Column */}
              <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm text-left">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                    <LinkIcon className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="font-bold text-lg">Research by URL</h3>
                </div>
                <form onSubmit={(e) => handleSearch(e, urlTerm)} className="space-y-4">
                  <input
                    type="text"
                    placeholder="Paste Play Store URL here..."
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-blue-500 rounded-2xl text-sm transition-all outline-none"
                    value={urlTerm}
                    onChange={(e) => setUrlTerm(e.target.value)}
                  />
                  <button 
                    type="submit"
                    disabled={isSearching}
                    className="w-full py-3 bg-blue-600 text-white rounded-2xl font-bold text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {isSearching ? "Processing..." : "Analyze URL"}
                  </button>
                </form>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-3">
              {["Tata Power EZ Charge", "Statiq", "ChargeZone", "PlugShare"].map((example) => (
                <button
                  key={example}
                  onClick={(e) => handleSearch(e, example)}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm hover:border-emerald-500 hover:text-emerald-600 transition-all shadow-sm"
                >
                  {example}
                </button>
              ))}
            </div>

            {/* Recent Analyses Section */}
            {recentAnalyses.length > 0 && (
              <div className="w-full max-w-4xl mt-16">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <History className="w-5 h-5 text-gray-400" />
                    <h3 className="font-bold text-lg">Recent Analyses</h3>
                  </div>
                  <button 
                    onClick={clearRecent}
                    className="text-xs font-semibold text-gray-400 hover:text-red-500 flex items-center gap-1 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    Clear History
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recentAnalyses.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => loadRecent(item)}
                      className="flex items-center gap-3 p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md hover:border-emerald-100 transition-all text-left group"
                    >
                      <img src={item.app.icon} alt={item.app.title} className="w-10 h-10 rounded-lg shadow-sm" />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate group-hover:text-emerald-600 transition-colors">{item.app.title}</p>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">
                          {new Date(item.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-emerald-500 transition-colors" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {isAnalyzing && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="relative">
              <div className="w-24 h-24 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin"></div>
              <Zap className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-emerald-600 w-8 h-8 animate-pulse" />
            </div>
            <h2 className="text-2xl font-bold mt-8 mb-2">Analyzing Driver Insights</h2>
            <p className="text-gray-500 animate-pulse">Gemini is processing thousands of reviews for {selectedApp?.title}...</p>
          </div>
        )}

        {error && (
          <div className="max-w-md mx-auto bg-red-50 border border-red-100 p-4 rounded-2xl flex items-start gap-3 text-red-600 mb-8">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Dashboard Content */}
        {analysis && (
          <div ref={reportRef} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* App Overview */}
            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm flex flex-col md:flex-row items-center gap-8">
              <img src={selectedApp?.icon} alt={analysis.appName} className="w-24 h-24 rounded-2xl shadow-lg" />
              <div className="flex-1 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                  <h2 className="text-3xl font-bold">{analysis.appName}</h2>
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-full uppercase tracking-wider">Analyzed</span>
                </div>
                <p className="text-gray-500 mb-4">Intelligence report based on {analysis.reviewCount} recent Google Play Store reviews.</p>
                <div className="flex flex-wrap justify-center md:justify-start gap-4">
                  <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm font-semibold">Pain Index: {Math.round(analysis.painIndex.reduce((acc, curr) => acc + (curr.category !== "Positive feedback" ? curr.percentage : 0), 0))}%</span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl">
                    <Activity className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-semibold">Sentiment Score: {analysis.marketPosition.sentimentScore}/100</span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <span className="text-sm font-semibold">Top Issue: {analysis.painIndex.sort((a, b) => b.percentage - a.percentage)[0].category}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Market Positioning */}
            <div className="bg-emerald-50 rounded-3xl p-8 border border-emerald-100">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-bold text-emerald-900 mb-2 flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Market Perception
                  </h3>
                  <p className="text-emerald-800/80 leading-relaxed">{analysis.marketPosition.perception}</p>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-emerald-900 mb-2 flex items-center gap-2">
                    <Rocket className="w-5 h-5" />
                    Competitive Advantage
                  </h3>
                  <p className="text-emerald-800/80 leading-relaxed">{analysis.marketPosition.competitiveAdvantage}</p>
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Pain Index Chart */}
              <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-xl font-bold">EV Driver Pain Index</h3>
                    <p className="text-sm text-gray-500">Distribution of reported issues</p>
                  </div>
                  <PieChartIcon className="text-emerald-600 w-6 h-6" />
                </div>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analysis.painIndex}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={110}
                        paddingAngle={5}
                        dataKey="percentage"
                        label={({ name, percentage }) => `${percentage}%`}
                      >
                        {analysis.painIndex.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      />
                      <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Bar Chart Distribution */}
              <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-xl font-bold">Issue Frequency</h3>
                    <p className="text-sm text-gray-500">Categorized complaint counts</p>
                  </div>
                  <BarChart3 className="text-emerald-600 w-6 h-6" />
                </div>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analysis.painIndex}>
                      <XAxis dataKey="category" hide />
                      <YAxis />
                      <Tooltip 
                        cursor={{fill: '#f8fafc'}}
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      />
                      <Bar dataKey="percentage" fill="#10b981" radius={[4, 4, 0, 0]} label={{ position: 'top', formatter: (val: number) => `${val}%` }} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* SWOT Analysis */}
            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
              <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
                <Layers className="text-emerald-600 w-6 h-6" />
                Strategic SWOT Analysis
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <h4 className="font-bold text-emerald-900 mb-4 flex items-center gap-2 uppercase tracking-wider text-xs">
                    <CheckCircle2 className="w-4 h-4" /> Strengths
                  </h4>
                  <ul className="space-y-2">
                    {analysis.swot.strengths.map((s, i) => (
                      <li key={i} className="text-sm text-emerald-800 flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full mt-1.5 shrink-0" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="p-6 bg-red-50 rounded-2xl border border-red-100">
                  <h4 className="font-bold text-red-900 mb-4 flex items-center gap-2 uppercase tracking-wider text-xs">
                    <ShieldAlert className="w-4 h-4" /> Weaknesses
                  </h4>
                  <ul className="space-y-2">
                    {analysis.swot.weaknesses.map((w, i) => (
                      <li key={i} className="text-sm text-red-800 flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-red-400 rounded-full mt-1.5 shrink-0" />
                        {w}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100">
                  <h4 className="font-bold text-blue-900 mb-4 flex items-center gap-2 uppercase tracking-wider text-xs">
                    <Lightbulb className="w-4 h-4" /> Opportunities
                  </h4>
                  <ul className="space-y-2">
                    {analysis.swot.opportunities.map((o, i) => (
                      <li key={i} className="text-sm text-blue-800 flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1.5 shrink-0" />
                        {o}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100">
                  <h4 className="font-bold text-amber-900 mb-4 flex items-center gap-2 uppercase tracking-wider text-xs">
                    <AlertTriangle className="w-4 h-4" /> Threats
                  </h4>
                  <ul className="space-y-2">
                    {analysis.swot.threats.map((t, i) => (
                      <li key={i} className="text-sm text-amber-800 flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-amber-400 rounded-full mt-1.5 shrink-0" />
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* User Personas */}
            <div className="space-y-6">
              <h3 className="text-2xl font-bold px-2 flex items-center gap-3">
                <Users className="text-emerald-600 w-7 h-7" />
                Target User Personas
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {analysis.personas.map((persona, idx) => (
                  <div key={idx} className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-lg transition-all group">
                    <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-emerald-50 transition-colors">
                      <Users className="w-7 h-7 text-gray-400 group-hover:text-emerald-600 transition-colors" />
                    </div>
                    <h4 className="text-xl font-bold mb-3">{persona.name}</h4>
                    <p className="text-sm text-gray-500 mb-6 leading-relaxed">{persona.description}</p>
                    <div className="space-y-4">
                      <div>
                        <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest mb-2">Pain Points</p>
                        <div className="flex flex-wrap gap-2">
                          {persona.painPoints.map((p, i) => (
                            <span key={i} className="px-2 py-1 bg-red-50 text-red-600 text-[10px] font-bold rounded-md">{p}</span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-2">Core Desires</p>
                        <div className="flex flex-wrap gap-2">
                          {persona.desires.map((d, i) => (
                            <span key={i} className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-md">{d}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Strategic Roadmap */}
            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
              <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
                <Map className="text-emerald-600 w-6 h-6" />
                VoltBay Strategic Roadmap
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {analysis.roadmap.map((phase, idx) => (
                  <div key={idx} className="relative">
                    {idx < 2 && <div className="hidden md:block absolute top-10 -right-4 w-8 h-0.5 bg-gray-100 z-0" />}
                    <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center font-bold shadow-lg shadow-emerald-100">
                          {idx + 1}
                        </div>
                        <h4 className="font-bold text-lg">{phase.phase}</h4>
                      </div>
                      <div className="space-y-4">
                        {phase.features.map((feature, fIdx) => (
                          <div key={fIdx} className="p-4 bg-gray-50 rounded-2xl border border-transparent hover:border-emerald-100 transition-all">
                            <h5 className="font-bold text-sm mb-2">{feature.title}</h5>
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-gray-400" />
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{feature.effort} Effort</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <TrendingUp className="w-3 h-3 text-emerald-500" />
                                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">{feature.impact} Impact</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>            <div className="space-y-6">
              <h3 className="text-2xl font-bold px-2">Deep Dive: Problem Categories</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {analysis.explanations.map((item, idx) => (
                  <div key={idx} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center">
                        <AlertTriangle className={cn("w-5 h-5", item.category === "Positive feedback" ? "text-emerald-500" : "text-amber-500")} />
                      </div>
                      <h4 className="font-bold text-lg">{item.category}</h4>
                    </div>
                    <p className="text-gray-600 text-sm mb-4 leading-relaxed">{item.explanation}</p>
                    <div className="bg-emerald-50/50 p-4 rounded-2xl mb-4">
                      <p className="text-[10px] uppercase font-bold text-emerald-700 mb-1 tracking-wider">Business Impact</p>
                      <p className="text-sm text-emerald-900 font-medium">{item.impact}</p>
                    </div>
                    <div className="space-y-3">
                      {item.quotes.map((quote, qIdx) => (
                        <div key={qIdx} className="flex gap-3">
                          <Quote className="w-4 h-4 text-gray-300 shrink-0 mt-1" />
                          <p className="text-xs italic text-gray-500">"{quote}"</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Competitor Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <ShieldAlert className="text-red-500 w-6 h-6" />
                  Competitor Weakness Map
                </h3>
                <div className="space-y-6">
                  {analysis.competitorWeaknesses.map((comp, idx) => (
                    <div key={idx} className="border-l-4 border-red-100 pl-4 py-1">
                      <h4 className="font-bold text-gray-900 mb-2">{comp.appName}</h4>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {comp.weaknesses.map((w, wIdx) => (
                          <span key={wIdx} className="px-2 py-1 bg-red-50 text-red-600 text-[10px] font-bold rounded-md uppercase">{w}</span>
                        ))}
                      </div>
                      <p className="text-sm text-gray-500 leading-relaxed">{comp.explanation}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <Award className="text-emerald-500 w-6 h-6" />
                  Competitor Strength Map
                </h3>
                <div className="space-y-6">
                  {analysis.competitorStrengths.map((comp, idx) => (
                    <div key={idx} className="border-l-4 border-emerald-100 pl-4 py-1">
                      <h4 className="font-bold text-gray-900 mb-2">{comp.appName}</h4>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {comp.strengths.map((s, sIdx) => (
                          <span key={sIdx} className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-md uppercase">{s}</span>
                        ))}
                      </div>
                      <p className="text-sm text-gray-500 leading-relaxed mb-3">{comp.explanation}</p>
                      <div className="bg-emerald-50 p-3 rounded-xl flex items-start gap-3">
                        <Target className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">VoltBay Action</p>
                          <p className="text-xs text-emerald-700 font-medium">{comp.voltBayAction}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <TrendingUp className="text-blue-500 w-6 h-6" />
                Competitor Mention Detection
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {analysis.competitorMentions.map((mention, idx) => (
                  <div key={idx} className="bg-gray-50/50 p-4 rounded-2xl">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-sm">{mention.name}</span>
                      <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{mention.percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden mb-2">
                      <div className="bg-blue-500 h-full" style={{ width: `${mention.percentage}%` }}></div>
                    </div>
                    <p className="text-xs text-gray-500 italic">"{mention.context}"</p>
                  </div>
                ))}
              </div>
            </div>

            {/* VoltBay Opportunities */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-emerald-900 rounded-3xl p-8 text-white shadow-xl shadow-emerald-200">
                <h3 className="text-2xl font-bold mb-8 flex items-center gap-3">
                  <Lightbulb className="text-emerald-400 w-8 h-8" />
                  VoltBay Opportunity Detector
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {analysis.opportunities.map((opp, idx) => (
                    <div key={idx} className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/10 hover:bg-white/20 transition-colors">
                      <div className="w-8 h-8 bg-emerald-400/20 rounded-lg flex items-center justify-center mb-4">
                        <span className="font-bold text-emerald-400">{idx + 1}</span>
                      </div>
                      <h4 className="font-bold mb-2 text-lg">{opp.title}</h4>
                      <p className="text-emerald-100/80 text-sm leading-relaxed">{opp.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <ListChecks className="text-emerald-600 w-6 h-6" />
                  Feature Prioritization
                </h3>
                <div className="space-y-4">
                  {analysis.priorities.map((priority, idx) => (
                    <div key={idx} className="flex items-center gap-4 p-3 bg-gray-50 rounded-2xl border border-transparent hover:border-emerald-100 transition-all">
                      <div className="w-8 h-8 bg-white rounded-xl shadow-sm flex items-center justify-center font-bold text-emerald-600 shrink-0">
                        {idx + 1}
                      </div>
                      <p className="text-sm font-semibold text-gray-700">{priority}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Review Explorer */}
            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
              <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
                <Search className="text-emerald-600 w-6 h-6" />
                Review Explorer
              </h3>
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {analysis.explanations.map((cat, cIdx) => (
                  <div key={cIdx} className="space-y-3">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest sticky top-0 bg-white py-2 z-10">{cat.category}</h4>
                    {cat.quotes.map((quote, qIdx) => (
                      <div key={qIdx} className="p-4 bg-gray-50 rounded-2xl border border-transparent hover:border-emerald-100 transition-all">
                        <div className="flex gap-3">
                          <Quote className="w-4 h-4 text-emerald-300 shrink-0 mt-1" />
                          <p className="text-sm text-gray-600 leading-relaxed italic">"{quote}"</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Footer Report Info */}
            <div className="text-center py-8 border-t border-gray-100">
              <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">VoltBay Internal Intelligence Report • Confidential</p>
              <p className="text-[10px] text-gray-300 mt-1">Generated on {new Date().toLocaleDateString()} • Powered by Gemini AI</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
