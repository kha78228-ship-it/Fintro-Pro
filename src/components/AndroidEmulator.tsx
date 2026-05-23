import React, { useState, useEffect, useRef } from "react";
import { 
  Plus, 
  Trash2, 
  Sparkles, 
  ArrowLeft, 
  Play, 
  Square,
  Home, 
  Wifi, 
  Battery, 
  ChevronLeft, 
  ChevronRight, 
  Code2, 
  Terminal, 
  Search, 
  Check, 
  Settings, 
  Moon, 
  Sun,
  Activity, 
  Heart, 
  Calendar, 
  MapPin, 
  User, 
  Folder, 
  BookOpen, 
  Share2, 
  Volume2, 
  RefreshCw, 
  DollarSign, 
  AlertCircle, 
  Info,
  Mic,
  Wallpaper,
  MessageSquare,
  Cpu,
  Layers,
  Award,
  Star,
  Map,
  Smile,
  Music,
  Maximize2,
  Copy,
  FolderOpen,
  TerminalSquare
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// Types for Simulated Android App Blueprints
interface PresetApp {
  id: string;
  name: string;
  tagline: string;
  iconName: "Activity" | "Heart" | "Calendar" | "MapPin" | "Folder";
  color: string;
  prompt: string;
  composeCode: string;
}

const PRESE_APPS: PresetApp[] = [
  {
    id: "ludo_scores",
    name: "Ludo Scores Pro",
    tagline: "Bảng điểm cá ngựa & xúc xắc ảo",
    iconName: "Activity",
    color: "#ea433ec",
    prompt: "Build an interactive Ludo Game Score Ledger for 4 players with smart leaderboards and simulated dice roller for family board game nights.",
    composeCode: `package com.google.aistudio.ludoscores

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlin.random.Random

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            LudoDashboardTheme {
                LudoDashboard()
            }
        }
    }
}

@Composable
fun LudoDashboard() {
    var diceValue by remember { mutableStateOf(1) }
    var matchesPlayed by remember { mutableStateOf(4) }
    
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF121212))
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            text = "Ludo Party Companion",
            fontSize = 24.sp,
            fontWeight = FontWeight.Bold,
            color = Color.White
        )
        
        Spacer(modifier = Modifier.height(16.dp))
        
        // Rolling dice card
        Card(
            shape = RoundedCornerShape(16.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(
                modifier = Modifier.padding(16.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text("Simulated Board Dice", fontWeight = FontWeight.Medium)
                Spacer(modifier = Modifier.height(12.dp))
                Button(onClick = { diceValue = Random.nextInt(1, 7) }) {
                    Text("ROLL: $diceValue")
                }
            }
        }
    }
}`
  },
  {
    id: "love_ledger",
    name: "Love Ledger pro",
    tagline: "Sổ chi tiêu hạnh phúc đôi ta",
    iconName: "Heart",
    color: "#f43f5e",
    prompt: "Create an adorable couple shared budget book with quick transaction entry, dynamic category distribution, and sweet relationship milestone notes.",
    composeCode: `package com.google.aistudio.loveledger

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            LoveTheme {
                CouplesLedger()
            }
        }
    }
}

@Composable
fun CouplesLedger() {
    var balance by remember { mutableStateOf(15800000) }
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFFFFF0F2))
            .padding(20.dp)
    ) {
        Text("Our Financial Ledger ❤️", fontSize = 22.sp, color = Color(0xFFE11D48))
        Spacer(modifier = Modifier.height(10.dp))
        Card(
            modifier = Modifier.fillMaxWidth().padding(8.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White)
        ) {
            Column(Modifier.padding(16.dp)) {
                Text("Joint Savings Goal", color = Color.Gray)
                Text("15,800,000 VND", fontSize = 28.sp, color = Color.Black)
            }
        }
    }
}`
  },
  {
    id: "vn_heritage",
    name: "Di Sản Việt Nam Explorer",
    tagline: "Hướng dẫn viên di sản UNESCO",
    iconName: "MapPin",
    color: "#059669",
    prompt: "Build an offline tourist guide to Vietnam's UNESCO World Heritage Sites (Hạ Long, Tràng An, Hội An, Huế) with rich destination cards and interactive bucket lists.",
    composeCode: `package com.google.aistudio.heritage

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            HeritageTheme {
                ExploreVietnam()
            }
        }
    }
}

@Composable
fun ExploreVietnam() {
    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        Text("UNESCO Vietnam Heritage 🇻🇳", style = MaterialTheme.typography.headlineMedium)
        Spacer(modifier = Modifier.height(12.dp))
        Text("Embark on highly immersive cultural experiences safely.")
    }
}`
  },
  {
    id: "love_counter",
    name: "Đồng Hồ Cặp Đôi",
    tagline: "Đếm ngày trân quý & kỉ niệm",
    iconName: "Calendar",
    color: "#ec4899",
    prompt: "Build a dynamic retro counters app for couples tracking days together, custom relationship avatars, sweet quotes of the day, and milestone countdown animations.",
    composeCode: `package com.google.aistudio.lovetimetracker

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            CoupleCounterTheme {
                CountdownApp()
            }
        }
    }
}

@Composable
fun CountdownApp() {
    Column(
        modifier = Modifier.fillMaxSize(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text("Every Second Counts With You", fontSize = 16.sp)
        Text("1314 Days", fontSize = 48.sp, fontWeight = FontWeight.Bold)
    }
}`
  },
  {
    id: "task_note",
    name: "Smart Notepad Pro",
    tagline: "Ghi chú phân loại thông minh",
    iconName: "Folder",
    color: "#f59e0b",
    prompt: "Build a modern tasks and quick diary logger with color-coded tags, progress indicators, search query, and motivational quotes.",
    composeCode: `package com.google.aistudio.smartnotes

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            SmartNotesTheme {
                NotesHome()
            }
        }
    }
}

@Composable
fun NotesHome() {
    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        Text("Smart Workspace Notes", style = MaterialTheme.typography.titleLarge)
        Spacer(modifier = Modifier.height(10.dp))
        OutlinedTextField(
            value = "",
            onValueChange = {},
            label = { Text("Filter keywords...") },
            modifier = Modifier.fillMaxWidth()
        )
    }
}`
  }
];

// Helper to render Icons dynamically from Lucide database
const renderPresetIcon = (iconName: string, className: string = "w-5 h-5") => {
  switch (iconName) {
    case "Activity":
      return <Activity className={className} />;
    case "Heart":
      return <Heart className={className} />;
    case "Calendar":
      return <Calendar className={className} />;
    case "MapPin":
      return <MapPin className={className} />;
    case "Folder":
      return <Folder className={className} />;
    default:
      return <Sparkles className={className} />;
  }
};

export default function AndroidEmulator() {
  const [promptInput, setPromptInput] = useState("");
  const [activePreset, setActivePreset] = useState<PresetApp>(PRESE_APPS[0]);
  const [isCompiling, setIsCompiling] = useState(false);
  const [compileStep, setCompileStep] = useState(0);
  const [compileLogs, setCompileLogs] = useState<string[]>([]);
  const [simulationActive, setSimulationActive] = useState(true);
  const [activeCodeTab, setActiveCodeTab] = useState<"compose" | "logs">("compose");

  // Virtual Phone OS states
  const [phoneWallpaper, setPhoneWallpaper] = useState<string>("skyline");
  const [phoneTime, setPhoneTime] = useState("09:41");
  const [phoneBattery, setPhoneBattery] = useState(88);
  const [phoneWifi, setPhoneWifi] = useState(true);
  const [phoneBluetooth, setPhoneBluetooth] = useState(true);
  const [phoneLocation, setPhoneLocation] = useState(true);
  const [phoneView, setPhoneView] = useState<"home" | "settings" | "app">("app");
  const [phoneDarkMode, setPhoneDarkMode] = useState(false);
  const [recentAppsStack, setRecentAppsStack] = useState<string[]>(["Google AI Studio"]);

  // Ludo applet states
  const [ludoRoll, setLudoRoll] = useState(4);
  const [isRolling, setIsRolling] = useState(false);
  const [ludoPlayers, setLudoPlayers] = useState([
    { name: "Anh (Orange)", color: "#f97316", score: 42 },
    { name: "Em (Rose)", color: "#f43f5e", score: 56 },
    { name: "Hòa (Green)", color: "#10b981", score: 28 },
    { name: "Trung (Purple)", color: "#8b5cf6", score: 35 }
  ]);
  const [historyMatches, setHistoryMatches] = useState<string[]>([
    "Anh thắng ván 2 (Xúc xắc ra 6 điểm ba lần)",
    "Em vừa chiếm chuồng của Hòa"
  ]);

  // Love Ledger states
  const [loveTransactions, setLoveTransactions] = useState([
    { id: "1", title: "Mua trà sữa hoàng kim", amount: 55000, category: "Ăn uống", spender: "Anh" },
    { id: "2", title: "Vé xem phim nhà bà Nữ", amount: 240000, category: "Giải trí", spender: "Em" },
    { id: "3", title: "Đổ xăng xe máy", amount: 90000, category: "Di chuyển", spender: "Anh" }
  ]);
  const [loveSpender, setLoveSpender] = useState<"Anh" | "Em">("Anh");
  const [loveTitle, setLoveTitle] = useState("");
  const [loveAmount, setLoveAmount] = useState("");
  const [loveCat, setLoveCat] = useState("Ăn uống");
  const [savingsGoal, setSavingsGoal] = useState(65); // percentage
  const [showHeartFloat, setShowHeartFloat] = useState(false);

  // Vietnam Heritage Guide states
  const [heritageFilters, setHeritageFilters] = useState<string>("all");
  const [heritageFavorites, setHeritageFavorites] = useState<string[]>(["halong"]);
  const [heritagePlaces] = useState([
    { id: "halong", title: "Vịnh Hạ Long", region: "Quảng Ninh", category: "Thiên nhiên", desc: "Kỳ quan đá vôi kỳ vĩ với hơn 1.600 hòn đảo lớn nhỏ rải rác trên biển ngọc cực kỳ lãng mạn.", hits: 1450, tips: "Nên thuê du thuyền ngủ đêm để ngắm bình minh trên vịnh tuyệt đẹp." },
    { id: "hoian", title: "Phố Cổ Hội An", region: "Quảng Nam", category: "Văn hóa", desc: "Thành phố cổ kính bên dòng sông Thu Bồn nổi tiếng với lồng đèn rực rỡ và ẩm thực Cao Lầu đậm đà.", hits: 980, tips: "Đi dạo phố cổ vào ngày rằm (14 âm lịch), tắt đèn điện thắp đèn hoa đăng." },
    { id: "trangan", title: "Danh Thắng Tràng An", region: "Ninh Bình", category: "Hỗn hợp", desc: "Di sản thế giới kép tráng lệ với hệ thống hang động xuyên thủy kỳ bí kết hợp các đền đài linh thiêng cổ thụ.", hits: 1120, tips: "Tháng 1-3 âm lịch mùa trẩy hội hoặc ngắm lúa chín vàng óng tháng 5 cực hot." },
    { id: "hue", title: "Cố Đô Huế", region: "Thừa Thiên Huế", category: "Lịch sử", desc: "Quần thể di tích cung điện lộng lẫy triều Nguyễn, lăng tẩm uy nghiêm tráng lệ rợp mát bóng thông.", hits: 820, tips: "Nên thưởng thức Nhã nhạc cung đình Huế tại Duyệt Thị Đường và nghe ca Huế trên sông Hương." }
  ]);

  // Love memory states
  const [loveStartDate, setLoveStartDate] = useState("2023-01-14");
  const [daysCount, setDaysCount] = useState(1224);
  const [loveQuote, setLoveQuote] = useState("Yêu không chỉ là nhìn nhau, mà là cùng nhau nhìn về một hướng.");
  const [bgMusic, setBgMusic] = useState(false);
  const [visualizerHeight, setVisualizerHeight] = useState<number[]>([15, 30, 20, 45, 12, 28, 40, 18]);

  const QUOTES = [
    "Yêu không chỉ là nhìn nhau, mà là cùng nhau nhìn về một hướng.",
    "Bên em là bình yên, bên anh là ấm áp ngọt ngào vô tận.",
    "Thế gian này có hàng triệu nụ cười, nhưng nụ cười của em mới là điều làm trái tim anh rung động.",
    "Hạnh phúc đơn giản chỉ là mỗi sáng thức dậy biết mình vẫn có một người để nhớ về.",
    "Cầu mong trăm năm tình cảm của chúng mình mãi luôn bền chặt như thuở ban sơ."
  ];

  // Smart Note states
  const [notes, setNotes] = useState([
    { id: "1", title: "Chuẩn bị quà kỉ niệm", desc: "Mua một bó hoa cúc họa mi xinh xắn và chuẩn bị thiệp viết tay chân thành tặng bạn gái.", tag: "Urgent", color: "red" },
    { id: "2", title: "Địa điểm đi phượt cuối tuần", desc: "Tìm hiểu xe giường nằm lên Sapa ngắm mây luồn rợp bóng hoàng hôn bản Cát Cát.", tag: "Idea", color: "blue" },
    { id: "3", title: "Tự học làm bánh ngọt cupcake", desc: "Bột mì 200g, lòng đỏ trứng, sữa đặc sấy nhiệt độ 180 độ C trong vòng 35 phút.", tag: "Daily", color: "green" }
  ]);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteDesc, setNoteDesc] = useState("");
  const [noteTag, setNoteTag] = useState("Idea");
  const [noteSearch, setNoteSearch] = useState("");

  // Arbitrary custom user prompt compilation
  const [customAppCompiled, setCustomAppCompiled] = useState<any>(null);
  const [aiCompileError, setAiCompileError] = useState<string | null>(null);

  // Time tracker effect
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setPhoneTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Music spectrum visualizer simulation
  useEffect(() => {
    if (!bgMusic) return;
    const interval = setInterval(() => {
      setVisualizerHeight(prev => prev.map(() => Math.floor(Math.random() * 35) + 10));
    }, 150);
    return () => clearInterval(interval);
  }, [bgMusic]);

  // Handle preset selector click
  const handlePresetSelect = (app: PresetApp) => {
    setActivePreset(app);
    setPromptInput(app.prompt);
    // Auto initiate compiler
    triggerBuild(app);
  };

  // Compile prompt to simulated app loading
  const triggerBuild = async (app: PresetApp) => {
    setIsCompiling(true);
    setCompileStep(0);
    setCompileLogs([]);
    setAiCompileError(null);
    setActiveCodeTab("logs");

    const steps = [
      "Connecting to Google AI Studio Cloud Container...",
      "Resolving Kotlin Android Compiler dependencies...",
      "Generating Jetpack Compose layout trees...",
      "Compiling Java class blueprints and bundling DEX manifests...",
      "Generating mock Android Application Package (APK)...",
      "Launching Android Virtual Device (AVD) background container...",
      "Pixel 9 Pro emulator successfully synced and booted applet!"
    ];

    for (let i = 0; i < steps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 800));
      setCompileStep(i + 1);
      setCompileLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${steps[i]}`]);
    }

    setIsCompiling(false);
    setPhoneView("app");
    setSimulationActive(true);
  };

  // Handle arbitrary prompt builders using Gemini code API
  const handleBuildCustomApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptInput.trim()) return;

    setIsCompiling(true);
    setCompileStep(0);
    setCompileLogs(["[System] Syncing with Google Gemini 3.5-Flash compiler..."]);
    setAiCompileError(null);
    setActiveCodeTab("logs");

    try {
      // Prompt engineering requesting specialized JSON schema layout
      const customPrompt = `You are a high-fidelity server-side Android Emulator helper. The user wants to build an app described as: "${promptInput}".
      Generate a realistic Jetpack Compose source code file (simulated, very professional looking) AND convert this app structure into a JSON config so my React UI can dynamically render it inside the phone simulator.
      
      Respond with ONLY a valid raw JSON block containing exactly these parameters and nothing else (no wrapper text, no extra markdown other than raw json format):
      {
        "appName": "Name of app",
        "appColor": "A single hex color code like #8B5CF6 or #EC4899",
        "iconName": "One of: Activity, Heart, Calendar, MapPin, Folder",
        "composeCode": "Complete formatted Kotlin Jetpack Compose code with classes, import, modifiers for MainActivity.kt",
        "screenTitle": "A beautiful catchy VN screen title",
        "theme": "light",
        "features": [
          { "id": "f1", "title": "A headline title of custom control", "desc": "Subtext instruction", "buttonText": "Action Button Text", "type": "counter" },
          { "id": "f2", "title": "Interactive list tracker", "type": "todolist" }
        ],
        "initialItems": [
          { "id": "i1", "text": "Recipe step 1 / Checklist item A", "status": "pending" },
          { "id": "i2", "text": "Recipe step 2 / Checklist item B", "status": "completed" }
        ]
      }`;

      // Call our server endpoint
      const response = await fetch("/api/gemini/generateContent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "gemini-3.5-flash",
          contents: customPrompt
        })
      });

      if (!response.ok) {
        throw new Error("Unable to obtain simulated compiler data from server.");
      }

      const resData = await response.json();
      let rawText = resData.text || "";
      
      // Sanitizing JSON output
      if (rawText.includes("```json")) {
        rawText = rawText.split("```json")[1].split("```")[0].trim();
      } else if (rawText.includes("```")) {
        rawText = rawText.split("```")[1].split("```")[0].trim();
      }
      
      const appJson = JSON.parse(rawText);

      // Create preset replacement
      const dynamicPreset: PresetApp = {
        id: "custom_compiled_" + Date.now(),
        name: appJson.appName || "Custom AI App",
        tagline: "Ứng dụng biên dịch lập trình thông minh",
        iconName: appJson.iconName || "Activity",
        color: appJson.appColor || "#3b82f6",
        prompt: promptInput,
        composeCode: appJson.composeCode || "// Compiled with Gemini successful"
      };

      // Set custom state properties
      setCustomAppCompiled({
        ...appJson,
        items: appJson.initialItems || []
      });

      setActivePreset(dynamicPreset);
      setCompileLogs(p => [...p, "[System] Custom compilation completely successful! Running simulated APK on Virtual Device."]);
      
      // Boot flow simulation
      for (let s = 4; s <= 7; s++) {
        await new Promise(r => setTimeout(r, 400));
        setCompileStep(s);
      }

      setIsCompiling(false);
      setPhoneView("app");
      setSimulationActive(true);

    } catch (e: any) {
      console.error(e);
      setAiCompileError(`Compilation failed: ${e.message || "Invalid syntax returned from AI Studio Server"}`);
      setCompileLogs(p => [...p, `[ERROR] Compiler crashed: ${e.message}`]);
      setIsCompiling(false);
    }
  };

  // Virtual Custom App Interactive state
  const handleToggleCustomItem = (id: string) => {
    if (!customAppCompiled) return;
    const updated = customAppCompiled.items.map((it: any) => {
      if (it.id === id) {
        return { ...it, status: it.status === "completed" ? "pending" : "completed" };
      }
      return it;
    });
    setCustomAppCompiled({ ...customAppCompiled, items: updated });
  };

  const handleAddCustomItem = (text: string) => {
    if (!customAppCompiled || !text.trim()) return;
    const newItem = {
      id: "item_" + Date.now(),
      text: text.trim(),
      status: "pending"
    };
    setCustomAppCompiled({
      ...customAppCompiled,
      items: [...customAppCompiled.items, newItem]
    });
  };

  return (
    <div className="w-full grid grid-cols-1 xl:grid-cols-12 gap-8 text-neutral-800 font-sans relative">
      
      {/* LEFT SIDE WORKSPACE: Google AI Studio Emulator Controller */}
      <div className="xl:col-span-7 space-y-6 flex flex-col justify-between">
        
        {/* Google Mock AI Studio Banner Header */}
        <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-neutral-100 shadow-sm relative overflow-hidden flex flex-col">
          {/* Decorative Background */}
          <div className="absolute right-0 top-0 w-44 h-44 bg-gradient-to-br from-indigo-500/5 to-teal-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] uppercase tracking-widest font-extrabold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100 flex items-center gap-1">
              <Cpu className="w-3 h-3 animate-spin" /> Android Framework
            </span>
            <span className="text-[10px] uppercase tracking-widest font-extrabold text-teal-600 bg-teal-50 px-3 py-1 rounded-full border border-teal-100">
              Gemini 3.5 SDK
            </span>
          </div>

          <h2 className="text-3xl font-black text-neutral-900 tracking-tight leading-tight flex items-center gap-1 flex-wrap">
            Build your ideas with <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-pink-600 bg-clip-text text-transparent">Gemini</span>
          </h2>
          <p className="text-sm text-neutral-400 mt-2 max-w-xl leading-relaxed font-medium">
            Mô phỏng máy ảo Android Studio thế hệ mới tích hợp trực tiếp trong Google AI Studio. Viết ý tưởng ứng dụng bằng tiếng Việt để biên dịch lập trình mã nguồn và chạy thử nghiệm trực tiếp trên máy ảo Android Pixel 9!
          </p>

          {/* Prompt Form Wrapper */}
          <form onSubmit={handleBuildCustomApp} className="mt-8 space-y-4">
            <div className="relative bg-neutral-50 rounded-[2rem] border border-neutral-200/80 p-3 shadow-inner hover:border-neutral-300 transition-colors focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10">
              <div className="flex items-center gap-2.5 px-3 pt-2 text-[11px] font-bold text-neutral-400 select-none">
                <span className="w-5 h-5 rounded bg-green-50 text-green-600 flex items-center justify-center font-bold">🤖</span>
                <span>Build an Android app (Android framework)</span>
              </div>
              
              <textarea
                value={promptInput}
                onChange={(e) => setPromptInput(e.target.value)}
                placeholder="Ví dụ: Tạo một ứng dụng quản lý công thức làm bánh ngọt kem dâu, có bảng thời gian hấp lúa mì, đo nhiệt độ lò sấy..."
                rows={3}
                className="w-full px-3 py-3 bg-transparent border-0 text-sm focus:outline-none text-neutral-800 font-medium placeholder-neutral-400 resize-none leading-relaxed"
              />

              <div className="flex items-center justify-between border-t border-neutral-200/50 pt-2.5 px-2">
                <div className="flex gap-1.5 text-neutral-400">
                  <button type="button" className="p-2 hover:bg-neutral-200 rounded-xl transition-colors" title="Đính kèm file hoặc ảnh mẫu">
                    <Plus className="w-4 h-4 text-neutral-500" />
                  </button>
                  <button type="button" className="p-2 hover:bg-neutral-200 rounded-xl transition-colors" title="Thu âm giọng nói">
                    <Mic className="w-4 h-4 text-neutral-500" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {promptInput.trim() && (
                    <button
                      type="button"
                      onClick={() => setPromptInput("")}
                      className="px-3 py-1.5 text-xs font-bold text-neutral-400 hover:text-neutral-600"
                    >
                      Xóa trắng
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={isCompiling}
                    className="py-2.5 px-6 bg-neutral-900 hover:bg-neutral-800 text-white font-extrabold text-xs rounded-full transition-all active:scale-95 flex items-center gap-2 shadow hover:shadow-md cursor-pointer disabled:opacity-40"
                  >
                    <Sparkles className="w-4 h-4 text-amber-400 animate-pulse animate-duration-1000" />
                    Biên Dịch App Android
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Carousel Recommended Applications */}
        <div className="bg-white p-6 rounded-[2rem] border border-neutral-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-neutral-900 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" /> Ý tưởng khuyên dùng thiết kế
            </h3>
            <span className="text-[10px] text-neutral-400 font-bold">Lick để chạy giả lập nhanh</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3.5">
            {PRESE_APPS.map(app => {
              const isSelected = activePreset.id === app.id;
              return (
                <button
                  type="button"
                  key={app.id}
                  onClick={() => handlePresetSelect(app)}
                  className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between group cursor-pointer ${
                    isSelected 
                      ? "bg-neutral-900 text-white border-neutral-950 shadow-md scale-[1.02]" 
                      : "bg-neutral-50/50 hover:bg-white border-neutral-200 hover:border-neutral-300 hover:shadow"
                  }`}
                >
                  <div 
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-white mb-2 shadow"
                    style={{ backgroundColor: app.color }}
                  >
                    {renderPresetIcon(app.iconName, "w-4 h-4 text-white")}
                  </div>

                  <div>
                    <h4 className="text-[12px] font-black line-clamp-1 leading-tight">{app.name}</h4>
                    <p className={`text-[9px] font-bold truncate mt-0.5 ${isSelected ? "text-neutral-400" : "text-neutral-400 group-hover:text-blue-500"}`}>
                      {app.tagline}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Kotlin Jetpack Compose Code / Logs Editor Console */}
        <div className="bg-neutral-950 p-6 rounded-[2rem] border border-neutral-900 text-neutral-300 min-h-[300px] flex flex-col justify-between shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-neutral-900 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500" />
              <span className="w-3 h-3 rounded-full bg-yellow-500" />
              <span className="w-3 h-3 rounded-full bg-green-500" />
              <div className="w-px h-4 bg-neutral-800 mx-1" />
              <span className="text-[10px] font-mono font-extrabold text-neutral-500 uppercase tracking-wider">Android Studio IDE Terminal</span>
            </div>

            <div className="flex bg-neutral-900 p-1 rounded-xl border border-neutral-800">
              <button
                onClick={() => setActiveCodeTab("compose")}
                className={`px-3 py-1 text-[10px] font-mono font-bold rounded-lg transition-all ${activeCodeTab === "compose" ? "bg-white/10 text-white shadow-sm" : "text-neutral-500 hover:text-neutral-300"}`}
              >
                <Code2 className="w-3 h-3 inline-block mr-1" /> MainActivity.kt (Compose)
              </button>
              <button
                onClick={() => setActiveCodeTab("logs")}
                className={`px-3 py-1 text-[10px] font-mono font-bold rounded-lg transition-all relative ${activeCodeTab === "logs" ? "bg-white/10 text-white shadow-sm" : "text-neutral-500 hover:text-neutral-300"}`}
              >
                {isCompiling && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-blue-400 animate-ping" />}
                <Terminal className="w-3 h-3 inline-block mr-1" /> Gradle Output & Logs
              </button>
            </div>
          </div>

          <div className="flex-1 py-4 font-mono text-[10.5px] leading-relaxed overflow-y-auto max-h-[320px]">
            {activeCodeTab === "compose" ? (
              <pre className="text-emerald-400 whitespace-pre-wrap select-text">
                {activePreset.composeCode}
              </pre>
            ) : (
              <div className="space-y-1 text-slate-300">
                {compileLogs.map((log, index) => (
                  <div key={index} className="flex gap-2 items-start hover:bg-white/5 px-2 py-0.5 rounded transition-colors">
                    <span className="text-neutral-600 text-[10px]">{index + 1}</span>
                    <span className={log.includes("[ERROR]") ? "text-rose-400 font-bold" : log.includes("success") ? "text-cyan-400 font-bold" : "text-slate-300"}>
                      {log}
                    </span>
                  </div>
                ))}
                
                {isCompiling && (
                  <div className="flex items-center gap-2 text-blue-400 font-bold animate-pulse mt-3 pl-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>[COMPILE STEP {compileStep}/7] compiling assets & linking resources...</span>
                  </div>
                )}

                {aiCompileError && (
                  <div className="p-4 bg-rose-950/40 border border-rose-900 rounded-xl mt-4 flex items-start gap-2.5 text-rose-300">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-extrabold text-xs">Phát hiện Lỗi Biên Dịch!</p>
                      <p className="mt-1 text-[10px] leading-relaxed font-semibold">{aiCompileError}</p>
                    </div>
                  </div>
                )}
                
                {!isCompiling && compileLogs.length === 0 && (
                  <div className="text-center py-12 text-neutral-500">
                    <TerminalSquare className="w-12 h-12 text-neutral-800 mx-auto mb-3" />
                    <p>Khởi chạy biên dịch ứng dụng để xem luồng Logs Gradle chi tiết tại đây.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Source tracker banner */}
          <div className="border-t border-neutral-900 pt-3 text-[10px] text-neutral-500 flex justify-between items-center font-mono">
            <span>Project: GoogleAndroidAIStudioApplet</span>
            <span className="text-orange-500 font-bold">STATUS: {isCompiling ? "BUILDING" : "LIVE & SYNCED"}</span>
          </div>
        </div>

      </div>

      {/* RIGHT SIDE WORKSPACE: Pixel 9 Pro Android Virtual Device Simulator Container */}
      <div className="xl:col-span-5 flex flex-col items-center">
        
        {/* Device frame shadow wrapping */}
        <div className="relative p-6 bg-neutral-100 rounded-[4rem] border border-neutral-200/50 shadow-sm flex flex-col justify-center items-center w-full max-w-[420px]">
          
          {/* External controller handles on side of phone */}
          <div className="absolute right-3 top-28 w-1 h-14 bg-neutral-400 rounded-l shadow-sm" title="Volume Up" />
          <div className="absolute right-3 top-44 w-1 h-14 bg-neutral-400 rounded-l shadow-sm" title="Volume Down" />
          <div className="absolute right-3 top-64 w-1 h-20 bg-neutral-600 rounded-l shadow-sm" title="Power Key" />

          {/* Actual physical phone layout body container */}
          <div className={`relative border-[14px] border-neutral-900 bg-neutral-950 rounded-[3.8rem] shadow-2xl transition-all duration-350 ease-out flex flex-col w-full overflow-hidden ${phoneDarkMode ? "dark" : ""}`}
               style={{ height: "720px" }}>
            
            {/* Curvaceous Camera Punch-Hole Notch */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-6 bg-neutral-950 rounded-full z-50 flex items-center justify-center">
              <div className="w-12 h-1 bg-neutral-800 rounded-full mb-1" />
              <div className="w-2.5 h-2.5 bg-neutral-900 border border-neutral-800 rounded-full absolute right-4 top-1" />
            </div>

            {/* Simulated Android Status Bar */}
            <div className="h-9 bg-neutral-100 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100 flex items-center justify-between px-7 text-[10px] font-extrabold select-none shrink-0 border-b border-neutral-200/30 relative z-40">
              <span className="font-mono tracking-tight">{phoneTime}</span>
              <div className="flex items-center gap-2">
                {phoneWifi ? <Wifi className="w-3.5 h-3.5 text-blue-500" /> : <Wifi className="w-3.5 h-3.5 text-neutral-400 opacity-50" />}
                <span className="text-[9px] font-mono text-neutral-500">5G</span>
                <div className="flex items-center gap-1 bg-neutral-200 dark:bg-neutral-850 px-1.5 py-0.5 rounded-md font-mono text-[9px]">
                  <Battery className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  <span>{phoneBattery}%</span>
                </div>
              </div>
            </div>

            {/* Active Core OS view area dispatcher */}
            <div className="flex-1 w-full h-full relative overflow-hidden bg-white dark:bg-neutral-950">
              
              <AnimatePresence mode="wait">
                
                {/* 1. Android Homescreen Launcher view */}
                {phoneView === "home" && (
                  <motion.div
                    key="os_home"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute inset-0 p-6 flex flex-col justify-between text-white relative"
                    style={{
                      backgroundImage: phoneWallpaper === "skyline" 
                        ? "linear-gradient(to bottom, #111827, #312e81, #4c1d95)" 
                        : "linear-gradient(to bottom, #064e3b, #115e59, #134e4a)"
                    }}
                  >
                    
                    {/* Big widget area */}
                    <div className="space-y-4 pt-10">
                      <div className="bg-white/10 backdrop-blur-md p-4 rounded-3xl border border-white/10">
                        <p className="text-[10px] font-extrabold text-blue-300 uppercase tracking-widest leading-none">AI Studio Companion</p>
                        <h4 className="text-md font-black mt-1">Hello, Developer!</h4>
                        <p className="text-[11px] text-white/70 leading-relaxed mt-1">
                          Biên dịch cài đặt ứng dụng Android từ kho bên cạnh để kích hoạt widget launcher.
                        </p>
                      </div>

                      {/* Micro calendar clock widget */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl text-center border border-white/5">
                          <p className="text-[11px] text-white/50 leading-none">Days Tracked</p>
                          <p className="text-xl font-mono font-bold mt-1 text-pink-400">{daysCount}</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl text-center border border-white/5">
                          <p className="text-[11px] text-white/50 leading-none">Savings</p>
                          <p className="text-xl font-mono font-bold mt-1 text-emerald-400">{savingsGoal}%</p>
                        </div>
                      </div>
                    </div>

                    {/* App icon drawer grids */}
                    <div className="grid grid-cols-4 gap-4 pb-8 text-center text-[10px] font-black tracking-wide font-sans select-none">
                      
                      {/* Active compiled app symbol if available */}
                      <button
                        type="button"
                        onClick={() => setPhoneView("app")}
                        className="flex flex-col items-center gap-1.5 focus:scale-110 transition-transform cursor-pointer"
                      >
                        <div 
                          className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg relative"
                          style={{ backgroundColor: activePreset.color }}
                        >
                          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500 border-2 border-slate-900" />
                          {renderPresetIcon(activePreset.iconName, "w-6 h-6 text-white")}
                        </div>
                        <span className="truncate w-14 leading-tight font-black">{activePreset.name}</span>
                      </button>

                      {/* Native Setup/Settings app */}
                      <button
                        type="button"
                        onClick={() => setPhoneView("settings")}
                        className="flex flex-col items-center gap-1.5 focus:scale-110 transition-transform cursor-pointer"
                      >
                        <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-100 flex items-center justify-center shadow-lg border border-slate-700">
                          <Settings className="w-6 h-6" />
                        </div>
                        <span>Cài đặt OS</span>
                      </button>

                      {/* Store Mock Icon */}
                      <div className="flex flex-col items-center gap-1.5 opacity-60">
                        <div className="w-12 h-12 rounded-2xl bg-white/15 text-white flex items-center justify-center border border-white/5 shadow-inner">
                          <MessageSquare className="w-5 h-5 text-teal-300" />
                        </div>
                        <span>Messages</span>
                      </div>

                      {/* Code file repository folder */}
                      <div className="flex flex-col items-center gap-1.5 opacity-60">
                        <div className="w-12 h-12 rounded-2xl bg-white/15 text-white flex items-center justify-center border border-white/5 shadow-inner">
                          <FolderOpen className="w-5 h-5 text-amber-300" />
                        </div>
                        <span>My Files</span>
                      </div>

                    </div>
                  </motion.div>
                )}

                {/* 2. OS Settings Screen view */}
                {phoneView === "settings" && (
                  <motion.div
                    key="os_settings"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    className="absolute inset-0 bg-neutral-50 dark:bg-neutral-900 p-5 overflow-y-auto"
                  >
                    <div className="flex items-center gap-2 pb-4 border-b border-neutral-200/50 mb-4 text-neutral-800 dark:text-neutral-100">
                      <button onClick={() => setPhoneView("home")} className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-lg">
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <h3 className="text-md font-bold">Cài đặt Android Virtual Device</h3>
                    </div>

                    <div className="space-y-4">
                      
                      {/* Dark Mode toggle */}
                      <div className="bg-white dark:bg-neutral-850 p-4 rounded-2xl border border-neutral-150 dark:border-neutral-800 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2.5 text-neutral-800 dark:text-white">
                          {phoneDarkMode ? <Moon className="w-4 h-4 text-blue-500" /> : <Sun className="w-4 h-4 text-orange-500" />}
                          <div>
                            <p className="text-xs font-bold leading-none">Chế độ giao diện tối (Dark Mode)</p>
                            <span className="text-[10px] text-neutral-400 mt-0.5 block">Kích hoạt chế độ đêm cho màn hình ảo</span>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={phoneDarkMode}
                          onChange={(e) => setPhoneDarkMode(e.target.checked)}
                          className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                        />
                      </div>

                      {/* Wallpaper selector inside settings */}
                      <div className="bg-white dark:bg-neutral-850 p-4 rounded-2xl border border-neutral-150 dark:border-neutral-800 shadow-sm space-y-3">
                        <div className="flex items-center gap-2 text-neutral-850 dark:text-white">
                          <Wallpaper className="w-4 h-4 text-teal-600" />
                          <p className="text-xs font-bold">Hình nền màn hình chờ Android</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setPhoneWallpaper("skyline")}
                            className={`p-2 rounded-xl text-[10px] font-bold border transition-all ${phoneWallpaper === "skyline" ? "bg-neutral-900 text-white border-neutral-900" : "bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400"}`}
                          >
                            🌌 Cosmic Indigo Gradient
                          </button>
                          <button
                            type="button"
                            onClick={() => setPhoneWallpaper("forest")}
                            className={`p-2 rounded-xl text-[10px] font-bold border transition-all ${phoneWallpaper === "forest" ? "bg-neutral-900 text-white border-neutral-900" : "bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400"}`}
                          >
                            🌲 Emerald Teal Oasis
                          </button>
                        </div>
                      </div>

                      {/* Interactive battery slider simulation */}
                      <div className="bg-white dark:bg-neutral-850 p-4 rounded-2xl border border-neutral-150 dark:border-neutral-800 shadow-sm space-y-2">
                        <div className="flex justify-between items-center text-neutral-850 dark:text-white">
                          <div className="flex items-center gap-2">
                            <Battery className="w-4 h-4 text-emerald-500" />
                            <p className="text-xs font-bold">Mô phỏng mức năng lượng Pin</p>
                          </div>
                          <span className="text-[11px] font-mono font-bold text-neutral-500">{phoneBattery}%</span>
                        </div>
                        <input
                          type="range"
                          min="5"
                          max="100"
                          value={phoneBattery}
                          onChange={(e) => setPhoneBattery(parseInt(e.target.value))}
                          className="w-full h-1 bg-neutral-250 accent-blue-600 cursor-pointer"
                        />
                      </div>

                      {/* Emulator Info */}
                      <div className="bg-neutral-100 dark:bg-neutral-950 p-4 rounded-2xl border border-neutral-200/50 text-[10.5px] font-mono leading-relaxed text-neutral-500 space-y-1 select-text">
                        <h4 className="font-extrabold text-xs text-neutral-700 dark:text-neutral-300 border-b border-neutral-200/50 pb-1 mb-2">Device Properties</h4>
                        <p>Model: Google Pixel 9 AVD</p>
                        <p>Host Ingress Container: v3.12.1</p>
                        <p>Architecture: ARM64 Native</p>
                        <p>API Level: 35 (Android 15 Vanilla)</p>
                      </div>

                    </div>
                  </motion.div>
                )}

                {/* 3. Compiled Target App View (Dispatcher) */}
                {phoneView === "app" && (
                  <motion.div
                    key="os_app"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="absolute inset-0 flex flex-col justify-between"
                  >
                    
                    {/* App Header */}
                    <div 
                      className="px-5 py-4 text-white flex items-center justify-between shadow-sm relative z-10"
                      style={{ backgroundColor: activePreset.color }}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
                          {renderPresetIcon(activePreset.iconName, "w-4 h-4 text-white")}
                        </div>
                        <div>
                          <h3 className="text-xs font-bold tracking-tight">{activePreset.name}</h3>
                          <span className="text-[9px] text-white/70 block leading-tight">Android Built-in Simulation</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button onClick={() => setPhoneView("home")} className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors border border-white/5" title="Exit app">
                          <Home className="w-3.5 h-3.5 text-white" />
                        </button>
                      </div>
                    </div>

                    {/* App Screen Dispatcher content body */}
                    <div className="flex-1 overflow-y-auto bg-neutral-50 dark:bg-neutral-950 relative">

                      {/* CASE A: Custom AI Prompt dynamically loaded */}
                      {activePreset.id.startsWith("custom_compiled") && customAppCompiled ? (
                        <div className="p-4 space-y-4">
                          
                          {/* Generated header summary */}
                          <div className="bg-white dark:bg-neutral-900 border border-neutral-150 dark:border-neutral-800 p-4 rounded-2xl shadow-sm text-center">
                            <Sparkles className="w-5 h-5 mx-auto text-amber-500 animate-pulse" />
                            <h4 className="text-xs font-extrabold text-neutral-850 dark:text-white mt-1.5">{customAppCompiled.screenTitle}</h4>
                            <p className="text-[10px] text-neutral-400 mt-1">Biên dịch từ mạng thần kinh nhân tạo AI Studio</p>
                          </div>

                          {/* Dynamic components lists loop */}
                          {customAppCompiled.features?.map((feat: any, idx: number) => {
                            
                            // 1. Todolist / steps simulation
                            if (feat.type === "todolist") {
                              return (
                                <div key={idx} className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-150 dark:border-neutral-800 space-y-3 shadow-sm">
                                  <div className="flex justify-between items-center pb-2 border-b border-neutral-200/50">
                                    <h5 className="text-[11px] font-extrabold text-neutral-800 dark:text-white uppercase tracking-wider">{feat.title || "Khảo sát và Bước Làm"}</h5>
                                    <span className="text-[9px] text-neutral-400 font-bold">{customAppCompiled.items.filter((i:any)=>i.status==="completed").length}/{customAppCompiled.items.length} xong</span>
                                  </div>

                                  <div className="space-y-2 max-h-[150px] overflow-y-auto">
                                    {customAppCompiled.items.map((item: any) => (
                                      <button
                                        type="button"
                                        key={item.id}
                                        onClick={() => handleToggleCustomItem(item.id)}
                                        className="w-full flex items-center justify-between p-2.5 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-xl transition-all border border-neutral-100 dark:border-neutral-800 text-left cursor-pointer"
                                      >
                                        <div className="flex items-center gap-2.5">
                                          <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${item.status === "completed" ? "bg-emerald-500 border-emerald-600 text-white" : "border-neutral-300"}`}>
                                            {item.status === "completed" && <Check className="w-3 h-3" />}
                                          </div>
                                          <span className={`text-[11px] font-medium leading-tight ${item.status === "completed" ? "line-through text-neutral-400" : "text-neutral-800 dark:text-neutral-200"}`}>
                                            {item.text}
                                          </span>
                                        </div>
                                      </button>
                                    ))}
                                  </div>

                                  {/* Add new mock row for custom list */}
                                  <div className="flex gap-1.5 pt-1.5">
                                    <input
                                      type="text"
                                      id="new_custom_item_inp"
                                      placeholder="Thêm mục tiêu/bước..."
                                      className="flex-1 px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 text-[10.5px] border border-neutral-200 dark:border-neutral-800 rounded-xl focus:outline-none"
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                          const el = e.currentTarget;
                                          handleAddCustomItem(el.value);
                                          el.value = "";
                                        }
                                      }}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const el = document.getElementById("new_custom_item_inp") as HTMLInputElement;
                                        if (el) {
                                          handleAddCustomItem(el.value);
                                          el.value = "";
                                        }
                                      }}
                                      className="px-2.5 py-1.5 bg-neutral-900 text-white text-[10px] font-bold rounded-xl"
                                    >
                                      Thêm
                                    </button>
                                  </div>
                                </div>
                              );
                            }

                            // 2. Custom Counter action controller
                            if (feat.type === "counter" || feat.buttonText) {
                              return (
                                <div key={idx} className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-150 dark:border-neutral-800 text-center space-y-2 shadow-sm">
                                  <p className="text-[11px] font-bold text-neutral-500">{feat.desc || "Interactive Button Action"}</p>
                                  <h5 className="text-xs font-semibold text-neutral-800 dark:text-white leading-tight">{feat.title || "Custom event action tracker"}</h5>
                                  <button
                                    type="button"
                                    onClick={() => alert(`Simulating Custom action: "${feat.buttonText}" is successful!`)}
                                    className="px-5 py-2 text-[10.5px] font-bold text-white rounded-xl mx-auto shadow-sm transition-all active:scale-95 cursor-pointer block"
                                    style={{ backgroundColor: activePreset.color }}
                                  >
                                    {feat.buttonText || "Execute AI Code"}
                                  </button>
                                </div>
                              );
                            }

                            return null;
                          })}

                          {/* XML and Gradle compiler parameters */}
                          <div className="bg-neutral-100 dark:bg-neutral-900 px-3.5 py-4 rounded-xl text-[9px] font-mono text-neutral-400 space-y-1">
                            <p className="text-[10px] font-extrabold text-neutral-500 dark:text-neutral-300">Compilation specs</p>
                            <p>Gradle Build tool: daemon v8.5</p>
                            <p>Minified SDK logic: level 31</p>
                            <p>Resource linking context: complete</p>
                          </div>

                        </div>
                      ) : (
                        
                        /* CASE B: Static high fidelity preset applications load */
                        <AnimatePresence mode="wait">
                          
                          {/* 1. Ludo score Companion simulation screen */}
                          {activePreset.id === "ludo_scores" && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 space-y-4">
                              {/* 3D Rolling Dice Section */}
                              <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-150 dark:border-neutral-800 shadow-sm text-center relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-xl pointer-events-none" />
                                <span className="text-[9px] text-neutral-400 uppercase tracking-wider font-extrabold">Simulated Physics Dice Roller</span>
                                
                                <div className="py-4 flex justify-center items-center gap-4">
                                  {/* Visual representation of 3D animated dice */}
                                  <motion.button
                                    type="button"
                                    onClick={() => {
                                      setIsRolling(true);
                                      setTimeout(() => {
                                        setLudoRoll(Math.floor(Math.random() * 6) + 1);
                                        setIsRolling(false);
                                      }, 600);
                                    }}
                                    animate={isRolling ? { rotate: [0, 90, 180, 270, 360], scale: [1, 1.2, 0.9, 1.1, 1] } : {}}
                                    transition={{ duration: 0.6 }}
                                    className="w-16 h-16 bg-white dark:bg-neutral-800 border-2 border-neutral-300 dark:border-neutral-700 rounded-2xl flex items-center justify-center text-4xl shadow-md cursor-pointer relative"
                                  >
                                    <span className="font-extrabold text-[#ea433e]">{ludoRoll}</span>
                                    {/* Dice dots drawing */}
                                    <div className="absolute inset-2 grid grid-cols-3 grid-rows-3 gap-1 pointer-events-none">
                                      {ludoRoll === 1 && <div className="w-1.5 h-1.5 rounded-full bg-red-600 col-start-2 row-start-2 justify-self-center self-center" />}
                                      {ludoRoll === 2 && (
                                        <>
                                          <div className="w-1 h-1 rounded-full bg-red-600 col-start-1 row-start-1 justify-self-center self-center" />
                                          <div className="w-1 h-1 rounded-full bg-red-600 col-start-3 row-start-3 justify-self-center self-center" />
                                        </>
                                      )}
                                      {ludoRoll === 3 && (
                                        <>
                                          <div className="w-1.5 h-1.5 rounded-full bg-red-600 col-start-1 row-start-1 justify-self-center self-center" />
                                          <div className="w-1.5 h-1.5 rounded-full bg-red-600 col-start-2 row-start-2 justify-self-center self-center" />
                                          <div className="w-1.5 h-1.5 rounded-full bg-red-600 col-start-3 row-start-3 justify-self-center self-center" />
                                        </>
                                      )}
                                      {ludoRoll >= 4 && (
                                        <>
                                          <div className="w-1.5 h-1.5 rounded-full bg-red-600 col-start-1 row-start-1" />
                                          <div className="w-1.5 h-1.5 rounded-full bg-red-600 col-start-3 row-start-1" />
                                          <div className="w-1.5 h-1.5 rounded-full bg-red-600 col-start-1 row-start-3" />
                                          <div className="w-1.5 h-1.5 rounded-full bg-red-600 col-start-3 row-start-3" />
                                        </>
                                      )}
                                      {ludoRoll === 5 && <div className="w-1.5 h-1.5 rounded-full bg-red-600 col-start-2 row-start-2" />}
                                      {ludoRoll === 6 && (
                                        <>
                                          <div className="w-1.5 h-1.5 rounded-full bg-red-600 col-start-1 row-start-2" />
                                          <div className="w-1.5 h-1.5 rounded-full bg-red-600 col-start-3 row-start-2" />
                                        </>
                                      )}
                                    </div>
                                  </motion.button>
                                  
                                  <div className="text-left">
                                    <p className="text-xs font-extrabold text-neutral-800 dark:text-neutral-100">Roll the Dice</p>
                                    <span className="text-[10px] text-neutral-400">Nhấp vào xúc xắc để sinh số ngẫu nhiên</span>
                                  </div>
                                </div>
                              </div>

                              {/* Leaderboard Table */}
                              <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-150 dark:border-neutral-800 shadow-sm space-y-3">
                                <div className="flex justify-between items-center border-b border-neutral-150 dark:border-neutral-850 pb-2">
                                  <h4 className="text-[11px] uppercase font-black tracking-wider text-neutral-900 dark:text-white">Bảng Xếp Hạng</h4>
                                  <Award className="w-4 h-4 text-amber-500" />
                                </div>

                                <div className="space-y-2">
                                  {[...ludoPlayers].sort((a,b)=>b.score - a.score).map((pl, idx) => (
                                    <div key={idx} className="flex justify-between items-center p-2 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800 text-[11px]">
                                      <div className="flex items-center gap-2 font-medium">
                                        <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-white text-[10px] ${idx === 0 ? "bg-amber-500" : "bg-neutral-400"}`}>
                                          {idx + 1}
                                        </span>
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: pl.color }} />
                                        <span className="font-extrabold">{pl.name}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="font-mono font-bold">{pl.score} điểm</span>
                                        <div className="flex gap-1 justify-end">
                                          <button 
                                            onClick={() => {
                                              const updated = ludoPlayers.map(p => p.name === pl.name ? { ...p, score: p.score + ludoRoll } : p);
                                              setLudoPlayers(updated);
                                              setHistoryMatches(prev => [`+${ludoRoll} điểm cho ${pl.name}`, ...prev]);
                                            }}
                                            className="px-1.5 py-0.5 bg-neutral-900 text-white rounded text-[8px] font-bold"
                                            title="Cộng điểm xúc xắc"
                                          >
                                            +{ludoRoll}
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Local Feed */}
                              <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-150 dark:border-neutral-800 shadow-sm space-y-2 text-[10px]">
                                <h4 className="text-[11px] font-bold text-neutral-400">Match feed log:</h4>
                                <div className="space-y-1 max-h-[80px] overflow-y-auto">
                                  {historyMatches.map((h, i) => (
                                    <p key={i} className="text-neutral-500 truncate select-text">• {h}</p>
                                  ))}
                                </div>
                              </div>

                            </motion.div>
                          )}

                          {/* 2. Love Ledger Shared Budget Screen */}
                          {activePreset.id === "love_ledger" && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 space-y-4">
                              
                              {/* Total balance card */}
                              <div className="bg-gradient-to-br from-rose-500 to-pink-500 p-5 rounded-2xl text-white shadow-sm relative overflow-hidden">
                                <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-white/10 rounded-full" />
                                <Heart className="w-5 h-5 absolute right-5 top-5 text-white/40 fill-current" />
                                <p className="text-[10px] text-white/70 uppercase font-black tracking-widest">Couples Joint Savings Ledger</p>
                                <h3 className="text-xl font-bold mt-2 font-mono">15,800,000 VND</h3>
                                <div className="flex justify-between items-center mt-3 text-[10px]">
                                  <span>Mục tiêu mua Laptop đôi: 80%</span>
                                  <span className="font-bold">65% Đạt</span>
                                </div>
                              </div>

                              {/* Spender Add transaction form */}
                              <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-150 dark:border-neutral-800 space-y-3.5 shadow-sm text-[11px]">
                                <h4 className="font-extrabold text-xs text-rose-600 block pb-1 border-b border-neutral-100 dark:border-neutral-800">Ghi chép giao dịch nhanh</h4>
                                
                                <div className="grid grid-cols-2 gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setLoveSpender("Anh")}
                                    className={`py-2 rounded-xl font-bold border transition-colors ${loveSpender === "Anh" ? "bg-rose-500 text-white border-rose-600" : "bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-800"}`}
                                  >
                                    👱‍♂️ Anh trả
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setLoveSpender("Em")}
                                    className={`py-2 rounded-xl font-bold border transition-colors ${loveSpender === "Em" ? "bg-rose-500 text-white border-rose-600" : "bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-800"}`}
                                  >
                                    👩‍🦰 Em trả
                                  </button>
                                </div>

                                <div className="space-y-2">
                                  <input 
                                    type="text" 
                                    placeholder="Nội dung chi tiêu..."
                                    value={loveTitle}
                                    onChange={(e) => setLoveTitle(e.target.value)}
                                    className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 rounded-xl"
                                  />
                                  <div className="grid grid-cols-2 gap-2">
                                    <input 
                                      type="number" 
                                      placeholder="Số tiền (VND)..."
                                      value={loveAmount}
                                      onChange={(e) => setLoveAmount(e.target.value)}
                                      className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 rounded-xl"
                                    />
                                    <select 
                                      value={loveCat} 
                                      onChange={(e) => setLoveCat(e.target.value)}
                                      className="px-2 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 rounded-xl"
                                    >
                                      <option value="Ăn uống">🍲 Ăn uống</option>
                                      <option value="Giải trí">🍿 Giải trí</option>
                                      <option value="Sinh hoạt">⚡ Sinh hoạt</option>
                                      <option value="Mua sắm">🛍️ Mua sắm</option>
                                    </select>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => {
                                    if (!loveTitle || !loveAmount) return;
                                    const newTx = {
                                      id: Date.now().toString(),
                                      title: loveTitle,
                                      amount: parseFloat(loveAmount),
                                      category: loveCat,
                                      spender: loveSpender
                                    };
                                    setLoveTransactions([newTx, ...loveTransactions]);
                                    setLoveTitle("");
                                    setLoveAmount("");
                                    setShowHeartFloat(true);
                                    setTimeout(() => setShowHeartFloat(false), 1500);
                                  }}
                                  className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-sm"
                                >
                                  Lưu giao dịch chung 💕
                                </button>
                              </div>

                              {/* Transaction feeds */}
                              <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-150 dark:border-neutral-800 shadow-sm space-y-2 text-[11px]">
                                <h4 className="font-extrabold text-neutral-400 uppercase tracking-widest text-[9px]">Lịch sử thu chi</h4>
                                <div className="space-y-1.5 max-h-[140px] overflow-y-auto">
                                  {loveTransactions.map((tx) => (
                                    <div key={tx.id} className="flex justify-between items-center p-2 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-xl border border-neutral-100 dark:border-neutral-850 transition-colors">
                                      <div>
                                        <p className="font-bold text-neutral-800 dark:text-neutral-100 leading-none">{tx.title}</p>
                                        <span className="text-[9px] text-neutral-400 mt-0.5 block">{tx.spender} • {tx.category}</span>
                                      </div>
                                      <span className="font-mono text-rose-500 font-bold">-{tx.amount.toLocaleString()}đ</span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Ambient floating heart toast */}
                              <AnimatePresence>
                                {showHeartFloat && (
                                  <motion.div 
                                    initial={{ opacity: 0, y: 50, scale: 0.1 }}
                                    animate={{ opacity: 1, y: -200, scale: [1, 2, 1.5] }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 1.2 }}
                                    className="absolute inset-x-0 bottom-32 flex justify-center pointer-events-none"
                                  >
                                    <div className="bg-rose-500 text-white p-3 rounded-full shadow-2xl flex items-center justify-center">
                                      <Heart className="w-10 h-10 fill-current animate-pulse text-white" />
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>

                            </motion.div>
                          )}

                          {/* 3. Vietnam UNESCO Heritage Guide */}
                          {activePreset.id === "vn_heritage" && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 space-y-4">
                              {/* Filter pills */}
                              <div className="flex gap-1.5 overflow-x-auto pb-1 select-none">
                                {[
                                  { k: "all", l: "Tất cả" },
                                  { k: "Thiên nhiên", l: "🌳 Thiên nhiên" },
                                  { k: "Văn hóa", l: "🏛️ Văn hóa" }
                                ].map((tab) => (
                                  <button
                                    key={tab.k}
                                    onClick={() => setHeritageFilters(tab.k)}
                                    className={`px-3 py-1 text-[10px] font-bold rounded-lg shrink-0 transition-colors ${heritageFilters === tab.k ? "bg-emerald-600 text-white" : "bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-800"}`}
                                  >
                                    {tab.l}
                                  </button>
                                ))}
                              </div>

                              {/* Main layout lists of cards */}
                              <div className="space-y-3.5 max-h-[380px] overflow-y-auto">
                                {heritagePlaces.filter(p => heritageFilters === "all" || p.category === heritageFilters).map((pl) => {
                                  const isFavorite = heritageFavorites.includes(pl.id);
                                  return (
                                    <div key={pl.id} className="bg-white dark:bg-neutral-900 border border-neutral-150 dark:border-neutral-800 rounded-2xl p-4 shadow-sm space-y-2.5">
                                      <div className="flex justify-between items-start">
                                        <div>
                                          <div className="flex items-center gap-2">
                                            <h4 className="text-xs font-black text-neutral-800 dark:text-neutral-100">{pl.title}</h4>
                                            <span className="text-[8px] uppercase tracking-widest bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded font-extrabold">{pl.category}</span>
                                          </div>
                                          <div className="text-[9px] text-neutral-400 font-bold flex items-center gap-1 mt-0.5">
                                            <MapPin className="w-3 h-3" /> {pl.region}
                                          </div>
                                        </div>

                                        <button
                                          type="button"
                                          onClick={() => {
                                            if (isFavorite) {
                                              setHeritageFavorites(prev => prev.filter(f => f !== pl.id));
                                            } else {
                                              setHeritageFavorites(prev => [...prev, pl.id]);
                                            }
                                          }}
                                          className={`p-1.5 rounded-lg border ${isFavorite ? "bg-rose-50 text-rose-500 border-rose-100" : "bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-800"}`}
                                        >
                                          <Heart className={`w-3.5 h-3.5 ${isFavorite ? "fill-current text-rose-500" : "text-neutral-400"}`} />
                                        </button>
                                      </div>

                                      <p className="text-[10px] text-neutral-500 font-medium leading-relaxed">{pl.desc}</p>
                                      
                                      <div className="p-2.5 bg-neutral-50 dark:bg-neutral-950 rounded-xl border border-neutral-100 dark:border-neutral-800 text-[9.5px]">
                                        <p className="font-extrabold text-[#059669]">💡 Mẹo du lịch:</p>
                                        <p className="text-neutral-600 dark:text-neutral-400 mt-0.5 leading-relaxed font-semibold italic">{pl.tips}</p>
                                      </div>

                                      <div className="flex justify-between items-center text-[9px] font-bold text-neutral-400">
                                        <span>Lượt ghé thăm: {pl.hits} lượt</span>
                                        <span>{isFavorite ? "Đã ghim mốc ❤️" : "Lưu điểm cắm mốc"}</span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>

                            </motion.div>
                          )}

                          {/* 4. Love Counter / retro day companion screen */}
                          {activePreset.id === "love_counter" && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 space-y-4">
                              {/* Central counter display */}
                              <div className="bg-gradient-to-tr from-pink-500 via-rose-500 to-amber-400 p-5 rounded-3xl text-center text-white relative overflow-hidden shadow-md">
                                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/10 to-transparent pointer-events-none" />
                                <Heart className="w-8 h-8 mx-auto fill-current animate-pulse text-white/50" />
                                <p className="text-[10px] font-extrabold uppercase tracking-widest mt-2">Days Of Wholesome Union</p>
                                <h2 className="text-4xl font-mono font-black mt-1 text-white select-all">{daysCount} Days</h2>
                                <p className="text-[10px] text-white/70 font-semibold mt-1">Starting milestone: {loveStartDate}</p>
                              </div>

                              {/* Input change milestones */}
                              <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-150 dark:border-neutral-800 p-4 text-[11px] space-y-3.5 shadow-sm">
                                <div className="flex justify-between items-center">
                                  <label className="text-xs font-extrabold text-neutral-800 dark:text-white">Cấu hình mốc kỉ niệm</label>
                                  <Calendar className="w-4 h-4 text-pink-500" />
                                </div>
                                <div className="flex gap-2">
                                  <input
                                    type="date"
                                    value={loveStartDate}
                                    onChange={(e) => {
                                      setLoveStartDate(e.target.value);
                                      const start = new Date(e.target.value);
                                      const diff = Math.floor((new Date().getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                                      setDaysCount(isNaN(diff) ? 0 : diff);
                                    }}
                                    className="flex-1 px-3 py-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 rounded-xl"
                                  />
                                </div>
                              </div>

                              {/* Daily quote and equalizer */}
                              <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-150 dark:border-neutral-800 p-4 space-y-3 shadow-sm text-center">
                                <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
                                  <span className="text-[9px] uppercase font-bold text-pink-500">Lời nhắn mỗi ngày</span>
                                  <button onClick={() => {
                                    const randIdx = Math.floor(Math.random() * QUOTES.length);
                                    setLoveQuote(QUOTES[randIdx]);
                                  }} className="text-[10px] text-pink-600 hover:underline">Đổi câu khác</button>
                                </div>
                                <p className="text-xs text-neutral-600 dark:text-neutral-300 italic leading-relaxed font-semibold">"{loveQuote}"</p>
                                
                                {/* Ambient Music Player Simulation */}
                                <div className="pt-2 bg-neutral-50 dark:bg-neutral-950 p-2.5 rounded-xl border border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                                  <button onClick={() => setBgMusic(!bgMusic)} className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 text-white rounded-lg text-[9.5px] font-bold">
                                    <Music className="w-3 h-3 animate-spin" />
                                    <span>{bgMusic ? "Tắt nhạc chill" : "Bật nhạc chill"}</span>
                                  </button>

                                  <div className="flex items-end gap-0.5 h-6">
                                    {visualizerHeight.map((h, i) => (
                                      <div
                                        key={i}
                                        style={{ height: bgMusic ? `${h}px` : "4px" }}
                                        className="w-[3px] bg-pink-500 rounded-t transition-all duration-150"
                                      />
                                    ))}
                                  </div>
                                </div>
                              </div>

                            </motion.div>
                          )}

                          {/* 5. Smart Tasks & Notepad Simulation */}
                          {activePreset.id === "task_note" && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 space-y-4">
                              {/* Search field */}
                              <div className="relative">
                                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                  type="text"
                                  placeholder="Tìm kiếm công việc ghi chú nhanh..."
                                  value={noteSearch}
                                  onChange={(e) => setNoteSearch(e.target.value)}
                                  className="w-full pl-9 pr-4 py-2 bg-white dark:bg-neutral-900 text-xs border border-neutral-200 dark:border-neutral-800 rounded-xl"
                                />
                              </div>

                              {/* Notes grids lists feedback */}
                              <div className="space-y-2 max-h-[220px] overflow-y-auto">
                                {notes.filter(t => !noteSearch || t.title.toLowerCase().includes(noteSearch.toLowerCase()) || t.desc.toLowerCase().includes(noteSearch.toLowerCase())).map((t) => (
                                  <div key={t.id} className="p-3.5 bg-white dark:bg-neutral-900 border border-neutral-150 dark:border-neutral-800 rounded-xl relative overflow-hidden shadow-sm flex justify-between gap-3">
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-1.5">
                                        <span className={`w-1.5 h-1.5 rounded-full ${t.tag === "Urgent" ? "bg-red-500" : t.tag === "Idea" ? "bg-blue-500" : "bg-emerald-500"}`} />
                                        <h5 className="text-[11.5px] font-extrabold text-neutral-850 dark:text-white leading-none">{t.title}</h5>
                                      </div>
                                      <p className="text-[10px] text-neutral-400 leading-relaxed font-semibold">{t.desc}</p>
                                    </div>

                                    <div className="flex flex-col justify-between items-end shrink-0">
                                      <span className={`text-[8px] font-extrabold tracking-wider uppercase px-2 py-0.5 rounded ${t.tag === "Urgent" ? "bg-red-50 text-red-600" : t.tag === "Idea" ? "bg-blue-50 text-blue-600" : "bg-emerald-50 text-emerald-600"}`}>
                                        {t.tag}
                                      </span>
                                      
                                      <button 
                                        onClick={() => {
                                          setNotes(prev => prev.filter(it => it.id !== t.id));
                                        }}
                                        className="p-1 text-neutral-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* Form adder */}
                              <div className="bg-white dark:bg-neutral-900 border border-neutral-150 dark:border-neutral-800 p-4 rounded-2xl space-y-2.5 text-[11px] shadow-sm">
                                <h4 className="font-extrabold text-xs text-amber-500">Tạo công việc/Nhật kí mới</h4>
                                <div className="space-y-1.5">
                                  <input
                                    type="text"
                                    placeholder="Tiêu đề..."
                                    value={noteTitle}
                                    onChange={(e) => setNoteTitle(e.target.value)}
                                    className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-150 dark:border-neutral-800 rounded-xl"
                                  />
                                  <textarea
                                    rows={2}
                                    placeholder="Nội dung mô tả chi tiết công việc của bạn..."
                                    value={noteDesc}
                                    onChange={(e) => setNoteDesc(e.target.value)}
                                    className="w-full p-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-150 dark:border-neutral-800 rounded-xl text-[10.5px] resize-none"
                                  />
                                </div>

                                <div className="flex justify-between items-center gap-2">
                                  <div className="flex gap-1.5">
                                    {["Urgent", "Idea", "Daily"].map(tg => (
                                      <button
                                        key={tg}
                                        type="button"
                                        onClick={() => setNoteTag(tg)}
                                        className={`px-2 py-1 text-[9px] font-bold rounded ${noteTag === tg ? "bg-neutral-900 text-white" : "bg-neutral-50 border border-neutral-200"}`}
                                      >
                                        {tg}
                                      </button>
                                    ))}
                                  </div>

                                  <button
                                    onClick={() => {
                                      if (!noteTitle || !noteDesc) return;
                                      const nTask = {
                                        id: Date.now().toString(),
                                        title: noteTitle,
                                        desc: noteDesc,
                                        tag: noteTag,
                                        color: noteTag === "Urgent" ? "red" : noteTag === "Idea" ? "blue" : "green"
                                      };
                                      setNotes([nTask, ...notes]);
                                      setNoteTitle("");
                                      setNoteDesc("");
                                    }}
                                    className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg"
                                  >
                                    Lưu thẻ
                                  </button>
                                </div>
                              </div>

                            </motion.div>
                          )}

                        </AnimatePresence>
                      )}

                    </div>

                    {/* Virtual Android Navigation Soft Bar (◁, ◯, ☐) */}
                    <div className="h-10 bg-neutral-100 dark:bg-neutral-900 flex justify-around items-center px-8 border-t border-neutral-200/20 z-45 shrink-0 relative">
                      {/* Back key (◁) */}
                      <button
                        onClick={() => {
                          if (phoneView === "app") {
                            setPhoneView("home");
                          } else if (phoneView === "settings") {
                            setPhoneView("home");
                          }
                        }}
                        className="w-10 h-10 flex items-center justify-center text-neutral-400 hover:text-neutral-850 dark:hover:text-white transition-colors cursor-pointer"
                        title="Back"
                      >
                        <ChevronLeft className="w-5 h-5 font-bold" />
                      </button>

                      {/* Home key (◯) */}
                      <button
                        onClick={() => setPhoneView("home")}
                        className="w-7 h-7 rounded-full border-[2.5px] border-neutral-400 hover:border-neutral-800 dark:hover:border-white transition-all cursor-pointer flex items-center justify-center shrink-0"
                        title="Android Homescreen Launcher"
                      >
                        <div className="w-2.5 h-2.5 rounded-full bg-neutral-400 hover:bg-neutral-800 dark:hover:bg-white" />
                      </button>

                      {/* Recents App Stack key (☐) */}
                      <button
                        onClick={() => {
                          alert(`Simulating AVD Apps Switcher: Active App is "${activePreset.name}" running on SDK 35.`);
                        }}
                        className="w-5 h-5 border-[2.5px] border-neutral-400 hover:border-neutral-850 dark:hover:border-white rounded-md transition-colors cursor-pointer shrink-0"
                        title="Active Recents Stack"
                      />
                    </div>

                  </motion.div>
                )}

              </AnimatePresence>

            </div>

          </div>

          {/* Simulated hardware footer speaker/bezel logo details */}
          <div className="mt-3.5 text-[11px] font-mono text-neutral-400 font-bold select-none text-center">
            <span>AVD: PIXEL_9_PRO_MOCK_API_35</span>
          </div>

        </div>

      </div>

    </div>
  );
}
